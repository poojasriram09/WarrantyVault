import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { format, parseISO, startOfMonth } from "date-fns";

const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-xl px-3 py-2 text-sm text-white" style={{ backgroundColor: "#1c1e3a", border: "1px solid var(--border)" }}>
      <p className="text-slate-400">{label}</p>
      <p className="font-semibold" style={{ color: "var(--accent-light)" }}>{payload[0].value} warranties</p>
    </div>
  );
};

export function WarrantyChart({ data }) {
  const monthly = data.reduce((acc, w) => {
    if (!w.created_at) return acc;
    const month = format(startOfMonth(parseISO(w.created_at)), "MMM yy");
    acc[month] = (acc[month] || 0) + 1;
    return acc;
  }, {});

  const chartData = Object.entries(monthly).map(([month, count]) => ({ month, count }));

  if (!chartData.length) {
    return <div className="h-44 flex items-center justify-center text-sm text-slate-600">No data yet</div>;
  }

  return (
    <ResponsiveContainer width="100%" height={180}>
      <BarChart data={chartData} barSize={24}>
        <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" vertical={false} />
        <XAxis dataKey="month" tick={{ fontSize: 11, fill: "#64748b" }} axisLine={false} tickLine={false} />
        <YAxis allowDecimals={false} tick={{ fontSize: 11, fill: "#64748b" }} axisLine={false} tickLine={false} />
        <Tooltip content={<CustomTooltip />} cursor={{ fill: "rgba(124,58,237,0.06)", radius: 8 }} />
        <Bar dataKey="count" radius={[6, 6, 0, 0]} fill="url(#purpleGrad)" />
        <defs>
          <linearGradient id="purpleGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#7c3aed" />
            <stop offset="100%" stopColor="#4f46e5" stopOpacity={0.7} />
          </linearGradient>
        </defs>
      </BarChart>
    </ResponsiveContainer>
  );
}
