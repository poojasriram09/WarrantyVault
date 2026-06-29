const colorMap = {
  blue:  { bg: "rgba(59,130,246,0.12)",  icon: "#60a5fa", glow: "rgba(59,130,246,0.2)"  },
  green: { bg: "rgba(34,197,94,0.12)",   icon: "#4ade80", glow: "rgba(34,197,94,0.2)"   },
  amber: { bg: "rgba(245,158,11,0.12)",  icon: "#fbbf24", glow: "rgba(245,158,11,0.2)"  },
  red:   { bg: "rgba(239,68,68,0.12)",   icon: "#f87171", glow: "rgba(239,68,68,0.2)"   },
};

export function StatCard({ title, value, icon: Icon, color }) {
  const c = colorMap[color];
  return (
    <div
      className="rounded-2xl p-5 flex items-center gap-4 transition-all duration-200 hover:translate-y-[-2px]"
      style={{
        backgroundColor: "var(--bg-card)",
        border: "1px solid var(--border)",
        boxShadow: "0 4px 24px rgba(0,0,0,0.2)",
      }}
    >
      <div
        className="h-12 w-12 rounded-xl flex items-center justify-center shrink-0"
        style={{ backgroundColor: c.bg, boxShadow: `0 0 16px ${c.glow}` }}
      >
        <Icon size={22} style={{ color: c.icon }} />
      </div>
      <div>
        <p className="text-xs text-slate-500 font-medium uppercase tracking-wide">{title}</p>
        <p className="text-2xl font-bold text-white mt-0.5">{value}</p>
      </div>
    </div>
  );
}
