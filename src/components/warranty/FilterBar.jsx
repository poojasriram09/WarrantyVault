import { Search } from "lucide-react";
import { useWarrantyStore } from "../../stores/warrantyStore";
import { WARRANTY_STATUSES, CATEGORIES } from "../../utils/constants";

const MONTHS = [
  { value: "01", label: "January" }, { value: "02", label: "February" },
  { value: "03", label: "March" }, { value: "04", label: "April" },
  { value: "05", label: "May" }, { value: "06", label: "June" },
  { value: "07", label: "July" }, { value: "08", label: "August" },
  { value: "09", label: "September" }, { value: "10", label: "October" },
  { value: "11", label: "November" }, { value: "12", label: "December" },
];

const currentYear = new Date().getFullYear();
const YEARS = Array.from({ length: 10 }, (_, i) => String(currentYear - i));

const selectStyle = {
  backgroundColor: "var(--bg-card)",
  border: "1px solid var(--border)",
  color: "#94a3b8",
  borderRadius: "12px",
  padding: "8px 12px",
  fontSize: "13px",
  outline: "none",
};

export function FilterBar() {
  const { filters, setFilter } = useWarrantyStore();

  return (
    <div className="flex flex-wrap gap-3">
      <div className="relative">
        <Search size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-600" />
        <input
          type="text"
          placeholder="Search products or brands..."
          value={filters.search}
          onChange={(e) => setFilter("search", e.target.value)}
          className="pl-9 pr-4 py-2 text-sm text-white placeholder-slate-600 outline-none focus:ring-1 rounded-xl w-64"
          style={{
            backgroundColor: "var(--bg-card)",
            border: "1px solid var(--border)",
            focusRingColor: "var(--accent)",
          }}
          onFocus={(e) => (e.target.style.borderColor = "rgba(124,58,237,0.5)")}
          onBlur={(e) => (e.target.style.borderColor = "var(--border)")}
        />
      </div>

      <select value={filters.status} onChange={(e) => setFilter("status", e.target.value)} style={selectStyle}>
        {WARRANTY_STATUSES.map((s) => (
          <option key={s.value} value={s.value} style={{ backgroundColor: "#0f1029" }}>{s.label}</option>
        ))}
      </select>

      <select value={filters.category} onChange={(e) => setFilter("category", e.target.value)} style={selectStyle}>
        <option value="all" style={{ backgroundColor: "#0f1029" }}>All Categories</option>
        {CATEGORIES.map((c) => (
          <option key={c.value} value={c.value} style={{ backgroundColor: "#0f1029" }}>{c.label}</option>
        ))}
      </select>

      <select value={filters.year} onChange={(e) => setFilter("year", e.target.value)} style={selectStyle}>
        <option value="all" style={{ backgroundColor: "#0f1029" }}>All Years</option>
        {YEARS.map((y) => (
          <option key={y} value={y} style={{ backgroundColor: "#0f1029" }}>{y}</option>
        ))}
      </select>

      <select value={filters.month} onChange={(e) => setFilter("month", e.target.value)} style={selectStyle}>
        <option value="all" style={{ backgroundColor: "#0f1029" }}>All Months</option>
        {MONTHS.map((m) => (
          <option key={m.value} value={m.value} style={{ backgroundColor: "#0f1029" }}>{m.label}</option>
        ))}
      </select>

      <select value={filters.sortBy} onChange={(e) => setFilter("sortBy", e.target.value)} style={selectStyle}>
        <option value="newest" style={{ backgroundColor: "#0f1029" }}>Newest First</option>
        <option value="oldest" style={{ backgroundColor: "#0f1029" }}>Oldest First</option>
        <option value="expiry_asc" style={{ backgroundColor: "#0f1029" }}>Expiry: Soonest</option>
        <option value="expiry_desc" style={{ backgroundColor: "#0f1029" }}>Expiry: Latest</option>
      </select>
    </div>
  );
}
