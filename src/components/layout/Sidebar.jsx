import { NavLink } from "react-router-dom";
import {
  LayoutDashboard, ShieldCheck, PlusCircle, Wrench,
  MapPin, User, LogOut, Crown, Mail, Lock,
} from "lucide-react";
import { useTranslation } from "react-i18next";
import { authService } from "../../services/auth.service";
import { useAuthStore } from "../../stores/authStore";
import { isAdminEmail } from "../../utils/adminGuard";
import LanguageSwitcher from "./LanguageSwitcher";

const navKeys = [
  { to: "/dashboard", key: "nav.dashboard", icon: LayoutDashboard },
  { to: "/warranties", key: "nav.myWarranties", icon: ShieldCheck },
  { to: "/add-product", key: "nav.addProduct", icon: PlusCircle },
  { to: "/gmail-import", key: "nav.importGmail", icon: Mail },
  { to: "/digital-locker", key: "nav.digitalLocker", icon: Lock },
  { to: "/claim-assistant", key: "nav.claimAssistant", icon: Wrench },
  { to: "/service-centers", key: "nav.serviceCenters", icon: MapPin },
];

export function Sidebar() {
  const { logout, dbUser } = useAuthStore();
  const { t } = useTranslation("common");
  const isAdmin = isAdminEmail(dbUser?.email);

  async function handleLogout() {
    await authService.logout();
    logout();
  }

  return (
    <aside
      className="w-64 flex flex-col shrink-0 min-h-screen"
      style={{
        backgroundColor: "#0a0b1e",
        borderRight: "1px solid var(--border)",
      }}
    >
      {/* Brand */}
      <div className="p-6" style={{ borderBottom: "1px solid var(--border)" }}>
        <div className="flex items-center gap-2.5">
          <img src="/logo.png" alt="WarrantyVault" className="h-8 w-8 rounded-lg object-cover shrink-0" />
          <div>
            <h1 className="text-base font-bold text-white leading-none">WarrantyVault</h1>
            <p className="text-[10px] mt-0.5" style={{ color: "var(--accent-light)" }}>
              {t("brand.tagline")}
            </p>
          </div>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 p-3 space-y-0.5">
        {!isAdmin && navKeys.map(({ to, key, icon: Icon }) => (
          <NavLink
            key={to}
            to={to}
            className={({ isActive }) =>
              `flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-150 ${
                isActive ? "nav-active text-white" : "text-slate-400 hover:text-white hover:bg-white/5"
              }`
            }
          >
            {({ isActive }) => (
              <>
                <Icon
                  size={17}
                  style={{ color: isActive ? "var(--accent-light)" : undefined }}
                />
                {t(key)}
              </>
            )}
          </NavLink>
        ))}
        {isAdmin && (
          <NavLink
            to="/admin"
            className={({ isActive }) =>
              `flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-150 ${
                isActive ? "nav-active text-white" : "text-slate-400 hover:text-white hover:bg-white/5"
              }`
            }
          >
            {({ isActive }) => (
              <>
                <Crown size={17} style={{ color: isActive ? "var(--accent-light)" : undefined }} />
                {t("nav.adminPanel")}
              </>
            )}
          </NavLink>
        )}
      </nav>

      {/* Footer */}
      <div className="p-3 space-y-0.5" style={{ borderTop: "1px solid var(--border)" }}>
        {!isAdmin && (
          <NavLink
            to="/profile"
            className={({ isActive }) =>
              `flex items-center gap-3 px-3 py-2.5 text-sm rounded-xl transition-all ${
                isActive ? "nav-active text-white" : "text-slate-400 hover:text-white hover:bg-white/5"
              }`
            }
          >
            <User size={17} /> {t("nav.profile")}
          </NavLink>
        )}
        <button
          onClick={handleLogout}
          className="flex items-center gap-3 px-3 py-2.5 text-sm rounded-xl w-full text-left transition-all text-slate-400 hover:text-red-400 hover:bg-red-500/10"
        >
          <LogOut size={17} /> {t("nav.signOut")}
        </button>
      </div>
    </aside>
  );
}
