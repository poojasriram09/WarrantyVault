import { Component, useEffect, useState } from "react";
import { FileText, ShieldCheck, ExternalLink } from "lucide-react";
import { Modal } from "../ui/Modal";
import { StatusBadge } from "./StatusBadge";
import { formatDate } from "../../utils/warrantyStatus";
import { supabase } from "../../config/supabase";

class DetailErrorBoundary extends Component {
  state = { error: false };
  static getDerivedStateFromError() { return { error: true }; }
  render() {
    if (this.state.error) {
      return (
        <p className="text-sm text-slate-400 py-4 text-center">
          Could not load warranty details.
        </p>
      );
    }
    return this.props.children;
  }
}

const DOC_META = {
  receipt:      { label: "Purchase Receipt", icon: FileText,    color: "#a78bfa" },
  invoice:      { label: "Invoice",          icon: FileText,    color: "#60a5fa" },
  warranty_card:{ label: "Warranty Card",    icon: ShieldCheck, color: "#34d399" },
  manual:       { label: "Manual",           icon: FileText,    color: "#f59e0b" },
  insurance:    { label: "Insurance Doc",    icon: ShieldCheck, color: "#f97316" },
  other:        { label: "Document",         icon: FileText,    color: "#94a3b8" },
};

export function WarrantyDetail({ warranty, onClose }) {
  const [docs, setDocs] = useState([]);

  useEffect(() => {
    if (!warranty?.products?.id) return;
    supabase
      .from("documents")
      .select("id, doc_type, file_url, file_name, file_size")
      .eq("product_id", warranty.products.id)
      .then(({ data }) => setDocs(data ?? []));
  }, [warranty?.products?.id]);

  if (!warranty) return null;
  const { products: product } = warranty;

  const rows = [
    ["Brand", product?.brand],
    ["Model", product?.model_number],
    ["Serial No.", product?.serial_number],
    ["Category", product?.category],
    ["Retailer", product?.retailer],
    ["Purchase Price", product?.purchase_price ? `₹${product.purchase_price}` : null],
    ["Purchase Date", formatDate(product?.purchase_date)],
    ["Warranty Type", warranty.warranty_type],
    ["Start Date", formatDate(warranty.start_date)],
    ["End Date", formatDate(warranty.end_date)],
    ["Duration", warranty.warranty_duration_months ? `${warranty.warranty_duration_months} months` : null],
  ].filter(([, v]) => v);

  return (
    <Modal open={!!warranty} onClose={onClose} title="Warranty Details">
      <DetailErrorBoundary>
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="font-semibold text-white">{product?.product_name}</h3>
          <StatusBadge status={warranty.status} />
        </div>

        <div className="rounded-xl overflow-hidden" style={{ border: "1px solid var(--border)" }}>
          {rows.map(([label, value], i) => (
            <div
              key={label}
              className="flex justify-between items-center px-4 py-2.5 text-sm"
              style={{
                borderBottom: i < rows.length - 1 ? "1px solid var(--border)" : "none",
                backgroundColor: i % 2 === 0 ? "rgba(255,255,255,0.02)" : "transparent",
              }}
            >
              <span className="text-slate-500">{label}</span>
              <span className="text-slate-200 font-medium capitalize">{value}</span>
            </div>
          ))}
        </div>

        {product?.notes && (
          <div className="rounded-xl p-4 text-sm text-slate-400" style={{ backgroundColor: "rgba(255,255,255,0.03)", border: "1px solid var(--border)" }}>
            {product.notes}
          </div>
        )}

        {/* Documents section */}
        {docs.length > 0 && (
          <div>
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">
              Documents
            </p>
            <div className="space-y-2">
              {docs.map((doc) => {
                const meta = DOC_META[doc.doc_type] ?? { label: doc.doc_type, icon: FileText, color: "#94a3b8" };
                const Icon = meta.icon;
                return (
                  <a
                    key={doc.id}
                    href={doc.file_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center justify-between gap-3 px-4 py-3 rounded-xl transition-all hover:opacity-80"
                    style={{ backgroundColor: "rgba(255,255,255,0.03)", border: "1px solid var(--border)" }}
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <Icon size={15} style={{ color: meta.color, flexShrink: 0 }} />
                      <div className="min-w-0">
                        <p className="text-sm font-medium text-slate-200">{meta.label}</p>
                        {doc.file_name && (
                          <p className="text-xs text-slate-500 truncate">{doc.file_name}</p>
                        )}
                      </div>
                    </div>
                    <ExternalLink size={13} className="text-slate-500 shrink-0" />
                  </a>
                );
              })}
            </div>
          </div>
        )}
      </div>
      </DetailErrorBoundary>
    </Modal>
  );
}
