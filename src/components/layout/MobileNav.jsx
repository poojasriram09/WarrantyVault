import { NavLink, useNavigate } from "react-router-dom";
import { useState, useEffect, useRef } from "react";
import {
  LayoutDashboard, ShieldCheck, PlusCircle, Wrench, Lock,
  MapPin, User, LogOut, MoreHorizontal, X, Mail,
} from "lucide-react";
import { useTranslation } from "react-i18next";
import { authService } from "../../services/auth.service";
import { useAuthStore } from "../../stores/authStore";

const navKeys = [
  { to: "/dashboard",       key: "nav.home",      icon: LayoutDashboard },
  { to: "/warranties",      key: "nav.warranties", icon: ShieldCheck },
  { to: "/add-product",     key: "nav.add",        icon: PlusCircle },
  { to: "/digital-locker",  key: "nav.locker",     icon: Lock },
];

const moreKeys = [
  { to: "/gmail-import",     key: "nav.importGmail",     icon: Mail },
  { to: "/claim-assistant",  key: "nav.claimAssistant",  icon: Wrench },
  { to: "/service-centers",  key: "nav.serviceCenters",  icon: MapPin },
  { to: "/profile",          key: "nav.profile",         icon: User },
];

export function MobileNav() {
  const { t } = useTranslation("common");
  const [moreOpen, setMoreOpen] = useState(false);
  const menuRef = useRef(null);
  const navigate = useNavigate();
  const { logout } = useAuthStore();

  // Close menu on outside click
  useEffect(() => {
    function handler(e) {
      if (menuRef.current && !menuRef.current.contains(e.target)) setMoreOpen(false);
    }
    if (moreOpen) document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [moreOpen]);

  async function handleLogout() {
    setMoreOpen(false);
    await authService.logout();
    logout();
  }

  return (
    <nav
      className="md:hidden fixed bottom-0 left-0 right-0 z-40"
      style={{
        backgroundColor: "rgba(10, 11, 30, 0.95)",
        borderTop: "1px solid var(--border)",
        backdropFilter: "blur(12px)",
        WebkitBackdropFilter: "blur(12px)",
        paddingBottom: "env(safe-area-inset-bottom, 0px)",
      }}
    >
      {/* More menu popup */}
      {moreOpen && (
        <div
          ref={menuRef}
          className="absolute bottom-full right-2 mb-2 w-56 rounded-2xl overflow-hidden shadow-2xl"
          style={{
            backgroundColor: "var(--bg-card)",
            border: "1px solid var(--border)",
            boxShadow: "0 -10px 40px rgba(0,0,0,0.5)",
          }}
        >
          <div className="flex items-center justify-between px-4 py-2.5" style={{ borderBottom: "1px solid var(--border)" }}>
            <span className="text-xs font-semibold text-white">{t("nav.more")}</span>
            <button onClick={() => setMoreOpen(false)} className="text-slate-400 hover:text-white">
              <X size={14} />
            </button>
          </div>
          <div className="py-1">
            {moreKeys.map(({ to, key, icon: Icon }) => (
              <NavLink
                key={to}
                to={to}
                onClick={() => setMoreOpen(false)}
                className={({ isActive }) =>
                  `flex items-center gap-3 px-4 py-2.5 text-sm transition-colors ${
                    isActive ? "text-white" : "text-slate-400 hover:text-white hover:bg-white/5"
                  }`
                }
              >
                {({ isActive }) => (
                  <>
                    <Icon size={16} style={{ color: isActive ? "var(--accent-light)" : undefined }} />
                    {t(key)}
                  </>
                )}
              </NavLink>
            ))}
            <div style={{ borderTop: "1px solid var(--border)", margin: "4px 0" }} />
            <button
              onClick={handleLogout}
              className="flex items-center gap-3 px-4 py-2.5 text-sm w-full text-left text-slate-400 hover:text-red-400 hover:bg-red-500/10 transition-colors"
            >
              <LogOut size={16} /> {t("nav.signOut")}
            </button>
          </div>
        </div>
      )}

      {/* Bottom bar */}
      <div className="flex items-center justify-around h-16">
        {navKeys.map(({ to, key, icon: Icon }) => (
          <NavLink
            key={to}
            to={to}
            className={({ isActive }) =>
              `flex flex-col items-center gap-0.5 px-3 py-1 rounded-xl transition-all text-[10px] font-medium ${
                isActive ? "text-white" : "text-slate-500"
              }`
            }
          >
            {({ isActive }) => (
              <>
                <div
                  className="h-8 w-8 flex items-center justify-center rounded-xl transition-all"
                  style={
                    isActive
                      ? { backgroundColor: "rgba(124,58,237,0.2)" }
                      : {}
                  }
                >
                  <Icon
                    size={18}
                    style={{ color: isActive ? "var(--accent-light)" : undefined }}
                  />
                </div>
                {t(key)}
              </>
            )}
          </NavLink>
        ))}

        {/* More button */}
        <button
          onClick={() => setMoreOpen((v) => !v)}
          className={`flex flex-col items-center gap-0.5 px-3 py-1 rounded-xl transition-all text-[10px] font-medium ${
            moreOpen ? "text-white" : "text-slate-500"
          }`}
        >
          <div
            className="h-8 w-8 flex items-center justify-center rounded-xl transition-all"
            style={moreOpen ? { backgroundColor: "rgba(124,58,237,0.2)" } : {}}
          >
            <MoreHorizontal
              size={18}
              style={{ color: moreOpen ? "var(--accent-light)" : undefined }}
            />
          </div>
          {t("nav.more")}
        </button>
      </div>
    </nav>
  );
}
