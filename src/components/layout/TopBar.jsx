import { Bell, CheckCheck, X } from "lucide-react";
import { useState, useEffect, useRef } from "react";
import { useTranslation } from "react-i18next";
import { useAuthStore } from "../../stores/authStore";
import { notificationService } from "../../services/notification.service";
import { Avatar } from "../ui/Avatar";
import LanguageSwitcher from "./LanguageSwitcher";

function timeAgo(dateStr) {
  const diff = Date.now() - new Date(dateStr).getTime();
  const m = Math.floor(diff / 60000);
  if (m < 1) return "just now";
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  return `${Math.floor(h / 24)}d ago`;
}

function NotificationPanel({ onClose, dbUserId, onNewNotification }) {
  const { t } = useTranslation("common");
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!dbUserId) { setLoading(false); return; }
    notificationService.getForUser(dbUserId)
      .then(setItems)
      .catch(() => setItems([]))
      .finally(() => setLoading(false));

    // Real-time: prepend new notifications as they arrive
    const channel = notificationService.subscribeToNew(dbUserId, (newItem) => {
      setItems((prev) => [newItem, ...prev]);
      onNewNotification?.();
    });
    return () => channel.unsubscribe();
  }, [dbUserId]);

  async function handleMarkAll() {
    if (!dbUserId) return;
    await notificationService.markAllRead(dbUserId);
    setItems((prev) => prev.map((n) => ({ ...n, is_read: true })));
  }

  async function handleMarkOne(id) {
    await notificationService.markRead(id);
    setItems((prev) => prev.map((n) => n.id === id ? { ...n, is_read: true } : n));
  }

  const unread = items.filter((n) => !n.is_read).length;

  return (
    <div
      className="absolute right-0 top-12 w-80 rounded-2xl overflow-hidden z-50 shadow-2xl"
      style={{
        backgroundColor: "var(--bg-card)",
        border: "1px solid var(--border)",
        boxShadow: "0 20px 60px rgba(0,0,0,0.5)",
      }}
    >
      {/* Header */}
      <div
        className="flex items-center justify-between px-4 py-3"
        style={{ borderBottom: "1px solid var(--border)" }}
      >
        <div className="flex items-center gap-2">
          <span className="text-sm font-semibold text-white">{t("notifications.title")}</span>
          {unread > 0 && (
            <span
              className="text-[10px] font-bold px-1.5 py-0.5 rounded-full text-white"
              style={{ backgroundColor: "var(--accent)" }}
            >
              {unread}
            </span>
          )}
        </div>
        <div className="flex items-center gap-1">
          {unread > 0 && (
            <button
              onClick={handleMarkAll}
              className="flex items-center gap-1 text-[11px] text-slate-400 hover:text-white transition-colors px-2 py-1 rounded-lg hover:bg-white/5"
            >
              <CheckCheck size={12} /> {t("notifications.markAllRead")}
            </button>
          )}
          <button
            onClick={onClose}
            className="h-6 w-6 flex items-center justify-center rounded-lg text-slate-400 hover:text-white hover:bg-white/5 transition-colors"
          >
            <X size={13} />
          </button>
        </div>
      </div>

      {/* Body */}
      <div className="max-h-80 overflow-y-auto">
        {loading ? (
          <div className="flex items-center justify-center py-10">
            <div className="h-5 w-5 rounded-full border-2 border-purple-500 border-t-transparent animate-spin" />
          </div>
        ) : items.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-10 gap-2 text-slate-500">
            <Bell size={22} />
            <p className="text-xs">{t("notifications.empty")}</p>
          </div>
        ) : (
          <ul>
            {items.map((n) => (
              <li
                key={n.id}
                onClick={() => !n.is_read && handleMarkOne(n.id)}
                className="flex gap-3 px-4 py-3 transition-colors cursor-default"
                style={{
                  borderBottom: "1px solid var(--border)",
                  backgroundColor: n.is_read ? "transparent" : "rgba(124,58,237,0.07)",
                }}
              >
                <div
                  className="h-2 w-2 rounded-full mt-1.5 shrink-0"
                  style={{ backgroundColor: n.is_read ? "transparent" : "var(--accent)" }}
                />
                <div className="flex-1 min-w-0">
                  <p className="text-xs text-white leading-snug">{n.message}</p>
                  <p className="text-[10px] text-slate-500 mt-0.5">{timeAgo(n.created_at)}</p>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}

export function TopBar() {
  const { dbUser, user } = useAuthStore();
  const name = dbUser?.display_name || user?.displayName || user?.email || "";
  const [open, setOpen] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const ref = useRef(null);

  // Load unread count on mount + re-fetch after short delay to catch login-inserted notifications
  useEffect(() => {
    if (!dbUser?.id) return;

    function fetchUnread() {
      notificationService.getForUser(dbUser.id)
        .then((items) => setUnreadCount(items.filter((n) => !n.is_read).length))
        .catch(() => {});
    }

    fetchUnread();
    // Re-fetch after 3s to catch notifications inserted during login
    const timer = setTimeout(fetchUnread, 3000);

    const channel = notificationService.subscribeToNew(dbUser.id, () => {
      setUnreadCount((c) => c + 1);
    });
    return () => { clearTimeout(timer); channel.unsubscribe(); };
  }, [dbUser?.id]);

  // Close on outside click
  useEffect(() => {
    function handler(e) {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    }
    if (open) document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [open]);

  return (
    <header
      className="h-16 flex items-center justify-between px-6 shrink-0"
      style={{
        backgroundColor: "rgba(10, 11, 30, 0.8)",
        borderBottom: "1px solid var(--border)",
        backdropFilter: "blur(12px)",
        WebkitBackdropFilter: "blur(12px)",
      }}
    >
      <div />
      <div className="flex items-center gap-4">
        {/* Language */}
        <LanguageSwitcher compact />
        {/* Bell */}
        <div className="relative" ref={ref}>
          <button
            onClick={() => setOpen((v) => !v)}
            className="relative h-9 w-9 flex items-center justify-center rounded-xl transition-all text-slate-400 hover:text-white"
            style={{ border: "1px solid var(--border)", backgroundColor: "var(--bg-card)" }}
          >
            <Bell size={17} />
            {unreadCount > 0 && (
              <span
                className="absolute -top-1 -right-1 min-w-[18px] h-[18px] flex items-center justify-center rounded-full text-[10px] font-bold text-white px-1"
                style={{ backgroundColor: "#ef4444" }}
              >
                {unreadCount > 99 ? "99+" : unreadCount}
              </span>
            )}
          </button>
          {open && (
            <NotificationPanel
              onClose={() => setOpen(false)}
              dbUserId={dbUser?.id}
              onNewNotification={() => setUnreadCount((c) => c + 1)}
            />
          )}
        </div>

        {/* User chip */}
        <div
          className="flex items-center gap-2.5 px-3 py-1.5 rounded-xl"
          style={{ border: "1px solid var(--border)", backgroundColor: "var(--bg-card)" }}
        >
          <Avatar src={dbUser?.avatar_url || user?.photoURL} name={name} size="sm" />
          <span className="text-sm text-slate-300 hidden sm:block max-w-[120px] truncate">
            {name || "User"}
          </span>
        </div>
      </div>
    </header>
  );
}
