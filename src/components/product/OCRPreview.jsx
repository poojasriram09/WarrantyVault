import { CheckCircle, AlertCircle } from "lucide-react";

export function OCRPreview({ result }) {
  if (!result) return null;
  const isHigh = result.confidence === "high";

  return (
    <div
      className="rounded-xl p-4 text-sm space-y-2"
      style={{
        backgroundColor: isHigh ? "rgba(34,197,94,0.08)" : "rgba(245,158,11,0.08)",
        border: `1px solid ${isHigh ? "rgba(34,197,94,0.2)" : "rgba(245,158,11,0.2)"}`,
      }}
    >
      <div className="flex items-center gap-2 font-medium" style={{ color: isHigh ? "#4ade80" : "#fbbf24" }}>
        {isHigh ? <CheckCircle size={14} /> : <AlertCircle size={14} />}
        OCR {isHigh ? "extracted fields — please verify" : "partial extraction — fill in missing fields"}
      </div>
      <div className="grid grid-cols-2 gap-x-6 gap-y-1 text-xs text-slate-400">
        {result.productName && <span>Product: <span className="text-slate-200">{result.productName}</span></span>}
        {result.brand && <span>Brand: <span className="text-slate-200">{result.brand}</span></span>}
        {result.modelNumber && <span>Model: <span className="text-slate-200">{result.modelNumber}</span></span>}
        {result.serialNumber && <span>Serial: <span className="text-slate-200">{result.serialNumber}</span></span>}
        {result.purchaseDate && <span>Date: <span className="text-slate-200">{result.purchaseDate}</span></span>}
        {result.price && <span>Price: <span className="text-slate-200">₹{result.price}</span></span>}
        {result.retailer && <span>Retailer: <span className="text-slate-200">{result.retailer}</span></span>}
        {result.warrantyMonths && <span>Warranty: <span className="text-slate-200">{result.warrantyMonths} months</span></span>}
      </div>
    </div>
  );
}
