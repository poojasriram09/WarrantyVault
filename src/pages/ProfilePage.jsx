import { useState } from "react";
import { useTranslation } from "react-i18next";
import { updateProfile, sendPasswordResetEmail } from "../config/firebase";
import { auth } from "../config/firebase";
import { supabase } from "../config/supabase";
import { authService } from "../services/auth.service";
import { useAuthStore } from "../stores/authStore";
import { Avatar } from "../components/ui/Avatar";
import { Button } from "../components/ui/Button";
import {
  Mail, LogOut, KeyRound, Chrome, AtSign, Pencil, Check, X,
} from "lucide-react";
import toast from "react-hot-toast";
import { format } from "date-fns";

export default function ProfilePage() {
  const { user, dbUser, setDbUser, logout } = useAuthStore();
  const { t } = useTranslation("profile");
  const [editingName, setEditingName] = useState(false);
  const [nameValue, setNameValue] = useState("");
  const [savingName, setSavingName] = useState(false);
  const [resetSent, setResetSent] = useState(false);

  const name  = dbUser?.display_name || user?.displayName || "";
  const email = dbUser?.email        || user?.email        || "";
  const isGoogle = user?.providerData?.[0]?.providerId === "google.com";
  const memberSince = dbUser?.created_at
    ? format(new Date(dbUser.created_at), "MMMM yyyy")
    : null;

  function startEditName() {
    setNameValue(name);
    setEditingName(true);
  }

  async function saveName() {
    if (!nameValue.trim()) return;
    setSavingName(true);
    try {
      await updateProfile(auth.currentUser, { displayName: nameValue.trim() });
      await supabase
        .from("users")
        .update({ display_name: nameValue.trim() })
        .eq("id", dbUser.id);
      setDbUser({ ...dbUser, display_name: nameValue.trim() });
      setEditingName(false);
      toast.success(t("toasts.nameUpdated"));
    } catch {
      toast.error(t("toasts.nameUpdateFail"));
    } finally {
      setSavingName(false);
    }
  }

  async function handlePasswordReset() {
    try {
      await sendPasswordResetEmail(auth, email);
      setResetSent(true);
      toast.success(t("toasts.resetSent"));
    } catch {
      toast.error(t("toasts.resetFail"));
    }
  }

  async function handleLogout() {
    await authService.logout();
    logout();
  }

  return (
    <div className="max-w-2xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white">{t("title")}</h1>
        <p className="text-sm text-slate-500 mt-0.5">{t("subtitle")}</p>
      </div>

      {/* Avatar + name card */}
      <div
        className="rounded-2xl p-6"
        style={{ backgroundColor: "var(--bg-card)", border: "1px solid var(--border)" }}
      >
        <div className="flex items-center gap-5">
          <Avatar src={dbUser?.avatar_url || user?.photoURL} name={name} size="lg" />
          <div className="flex-1 min-w-0">
            {editingName ? (
              <div className="flex items-center gap-2">
                <input
                  value={nameValue}
                  onChange={(e) => setNameValue(e.target.value)}
                  onKeyDown={(e) => { if (e.key === "Enter") saveName(); if (e.key === "Escape") setEditingName(false); }}
                  autoFocus
                  className="flex-1 text-white text-lg font-semibold bg-transparent border-b outline-none pb-0.5"
                  style={{ borderColor: "var(--accent)" }}
                />
                <button onClick={saveName} disabled={savingName}
                  className="text-green-400 hover:text-green-300 transition-colors p-1">
                  <Check size={16} />
                </button>
                <button onClick={() => setEditingName(false)}
                  className="text-slate-500 hover:text-white transition-colors p-1">
                  <X size={16} />
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <p className="text-lg font-semibold text-white truncate">{name || "User"}</p>
                <button onClick={startEditName}
                  className="text-slate-600 hover:text-purple-400 transition-colors p-1 shrink-0">
                  <Pencil size={13} />
                </button>
              </div>
            )}
            <p className="text-sm text-slate-500 mt-0.5 truncate">{email}</p>
            <div className="flex items-center gap-2 mt-2 flex-wrap">
              <span
                className="inline-flex items-center gap-1.5 text-[11px] px-2.5 py-1 rounded-full font-medium"
                style={
                  isGoogle
                    ? { background: "rgba(234,67,53,0.12)", color: "#fca5a5" }
                    : { background: "rgba(124,58,237,0.12)", color: "#a78bfa" }
                }
              >
                {isGoogle ? <Chrome size={11} /> : <AtSign size={11} />}
                {isGoogle ? t("googleAccount") : t("emailPassword")}
              </span>
              {memberSince && (
                <span className="text-[11px] text-slate-600">{t("memberSince", { date: memberSince })}</span>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Account actions */}
      <div
        className="rounded-2xl p-6 space-y-3"
        style={{ backgroundColor: "var(--bg-card)", border: "1px solid var(--border)" }}
      >
        <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-4">{t("account")}</p>

        <div
          className="flex items-center justify-between py-3 px-4 rounded-xl"
          style={{ backgroundColor: "rgba(255,255,255,0.02)", border: "1px solid var(--border)" }}
        >
          <div className="flex items-center gap-3">
            <Mail size={15} className="text-slate-500" />
            <div>
              <p className="text-sm font-medium text-white">{t("email")}</p>
              <p className="text-xs text-slate-500">{email}</p>
            </div>
          </div>
        </div>

        {!isGoogle && (
          <div
            className="flex items-center justify-between py-3 px-4 rounded-xl"
            style={{ backgroundColor: "rgba(255,255,255,0.02)", border: "1px solid var(--border)" }}
          >
            <div className="flex items-center gap-3">
              <KeyRound size={15} className="text-slate-500" />
              <div>
                <p className="text-sm font-medium text-white">{t("password")}</p>
                <p className="text-xs text-slate-500">{t("resetHint")}</p>
              </div>
            </div>
            <Button
              variant="secondary"
              className="text-xs px-3 py-1.5"
              onClick={handlePasswordReset}
              disabled={resetSent}
            >
              {resetSent ? t("sent") : t("reset")}
            </Button>
          </div>
        )}

        <div className="pt-2">
          <Button variant="danger" onClick={handleLogout} className="w-full justify-center gap-2">
            <LogOut size={15} /> {t("signOut")}
          </Button>
        </div>
      </div>
    </div>
  );
}
