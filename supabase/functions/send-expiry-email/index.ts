import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY") ?? "";
const SUPABASE_URL = Deno.env.get("SUPABASE_URL") ?? "";
const SUPABASE_SERVICE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";

const ALLOWED_ORIGINS = [
  "https://warrantyvault-8eb66.web.app",
  "https://warrantyvault-8eb66.firebaseapp.com",
  "http://localhost:5173",
];

function getCorsHeaders(req: Request) {
  const origin = req.headers.get("Origin") ?? "";
  const allowedOrigin = ALLOWED_ORIGINS.includes(origin) ? origin : ALLOWED_ORIGINS[0];
  return {
    "Access-Control-Allow-Origin": allowedOrigin,
    "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  };
}

function escapeHtml(str: string): string {
  if (!str) return str;
  return str.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: getCorsHeaders(req) });
  }

  try {
    const { user_id } = await req.json();
    if (!user_id) {
      return new Response(JSON.stringify({ error: "Missing user_id" }), {
        status: 400, headers: { ...getCorsHeaders(req), "Content-Type": "application/json" },
      });
    }

    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

    // Get user details
    const { data: user, error: userErr } = await supabase
      .from("users")
      .select("email, display_name")
      .eq("id", user_id)
      .single();

    if (userErr || !user?.email) {
      return new Response(JSON.stringify({ error: "User not found" }), {
        status: 404, headers: { ...getCorsHeaders(req), "Content-Type": "application/json" },
      });
    }

    const today = new Date();
    const todayStr = today.toISOString().split("T")[0];

    const day7 = new Date(today);
    day7.setDate(day7.getDate() + 7);
    const day7Str = day7.toISOString().split("T")[0];

    const day30 = new Date(today);
    day30.setDate(day30.getDate() + 30);
    const day30Str = day30.toISOString().split("T")[0];

    // Fetch warranties expiring within 7 days
    const { data: urgent7 } = await supabase
      .from("warranties_with_status")
      .select("*, products(product_name, brand)")
      .eq("user_id", user_id)
      .gte("end_date", todayStr)
      .lte("end_date", day7Str)
      .order("end_date", { ascending: true });

    // Fetch warranties expiring in 8–30 days
    const nextDay7 = new Date(day7);
    nextDay7.setDate(nextDay7.getDate() + 1);
    const nextDay7Str = nextDay7.toISOString().split("T")[0];

    const { data: expiring30 } = await supabase
      .from("warranties_with_status")
      .select("*, products(product_name, brand)")
      .eq("user_id", user_id)
      .gte("end_date", nextDay7Str)
      .lte("end_date", day30Str)
      .order("end_date", { ascending: true });

    const list7 = urgent7 ?? [];
    const list30 = expiring30 ?? [];

    if (list7.length === 0 && list30.length === 0) {
      return new Response(
        JSON.stringify({ sent: false, reason: "no warranties expiring within 30 days" }),
        { headers: { ...getCorsHeaders(req), "Content-Type": "application/json" } }
      );
    }

    // Build table rows helper
    const buildRows = (items: any[]) =>
      items.map((w) => {
        const daysLeft = Math.ceil(
          (new Date(w.end_date).getTime() - Date.now()) / (1000 * 60 * 60 * 24)
        );
        const color = daysLeft <= 3 ? "#ef4444" : daysLeft <= 7 ? "#f87171" : "#fbbf24";
        return `
          <tr>
            <td style="padding:10px 14px;border-bottom:1px solid #1e1e3a;color:#e2e8f0">
              ${escapeHtml(w.products?.product_name) ?? "—"}
            </td>
            <td style="padding:10px 14px;border-bottom:1px solid #1e1e3a;color:#94a3b8">
              ${escapeHtml(w.products?.brand) ?? "—"}
            </td>
            <td style="padding:10px 14px;border-bottom:1px solid #1e1e3a;color:${color};font-weight:600">
              ${daysLeft} day${daysLeft !== 1 ? "s" : ""}
            </td>
            <td style="padding:10px 14px;border-bottom:1px solid #1e1e3a;color:#64748b">
              ${w.end_date}
            </td>
          </tr>`;
      }).join("");

    // Build section helper
    const buildSection = (title: string, badgeColor: string, description: string, items: any[]) => {
      if (items.length === 0) return "";
      return `
        <!-- ${title} -->
        <div style="margin-bottom:24px">
          <div style="display:flex;align-items:center;margin-bottom:12px">
            <span style="display:inline-block;padding:4px 12px;background:${badgeColor};color:#fff;border-radius:20px;font-size:12px;font-weight:600;letter-spacing:0.03em">
              ${title}
            </span>
            <span style="margin-left:10px;color:#94a3b8;font-size:13px">${description}</span>
          </div>
          <table style="width:100%;border-collapse:collapse;background:#0f1029;border-radius:12px;overflow:hidden;border:1px solid rgba(255,255,255,0.07)">
            <thead>
              <tr style="background:#1e1b4b">
                <th style="padding:10px 14px;text-align:left;color:#a78bfa;font-size:11px;letter-spacing:0.05em;text-transform:uppercase">Product</th>
                <th style="padding:10px 14px;text-align:left;color:#a78bfa;font-size:11px;letter-spacing:0.05em;text-transform:uppercase">Brand</th>
                <th style="padding:10px 14px;text-align:left;color:#a78bfa;font-size:11px;letter-spacing:0.05em;text-transform:uppercase">Days Left</th>
                <th style="padding:10px 14px;text-align:left;color:#a78bfa;font-size:11px;letter-spacing:0.05em;text-transform:uppercase">Expires On</th>
              </tr>
            </thead>
            <tbody>${buildRows(items)}</tbody>
          </table>
        </div>`;
    };

    const totalCount = list7.length + list30.length;
    const name = escapeHtml(user.display_name) ?? "there";

    // Subject line prioritizes urgency
    const subject = list7.length > 0
      ? `🚨 ${list7.length} warranty${list7.length > 1 ? "ies" : "y"} expiring within 7 days!`
      : `⚠️ ${list30.length} warranty${list30.length > 1 ? "ies" : "y"} expiring within 30 days`;

    const urgentSection = buildSection(
      `URGENT — ${list7.length} expiring in 7 days`,
      "#dc2626",
      "Immediate action required",
      list7
    );
    const warningSection = buildSection(
      `${list30.length} expiring in 30 days`,
      "#d97706",
      "Plan ahead",
      list30
    );

    const html = `<!DOCTYPE html>
<html>
<body style="margin:0;padding:0;background:#06061a;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif">
  <div style="max-width:600px;margin:40px auto;padding:32px">

    <!-- Header -->
    <div style="margin-bottom:28px">
      <h1 style="color:#a78bfa;font-size:22px;margin:0 0 4px">WarrantyVault</h1>
      <p style="color:#475569;font-size:13px;margin:0">Warranty Expiry Alert</p>
    </div>

    <!-- Greeting -->
    <p style="color:#e2e8f0;font-size:15px;line-height:1.6;margin-bottom:24px">
      Hi ${name},<br><br>
      You have <strong style="color:#fbbf24">${totalCount} warranty${totalCount > 1 ? "ies" : "y"}</strong>
      that need${totalCount === 1 ? "s" : ""} your attention. ${list7.length > 0 ? `<strong style="color:#f87171">${list7.length}</strong> expiring within 7 days!` : ""}
    </p>

    ${urgentSection}
    ${warningSection}

    <!-- CTA -->
    <div style="margin-top:28px;text-align:center">
      <a href="https://warrantyvault-8eb66.web.app/warranties"
         style="display:inline-block;padding:12px 28px;background:linear-gradient(135deg,#7c3aed,#4f46e5);color:#fff;text-decoration:none;border-radius:12px;font-size:14px;font-weight:600">
        View My Warranties
      </a>
    </div>

    <!-- Footer -->
    <p style="color:#334155;font-size:12px;margin-top:36px;text-align:center;border-top:1px solid #1e1e3a;padding-top:20px">
      You're receiving this because you have an account on WarrantyVault.<br>
      &copy; 2026 WarrantyVault. All rights reserved.
    </p>
  </div>
</body>
</html>`;

    // Send via Resend
    const resendRes = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${RESEND_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: "WarrantyVault <onboarding@resend.dev>",
        to: [user.email],
        subject,
        html,
      }),
    });

    if (!resendRes.ok) {
      const errText = await resendRes.text();
      console.error("Resend error:", errText);
      return new Response(JSON.stringify({ error: `Resend error: ${errText}` }), {
        status: 500, headers: { ...getCorsHeaders(req), "Content-Type": "application/json" },
      });
    }

    return new Response(
      JSON.stringify({ sent: true, total: totalCount, urgent_7d: list7.length, warning_30d: list30.length, email: user.email }),
      { headers: { ...getCorsHeaders(req), "Content-Type": "application/json" } }
    );
  } catch (e) {
    console.error("send-expiry-email error:", e);
    return new Response(JSON.stringify({ error: e.message }), {
      status: 500, headers: { ...getCorsHeaders(req), "Content-Type": "application/json" },
    });
  }
});
