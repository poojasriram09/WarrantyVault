import emailjs from "@emailjs/browser";
import { sanitize } from "../utils/validators";

const SERVICE_ID = import.meta.env.VITE_EMAILJS_SERVICE_ID;
const TEMPLATE_ID = import.meta.env.VITE_EMAILJS_TEMPLATE_ID;
const PUBLIC_KEY = import.meta.env.VITE_EMAILJS_PUBLIC_KEY;

/**
 * Send warranty expiry alert email via EmailJS.
 * Template variables: to_email, to_name, urgent_count, warning_count, total_count, warranty_table
 */
export async function sendExpiryEmail({ email, displayName, warranties7d, warranties30d }) {
  if (!SERVICE_ID || !TEMPLATE_ID || !PUBLIC_KEY) {
    console.warn("EmailJS not configured — skipping expiry email");
    return null;
  }

  const totalCount = warranties7d.length + warranties30d.length;
  if (totalCount === 0) return null;

  // Build HTML table rows
  const buildRows = (items) =>
    items.map((w) => {
      const daysLeft = Math.ceil(
        (new Date(w.end_date).getTime() - Date.now()) / (1000 * 60 * 60 * 24)
      );
      const color = daysLeft <= 3 ? "#ef4444" : daysLeft <= 7 ? "#f87171" : "#fbbf24";
      return `<tr>
        <td style="padding:8px 12px;border-bottom:1px solid #1e1e3a;color:#e2e8f0">${sanitize(w.products?.product_name) ?? "—"}</td>
        <td style="padding:8px 12px;border-bottom:1px solid #1e1e3a;color:#94a3b8">${sanitize(w.products?.brand) ?? "—"}</td>
        <td style="padding:8px 12px;border-bottom:1px solid #1e1e3a;color:${color};font-weight:600">${daysLeft} day${daysLeft !== 1 ? "s" : ""}</td>
        <td style="padding:8px 12px;border-bottom:1px solid #1e1e3a;color:#64748b">${w.end_date}</td>
      </tr>`;
    }).join("");

  const buildSection = (title, badgeColor, items) => {
    if (items.length === 0) return "";
    return `
      <div style="margin-bottom:16px">
        <span style="display:inline-block;padding:3px 10px;background:${badgeColor};color:#fff;border-radius:16px;font-size:12px;font-weight:600;margin-bottom:8px">${title}</span>
        <table style="width:100%;border-collapse:collapse;background:#0f1029;border-radius:8px;overflow:hidden;border:1px solid rgba(255,255,255,0.07)">
          <thead><tr style="background:#1e1b4b">
            <th style="padding:8px 12px;text-align:left;color:#a78bfa;font-size:11px;text-transform:uppercase">Product</th>
            <th style="padding:8px 12px;text-align:left;color:#a78bfa;font-size:11px;text-transform:uppercase">Brand</th>
            <th style="padding:8px 12px;text-align:left;color:#a78bfa;font-size:11px;text-transform:uppercase">Days Left</th>
            <th style="padding:8px 12px;text-align:left;color:#a78bfa;font-size:11px;text-transform:uppercase">Expires On</th>
          </tr></thead>
          <tbody>${buildRows(items)}</tbody>
        </table>
      </div>`;
  };

  const warrantyTable =
    buildSection(`URGENT — ${warranties7d.length} expiring in 7 days`, "#dc2626", warranties7d) +
    buildSection(`${warranties30d.length} expiring in 30 days`, "#d97706", warranties30d);

  const templateParams = {
    to_email: email,
    to_name: displayName || "there",
    urgent_count: String(warranties7d.length),
    warning_count: String(warranties30d.length),
    total_count: String(totalCount),
    warranty_table: warrantyTable,
  };

  const res = await emailjs.send(SERVICE_ID, TEMPLATE_ID, templateParams, PUBLIC_KEY);
  return res;
}
