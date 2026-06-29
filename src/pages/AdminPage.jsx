import { useEffect, useState, useMemo } from "react";
import { format } from "date-fns";
import {
  Users, ShieldCheck, Package, FileText, Activity,
  TrendingUp, AlertTriangle, ShieldOff, RefreshCw,
  Database, Server, Zap, Globe, Crown, BarChart3,
  Search, Eye, CheckCircle, XCircle, Clock, Bell,
  MapPin, Cpu, Lock, Shield,
} from "lucide-react";
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend,
} from "recharts";
import { adminService } from "../services/admin.service";
import { useAuthStore } from "../stores/authStore";
import { Button } from "../components/ui/Button";
import { Spinner } from "../components/ui/Spinner";

const TABS = ["Overview", "Users", "Warranties", "Claims", "System"];

const CATEGORY_COLORS = ["#7c3aed", "#4f46e5", "#06b6d4", "#10b981", "#f59e0b", "#ef4444", "#ec4899"];

function StatCard({ title, value, sub, icon: Icon, color }) {
  const colorMap = {
    purple: { bg: "rgba(124,58,237,0.12)", icon: "#a78bfa" },
    blue: { bg: "rgba(79,70,229,0.12)", icon: "#818cf8" },
    green: { bg: "rgba(16,185,129,0.12)", icon: "#34d399" },
    amber: { bg: "rgba(245,158,11,0.12)", icon: "#fbbf24" },
    red: { bg: "rgba(239,68,68,0.12)", icon: "#f87171" },
    cyan: { bg: "rgba(6,182,212,0.12)", icon: "#22d3ee" },
  };
  const c = colorMap[color] || colorMap.purple;
  return (
    <div
      className="rounded-2xl p-5 flex items-start gap-4"
      style={{ backgroundColor: "var(--bg-card)", border: "1px solid var(--border)" }}
    >
      <div
        className="h-10 w-10 rounded-xl flex items-center justify-center shrink-0"
        style={{ backgroundColor: c.bg }}
      >
        <Icon size={18} style={{ color: c.icon }} />
      </div>
      <div>
        <p className="text-xs text-slate-500 mb-0.5">{title}</p>
        <p className="text-2xl font-bold text-white">{value}</p>
        {sub && <p className="text-[11px] text-slate-500 mt-0.5">{sub}</p>}
      </div>
    </div>
  );
}

function StatusPill({ status }) {
  const map = {
    active: { label: "Active", color: "#34d399", bg: "rgba(16,185,129,0.12)" },
    expiring_soon: { label: "Expiring", color: "#fbbf24", bg: "rgba(245,158,11,0.12)" },
    expired: { label: "Expired", color: "#f87171", bg: "rgba(239,68,68,0.12)" },
    pending: { label: "Pending", color: "#818cf8", bg: "rgba(79,70,229,0.12)" },
    approved: { label: "Approved", color: "#34d399", bg: "rgba(16,185,129,0.12)" },
    rejected: { label: "Rejected", color: "#f87171", bg: "rgba(239,68,68,0.12)" },
    resolved: { label: "Resolved", color: "#22d3ee", bg: "rgba(6,182,212,0.12)" },
  };
  const s = map[status] || { label: status, color: "#94a3b8", bg: "rgba(148,163,184,0.1)" };
  return (
    <span
      className="px-2 py-0.5 rounded-full text-[11px] font-semibold"
      style={{ color: s.color, backgroundColor: s.bg }}
    >
      {s.label}
    </span>
  );
}

