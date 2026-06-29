import { useState, useRef, useEffect } from "react";
import { Bot, X, Send, Loader2, Shield, ChevronDown } from "lucide-react";
import { useTranslation } from "react-i18next";
import { aiService } from "../../services/ai.service";
import { useWarrantyStore } from "../../stores/warrantyStore";

export function WarrantyBot() {
  const { t, i18n } = useTranslation("chatbot");
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState([
    { role: "assistant", content: t("greeting") },
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const bottomRef = useRef(null);
  const inputRef = useRef(null);
  const { warranties } = useWarrantyStore();

  // Update greeting when language changes
  useEffect(() => {
    setMessages((prev) => {
      if (prev.length === 1 && prev[0].role === "assistant") {
        return [{ role: "assistant", content: t("greeting") }];
      }
      return prev;
    });
  }, [i18n.language, t]);

  const QUICK_PROMPTS = [
    t("quickPrompts.expiringSoon"),
    t("quickPrompts.fileClaim"),
    t("quickPrompts.analyzePortfolio"),
    t("quickPrompts.addProduct"),
  ];

  // Scroll to bottom on new message
  useEffect(() => {
    if (open) bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, open]);

  // Focus input when opened
  useEffect(() => {
    if (open) setTimeout(() => inputRef.current?.focus(), 150);
  }, [open]);

  async function sendMessage(text) {
    const userText = (text ?? input).trim();
    if (!userText || loading) return;
    setInput("");
    setError(null);

    const newMessages = [...messages, { role: "user", content: userText }];
    setMessages(newMessages);
    setLoading(true);

    try {
      // Pass all messages except the initial greeting (which is just UI)
      const history = newMessages.filter((_, i) => i !== 0);
      const reply = await aiService.chat(history, warranties);
      setMessages((prev) => [...prev, { role: "assistant", content: reply }]);
    } catch (err) {
      const msgMap = {
        QUOTA_EXCEEDED: t("errors.quotaExceeded"),
        INVALID_KEY: t("errors.invalidKey"),
        NETWORK_ERROR: t("errors.networkError"),
        INVALID_REQUEST: t("errors.invalidRequest"),
      };
      setError(msgMap[err.message] ?? err.message ?? t("errors.generic"));
    } finally {
      setLoading(false);
    }
  }

  function handleKey(e) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  }

  return (
    <>
      {/* ── Chat window ── */}
      <div
        className="fixed z-50 flex flex-col transition-all duration-300"
        style={{
          bottom: "calc(1.5rem + 56px + 1rem)",
          right: "1.25rem",
          width: open ? "min(380px, calc(100vw - 2.5rem))" : "0",
          height: open ? "520px" : "0",
          opacity: open ? 1 : 0,
          pointerEvents: open ? "auto" : "none",
          borderRadius: "20px",
          background: "#0a0b1e",
          border: "1px solid rgba(124,58,237,0.35)",
          boxShadow: "0 0 60px rgba(124,58,237,0.25), 0 24px 48px rgba(0,0,0,0.6)",
          overflow: "hidden",
          transform: open ? "scale(1) translateY(0)" : "scale(0.92) translateY(16px)",
          transformOrigin: "bottom right",
        }}
      >
        {/* Header */}
        <div
          className="flex items-center justify-between px-4 py-3 shrink-0"
          style={{
            background: "linear-gradient(135deg, rgba(124,58,237,0.3), rgba(96,165,250,0.15))",
            borderBottom: "1px solid rgba(124,58,237,0.25)",
          }}
        >
          <div className="flex items-center gap-2.5">
            <img src="/logo.png" alt="WarrantyVault" className="w-8 h-8 rounded-xl object-cover shrink-0" />
            <div>
              <div className="text-white font-bold text-sm leading-none">WarrantyBot</div>
              <div className="flex items-center gap-1 mt-0.5">
                <span className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" />
                <span className="text-green-400 text-[10px]">{t("online")}</span>
              </div>
            </div>
          </div>
          <button
            onClick={() => setOpen(false)}
            className="text-slate-400 hover:text-white transition-colors p-1 rounded-lg hover:bg-white/10"
          >
            <ChevronDown size={18} />
          </button>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto px-4 py-3 flex flex-col gap-3">
          {messages.map((msg, i) => (
            <div
              key={i}
              className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
            >
              {msg.role === "assistant" && (
                <div
                  className="w-6 h-6 rounded-lg flex items-center justify-center shrink-0 mr-2 mt-0.5"
                  style={{ background: "linear-gradient(135deg, #7c3aed, #60a5fa)" }}
                >
                  <Bot size={12} className="text-white" />
                </div>
              )}
              <div
                className="max-w-[82%] px-3.5 py-2.5 rounded-2xl text-sm leading-relaxed whitespace-pre-wrap"
                style={
                  msg.role === "user"
                    ? {
                        background: "linear-gradient(135deg, #7c3aed, #6d28d9)",
                        color: "#fff",
                        borderBottomRightRadius: "6px",
                      }
                    : {
                        background: "rgba(255,255,255,0.05)",
                        border: "1px solid rgba(255,255,255,0.08)",
                        color: "#cbd5e1",
                        borderBottomLeftRadius: "6px",
                      }
                }
              >
                {msg.content}
              </div>
            </div>
          ))}

          {/* Loading bubble */}
          {loading && (
            <div className="flex justify-start">
              <div
                className="w-6 h-6 rounded-lg flex items-center justify-center shrink-0 mr-2 mt-0.5"
                style={{ background: "linear-gradient(135deg, #7c3aed, #60a5fa)" }}
              >
                <Bot size={12} className="text-white" />
              </div>
              <div
                className="px-3.5 py-3 rounded-2xl flex items-center gap-1"
                style={{
                  background: "rgba(255,255,255,0.05)",
                  border: "1px solid rgba(255,255,255,0.08)",
                  borderBottomLeftRadius: "6px",
                }}
              >
                {[0, 1, 2].map((i) => (
                  <span
                    key={i}
                    className="w-1.5 h-1.5 rounded-full bg-purple-400"
                    style={{ animation: `bounce 1.2s ease-in-out ${i * 0.2}s infinite` }}
                  />
                ))}
              </div>
            </div>
          )}

          {/* Error */}
          {error && (
            <div
              className="text-xs px-3 py-2 rounded-xl text-red-400"
              style={{ background: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.2)" }}
            >
              {error}
            </div>
          )}

          <div ref={bottomRef} />
        </div>

        {/* Quick prompts — only show when just the greeting is visible */}
        {messages.length === 1 && !loading && (
          <div className="px-4 pb-2 flex flex-wrap gap-1.5 shrink-0">
            {QUICK_PROMPTS.map((p) => (
              <button
                key={p}
                onClick={() => sendMessage(p)}
                className="text-[11px] px-2.5 py-1 rounded-full text-purple-300 transition-all hover:text-white"
                style={{
                  background: "rgba(124,58,237,0.12)",
                  border: "1px solid rgba(124,58,237,0.3)",
                }}
              >
                {p}
              </button>
            ))}
          </div>
        )}

        {/* Input */}
        <div
          className="px-3 py-3 shrink-0 flex items-end gap-2"
          style={{ borderTop: "1px solid rgba(255,255,255,0.06)" }}
        >
          <textarea
            ref={inputRef}
            rows={1}
            value={input}
            onChange={(e) => {
              setInput(e.target.value);
              e.target.style.height = "auto";
              e.target.style.height = Math.min(e.target.scrollHeight, 96) + "px";
            }}
            onKeyDown={handleKey}
            placeholder={t("placeholder")}
            className="flex-1 resize-none rounded-xl px-3.5 py-2.5 text-sm text-white placeholder-slate-500 outline-none transition-all"
            style={{
              background: "rgba(255,255,255,0.05)",
              border: "1px solid rgba(255,255,255,0.1)",
              minHeight: "40px",
              maxHeight: "96px",
              lineHeight: "1.5",
            }}
            onFocus={(e) => (e.target.style.borderColor = "rgba(124,58,237,0.6)")}
            onBlur={(e) => (e.target.style.borderColor = "rgba(255,255,255,0.1)")}
          />
          <button
            onClick={() => sendMessage()}
            disabled={!input.trim() || loading}
            className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0 transition-all disabled:opacity-40"
            style={{
              background: "linear-gradient(135deg, #7c3aed, #6d28d9)",
              boxShadow: input.trim() ? "0 0 16px rgba(124,58,237,0.4)" : "none",
            }}
          >
            {loading ? (
              <Loader2 size={16} className="text-white animate-spin" />
            ) : (
              <Send size={16} className="text-white" />
            )}
          </button>
        </div>
      </div>

      {/* ── FAB button ── */}
      <button
        onClick={() => setOpen((v) => !v)}
        className="fixed z-50 w-14 h-14 rounded-2xl flex items-center justify-center transition-all duration-300 hover:scale-110 active:scale-95"
        style={{
          bottom: "calc(1.5rem + 56px + 1rem)",
          right: "1.25rem",
          background: open
            ? "linear-gradient(135deg, #6d28d9, #4f46e5)"
            : "linear-gradient(135deg, #7c3aed, #60a5fa)",
          boxShadow: open
            ? "0 0 32px rgba(124,58,237,0.5)"
            : "0 0 24px rgba(124,58,237,0.4), 0 8px 24px rgba(0,0,0,0.4)",
        }}
        aria-label="Toggle WarrantyBot"
      >
        {open ? (
          <X size={22} className="text-white" />
        ) : (
          <Bot size={24} className="text-white" />
        )}

        {/* Pulse ring when closed */}
        {!open && (
          <span
            className="absolute inset-0 rounded-2xl animate-ping"
            style={{ background: "rgba(124,58,237,0.3)", animationDuration: "2s" }}
          />
        )}
      </button>

      <style>{`
        @keyframes bounce {
          0%, 100% { transform: translateY(0); opacity: 0.5; }
          50% { transform: translateY(-4px); opacity: 1; }
        }
      `}</style>
    </>
  );
}
