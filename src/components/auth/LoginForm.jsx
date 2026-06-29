import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { authService } from "../../services/auth.service";
import { Button } from "../ui/Button";
import { Input } from "../ui/Input";
import { GoogleSignIn } from "./GoogleSignIn";
import { Mail, ArrowLeft, CheckCircle } from "lucide-react";

export function LoginForm() {
  const navigate = useNavigate();
  const { t } = useTranslation("auth");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  // Forgot password state
  const [showReset, setShowReset] = useState(false);
  const [resetEmail, setResetEmail] = useState("");
  const [resetLoading, setResetLoading] = useState(false);
  const [resetError, setResetError] = useState("");
  const [resetSent, setResetSent] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      await authService.loginWithEmail(email, password);
      navigate("/dashboard");
    } catch (err) {
      setError(err.message.replace("Firebase: ", "").replace(/\s*\(auth\/.*\)\.?$/, ""));
    } finally {
      setLoading(false);
    }
  }

  async function handleReset(e) {
    e.preventDefault();
    setResetError("");
    setResetLoading(true);
    try {
      await authService.resetPassword(resetEmail);
      setResetSent(true);
    } catch (err) {
      const msg = err.message.replace("Firebase: ", "").replace(/\s*\(auth\/.*\)\.?$/, "");
      setResetError(
        err.message.includes("user-not-found") || err.message.includes("invalid-email")
          ? "No account found with that email address."
          : msg
      );
    } finally {
      setResetLoading(false);
    }
  }

  function openReset() {
    setResetEmail(email);
    setResetError("");
    setResetSent(false);
    setShowReset(true);
  }

  // ── Forgot password panel ──
  if (showReset) {
    return (
      <div className="space-y-5">
        <button
          onClick={() => setShowReset(false)}
          className="flex items-center gap-1.5 text-sm text-slate-400 hover:text-white transition-colors"
        >
          <ArrowLeft size={15} />
          {t("resetPassword.backToSignIn")}
        </button>

        {resetSent ? (
          <div className="flex flex-col items-center text-center gap-4 py-4">
            <div
              className="w-16 h-16 rounded-2xl flex items-center justify-center"
              style={{ background: "rgba(74,222,128,0.12)", border: "1px solid rgba(74,222,128,0.25)" }}
            >
              <CheckCircle size={32} className="text-green-400" />
            </div>
            <div>
              <p className="text-white font-semibold text-lg">{t("resetPassword.checkInbox")}</p>
              <p className="text-slate-400 text-sm mt-1">
                {t("resetPassword.sentTo", { email: resetEmail })}
              </p>
            </div>
            <p className="text-slate-500 text-xs">
              {t("resetPassword.didntReceive")}
              <button
                onClick={() => setResetSent(false)}
                className="underline hover:text-slate-300 transition-colors"
              >
                {t("resetPassword.tryAgain")}
              </button>
            </p>
            <Button className="w-full py-2.5 mt-1" onClick={() => setShowReset(false)}>
              {t("resetPassword.backToSignIn")}
            </Button>
          </div>
        ) : (
          <form onSubmit={handleReset} className="space-y-4">
            <div>
              <p className="text-white font-semibold text-lg mb-1">{t("resetPassword.title")}</p>
              <p className="text-slate-400 text-sm">
                {t("resetPassword.subtitle")}
              </p>
            </div>
            <div className="relative">
              <Input
                label={t("resetPassword.emailLabel")}
                type="email"
                value={resetEmail}
                onChange={(e) => setResetEmail(e.target.value)}
                placeholder={t("resetPassword.emailPh")}
                required
              />
            </div>
            {resetError && (
              <div
                className="rounded-xl px-4 py-2.5 text-sm text-red-400"
                style={{ backgroundColor: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.2)" }}
              >
                {resetError}
              </div>
            )}
            <Button type="submit" loading={resetLoading} className="w-full py-2.5">
              <Mail size={15} className="mr-2" />
              {t("resetPassword.sendBtn")}
            </Button>
          </form>
        )}
      </div>
    );
  }

  // ── Normal login form ──
  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <Input label={t("login.email")} type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder={t("login.emailPh")} required />
      <div className="space-y-1">
        <Input label={t("login.password")} type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder={t("login.passwordPh")} required />
        <div className="flex justify-end">
          <button
            type="button"
            onClick={openReset}
            className="text-xs transition-colors hover:text-white"
            style={{ color: "var(--accent-light)" }}
          >
            {t("login.forgotPassword")}
          </button>
        </div>
      </div>
      {error && (
        <div className="rounded-xl px-4 py-2.5 text-sm text-red-400" style={{ backgroundColor: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.2)" }}>
          {error}
        </div>
      )}
      <Button type="submit" loading={loading} className="w-full py-2.5">{t("login.signIn")}</Button>
      <GoogleSignIn onSuccess={() => navigate("/dashboard")} />
      <p className="text-center text-sm text-slate-500">
        {t("login.noAccount")}
        <Link to="/signup" className="font-medium hover:text-white transition-colors" style={{ color: "var(--accent-light)" }}>
          {t("login.signUp")}
        </Link>
      </p>
    </form>
  );
}
