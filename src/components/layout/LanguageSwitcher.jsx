import { useTranslation } from "react-i18next";
import { Globe } from "lucide-react";

const LANGUAGES = [
  { code: "en", label: "English", short: "EN" },
  { code: "hi", label: "हिन्दी", short: "HI" },
  { code: "mr", label: "मराठी", short: "MR" },
];

export default function LanguageSwitcher({ compact = false }) {
  const { i18n } = useTranslation();

  const current = LANGUAGES.find((l) => l.code === i18n.language) || LANGUAGES[0];

  return (
    <div className="relative flex items-center gap-1.5">
      <Globe size={14} className="text-slate-500 shrink-0" />
      <select
        value={i18n.language}
        onChange={(e) => i18n.changeLanguage(e.target.value)}
        className="appearance-none cursor-pointer outline-none text-xs font-medium"
        style={{
          background: "rgba(255,255,255,0.05)",
          border: "1px solid rgba(255,255,255,0.1)",
          color: "#94a3b8",
          borderRadius: "8px",
          padding: compact ? "4px 8px" : "6px 12px",
          paddingRight: compact ? "20px" : "24px",
          fontSize: "0.75rem",
        }}
      >
        {LANGUAGES.map((lang) => (
          <option
            key={lang.code}
            value={lang.code}
            style={{ background: "#0f1029", color: "#e2e8f0" }}
          >
            {compact ? lang.short : lang.label}
          </option>
        ))}
      </select>
    </div>
  );
}
