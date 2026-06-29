import { Trash2, Eye, Calendar, Tag, Pencil } from "lucide-react";
import { useTranslation } from "react-i18next";
import { StatusBadge } from "./StatusBadge";
import { formatDate } from "../../utils/warrantyStatus";
import { CATEGORIES } from "../../utils/constants";

export function WarrantyCard({ warranty, onDelete, onView, onEdit }) {
  const { t } = useTranslation("warranties");
  const { t: tc } = useTranslation("common");
  const { products: product } = warranty;
  const categoryLabel = CATEGORIES.find((c) => c.value === product?.category)?.label || product?.category || "—";

  return (
    <div
      className="rounded-2xl p-5 flex flex-col gap-4 transition-all duration-200 cursor-pointer group hover:translate-y-[-2px]"
      style={{
        backgroundColor: "var(--bg-card)",
        border: "1px solid var(--border)",
        boxShadow: "0 4px 24px rgba(0,0,0,0.2)",
      }}
      onMouseEnter={(e) => (e.currentTarget.style.borderColor = "rgba(124,58,237,0.3)")}
      onMouseLeave={(e) => (e.currentTarget.style.borderColor = "var(--border)")}
    >
      {/* Header */}
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <h3 className="font-semibold text-white text-sm truncate">{product?.product_name}</h3>
          <div className="flex items-center gap-1.5 mt-1">
            <Tag size={11} className="text-slate-600" />
            <p className="text-xs text-slate-500">{product?.brand || "—"} · {categoryLabel}</p>
          </div>
        </div>
        <StatusBadge status={warranty.status} />
      </div>

      {/* Dates */}
      <div
        className="rounded-xl p-3 space-y-2"
        style={{ backgroundColor: "rgba(255,255,255,0.03)", border: "1px solid var(--border)" }}
      >
        <div className="flex items-center justify-between text-xs">
          <span className="text-slate-500 flex items-center gap-1.5"><Calendar size={11} /> {t("card.purchase")}</span>
          <span className="text-slate-300">{formatDate(product?.purchase_date)}</span>
        </div>
        <div className="flex items-center justify-between text-xs">
          <span className="text-slate-500 flex items-center gap-1.5"><Calendar size={11} /> {t("card.expires")}</span>
          <span className="text-slate-300">{formatDate(warranty.end_date)}</span>
        </div>
      </div>

      {/* Actions */}
      <div className="flex items-center gap-2">
        <button
          onClick={() => onView?.(warranty)}
          className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl text-xs font-medium transition-all text-slate-400 hover:text-white"
          style={{ border: "1px solid var(--border)", backgroundColor: "rgba(255,255,255,0.03)" }}
        >
          <Eye size={13} /> {tc("actions.view")}
        </button>
        <button
          onClick={() => onEdit?.(warranty)}
          className="h-8 w-8 flex items-center justify-center rounded-xl transition-all text-slate-600 hover:text-purple-400"
          style={{ border: "1px solid var(--border)", backgroundColor: "rgba(255,255,255,0.03)" }}
          title={tc("actions.edit")}
        >
          <Pencil size={13} />
        </button>
        <button
          onClick={() => onDelete?.(warranty.id)}
          className="h-8 w-8 flex items-center justify-center rounded-xl transition-all text-slate-600 hover:text-red-400"
          style={{ border: "1px solid var(--border)", backgroundColor: "rgba(255,255,255,0.03)" }}
          title={tc("actions.delete")}
        >
          <Trash2 size={13} />
        </button>
      </div>
    </div>
  );
}
