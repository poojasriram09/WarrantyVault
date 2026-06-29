const styles = {
  active:        { bg: "rgba(34,197,94,0.12)",  color: "#4ade80", border: "rgba(34,197,94,0.25)"  },
  expiring_soon: { bg: "rgba(245,158,11,0.12)", color: "#fbbf24", border: "rgba(245,158,11,0.25)" },
  expired:       { bg: "rgba(239,68,68,0.12)",  color: "#f87171", border: "rgba(239,68,68,0.25)"  },
};

const labels = { active: "Active", expiring_soon: "Expiring Soon", expired: "Expired" };

export function StatusBadge({ status }) {
  const s = styles[status] ?? { bg: "rgba(100,116,139,0.12)", color: "#94a3b8", border: "rgba(100,116,139,0.25)" };
  return (
    <span
      className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold whitespace-nowrap"
      style={{ backgroundColor: s.bg, color: s.color, border: `1px solid ${s.border}` }}
    >
      <span className="h-1.5 w-1.5 rounded-full" style={{ backgroundColor: s.color }} />
      {labels[status] ?? status}
    </span>
  );
}
