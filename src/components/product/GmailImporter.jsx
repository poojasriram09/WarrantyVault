import { useState } from "react";
import { Mail, Loader2, FileText, ImageIcon, X, ChevronDown, ChevronUp, Inbox } from "lucide-react";
import { gmailService } from "../../services/gmail.service";
import { ocrService } from "../../services/ocr.service";
import toast from "react-hot-toast";

// status: idle | connecting | searching | ready | processing
export function GmailImporter({ onExtracted, onFileSelected }) {
  const [open, setOpen] = useState(false);
  const [status, setStatus] = useState("idle");
  const [emails, setEmails] = useState([]);
  const [accessToken, setAccessToken] = useState(null);

  async function handleConnect() {
    setStatus("connecting");
    setOpen(true);
    try {
      const token = await gmailService.getAccessToken();
      setAccessToken(token);
      setStatus("searching");

      const messageIds = await gmailService.searchInvoiceEmails(token);

      if (!messageIds.length) {
        toast("No product invoice emails found.", { icon: "📭" });
        setEmails([]);
        setStatus("ready");
        return;
      }

      // Fetch full details for up to 15 messages in parallel
      const messages = await Promise.all(
        messageIds.slice(0, 15).map(({ id }) => gmailService.getFullMessage(token, id))
      );

      // Keep only messages that have image/PDF attachments
      const parsed = messages
        .map((msg) => ({
          id: msg.id,
          subject: gmailService.getHeader(msg.payload?.headers, "Subject") || "(No subject)",
          from: gmailService.getHeader(msg.payload?.headers, "From"),
          date: gmailService.getHeader(msg.payload?.headers, "Date"),
          attachments: gmailService.findAttachmentParts(msg.payload || {}),
        }))
        .filter((m) => m.attachments.length > 0);

      setEmails(parsed);
      setStatus("ready");

      if (!parsed.length) {
        toast("Product invoice emails found but none had image/PDF attachments.", { icon: "📎" });
      }
    } catch (err) {
      console.error(err);
      if (err.message === "GMAIL_API_DISABLED") {
        toast.error("Gmail API is not enabled. Enable it in Google Cloud Console → APIs & Services → Gmail API.", { duration: 6000 });
      } else if (err.message === "GMAIL_AUTH_FAILED") {
        toast.error("Gmail access denied. Please allow access when the popup appears.", { duration: 5000 });
      } else if (err.code === "auth/popup-closed-by-user" || err.code === "auth/cancelled-popup-request") {
        toast.error("Popup closed. Please try again and allow Gmail access.");
      } else {
        toast.error(`Gmail error: ${err.message || "Unknown error"}`);
      }
      setStatus("idle");
      setOpen(false);
    }
  }

  async function handlePickAttachment(email, attachment) {
    setStatus("processing");
    try {
      const attData = await gmailService.getAttachment(accessToken, email.id, attachment.attachmentId);
      const blob = gmailService.base64ToBlob(attData.data, attachment.mimeType);
      const file = new File([blob], attachment.filename, { type: attachment.mimeType });

      onFileSelected(file);

      const result = await ocrService.extractFromImage(file);
      onExtracted(result);

      toast.success(`OCR complete: ${attachment.filename}`);
      setOpen(false);
      setStatus("idle");
    } catch (err) {
      console.error(err);
      toast.error("Failed to process attachment.");
      setStatus("ready");
    }
  }

  function formatFrom(from = "") {
    // Extract just the name part before the email angle bracket
    const match = from.match(/^(.+?)\s*</);
    return match ? match[1].trim() : from;
  }

  function formatDate(dateStr = "") {
    try {
      return new Date(dateStr).toLocaleDateString("en-IN", {
        day: "numeric", month: "short", year: "numeric",
      });
    } catch {
      return dateStr;
    }
  }

  return (
    <div>
      {/* Trigger button */}
      <button
        type="button"
        onClick={status === "idle" ? handleConnect : () => setOpen((v) => !v)}
        className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium transition-all hover:scale-[1.02] active:scale-[0.98]"
        style={{
          background: "rgba(234,67,53,0.1)",
          border: "1px solid rgba(234,67,53,0.3)",
          color: "#fca5a5",
        }}
      >
        <Mail size={15} />
        Import from Gmail
        {open
          ? <ChevronUp size={13} className="opacity-60" />
          : <ChevronDown size={13} className="opacity-60" />}
      </button>

      {/* Panel */}
      {open && (
        <div
          className="mt-3 rounded-2xl overflow-hidden"
          style={{ border: "1px solid var(--border)", backgroundColor: "var(--bg-card)" }}
        >
          {/* Panel header */}
          <div
            className="flex items-center justify-between px-4 py-3"
            style={{ borderBottom: "1px solid var(--border)" }}
          >
            <div className="flex items-center gap-2">
              <Mail size={14} style={{ color: "#fca5a5" }} />
              <span className="text-sm font-semibold text-white">Gmail Invoices</span>
              {status === "ready" && emails.length > 0 && (
                <span
                  className="text-[11px] px-2 py-0.5 rounded-full"
                  style={{ backgroundColor: "rgba(124,58,237,0.15)", color: "#a78bfa" }}
                >
                  {emails.length} found
                </span>
              )}
            </div>
            <button
              type="button"
              onClick={() => setOpen(false)}
              className="text-slate-500 hover:text-white transition-colors p-1 rounded-lg hover:bg-white/10"
            >
              <X size={14} />
            </button>
          </div>

          {/* Loading states */}
          {(status === "connecting" || status === "searching" || status === "processing") && (
            <div className="flex flex-col items-center gap-3 py-12">
              <Loader2 size={26} className="animate-spin" style={{ color: "var(--accent-light)" }} />
              <p className="text-sm text-slate-400">
                {status === "connecting" && "Waiting for Google permission…"}
                {status === "searching" && "Searching your inbox for invoices…"}
                {status === "processing" && "Running OCR on attachment…"}
              </p>
            </div>
          )}

          {/* Empty state */}
          {status === "ready" && emails.length === 0 && (
            <div className="flex flex-col items-center gap-3 py-12 text-slate-500">
              <Inbox size={32} />
              <p className="text-sm">No invoice emails with attachments found.</p>
            </div>
          )}

          {/* Email list */}
          {status === "ready" && emails.length > 0 && (
            <div className="max-h-80 overflow-y-auto">
              {emails.map((email, i) => (
                <div
                  key={email.id}
                  style={i < emails.length - 1 ? { borderBottom: "1px solid var(--border)" } : {}}
                  className="px-4 py-3 hover:bg-white/[0.02] transition-colors"
                >
                  <p className="text-sm font-medium text-white truncate leading-snug">{email.subject}</p>
                  <p className="text-xs text-slate-500 mt-0.5 truncate">
                    {formatFrom(email.from)}
                    {email.date && (
                      <span className="ml-2 text-slate-600">· {formatDate(email.date)}</span>
                    )}
                  </p>

                  {/* Attachment pills */}
                  <div className="flex flex-wrap gap-2 mt-2.5">
                    {email.attachments.map((att) => (
                      <button
                        key={att.attachmentId}
                        type="button"
                        onClick={() => handlePickAttachment(email, att)}
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all hover:scale-105 active:scale-95"
                        style={{
                          background: "rgba(124,58,237,0.12)",
                          border: "1px solid rgba(124,58,237,0.3)",
                          color: "#a78bfa",
                        }}
                      >
                        {att.mimeType === "application/pdf"
                          ? <FileText size={11} />
                          : <ImageIcon size={11} />}
                        <span className="max-w-[160px] truncate">{att.filename}</span>
                        {att.size > 0 && (
                          <span className="opacity-50">
                            {att.size > 1024 * 1024
                              ? `${(att.size / 1024 / 1024).toFixed(1)}MB`
                              : `${Math.round(att.size / 1024)}KB`}
                          </span>
                        )}
                      </button>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
