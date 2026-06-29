import { PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer } from "recharts";
import { CATEGORIES } from "../../utils/constants";

const COLORS = ["#7c3aed", "#4f46e5", "#2563eb", "#0891b2", "#059669", "#d97706", "#dc2626", "#db2777", "#7c3aed"];

const CustomTooltip = ({ active, payload }) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-xl px-3 py-2 text-sm" style={{ backgroundColor: "#1c1e3a", border: "1px solid var(--border)" }}>
      <p className="text-white font-medium">{payload[0].name}</p>
      <p className="text-slate-400">{payload[0].value} items</p>
    </div>
  );
};

export function CategoryPie({ data }) {
  const counts = data.reduce((acc, w) => {
    const cat = w.products?.category || "other";
    acc[cat] = (acc[cat] || 0) + 1;
    return acc;
  }, {});

  const chartData = Object.entries(counts).map(([cat, count]) => ({
    name: CATEGORIES.find((c) => c.value === cat)?.label || cat,
    value: count,
  }));

  if (!chartData.length) {
    return <div className="h-44 flex items-center justify-center text-sm text-slate-600">No data yet</div>;
  }

  return (
    <ResponsiveContainer width="100%" height={180}>
      <PieChart>
        <Pie data={chartData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={65} innerRadius={35} paddingAngle={3}>
          {chartData.map((_, i) => (
            <Cell key={i} fill={COLORS[i % COLORS.length]} stroke="transparent" />
          ))}
        </Pie>
        <Tooltip content={<CustomTooltip />} />
        <Legend iconSize={8} iconType="circle" formatter={(v) => <span style={{ color: "#94a3b8", fontSize: 11 }}>{v}</span>} />
      </PieChart>
    </ResponsiveContainer>
  );
}
