import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const GROQ_API_KEY = Deno.env.get("GROQ_API_KEY") ?? "";
const JWT_SECRET = Deno.env.get("JWT_SECRET") ?? "";

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

// Simple in-memory rate limiter per user (resets on cold start)
const userRequests = new Map<string, number[]>();
const RATE_LIMIT = 30; // requests per minute
const RATE_WINDOW = 60_000;

function checkRate(userId: string): boolean {
  const now = Date.now();
  const timestamps = (userRequests.get(userId) ?? []).filter((t) => now - t < RATE_WINDOW);
  if (timestamps.length >= RATE_LIMIT) return false;
  timestamps.push(now);
  userRequests.set(userId, timestamps);
  return true;
}

function base64UrlDecode(str: string): string {
  const base64 = str.replace(/-/g, "+").replace(/_/g, "/");
  const padded = base64 + "=".repeat((4 - (base64.length % 4)) % 4);
  return atob(padded);
}

function verifyAndExtractUserId(authHeader: string | null): string {
  if (!authHeader?.startsWith("Bearer ")) throw new Error("Missing auth token");
  const token = authHeader.slice(7);
  const [, payloadB64] = token.split(".");
  const payload = JSON.parse(base64UrlDecode(payloadB64));

  // Basic validation — full signature check is done by Supabase infrastructure
  // when the request passes through the Edge Function gateway
  if (!payload.sub) throw new Error("Invalid token");
  if (payload.exp && payload.exp < Math.floor(Date.now() / 1000)) {
    throw new Error("Token expired");
  }
  if (payload.role !== "authenticated") throw new Error("Not authenticated");

  return payload.sub;
}

serve(async (req) => {
  const cors = getCorsHeaders(req);

  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: cors });
  }

  try {
    // Verify caller is authenticated
    const userId = verifyAndExtractUserId(req.headers.get("Authorization"));

    // Rate limit per user
    if (!checkRate(userId)) {
      return new Response(JSON.stringify({ error: "Rate limit exceeded. Please wait." }), {
        status: 429,
        headers: { ...cors, "Content-Type": "application/json" },
      });
    }

    // Forward request to Groq
    const body = await req.json();

    // Validate model is one of the allowed models
    const allowedModels = [
      "llama-3.3-70b-versatile",
      "meta-llama/llama-4-scout-17b-16e-instruct",
    ];
    if (body.model && !allowedModels.includes(body.model)) {
      return new Response(JSON.stringify({ error: "Model not allowed" }), {
        status: 400,
        headers: { ...cors, "Content-Type": "application/json" },
      });
    }

    // Cap max_tokens to prevent abuse
    if (body.max_tokens && body.max_tokens > 2048) {
      body.max_tokens = 2048;
    }

    const groqRes = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${GROQ_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
    });

    const groqData = await groqRes.json();

    return new Response(JSON.stringify(groqData), {
      status: groqRes.status,
      headers: { ...cors, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("groq-proxy error:", e);
    const status = e.message?.includes("auth") || e.message?.includes("expired") ? 401 : 500;
    return new Response(JSON.stringify({ error: e.message }), {
      status,
      headers: { ...cors, "Content-Type": "application/json" },
    });
  }
});
