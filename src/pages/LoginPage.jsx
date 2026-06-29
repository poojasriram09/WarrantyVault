import { useTranslation } from "react-i18next";
import { LoginForm } from "../components/auth/LoginForm";
import LanguageSwitcher from "../components/layout/LanguageSwitcher";

export default function LoginPage() {
  const { t } = useTranslation("auth");

  return (
    <div
      className="min-h-screen flex items-center justify-center p-4 bg-grid"
      style={{ backgroundColor: "var(--bg-base)" }}
    >
      {/* Glow orbs */}
      <div
        className="fixed top-[-200px] left-[-200px] w-[600px] h-[600px] rounded-full pointer-events-none"
        style={{ background: "radial-gradient(circle, rgba(124,58,237,0.12) 0%, transparent 70%)" }}
      />
      <div
        className="fixed bottom-[-200px] right-[-200px] w-[500px] h-[500px] rounded-full pointer-events-none"
        style={{ background: "radial-gradient(circle, rgba(79,70,229,0.1) 0%, transparent 70%)" }}
      />

      <div className="w-full max-w-md relative">
        <div className="absolute top-0 right-0">
          <LanguageSwitcher compact />
        </div>
        <div className="text-center mb-8">
          <img src="/logo.png" alt="WarrantyVault" className="h-14 w-14 rounded-2xl object-cover block mx-auto mb-4" style={{ boxShadow: "var(--glow)" }} />
          <h1 className="text-2xl font-bold text-white">{t("login.title")}</h1>
          <p className="text-slate-400 text-sm mt-1">{t("login.subtitle")}</p>
        </div>

        <div
          className="rounded-2xl p-8"
          style={{
            backgroundColor: "var(--bg-card)",
            border: "1px solid var(--border)",
            boxShadow: "0 24px 64px rgba(0,0,0,0.4)",
          }}
        >
          <LoginForm />
        </div>
      </div>
    </div>
  );
}
