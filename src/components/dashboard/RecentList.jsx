import { StatusBadge } from "../warranty/StatusBadge";
import { formatDate } from "../../utils/warrantyStatus";

export function RecentList({ warranties }) {
  if (!warranties.length) {
    return <p className="text-sm text-slate-600 py-4">No warranties added yet.</p>;
  }

  return (
    <ul className="space-y-1">
      {warranties.map((w) => (
        <li
          key={w.id}
          className="flex items-center justify-between px-3 py-3 rounded-xl transition-colors"
          style={{ borderBottom: "1px solid var(--border)" }}
        >
          <div>
            <p className="text-sm font-medium text-white">{w.products?.product_name}</p>
            <p className="text-xs text-slate-500 mt-0.5">
              {w.products?.brand} · expires {formatDate(w.end_date)}
            </p>
          </div>
          <StatusBadge status={w.status} />
        </li>
      ))}
    </ul>
  );
}
