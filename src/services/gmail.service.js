import { initializeApp, getApps } from "firebase/app";
import { getAuth, GoogleAuthProvider, signInWithPopup } from "firebase/auth";
import { Capacitor } from "@capacitor/core";

const GMAIL_API = "https://gmail.googleapis.com/gmail/v1/users/me";

// Separate Firebase app instance for Gmail OAuth (web only) — never touches the main auth session
function getGmailAuth() {
  const config = {
    apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
    authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
    projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  };
  const existing = getApps().find((a) => a.name === "gmail-oauth");
  const app = existing || initializeApp(config, "gmail-oauth");
  return getAuth(app);
}

export const gmailService = {
  // Get a Gmail-scoped access token.
  // Native: uses Capacitor Google Auth plugin (no popup/redirect issues).
  // Web: uses Firebase signInWithPopup on a separate app instance.
  async getAccessToken() {
    if (Capacitor.isNativePlatform()) {
      // Native: use Capacitor Google Auth plugin with gmail scope
      const { GoogleAuth } = await import("@codetrix-studio/capacitor-google-auth");
      await GoogleAuth.initialize({
        clientId: "314056451501-h8q6p0dbbkek6ijpfucpt93hi99i72qc.apps.googleusercontent.com",
        scopes: ["profile", "email", "https://www.googleapis.com/auth/gmail.readonly"],
        grantOfflineAccess: true,
      });
      const googleUser = await GoogleAuth.signIn();
      const accessToken = googleUser.authentication.accessToken;
      if (!accessToken) throw new Error("No access token returned from Google sign-in");
      return accessToken;
    }

    // Web: Firebase popup on separate app instance
    const gmailAuth = getGmailAuth();
    const provider = new GoogleAuthProvider();
    provider.addScope("https://www.googleapis.com/auth/gmail.readonly");
    provider.setCustomParameters({ prompt: "consent" });

    const result = await signInWithPopup(gmailAuth, provider);
    const credential = GoogleAuthProvider.credentialFromResult(result);
    if (!credential?.accessToken) throw new Error("No access token returned");
    return credential.accessToken;
  },

  // Search inbox for emails likely to contain product purchase invoices.
  async searchInvoiceEmails(accessToken) {
    const q = "has:attachment (asus OR samsung OR lg OR reliance OR dell) newer_than:2y";
    const url = `${GMAIL_API}/messages?q=${encodeURIComponent(q)}&maxResults=25`;
    const res = await fetch(url, {
      headers: { Authorization: `Bearer ${accessToken}` },
    });
    if (!res.ok) {
      const body = await res.json().catch(() => ({}));
      const msg = body?.error?.message || res.statusText;
      if (res.status === 403) throw new Error("GMAIL_API_DISABLED");
      if (res.status === 401) throw new Error("GMAIL_AUTH_FAILED");
      throw new Error(msg || "Gmail search failed");
    }
    const data = await res.json();
    return data.messages || [];
  },

  // Fetch full message payload (headers + parts).
  async getFullMessage(accessToken, messageId) {
    const url = `${GMAIL_API}/messages/${messageId}?format=full`;
    const res = await fetch(url, {
      headers: { Authorization: `Bearer ${accessToken}` },
    });
    if (!res.ok) throw new Error("Failed to fetch email");
    return res.json();
  },

  // Fetch raw attachment bytes (base64url encoded).
  async getAttachment(accessToken, messageId, attachmentId) {
    const url = `${GMAIL_API}/messages/${messageId}/attachments/${attachmentId}`;
    const res = await fetch(url, {
      headers: { Authorization: `Bearer ${accessToken}` },
    });
    if (!res.ok) throw new Error("Failed to fetch attachment");
    return res.json();
  },

  // Recursively find image / PDF parts in a message payload.
  findAttachmentParts(payload) {
    const parts = [];
    function walk(part) {
      if (
        part.filename?.length > 0 &&
        part.body?.attachmentId
      ) {
        const mime = part.mimeType || "";
        if (mime.startsWith("image/") || mime === "application/pdf") {
          parts.push({
            filename: part.filename,
            mimeType: mime,
            attachmentId: part.body.attachmentId,
            size: part.body.size || 0,
          });
        }
      }
      if (part.parts) part.parts.forEach(walk);
    }
    walk(payload);
    return parts;
  },

  // Decode base64url string → Blob.
  base64ToBlob(base64url, mimeType) {
    const base64 = base64url.replace(/-/g, "+").replace(/_/g, "/");
    const binary = atob(base64);
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
    return new Blob([bytes], { type: mimeType });
  },

  // Extract a named header value from the headers array.
  getHeader(headers = [], name) {
    return headers.find((h) => h.name.toLowerCase() === name.toLowerCase())?.value || "";
  },
};
