import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { warrantyService } from "../services/warranty.service";
import { useAuthStore } from "../stores/authStore";
import { StatCard } from "../components/dashboard/StatCard";
import { WarrantyChart } from "../components/dashboard/WarrantyChart";
import { CategoryPie } from "../components/dashboard/CategoryPie";
import { RecentList } from "../components/dashboard/RecentList";
import { Spinner } from "../components/ui/Spinner";
import { Button } from "../components/ui/Button";
import { Package, ShieldCheck, AlertTriangle, ShieldOff, PlusCircle, Sparkles } from "lucide-react";

export default function DashboardPage() {
  const { dbUser, user } = useAuthStore();
  const { t } = useTranslation("dashboard");
  const [stats, setStats] = useState(null);
  const [warranties, setWarranties] = useState([]);

  useEffect(() => {
    if (!dbUser) return;
    loadDashboard();
  }, [dbUser]);

  async function loadDashboard() {
    if (!dbUser?.id) return;
    const data = await warrantyService.getAllForUser(dbUser.id);
    setWarranties(data);
    setStats({
      total: data.length,
      active: data.filter((w) => w.status === "active").length,
      expiringSoon: data.filter((w) => w.status === "expiring_soon").length,
      expired: data.filter((w) => w.status === "expired").length,
    });
  }

  if (!stats) return <Spinner />;

  const name = dbUser?.display_name || user?.displayName || "there";

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Sparkles size={14} style={{ color: "var(--accent-light)" }} />
            <span className="text-xs font-medium uppercase tracking-widest" style={{ color: "var(--accent-light)" }}>
              {t("badge")}
            </span>
          </div>
          <h1 className="text-2xl font-bold text-white">
            {t("welcome", { name: name.split(" ")[0] })}
          </h1>
          <p className="text-sm text-slate-500 mt-0.5">{t("subtitle")}</p>
        </div>
        <Link to="/add-product">
          <Button>
            <PlusCircle size={15} /> {t("addProduct")}
          </Button>
        </Link>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard title={t("stats.totalProducts")} value={stats.total} icon={Package} color="blue" />
        <StatCard title={t("stats.active")} value={stats.active} icon={ShieldCheck} color="green" />
        <StatCard title={t("stats.expiringSoon")} value={stats.expiringSoon} icon={AlertTriangle} color="amber" />
        <StatCard title={t("stats.expired")} value={stats.expired} icon={ShieldOff} color="red" />
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        <div
          className="lg:col-span-2 rounded-2xl p-6"
          style={{ backgroundColor: "var(--bg-card)", border: "1px solid var(--border)" }}
        >
          <h2 className="text-sm font-semibold text-white mb-1">{t("charts.warrantiesAdded")}</h2>
          <p className="text-xs text-slate-500 mb-5">{t("charts.monthlyHistory")}</p>
          <WarrantyChart data={warranties} />
        </div>
        <div
          className="rounded-2xl p-6"
          style={{ backgroundColor: "var(--bg-card)", border: "1px solid var(--border)" }}
        >
          <h2 className="text-sm font-semibold text-white mb-1">{t("charts.byCategory")}</h2>
          <p className="text-xs text-slate-500 mb-5">{t("charts.productDistribution")}</p>
          <CategoryPie data={warranties} />
        </div>
      </div>

      {/* Recent */}
      <div
        className="rounded-2xl p-6"
        style={{ backgroundColor: "var(--bg-card)", border: "1px solid var(--border)" }}
      >
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-sm font-semibold text-white">{t("recent.title")}</h2>
          <Link to="/warranties" className="text-xs font-medium transition-colors hover:text-white" style={{ color: "var(--accent-light)" }}>
            {t("recent.viewAll")}
          </Link>
        </div>
        <RecentList warranties={warranties.slice(0, 5)} />
      </div>
    </div>
  );
}
