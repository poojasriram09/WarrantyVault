import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { create, getNumericDate } from "https://deno.land/x/djwt@v3.0.2/mod.ts";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL") ?? "";
const SUPABASE_SERVICE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";
const JWT_SECRET = Deno.env.get("JWT_SECRET") ?? "";
const FIREBASE_PROJECT_ID = "warrantyvault-8eb66";

const ALLOWED_ORIGINS = [
  "https://warrantyvault-8eb66.web.app",
  "https://warrantyvault-8eb66.firebaseapp.com",
  "http://localhost:5173",
];

function getCorsHeaders(req: Request) {
  const origin = req.headers.get("Origin") ?? "";
  const allowed = ALLOWED_ORIGINS.includes(origin) ? origin : ALLOWED_ORIGINS[0];
  return {
    "Access-Control-Allow-Origin": allowed,
    "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
  };
}

// Cache for Google's public keys (JWKS)
let cachedCerts: Record<string, string> | null = null;
let certsExpiry = 0;

async function getGoogleCerts(): Promise<Record<string, string>> {
  if (cachedCerts && Date.now() < certsExpiry) return cachedCerts;

  const res = await fetch(
    "https://www.googleapis.com/robot/v1/metadata/x509/securetoken@system.gserviceaccount.com"
  );
  const cacheControl = res.headers.get("cache-control") ?? "";
  const maxAgeMatch = cacheControl.match(/max-age=(\d+)/);
  const maxAge = maxAgeMatch ? parseInt(maxAgeMatch[1]) * 1000 : 3600_000;

  cachedCerts = await res.json();
  certsExpiry = Date.now() + maxAge;
  return cachedCerts!;
}

function base64UrlDecode(str: string): Uint8Array {
  const base64 = str.replace(/-/g, "+").replace(/_/g, "/");
  const padded = base64 + "=".repeat((4 - (base64.length % 4)) % 4);
  const binary = atob(padded);
  return Uint8Array.from(binary, (c) => c.charCodeAt(0));
}

async function verifyFirebaseToken(token: string) {
  // Decode header to get kid
  const [headerB64, payloadB64] = token.split(".");
  const header = JSON.parse(new TextDecoder().decode(base64UrlDecode(headerB64)));
  const payload = JSON.parse(new TextDecoder().decode(base64UrlDecode(payloadB64)));

  // Validate claims
  const now = Math.floor(Date.now() / 1000);
  if (payload.exp < now) throw new Error("Token expired");
  if (payload.iss !== `https://securetoken.google.com/${FIREBASE_PROJECT_ID}`) {
    throw new Error("Invalid issuer");
  }
  if (payload.aud !== FIREBASE_PROJECT_ID) throw new Error("Invalid audience");
  if (!payload.sub || typeof payload.sub !== "string") throw new Error("Invalid subject");

  // Verify signature using Google's public certificate
  const certs = await getGoogleCerts();
  const cert = certs[header.kid];
  if (!cert) throw new Error("Unknown key ID");

  // Import the X.509 certificate as a CryptoKey
  const pemBody = cert
    .replace("-----BEGIN CERTIFICATE-----", "")
    .replace("-----END CERTIFICATE-----", "")
    .replace(/\s/g, "");
  const certBytes = Uint8Array.from(atob(pemBody), (c) => c.charCodeAt(0));

  const cryptoKey = await crypto.subtle.importKey(
    "x509",
    certBytes.buffer,
    { name: "RSASSA-PKCS1-v1_5", hash: "SHA-256" },
    false,
    ["verify"]
  );

  // Verify signature
  const signatureInput = new TextEncoder().encode(
    token.split(".").slice(0, 2).join(".")
  );
  const signature = base64UrlDecode(token.split(".")[2]);

  const valid = await crypto.subtle.verify(
    "RSASSA-PKCS1-v1_5",
    cryptoKey,
    signature,
    signatureInput
  );

  if (!valid) throw new Error("Invalid signature");

  return payload;
}

async function mintSupabaseJwt(userId: string, email: string) {
  const key = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(JWT_SECRET),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"]
  );

  const now = Math.floor(Date.now() / 1000);
  const payload = {
    sub: userId,
    role: "authenticated",
    iss: "supabase",
    iat: now,
    exp: now + 3600,
    email,
  };

  return await create({ alg: "HS256", typ: "JWT" }, payload, key);
}

serve(async (req) => {
  const cors = getCorsHeaders(req);

  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: cors });
  }

  try {
    const { firebaseToken } = await req.json();
    if (!firebaseToken) {
      return new Response(JSON.stringify({ error: "Missing firebaseToken" }), {
        status: 400,
        headers: { ...cors, "Content-Type": "application/json" },
      });
    }

    // Verify Firebase ID token
    const firebasePayload = await verifyFirebaseToken(firebaseToken);
    const firebaseUid = firebasePayload.sub;

    // Look up or create user in Supabase
    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

    // Try sync RPC first
    let dbUser = null;
    const { data: rpcUser, error: rpcErr } = await supabase.rpc("sync_firebase_user", {
      p_firebase_uid: firebaseUid,
      p_email: firebasePayload.email ?? null,
      p_display_name: firebasePayload.name ?? null,
      p_avatar_url: firebasePayload.picture ?? null,
    });

    if (!rpcErr && rpcUser) {
      dbUser = rpcUser;
    } else {
      // Fallback: direct lookup
      const { data: existing } = await supabase
        .from("users")
        .select("*")
        .eq("firebase_uid", firebaseUid)
        .single();
      dbUser = existing;
    }

    if (!dbUser) {
      return new Response(JSON.stringify({ error: "User not found after sync" }), {
        status: 500,
        headers: { ...cors, "Content-Type": "application/json" },
      });
    }

    // Mint Supabase JWT
    const accessToken = await mintSupabaseJwt(dbUser.id, dbUser.email);

    return new Response(
      JSON.stringify({
        access_token: accessToken,
        expires_in: 3600,
        user: {
          id: dbUser.id,
          email: dbUser.email,
          display_name: dbUser.display_name,
          avatar_url: dbUser.avatar_url,
        },
      }),
      { headers: { ...cors, "Content-Type": "application/json" } }
    );
  } catch (e) {
    console.error("exchange-token error:", e);
    const status = e.message?.includes("expired") || e.message?.includes("Invalid") ? 401 : 500;
    return new Response(JSON.stringify({ error: e.message }), {
      status,
      headers: { ...cors, "Content-Type": "application/json" },
    });
  }
});
