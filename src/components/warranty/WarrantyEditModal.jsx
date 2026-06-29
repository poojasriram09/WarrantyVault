import { useState } from "react";
import { Modal } from "../ui/Modal";
import { Input } from "../ui/Input";
import { Button } from "../ui/Button";
import { warrantyService } from "../../services/warranty.service";
import { CATEGORIES, WARRANTY_TYPES, WARRANTY_DURATIONS } from "../../utils/constants";
import toast from "react-hot-toast";

const selectStyle = {
  backgroundColor: "var(--bg-card)",
  border: "1px solid var(--border)",
  color: "#cbd5e1",
  borderRadius: "12px",
  padding: "10px 14px",
  fontSize: "14px",
  outline: "none",
  width: "100%",
};

export function WarrantyEditModal({ warranty, onClose, onSaved }) {
  const p = warranty?.products ?? {};

  const [form, setForm] = useState({
    productName:   p.product_name    ?? "",
    brand:         p.brand           ?? "",
    modelNumber:   p.model_number    ?? "",
    serialNumber:  p.serial_number   ?? "",
    category:      p.category        ?? "electronics",
    purchaseDate:  p.purchase_date   ?? "",
    purchasePrice: p.purchase_price  ?? "",
    retailer:      p.retailer        ?? "",
    notes:         p.notes           ?? "",
    warrantyMonths: warranty?.warranty_duration_months ?? 12,
    warrantyType:  warranty?.warranty_type ?? "manufacturer",
    startDate:     warranty?.start_date ?? "",
  });
  const [loading, setLoading] = useState(false);

  function set(field, value) {
    setForm((prev) => ({ ...prev, [field]: value }));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    if (!form.productName.trim()) {
      toast.error("Product name is required");
      return;
    }
    setLoading(true);
    try {
      await warrantyService.update(warranty.id, p.id, form);
      toast.success("Warranty updated!");
      onSaved?.();
      onClose();
    } catch (err) {
      toast.error(err.message || "Update failed");
    } finally {
      setLoading(false);
    }
  }

  return (
    <Modal open={!!warranty} onClose={onClose} title="Edit Warranty">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="sm:col-span-2">
            <Input
              label="Product Name *"
              value={form.productName}
              onChange={(e) => set("productName", e.target.value)}
            />
          </div>
          <Input label="Brand" value={form.brand} onChange={(e) => set("brand", e.target.value)} />
          <Input label="Model Number" value={form.modelNumber} onChange={(e) => set("modelNumber", e.target.value)} />
          <Input label="Serial Number" value={form.serialNumber} onChange={(e) => set("serialNumber", e.target.value)} />

          <div className="space-y-1.5">
            <label className="block text-sm font-medium text-slate-300">Category</label>
            <select value={form.category} onChange={(e) => set("category", e.target.value)} style={selectStyle}>
              {CATEGORIES.map((c) => (
                <option key={c.value} value={c.value} style={{ backgroundColor: "#0f1029" }}>{c.label}</option>
              ))}
            </select>
          </div>

          <Input label="Purchase Date" type="date" value={form.purchaseDate} onChange={(e) => set("purchaseDate", e.target.value)} />
          <Input label="Purchase Price (₹)" type="number" min="0" value={form.purchasePrice} onChange={(e) => set("purchasePrice", e.target.value)} />
          <Input label="Retailer" value={form.retailer} onChange={(e) => set("retailer", e.target.value)} />

          <div className="space-y-1.5">
            <label className="block text-sm font-medium text-slate-300">Warranty Duration</label>
            <select value={form.warrantyMonths} onChange={(e) => set("warrantyMonths", e.target.value)} style={selectStyle}>
              {WARRANTY_DURATIONS.map((d) => (
                <option key={d.value} value={d.value} style={{ backgroundColor: "#0f1029" }}>{d.label}</option>
              ))}
            </select>
          </div>

          <div className="space-y-1.5">
            <label className="block text-sm font-medium text-slate-300">Warranty Type</label>
            <select value={form.warrantyType} onChange={(e) => set("warrantyType", e.target.value)} style={selectStyle}>
              {WARRANTY_TYPES.map((t) => (
                <option key={t.value} value={t.value} style={{ backgroundColor: "#0f1029" }}>{t.label}</option>
              ))}
            </select>
          </div>

          <Input label="Warranty Start Date" type="date" value={form.startDate} onChange={(e) => set("startDate", e.target.value)} />

          <div className="sm:col-span-2 space-y-1.5">
            <label className="block text-sm font-medium text-slate-300">Notes</label>
            <textarea
              value={form.notes}
              onChange={(e) => set("notes", e.target.value)}
              rows={2}
              className="w-full text-sm text-white placeholder-slate-600 outline-none rounded-xl"
              style={{ backgroundColor: "rgba(255,255,255,0.04)", border: "1px solid var(--border)", padding: "10px 14px", resize: "vertical" }}
            />
          </div>
        </div>

        <div className="flex gap-3 pt-1">
          <Button type="submit" loading={loading}>Save Changes</Button>
          <Button type="button" variant="secondary" onClick={onClose}>Cancel</Button>
        </div>
      </form>
    </Modal>
  );
}
