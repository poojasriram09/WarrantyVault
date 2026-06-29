import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { authService } from "../../services/auth.service";
import { Button } from "../ui/Button";
import { Input } from "../ui/Input";
import { GoogleSignIn } from "./GoogleSignIn";

export function SignupForm() {
  const navigate = useNavigate();
  const { t } = useTranslation("auth");
  const [form, setForm] = useState({ firstName: "", lastName: "", email: "", password: "" });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  function set(field, value) {
    setForm((prev) => ({ ...prev, [field]: value }));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    if (!form.firstName.trim()) { setError(t("validation.firstNameRequired")); return; }
    if (!form.email.trim()) { setError(t("validation.emailRequired")); return; }
    if (form.password.length < 8) { setError(t("validation.passwordMin")); return; }
    if (!/[A-Z]/.test(form.password)) { setError(t("validation.passwordUppercase")); return; }
    if (!/[0-9]/.test(form.password)) { setError(t("validation.passwordNumber")); return; }
    if (!/[^A-Za-z0-9]/.test(form.password)) { setError(t("validation.passwordSpecial")); return; }
    setLoading(true);
    try {
      const displayName = [form.firstName.trim(), form.lastName.trim()].filter(Boolean).join(" ");
      await authService.signup(form.email.trim(), form.password, displayName);
      navigate("/dashboard");
    } catch (err) {
      const msg = err.message;
      setError(
        msg === "ACCESS_DENIED"
          ? t("validation.notAuthorised")
          : msg.replace("Firebase: ", "").replace(/\s*\(auth\/.*\)\.?$/, "")
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-2 gap-3">
        <Input
          label={t("signup.firstName")}
          type="text"
          value={form.firstName}
          onChange={(e) => set("firstName", e.target.value)}
          placeholder={t("signup.firstNamePh")}
          required
        />
        <Input
          label={t("signup.lastName")}
          type="text"
          value={form.lastName}
          onChange={(e) => set("lastName", e.target.value)}
          placeholder={t("signup.lastNamePh")}
        />
      </div>
      <Input
        label={t("signup.email")}
        type="email"
        value={form.email}
        onChange={(e) => set("email", e.target.value)}
        placeholder={t("signup.emailPh")}
        required
      />
      <Input
        label={t("signup.password")}
        type="password"
        value={form.password}
        onChange={(e) => set("password", e.target.value)}
        placeholder={t("signup.passwordPh")}
        required
      />
      {error && (
        <div
          className="rounded-xl px-4 py-2.5 text-sm text-red-400"
          style={{ backgroundColor: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.2)" }}
        >
          {error}
        </div>
      )}
      <Button type="submit" loading={loading} className="w-full py-2.5">
        {t("signup.createAccount")}
      </Button>
      <GoogleSignIn onSuccess={() => navigate("/dashboard")} />
      <p className="text-center text-sm text-slate-500">
        {t("signup.hasAccount")}
        <Link
          to="/login"
          className="font-medium hover:text-white transition-colors"
          style={{ color: "var(--accent-light)" }}
        >
          {t("signup.signIn")}
        </Link>
      </p>
    </form>
  );
}
