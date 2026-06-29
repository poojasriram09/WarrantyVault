import { checkRateLimit } from "../utils/rateLimiter";

const GROQ_API_KEY = import.meta.env.VITE_GROQ_API_KEY;
const GROQ_URL = "https://api.groq.com/openai/v1/chat/completions";
const MODEL = "llama-3.3-70b-versatile";

// Max 20 chat requests per minute per session
const CHAT_RATE_LIMIT = 20;
const CHAT_WINDOW_MS = 60_000;

export const aiService = {
  async chat(messages, userWarranties = []) {
    if (!checkRateLimit("groq_chat", CHAT_RATE_LIMIT, CHAT_WINDOW_MS)) {
      throw new Error("RATE_LIMITED");
    }

    const today = new Date();
    const soon = userWarranties.filter((w) => {
      if (w.status !== "active") return false;
      const days = Math.ceil((new Date(w.end_date) - today) / 86400000);
      return days >= 0 && days <= 30;
    });

    const systemPrompt = `You are WarrantyBot, an intelligent warranty assistant built into WarrantyVault. Today's date is ${today.toDateString()}.

== YOUR ROLE ==
You are a helpful, concise, and friendly AI assistant specialised in warranties. You help users with:
1. General warranty questions — explain warranty terms, rights, coverage, what voids a warranty, consumer protection laws (especially Indian consumer law / Consumer Protection Act 2019).
2. System navigation — guide users to the right page: "Go to My Warranties", "Use the Add Product page to scan your receipt", "Visit Claim Assistant for step-by-step claim help", "Find service centers on the Service Centers page".
3. Warranty data analysis — analyse the user's stored products, highlight patterns, suggest actions.
4. Expiry warnings — proactively mention any warranties expiring within 30 days and advise immediate action.
5. Product insights — give useful insights about the user's warranty portfolio.

== USER'S WARRANTY PORTFOLIO ==
Total warranties: ${userWarranties.length}
Active: ${userWarranties.filter((w) => w.status === "active").length}
Expiring within 30 days: ${soon.length}${soon.length > 0 ? `\nExpiring soon:\n${soon.map((w) => `  - ${w.products?.product_name} (${w.products?.brand}) — expires ${w.end_date}`).join("\n")}` : ""}
Expired: ${userWarranties.filter((w) => w.status === "expired").length}

Full warranty list:
${JSON.stringify(
  userWarranties.map((w) => ({
    product: w.products?.product_name,
    brand: w.products?.brand,
    category: w.products?.category,
    status: w.status,
    start: w.start_date,
    expiry: w.end_date,
  })),
  null,
  2
)}

== RESPONSE STYLE ==
- Be concise — keep replies under 150 words unless deep analysis is asked.
- Use plain text. You may use bullet points (- item) for lists.
- Always be actionable — end with a suggestion or next step when relevant.
- If warranties are expiring soon, mention it proactively even if the user didn't ask.
- Never make up warranty data — only reference what's in the portfolio above.`;

    let res;
    try {
      res = await fetch(GROQ_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${GROQ_API_KEY}`,
        },
        body: JSON.stringify({
          model: MODEL,
          messages: [
            { role: "system", content: systemPrompt },
            ...messages.map((m) => ({ role: m.role, content: m.content })),
          ],
          temperature: 0.7,
          max_tokens: 512,
        }),
      });
    } catch {
      throw new Error("NETWORK_ERROR");
    }

    const data = await res.json();
    if (!res.ok) {
      if (res.status === 429) throw new Error("QUOTA_EXCEEDED");
      if (res.status === 401 || res.status === 403) throw new Error("INVALID_KEY");
      if (res.status === 400) throw new Error("INVALID_REQUEST");
      throw new Error(data?.error?.message ?? "Groq API request failed");
    }
    return data.choices?.[0]?.message?.content ?? "Sorry, I couldn't generate a response.";
  },
};
