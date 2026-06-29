import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Mail, FileText, ImageIcon, Loader2, Inbox, X, CheckCircle2 } from "lucide-react";
import { useTranslation } from "react-i18next";
import { gmailService } from "../services/gmail.service";
import { ocrService } from "../services/ocr.service";
import { productService } from "../services/product.service";
import { useAuthStore } from "../stores/authStore";
import { Input } from "../components/ui/Input";
import { Button } from "../components/ui/Button";
import { CATEGORIES, WARRANTY_TYPES, WARRANTY_DURATIONS } from "../utils/constants";
import { validateProductForm } from "../utils/validators";
import toast from "react-hot-toast";

const INITIAL = {
  productName: "", brand: "", modelNumber: "", serialNumber: "",
  category: "electronics", purchaseDate: "", purchasePrice: "",
  retailer: "", notes: "", warrantyMonths: "12", warrantyType: "manufacturer",
};

const selectStyle = {
  backgroundColor: "var(--bg-card)",
  border: "1px solid var(--border)",
  color: "#cbd5e1",
  borderRadius: "12px",
  padding: "10px 14px",
  fontSize: "14px",
  outline: "none",
  width: "100%",
};

export default function GmailImportPage() {
  const navigate = useNavigate();
  const { user, dbUser } = useAuthStore();
  const { t } = useTranslation("gmail");
  const { t: ta } = useTranslation("addProduct");
  const { t: tc } = useTranslation("common");
  const [status, setStatus] = useState("idle");
  const [emails, setEmails] = useState([]);
  const [accessToken, setAccessToken] = useState(null);
  const [selectedFile, setSelectedFile] = useState(null);
  const [receiptFile, setReceiptFile] = useState(null);
  const [ocrRawText, setOcrRawText] = useState(null);
  const [form, setForm] = useState(INITIAL);
  const [errors, setErrors] = useState({});
  const [saving, setSaving] = useState(false);

  function set(field, value) {
    setForm((prev) => ({ ...prev, [field]: value }));
    setErrors((prev) => ({ ...prev, [field]: undefined }));
  }

  async function handleConnect() {
    setStatus("connecting");
    try {
      const token = await gmailService.getAccessToken();
      setAccessToken(token);
      setStatus("searching");

      const messageIds = await gmailService.searchInvoiceEmails(token);
      if (!messageIds.length) {
        toast(t("toasts.noMatching"), { icon: "📭" });
        setEmails([]);
        setStatus("ready");
        return;
      }

      const messages = await Promise.all(
        messageIds.slice(0, 15).map(({ id }) => gmailService.getFullMessage(token, id))
      );

      const parsed = messages
        .map((msg) => ({
          id: msg.id,
          subject: gmailService.getHeader(msg.payload?.headers, "Subject") || t("noSubject"),
          from: gmailService.getHeader(msg.payload?.headers, "From"),
          date: gmailService.getHeader(msg.payload?.headers, "Date"),
          attachments: gmailService.findAttachmentParts(msg.payload || {}),
        }))
        .filter((m) => m.attachments.length > 0);

      setEmails(parsed);
      setStatus("ready");

      if (!parsed.length) {
        toast(t("toasts.noAttachments"), { icon: "📎" });
      }
    } catch (err) {
      console.error(err);
      if (err.message === "GMAIL_API_DISABLED") {
        toast.error(t("toasts.gmailNotEnabled"), { duration: 6000 });
      } else if (err.message === "GMAIL_AUTH_FAILED") {
        toast.error(t("toasts.accessDenied"), { duration: 5000 });
      } else if (err.code === "auth/popup-closed-by-user" || err.code === "auth/cancelled-popup-request") {
        toast.error(t("toasts.popupClosed"));
      } else {
        toast.error(t("toasts.gmailError", { message: err.message || "Unknown error" }));
      }
      setStatus("idle");
    }
  }

  async function handlePickAttachment(email, attachment) {
    setStatus("processing");
    setSelectedFile({ filename: attachment.filename, mimeType: attachment.mimeType });
    setForm(INITIAL);
    setErrors({});
    try {
      const attData = await gmailService.getAttachment(accessToken, email.id, attachment.attachmentId);
      const blob = gmailService.base64ToBlob(attData.data, attachment.mimeType);
      const file = new File([blob], attachment.filename, { type: attachment.mimeType });
      setReceiptFile(file);
      setOcrRawText(null);

      const data = await ocrService.extractFromImage(file);
      setOcrRawText(data?.rawText ?? null);

      if (data.productName) set("productName", data.productName);
      if (data.brand) set("brand", data.brand);
      if (data.modelNumber) set("modelNumber", data.modelNumber);
      if (data.serialNumber) set("serialNumber", data.serialNumber);
      if (data.price) set("purchasePrice", String(data.price));
      if (data.retailer) set("retailer", data.retailer);
      if (data.warrantyMonths) set("warrantyMonths", String(data.warrantyMonths));
      if (data.purchaseDate) {
        if (/^\d{4}[\/\-]\d{2}[\/\-]\d{2}$/.test(data.purchaseDate)) {
          set("purchaseDate", data.purchaseDate.replace(/\//g, "-"));
        } else {
          const parts = data.purchaseDate.split(/[\/\-\.]/);
          if (parts.length === 3) {
            const [d, m, y] = parts;
            const year = y.length === 2 ? `20${y}` : y;
            set("purchaseDate", `${year}-${m.padStart(2, "0")}-${d.padStart(2, "0")}`);
          }
        }
      }

      toast.success(t("toasts.extracted", { filename: attachment.filename }));
      setStatus("ready");
    } catch (err) {
      console.error(err);
      toast.error(t("toasts.extractFail"));
      setSelectedFile(null);
      setStatus("ready");
    }
  }

  async function handleSubmit(e) {
    e.preventDefault();
    if (!dbUser?.id) { toast.error(tc("errors.sessionNotLoaded")); return; }
    const errs = validateProductForm(form);
    if (Object.keys(errs).length) { setErrors(errs); return; }
    setSaving(true);
    try {
      await productService.addProductWithWarranty({
        userId: dbUser.id,
        ...form,
        purchasePrice: form.purchasePrice ? Number(form.purchasePrice) : null,
        warrantyMonths: form.warrantyMonths,
        receiptFile,
        receiptDocType: "invoice",
        ocrRawText,
      });
      toast.success(t("toasts.success"));
      navigate("/warranties");
    } catch (err) {
      toast.error(err.message || t("toasts.fail"));
    } finally {
      setSaving(false);
    }
  }

  function formatFrom(from = "") {
    const match = from.match(/^(.+?)\s*</);
    return match ? match[1].trim() : from;
  }

  function formatDate(dateStr = "") {
    try {
      return new Date(dateStr).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });
    } catch { return dateStr; }
  }

  return (
    <div className="w-full max-w-4xl space-y-4">
      <div>
        <div className="flex items-center gap-2 mb-1">
          <Mail size={20} style={{ color: "var(--accent-light)" }} />
          <h1 className="text-2xl font-bold text-white">{t("title")}</h1>
        </div>
        <p className="text-sm text-slate-500">{t("subtitle")}</p>
      </div>

      {/* Step 1 */}
      <div className="rounded-2xl overflow-hidden" style={{ backgroundColor: "var(--bg-card)", border: "1px solid var(--border)" }}>
        <div className="flex items-center justify-between px-5 py-4" style={{ borderBottom: "1px solid var(--border)" }}>
          <div className="flex items-center gap-2">
            <Mail size={15} style={{ color: "#fca5a5" }} />
            <span className="text-sm font-semibold text-white">{t("step1")}</span>
          </div>
          {status === "ready" && emails.length > 0 && (
            <span className="text-[11px] px-2 py-0.5 rounded-full" style={{ backgroundColor: "rgba(124,58,237,0.15)", color: "#a78bfa" }}>
              {t("emailsFound", { count: emails.length })}
            </span>
          )}
        </div>

        {status === "idle" && (
          <div className="px-5 py-8 flex flex-col items-center gap-3">
            <p className="text-sm text-slate-400 text-center">{t("connectHint")}</p>
            <button type="button" onClick={handleConnect}
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-medium transition-all hover:scale-[1.02] active:scale-[0.98]"
              style={{ background: "rgba(234,67,53,0.1)", border: "1px solid rgba(234,67,53,0.3)", color: "#fca5a5" }}>
              <Mail size={15} /> {t("connectBtn")}
            </button>
          </div>
        )}

        {(status === "connecting" || status === "searching" || status === "processing") && (
          <div className="flex flex-col items-center gap-3 py-12">
            <Loader2 size={26} className="animate-spin" style={{ color: "var(--accent-light)" }} />
            <p className="text-sm text-slate-400">
              {status === "connecting" && t("waitingPermission")}
              {status === "searching" && t("searchingInbox")}
              {status === "processing" && t("runningOcr")}
            </p>
          </div>
        )}

        {status === "ready" && emails.length === 0 && (
          <div className="flex flex-col items-center gap-3 py-12 text-slate-500">
            <Inbox size={32} />
            <p className="text-sm">{t("noEmails")}</p>
            <button type="button" onClick={handleConnect} className="text-xs text-slate-400 underline underline-offset-2">{tc("actions.tryAgain")}</button>
          </div>
        )}

        {status === "ready" && emails.length > 0 && (
          <div className="max-h-96 overflow-y-auto">
            {emails.map((email, i) => (
              <div key={email.id} className="px-5 py-4 hover:bg-white/[0.02] transition-colors"
                style={i < emails.length - 1 ? { borderBottom: "1px solid var(--border)" } : {}}>
                <p className="text-sm font-medium text-white truncate leading-snug">{email.subject}</p>
                <p className="text-xs text-slate-500 mt-0.5 truncate">
                  {formatFrom(email.from)}
                  {email.date && <span className="ml-2 text-slate-600">· {formatDate(email.date)}</span>}
                </p>
                <div className="flex flex-wrap gap-2 mt-2.5">
                  {email.attachments.map((att) => {
                    const isSelected = selectedFile?.filename === att.filename;
                    return (
                      <button key={att.attachmentId} type="button" onClick={() => handlePickAttachment(email, att)}
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all hover:scale-105 active:scale-95"
                        style={{
                          background: isSelected ? "rgba(34,197,94,0.12)" : "rgba(124,58,237,0.12)",
                          border: `1px solid ${isSelected ? "rgba(34,197,94,0.4)" : "rgba(124,58,237,0.3)"}`,
                          color: isSelected ? "#4ade80" : "#a78bfa",
                        }}>
                        {isSelected ? <CheckCircle2 size={11} /> : att.mimeType === "application/pdf" ? <FileText size={11} /> : <ImageIcon size={11} />}
                        <span className="max-w-[160px] truncate">{att.filename}</span>
                        {att.size > 0 && (
                          <span className="opacity-50">
                            {att.size > 1024 * 1024 ? `${(att.size / 1024 / 1024).toFixed(1)}MB` : `${Math.round(att.size / 1024)}KB`}
                          </span>
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Step 2 */}
      {selectedFile && (
        <div className="rounded-2xl overflow-hidden" style={{ backgroundColor: "var(--bg-card)", border: "1px solid var(--border)" }}>
          <div className="flex items-center justify-between px-5 py-4" style={{ borderBottom: "1px solid var(--border)" }}>
            <span className="text-sm font-semibold text-white">{t("step2")}</span>
            <div className="flex items-center gap-1.5 text-xs text-slate-400">
              {selectedFile.mimeType === "application/pdf" ? <FileText size={12} /> : <ImageIcon size={12} />}
              <span className="max-w-[200px] truncate">{selectedFile.filename}</span>
              <button type="button" onClick={() => { setSelectedFile(null); setForm(INITIAL); setOcrRawText(null); }} className="ml-1 text-slate-600 hover:text-slate-300">
                <X size={13} />
              </button>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="p-4">
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              <div className="col-span-2 sm:col-span-3">
                <Input label={ta("fields.productName")} value={form.productName} onChange={(e) => set("productName", e.target.value)} placeholder={ta("fields.productNamePh")} error={errors.productName} />
              </div>
              <Input label={ta("fields.brand")} value={form.brand} onChange={(e) => set("brand", e.target.value)} placeholder={ta("fields.brandPh")} />
              <Input label={ta("fields.modelNumber")} value={form.modelNumber} onChange={(e) => set("modelNumber", e.target.value)} placeholder={ta("fields.modelNumberPh")} />
              <Input label={ta("fields.serialNumber")} value={form.serialNumber} onChange={(e) => set("serialNumber", e.target.value)} placeholder={ta("fields.serialNumberPh")} />

              <div className="space-y-1.5">
                <label className="block text-sm font-medium text-slate-300">{ta("fields.category")}</label>
                <select value={form.category} onChange={(e) => set("category", e.target.value)} style={selectStyle}>
                  {CATEGORIES.map((c) => <option key={c.value} value={c.value} style={{ backgroundColor: "#0f1029" }}>{c.label}</option>)}
                </select>
              </div>

              <Input label={ta("fields.purchaseDate")} type="date" value={form.purchaseDate} onChange={(e) => set("purchaseDate", e.target.value)} error={errors.purchaseDate} />
              <Input label={ta("fields.price")} type="number" min="0" value={form.purchasePrice} onChange={(e) => set("purchasePrice", e.target.value)} placeholder={ta("fields.pricePh")} />
              <Input label={ta("fields.retailer")} value={form.retailer} onChange={(e) => set("retailer", e.target.value)} placeholder={ta("fields.retailerPh")} />

              <div className="space-y-1.5">
                <label className="block text-sm font-medium text-slate-300">{ta("fields.warrantyDuration")}</label>
                <select value={form.warrantyMonths} onChange={(e) => set("warrantyMonths", e.target.value)} style={selectStyle}>
                  {WARRANTY_DURATIONS.map((d) => <option key={d.value} value={d.value} style={{ backgroundColor: "#0f1029" }}>{d.label}</option>)}
                </select>
                {errors.warrantyMonths && <p className="text-xs text-red-400">{errors.warrantyMonths}</p>}
              </div>

              <div className="space-y-1.5">
                <label className="block text-sm font-medium text-slate-300">{ta("fields.warrantyType")}</label>
                <select value={form.warrantyType} onChange={(e) => set("warrantyType", e.target.value)} style={selectStyle}>
                  {WARRANTY_TYPES.map((wt) => <option key={wt.value} value={wt.value} style={{ backgroundColor: "#0f1029" }}>{wt.label}</option>)}
                </select>
              </div>

              <div className="col-span-2 sm:col-span-3 space-y-1.5">
                <label className="block text-sm font-medium text-slate-300">{ta("fields.notes")}</label>
                <textarea value={form.notes} onChange={(e) => set("notes", e.target.value)} rows={2}
                  className="w-full text-sm text-white placeholder-slate-600 outline-none focus:ring-1 rounded-xl"
                  style={{ backgroundColor: "rgba(255,255,255,0.04)", border: "1px solid var(--border)", padding: "10px 14px", resize: "vertical" }}
                  placeholder={ta("fields.notesPh")} />
              </div>
            </div>

            <div className="flex gap-3 pt-4">
              <Button type="submit" loading={saving}>{t("addToWarranties")}</Button>
              <Button type="button" variant="secondary" onClick={() => navigate("/warranties")}>{ta("cancel")}</Button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