function Avatar({ name, size = 32 }) {
  const initials = (name || "?")
    .split(" ")
    .map((n) => n[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
  return (
    <div
      className="rounded-full flex items-center justify-center text-xs font-bold text-white shrink-0"
      style={{
        width: size, height: size,
        background: "linear-gradient(135deg, #7c3aed, #4f46e5)",
      }}
    >
      {initials}
    </div>
  );
}

function SearchInput({ value, onChange, placeholder }) {
  return (
    <div className="relative">
      <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="pl-9 pr-4 py-2 text-sm rounded-xl w-64 text-white placeholder-slate-500 outline-none focus:ring-1"
        style={{
          backgroundColor: "rgba(255,255,255,0.04)",
          border: "1px solid var(--border)",
          focusRingColor: "var(--accent)",
        }}
      />
    </div>
  );
}

// ── Tab: Overview ──────────────────────────────────────────────────────────────
function OverviewTab({ stats, onRefresh, refreshing }) {
  const pieData = Object.entries(stats.categoryBreakdown || {}).map(([name, value]) => ({
    name, value,
  }));

  const warrantyPieData = [
    { name: "Active", value: stats.warrantyBreakdown?.active || 0 },
    { name: "Expiring Soon", value: stats.warrantyBreakdown?.expiring || 0 },
    { name: "Expired", value: stats.warrantyBreakdown?.expired || 0 },
  ].filter((d) => d.value > 0);

  const WARRANTY_COLORS = ["#34d399", "#fbbf24", "#f87171"];

  return (
    <div className="space-y-6">
      {/* Stat cards */}
      <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
        <StatCard title="Total Users" value={stats.totalUsers} sub={`+${stats.newUsersThisMonth} this month`} icon={Users} color="purple" />
        <StatCard title="Warranties" value={stats.totalWarranties} sub={`+${stats.newWarrantiesThisMonth} this month`} icon={ShieldCheck} color="blue" />
        <StatCard title="Products" value={stats.totalProducts} icon={Package} color="cyan" />
        <StatCard title="Claims" value={stats.totalClaims} icon={FileText} color="amber" />
        <StatCard title="Active" value={stats.warrantyBreakdown?.active || 0} icon={CheckCircle} color="green" />
        <StatCard title="Expiring" value={stats.warrantyBreakdown?.expiring || 0} icon={AlertTriangle} color="red" />
      </div>

      {/* Charts row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {/* Warranty status pie */}
        <div
          className="rounded-2xl p-6"
          style={{ backgroundColor: "var(--bg-card)", border: "1px solid var(--border)" }}
        >
          <h3 className="text-sm font-semibold text-white mb-1">Warranty Status</h3>
          <p className="text-xs text-slate-500 mb-4">Distribution across all warranties</p>
          {warrantyPieData.length > 0 ? (
            <ResponsiveContainer width="100%" height={220}>
              <PieChart>
                <Pie
                  data={warrantyPieData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={90}
                  paddingAngle={3}
                  dataKey="value"
                >
                  {warrantyPieData.map((_, i) => (
                    <Cell key={i} fill={WARRANTY_COLORS[i % WARRANTY_COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{ backgroundColor: "#0f1029", border: "1px solid rgba(255,255,255,0.07)", borderRadius: 12, color: "#fff" }}
                />
                <Legend
                  wrapperStyle={{ color: "#94a3b8", fontSize: 12 }}
                  formatter={(v) => <span style={{ color: "#94a3b8" }}>{v}</span>}
                />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-[220px] flex items-center justify-center text-slate-500 text-sm">No data yet</div>
          )}
        </div>

        {/* Category breakdown */}
        <div
          className="rounded-2xl p-6"
          style={{ backgroundColor: "var(--bg-card)", border: "1px solid var(--border)" }}
        >
          <h3 className="text-sm font-semibold text-white mb-1">Products by Category</h3>
          <p className="text-xs text-slate-500 mb-4">Registered product distribution</p>
          {pieData.length > 0 ? (
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={pieData} barSize={24}>
                <XAxis dataKey="name" tick={{ fill: "#64748b", fontSize: 11 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fill: "#64748b", fontSize: 11 }} axisLine={false} tickLine={false} />
                <Tooltip
                  contentStyle={{ backgroundColor: "#0f1029", border: "1px solid rgba(255,255,255,0.07)", borderRadius: 12, color: "#fff" }}
                />
                <Bar dataKey="value" radius={[6, 6, 0, 0]}>
                  {pieData.map((_, i) => (
                    <Cell key={i} fill={CATEGORY_COLORS[i % CATEGORY_COLORS.length]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-[220px] flex items-center justify-center text-slate-500 text-sm">No data yet</div>
          )}
        </div>
      </div>

      {/* Recent users */}
      <div
        className="rounded-2xl p-6"
        style={{ backgroundColor: "var(--bg-card)", border: "1px solid var(--border)" }}
      >
        <h3 className="text-sm font-semibold text-white mb-4">Recent Registrations</h3>
        {stats.recentUsers.length === 0 ? (
          <p className="text-sm text-slate-500">No users found.</p>
        ) : (
          <div className="space-y-3">
            {stats.recentUsers.map((u) => (
              <div key={u.id} className="flex items-center gap-3">
                <Avatar name={u.display_name || u.email} size={36} />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-white truncate">{u.display_name || "—"}</p>
                  <p className="text-xs text-slate-500 truncate">{u.email}</p>
                </div>
                <span className="text-xs text-slate-600 shrink-0">
                  {u.created_at ? format(new Date(u.created_at), "MMM d, yyyy") : "—"}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

// ── Tab: Users ─────────────────────────────────────────────────────────────────
function UsersTab() {
  const { dbUser } = useAuthStore();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  useEffect(() => {
    adminService.getAllUsers(dbUser?.email).then(setUsers).finally(() => setLoading(false));
  }, []);

  const filtered = useMemo(() => {
    if (!search) return users;
    const q = search.toLowerCase();
    return users.filter(
      (u) =>
        u.email?.toLowerCase().includes(q) ||
        u.display_name?.toLowerCase().includes(q)
    );
  }, [users, search]);

  if (loading) return <Spinner />;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-sm text-slate-500">{filtered.length} user{filtered.length !== 1 ? "s" : ""}</p>
        <SearchInput value={search} onChange={setSearch} placeholder="Search users..." />
      </div>

      <div
        className="rounded-2xl overflow-hidden"
        style={{ backgroundColor: "var(--bg-card)", border: "1px solid var(--border)" }}
      >
        <table className="w-full text-sm">
          <thead>
            <tr style={{ borderBottom: "1px solid var(--border)" }}>
              {["User", "Email", "Joined", "ID"].map((h) => (
                <th key={h} className="px-5 py-3.5 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 ? (
              <tr>
                <td colSpan={4} className="px-5 py-10 text-center text-slate-500 text-sm">
                  No users found
                </td>
              </tr>
            ) : (
              filtered.map((u, i) => (
                <tr
                  key={u.id}
                  style={i < filtered.length - 1 ? { borderBottom: "1px solid var(--border)" } : {}}
                  className="hover:bg-white/[0.02] transition-colors"
                >
                  <td className="px-5 py-3.5">
                    <div className="flex items-center gap-3">
                      <Avatar name={u.display_name || u.email} size={32} />
                      <span className="font-medium text-white">{u.display_name || "—"}</span>
                    </div>
                  </td>
                  <td className="px-5 py-3.5 text-slate-400">{u.email}</td>
                  <td className="px-5 py-3.5 text-slate-500 text-xs">
                    {u.created_at ? format(new Date(u.created_at), "MMM d, yyyy") : "—"}
                  </td>
                  <td className="px-5 py-3.5">
                    <code className="text-[11px] text-slate-600 font-mono">{u.id?.slice(0, 8)}…</code>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ── Tab: Warranties ────────────────────────────────────────────────────────────
function WarrantiesTab() {
  const { dbUser } = useAuthStore();
  const [warranties, setWarranties] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");

  useEffect(() => {
    adminService.getAllWarranties(dbUser?.email).then(setWarranties).finally(() => setLoading(false));
  }, []);

  const filtered = useMemo(() => {
    return warranties.filter((w) => {
      const matchStatus = statusFilter === "all" || w.status === statusFilter;
      const q = search.toLowerCase();
      const matchSearch =
        !q ||
        w.products?.product_name?.toLowerCase().includes(q) ||
        w.products?.brand?.toLowerCase().includes(q);
      return matchStatus && matchSearch;
    });
  }, [warranties, search, statusFilter]);

  if (loading) return <Spinner />;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <p className="text-sm text-slate-500">{filtered.length} warrant{filtered.length !== 1 ? "ies" : "y"}</p>
        <div className="flex items-center gap-3">
          <div className="flex gap-1">
            {["all", "active", "expiring_soon", "expired"].map((s) => (
              <button
                key={s}
                onClick={() => setStatusFilter(s)}
                className="px-3 py-1.5 rounded-lg text-xs font-medium transition-all"
                style={
                  statusFilter === s
                    ? { backgroundColor: "var(--accent)", color: "#fff" }
                    : { backgroundColor: "rgba(255,255,255,0.05)", color: "#94a3b8" }
                }
              >
                {s === "expiring_soon" ? "Expiring" : s.charAt(0).toUpperCase() + s.slice(1)}
              </button>
            ))}
          </div>
          <SearchInput value={search} onChange={setSearch} placeholder="Search product..." />
        </div>
      </div>

      <div
        className="rounded-2xl overflow-hidden"
        style={{ backgroundColor: "var(--bg-card)", border: "1px solid var(--border)" }}
      >
        <table className="w-full text-sm">
          <thead>
            <tr style={{ borderBottom: "1px solid var(--border)" }}>
              {["Product", "Brand", "Category", "End Date", "Status"].map((h) => (
                <th key={h} className="px-5 py-3.5 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-5 py-10 text-center text-slate-500 text-sm">
                  No warranties found
                </td>
              </tr>
            ) : (
              filtered.map((w, i) => (
                <tr
                  key={w.id}
                  style={i < filtered.length - 1 ? { borderBottom: "1px solid var(--border)" } : {}}
                  className="hover:bg-white/[0.02] transition-colors"
                >
                  <td className="px-5 py-3.5">
                    <span className="font-medium text-white">{w.products?.product_name || "—"}</span>
                  </td>
                  <td className="px-5 py-3.5 text-slate-400">{w.products?.brand || "—"}</td>
                  <td className="px-5 py-3.5">
                    {w.products?.category ? (
                      <span
                        className="px-2 py-0.5 rounded-full text-[11px] font-medium"
                        style={{ backgroundColor: "rgba(124,58,237,0.15)", color: "#a78bfa" }}
                      >
                        {w.products.category}
                      </span>
                    ) : "—"}
                  </td>
                  <td className="px-5 py-3.5 text-slate-500 text-xs">
                    {w.end_date ? format(new Date(w.end_date), "MMM d, yyyy") : "—"}
                  </td>
                  <td className="px-5 py-3.5">
                    <StatusPill status={w.status} />
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ── Tab: Claims ────────────────────────────────────────────────────────────────
function ClaimsTab() {
  const { dbUser } = useAuthStore();
  const [claims, setClaims] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  useEffect(() => {
    adminService.getAllClaims(dbUser?.email).then(setClaims).finally(() => setLoading(false));
  }, []);

  const filtered = useMemo(() => {
    if (!search) return claims;
    const q = search.toLowerCase();
    return claims.filter(
      (c) =>
        c.issue_description?.toLowerCase().includes(q) ||
        c.status?.toLowerCase().includes(q) ||
        c.users?.display_name?.toLowerCase().includes(q) ||
        c.users?.email?.toLowerCase().includes(q)
    );
  }, [claims, search]);

  if (loading) return <Spinner />;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-sm text-slate-500">{filtered.length} claim{filtered.length !== 1 ? "s" : ""}</p>
        <SearchInput value={search} onChange={setSearch} placeholder="Search claims..." />
      </div>

      <div
        className="rounded-2xl overflow-hidden"
        style={{ backgroundColor: "var(--bg-card)", border: "1px solid var(--border)" }}
      >
        <table className="w-full text-sm">
          <thead>
            <tr style={{ borderBottom: "1px solid var(--border)" }}>
              {["Claim ID", "Claimed By", "Issue", "Status", "Submitted"].map((h) => (
                <th key={h} className="px-5 py-3.5 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-5 py-10 text-center text-slate-500 text-sm">
                  No claims found
                </td>
              </tr>
            ) : (
              filtered.map((c, i) => (
                <tr
                  key={c.id}
                  style={i < filtered.length - 1 ? { borderBottom: "1px solid var(--border)" } : {}}
                  className="hover:bg-white/[0.02] transition-colors"
                >
                  <td className="px-5 py-3.5">
                    <code className="text-[11px] text-slate-500 font-mono">{c.id?.slice(0, 8)}…</code>
                  </td>
                  <td className="px-5 py-3.5">
                    <div className="flex items-center gap-2.5">
                      <Avatar name={c.users?.display_name || c.users?.email} size={28} />
                      <div className="min-w-0">
                        <p className="text-sm font-medium text-white truncate">{c.users?.display_name || "—"}</p>
                        <p className="text-[11px] text-slate-500 truncate">{c.users?.email || ""}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-5 py-3.5 text-slate-300 max-w-xs">
                    <p className="truncate">{c.issue_description || "—"}</p>
                  </td>
                  <td className="px-5 py-3.5">
                    <StatusPill status={c.status || "pending"} />
                  </td>
                  <td className="px-5 py-3.5 text-slate-500 text-xs">
                    {c.created_at ? format(new Date(c.created_at), "MMM d, yyyy") : "—"}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ── Tab: System ────────────────────────────────────────────────────────────────
function SystemTab() {
  const techStack = [
    { name: "React 18 + Vite", category: "Frontend", icon: Zap, status: "operational" },
    { name: "Tailwind CSS v4", category: "Styling", icon: Globe, status: "operational" },
    { name: "Firebase Auth", category: "Authentication", icon: Lock, status: "operational" },
    { name: "Supabase (PostgreSQL)", category: "Database", icon: Database, status: "operational" },
    { name: "Cloudinary", category: "File Storage", icon: Server, status: "operational" },
    { name: "Tesseract.js", category: "OCR", icon: Cpu, status: "operational" },
    { name: "Groq API (llama-3.3-70b)", category: "AI Chat", icon: Activity, status: "operational" },
    { name: "Google Maps API", category: "Maps", icon: MapPin, status: "operational" },
    { name: "Supabase Edge Functions", category: "Notifications", icon: Bell, status: "operational" },
  ];

  const dbTables = [
    { name: "users", description: "Registered platform users", rls: true },
    { name: "products", description: "Consumer products registered", rls: true },
    { name: "warranties", description: "Warranty records per product", rls: true },
    { name: "warranties_with_status", description: "View with computed status", rls: true },
    { name: "documents", description: "Uploaded receipts & docs (Cloudinary)", rls: true },
    { name: "claims", description: "Warranty claim submissions", rls: true },
    { name: "notifications", description: "In-app expiry notifications", rls: true },
    { name: "service_centers", description: "Authorized repair locations", rls: false },
  ];

  return (
    <div className="space-y-6">
      {/* Tech stack */}
      <div
        className="rounded-2xl p-6"
        style={{ backgroundColor: "var(--bg-card)", border: "1px solid var(--border)" }}
      >
        <h3 className="text-sm font-semibold text-white mb-4">Tech Stack</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {techStack.map((t) => (
            <div
              key={t.name}
              className="flex items-center gap-3 rounded-xl p-3"
              style={{ backgroundColor: "rgba(255,255,255,0.03)", border: "1px solid var(--border)" }}
            >
              <div
                className="h-8 w-8 rounded-lg flex items-center justify-center shrink-0"
                style={{ backgroundColor: "rgba(124,58,237,0.15)" }}
              >
                <t.icon size={15} style={{ color: "var(--accent-light)" }} />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-white truncate">{t.name}</p>
                <p className="text-[11px] text-slate-500">{t.category}</p>
              </div>
              <div className="h-2 w-2 rounded-full shrink-0" style={{ backgroundColor: "#34d399" }} />
            </div>
          ))}
        </div>
      </div>

      {/* Database schema */}
      <div
        className="rounded-2xl p-6"
        style={{ backgroundColor: "var(--bg-card)", border: "1px solid var(--border)" }}
      >
        <h3 className="text-sm font-semibold text-white mb-4">Database Schema</h3>
        <div className="space-y-2">
          {dbTables.map((t) => (
            <div
              key={t.name}
              className="flex items-center gap-4 rounded-xl px-4 py-3"
              style={{ backgroundColor: "rgba(255,255,255,0.02)", border: "1px solid var(--border)" }}
            >
              <Database size={14} className="text-slate-500 shrink-0" />
              <code className="text-sm font-mono font-medium text-purple-400 w-52 shrink-0">{t.name}</code>
              <p className="text-xs text-slate-500 flex-1">{t.description}</p>
              <span
                className="text-[11px] px-2 py-0.5 rounded-full shrink-0"
                style={
                  t.rls
                    ? { backgroundColor: "rgba(16,185,129,0.12)", color: "#34d399" }
                    : { backgroundColor: "rgba(245,158,11,0.12)", color: "#fbbf24" }
                }
              >
                {t.rls ? "RLS On" : "Public"}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Environment */}
      <div
        className="rounded-2xl p-6"
        style={{ backgroundColor: "var(--bg-card)", border: "1px solid var(--border)" }}
      >
        <h3 className="text-sm font-semibold text-white mb-4">Environment</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {[
            { key: "VITE_FIREBASE_API_KEY", set: !!import.meta.env.VITE_FIREBASE_API_KEY },
            { key: "VITE_FIREBASE_AUTH_DOMAIN", set: !!import.meta.env.VITE_FIREBASE_AUTH_DOMAIN },
            { key: "VITE_SUPABASE_URL", set: !!import.meta.env.VITE_SUPABASE_URL },
            { key: "VITE_SUPABASE_ANON_KEY", set: !!import.meta.env.VITE_SUPABASE_ANON_KEY },
            { key: "VITE_CLOUDINARY_CLOUD_NAME", set: !!import.meta.env.VITE_CLOUDINARY_CLOUD_NAME },
            { key: "VITE_CLOUDINARY_UPLOAD_PRESET", set: !!import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET },
            { key: "VITE_GROQ_API_KEY", set: !!import.meta.env.VITE_GROQ_API_KEY },
            { key: "VITE_GOOGLE_MAPS_API_KEY", set: !!import.meta.env.VITE_GOOGLE_MAPS_API_KEY },
          ].map(({ key, set }) => (
            <div
              key={key}
              className="flex items-center justify-between rounded-xl px-4 py-2.5"
              style={{ backgroundColor: "rgba(255,255,255,0.02)", border: "1px solid var(--border)" }}
            >
              <code className="text-[11px] font-mono text-slate-400">{key}</code>
              {set ? (
                <CheckCircle size={14} style={{ color: "#34d399" }} />
              ) : (
                <XCircle size={14} style={{ color: "#f87171" }} />
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ── Main Page ──────────────────────────────────────────────────────────────────
export default function AdminPage() {
  const { dbUser, user } = useAuthStore();
  const [activeTab, setActiveTab] = useState("Overview");
  const [stats, setStats] = useState(null);
  const [refreshing, setRefreshing] = useState(false);

  async function loadStats() {
    setRefreshing(true);
    try {
      const email = dbUser?.email || user?.email;
      const data = await adminService.getPlatformStats(email);
      setStats(data);
    } finally {
      setRefreshing(false);
    }
  }

  useEffect(() => {
    loadStats();
  }, []);

  if (!stats) return <Spinner />;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between flex-wrap gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Crown size={14} style={{ color: "var(--accent-light)" }} />
            <span
              className="text-xs font-medium uppercase tracking-widest"
              style={{ color: "var(--accent-light)" }}
            >
              Admin Panel
            </span>
          </div>
          <h1 className="text-2xl font-bold text-white">Platform Management</h1>
          <p className="text-sm text-slate-500 mt-0.5">
            Logged in as <span className="text-slate-400">{dbUser?.email || user?.email}</span>
          </p>
        </div>
        <Button
          variant="secondary"
          onClick={loadStats}
          loading={refreshing}
          className="gap-2"
        >
          <RefreshCw size={14} className={refreshing ? "animate-spin" : ""} />
          Refresh
        </Button>
      </div>

      {/* Tabs */}
      <div
        className="flex gap-1 rounded-xl p-1"
        style={{ backgroundColor: "rgba(255,255,255,0.04)", border: "1px solid var(--border)", width: "fit-content" }}
      >
        {TABS.map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className="px-4 py-2 rounded-lg text-sm font-medium transition-all"
            style={
              activeTab === tab
                ? {
                    background: "linear-gradient(135deg, #7c3aed, #4f46e5)",
                    color: "#fff",
                    boxShadow: "0 0 16px rgba(124,58,237,0.4)",
                  }
                : { color: "#64748b" }
            }
          >
            {tab}
          </button>
        ))}
      </div>

      {/* Tab content */}
      {activeTab === "Overview" && (
        <OverviewTab stats={stats} onRefresh={loadStats} refreshing={refreshing} />
      )}
      {activeTab === "Users" && <UsersTab />}
      {activeTab === "Warranties" && <WarrantiesTab />}
      {activeTab === "Claims" && <ClaimsTab />}
      {activeTab === "System" && <SystemTab />}
    </div>
  );
}
