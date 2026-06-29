import { useState, useEffect, useRef } from "react";
import { Bot, Send, Sparkles } from "lucide-react";
import { aiService } from "../services/ai.service";
import { useWarranties } from "../hooks/useWarranties";

const SUGGESTED = [
  "Which warranties expire this month?",
  "How do I file a claim for my laptop?",
  "What does a manufacturer warranty cover?",
  "Show me my active warranties",
];

export default function AIAssistantPage() {
  const { warranties } = useWarranties();
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const bottomRef = useRef(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  async function sendMessage(text) {
    const userMsg = { role: "user", content: text };
    const updated = [...messages, userMsg];
    setMessages(updated);
    setInput("");
    setLoading(true);

    try {
      const reply = await aiService.chat(updated, warranties);
      setMessages([...updated, { role: "assistant", content: reply }]);
    } catch (err) {
      let content = "Sorry, something went wrong. Please try again.";
      if (err.message === "QUOTA_EXCEEDED")
        content = "Groq API rate limit reached. Please wait a moment and try again.";
      else if (err.message === "INVALID_KEY")
        content = "Groq API key is invalid. Please update VITE_GROQ_API_KEY in .env.local.";
      setMessages([...updated, { role: "assistant", content }]);
    } finally {
      setLoading(false);
    }
  }

  function handleSubmit(e) {
    e.preventDefault();
    if (!input.trim() || loading) return;
    sendMessage(input.trim());
  }

  return (
    <div className="max-w-3xl flex flex-col" style={{ height: "calc(100vh - 112px)" }}>
      {/* Header */}
      <div className="mb-4 shrink-0">
        <h1 className="text-2xl font-bold text-white">AI Assistant</h1>
        <p className="text-sm text-slate-500 mt-0.5">Powered by Groq (llama-3.3-70b)</p>
      </div>

      {/* Chat window */}
      <div
        className="flex-1 rounded-2xl p-4 overflow-y-auto"
        style={{ backgroundColor: "var(--bg-card)", border: "1px solid var(--border)" }}
      >
        {messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center gap-4">
            <div
              className="h-16 w-16 rounded-2xl flex items-center justify-center"
              style={{
                background: "linear-gradient(135deg, #7c3aed, #4f46e5)",
                boxShadow: "var(--glow)",
              }}
            >
              <Bot size={28} className="text-white" />
            </div>
            <div>
              <p className="text-white font-semibold">WarrantyVault AI</p>
              <p className="text-sm text-slate-500 mt-1 max-w-xs">
                Ask me anything about your warranties, claims, or coverage.
              </p>
            </div>
            <div className="flex flex-wrap justify-center gap-2 mt-2">
              {SUGGESTED.map((q) => (
                <button
                  key={q}
                  onClick={() => sendMessage(q)}
                  className="px-3 py-1.5 rounded-full text-xs font-medium transition-all hover:bg-white/10"
                  style={{ border: "1px solid var(--border)", color: "var(--accent-light)" }}
                >
                  {q}
                </button>
              ))}
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            {messages.map((msg, i) => (
              <div
                key={i}
                className={`flex gap-3 ${msg.role === "user" ? "justify-end" : "justify-start"}`}
              >
                {msg.role === "assistant" && (
                  <div
                    className="h-8 w-8 rounded-lg flex items-center justify-center shrink-0 mt-0.5"
                    style={{ background: "linear-gradient(135deg, #7c3aed, #4f46e5)" }}
                  >
                    <Sparkles size={13} className="text-white" />
                  </div>
                )}
                <div
                  className="max-w-[75%] rounded-2xl px-4 py-3 text-sm whitespace-pre-wrap leading-relaxed"
                  style={
                    msg.role === "user"
                      ? { background: "var(--accent)", color: "#fff", borderBottomRightRadius: 4 }
                      : {
                          background: "var(--bg-card-hover)",
                          border: "1px solid var(--border)",
                          color: "#cbd5e1",
                          borderBottomLeftRadius: 4,
                        }
                  }
                >
                  {msg.content}
                </div>
              </div>
            ))}

            {loading && (
              <div className="flex gap-3">
                <div
                  className="h-8 w-8 rounded-lg flex items-center justify-center shrink-0 mt-0.5"
                  style={{ background: "linear-gradient(135deg, #7c3aed, #4f46e5)" }}
                >
                  <Sparkles size={13} className="text-white" />
                </div>
                <div
                  className="rounded-2xl px-4 py-3 text-sm flex items-center gap-1.5"
                  style={{
                    background: "var(--bg-card-hover)",
                    border: "1px solid var(--border)",
                    color: "#64748b",
                    borderBottomLeftRadius: 4,
                  }}
                >
                  <span className="animate-bounce" style={{ animationDelay: "0ms" }}>·</span>
                  <span className="animate-bounce" style={{ animationDelay: "150ms" }}>·</span>
                  <span className="animate-bounce" style={{ animationDelay: "300ms" }}>·</span>
                </div>
              </div>
            )}
            <div ref={bottomRef} />
          </div>
        )}
      </div>

      {/* Input bar */}
      <form onSubmit={handleSubmit} className="mt-3 flex gap-2 shrink-0">
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Ask about your warranties…"
          disabled={loading}
          className="flex-1 text-sm text-white placeholder-slate-600 outline-none rounded-xl px-4 py-3 transition-all"
          style={{
            backgroundColor: "var(--bg-card)",
            border: "1px solid var(--border)",
          }}
          onFocus={(e) => (e.target.style.borderColor = "rgba(124,58,237,0.5)")}
          onBlur={(e) => (e.target.style.borderColor = "var(--border)")}
        />
        <button
          type="submit"
          disabled={!input.trim() || loading}
          className="h-12 w-12 rounded-xl flex items-center justify-center transition-all btn-glow disabled:opacity-40 disabled:cursor-not-allowed shrink-0"
          style={{ background: "var(--accent)" }}
        >
          <Send size={15} className="text-white" />
        </button>
      </form>
    </div>
  );
}
