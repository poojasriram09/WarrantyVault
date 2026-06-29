import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { useAuthStore } from "../stores/authStore";
import { productService } from "../services/product.service";
import { ReceiptUploader } from "../components/product/ReceiptUploader";
import { OCRPreview } from "../components/product/OCRPreview";
import { Input } from "../components/ui/Input";
import { Button } from "../components/ui/Button";
import { CATEGORIES, WARRANTY_TYPES, WARRANTY_DURATIONS } from "../utils/constants";
import { validateProductForm } from "../utils/validators";
import toast from "react-hot-toast";

const INITIAL = {
  productName: "", brand: "", modelNumber: "", serialNumber: "",
  category: "electronics", purchaseDate: "", purchasePrice: "",
  retailer: "", notes: "", warrantyMonths: "12", warrantyType: "manufacturer",
};

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

export default function AddProductPage() {
  const navigate = useNavigate();
  const { dbUser } = useAuthStore();
  const { t } = useTranslation("addProduct");
  const { t: tc } = useTranslation("common");
  const [form, setForm] = useState(INITIAL);
  const [errors, setErrors] = useState({});
  const [receiptFile, setReceiptFile] = useState(null);
  const [ocrResult, setOcrResult] = useState(null);
  const [loading, setLoading] = useState(false);

  function set(field, value) {
    setForm((prev) => ({ ...prev, [field]: value }));
    setErrors((prev) => ({ ...prev, [field]: undefined }));
  }

  function handleOCRExtracted(data) {
    setOcrResult(data);
    if (data.productName && !form.productName) set("productName", data.productName);
    if (data.brand && !form.brand) set("brand", data.brand);
    if (data.modelNumber && !form.modelNumber) set("modelNumber", data.modelNumber);
    if (data.serialNumber && !form.serialNumber) set("serialNumber", data.serialNumber);
    if (data.price && !form.purchasePrice) set("purchasePrice", String(data.price));
    if (data.retailer && !form.retailer) set("retailer", data.retailer);
    if (data.warrantyMonths && !form.warrantyMonths) set("warrantyMonths", String(data.warrantyMonths));
    if (data.purchaseDate && !form.purchaseDate) {
      if (/^\d{4}[\/\-]\d{2}[\/\-]\d{2}$/.test(data.purchaseDate)) {
        set("purchaseDate", data.purchaseDate.replace(/\//g, "-"));
      } else {
        const parts = data.purchaseDate.split(/[\/\-\.]/);
        if (parts.length === 3) {
          const [d, m, y] = parts;
          const year = y.length === 2 ? `20${y}` : y;
          set("purchaseDate", `${year}-${m.padStart(2, "0")}-${d.padStart(2, "0")}`);
        }
      }
    }
  }

  async function handleSubmit(e) {
    e.preventDefault();
    if (!dbUser?.id) {
      toast.error(tc("errors.sessionNotLoaded"));
      return;
    }
    const errs = validateProductForm(form);
    if (Object.keys(errs).length) { setErrors(errs); return; }
    setLoading(true);
    try {
      await productService.addProductWithWarranty({
        userId: dbUser.id,
        ...form,
        purchasePrice: form.purchasePrice ? Number(form.purchasePrice) : null,
        warrantyMonths: form.warrantyMonths,
        receiptFile,
        receiptDocType: "receipt",
        ocrRawText: ocrResult?.rawText ?? null,
      });
      toast.success(t("success"));
      navigate("/warranties");
    } catch (err) {
      console.error("Add product error:", err);
      const msg = err?.message || err?.details || err?.hint || JSON.stringify(err);
      toast.error(t("fail", { message: msg }), { duration: 6000 });
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="w-full max-w-4xl">
      <div className="mb-4">
        <h1 className="text-2xl font-bold text-white">{t("title")}</h1>
        <p className="text-sm text-slate-500 mt-0.5">{t("subtitle")}</p>
      </div>

      <form onSubmit={handleSubmit}>
        <div
          className="rounded-2xl p-4 space-y-4"
          style={{ backgroundColor: "var(--bg-card)", border: "1px solid var(--border)" }}
        >
          <ReceiptUploader onFileSelected={setReceiptFile} onExtracted={handleOCRExtracted} />

          {ocrResult && <OCRPreview result={ocrResult} />}

          <div className="h-px" style={{ backgroundColor: "var(--border)" }} />

          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            <div className="col-span-2 sm:col-span-3">
              <Input label={t("fields.productName")} value={form.productName} onChange={(e) => set("productName", e.target.value)} placeholder={t("fields.productNamePh")} error={errors.productName} />
            </div>
            <Input label={t("fields.brand")} value={form.brand} onChange={(e) => set("brand", e.target.value)} placeholder={t("fields.brandPh")} />
            <Input label={t("fields.modelNumber")} value={form.modelNumber} onChange={(e) => set("modelNumber", e.target.value)} placeholder={t("fields.modelNumberPh")} />
            <Input label={t("fields.serialNumber")} value={form.serialNumber} onChange={(e) => set("serialNumber", e.target.value)} placeholder={t("fields.serialNumberPh")} />

            <div className="space-y-1.5">
              <label className="block text-sm font-medium text-slate-300">{t("fields.category")}</label>
              <select value={form.category} onChange={(e) => set("category", e.target.value)} style={selectStyle}>
                {CATEGORIES.map((c) => <option key={c.value} value={c.value} style={{ backgroundColor: "#0f1029" }}>{c.label}</option>)}
              </select>
            </div>

            <Input label={t("fields.purchaseDate")} type="date" value={form.purchaseDate} onChange={(e) => set("purchaseDate", e.target.value)} error={errors.purchaseDate} />
            <Input label={t("fields.price")} type="number" min="0" value={form.purchasePrice} onChange={(e) => set("purchasePrice", e.target.value)} placeholder={t("fields.pricePh")} />
            <Input label={t("fields.retailer")} value={form.retailer} onChange={(e) => set("retailer", e.target.value)} placeholder={t("fields.retailerPh")} />

            <div className="space-y-1.5">
              <label className="block text-sm font-medium text-slate-300">{t("fields.warrantyDuration")}</label>
              <select value={form.warrantyMonths} onChange={(e) => set("warrantyMonths", e.target.value)} style={selectStyle}>
                {WARRANTY_DURATIONS.map((d) => <option key={d.value} value={d.value} style={{ backgroundColor: "#0f1029" }}>{d.label}</option>)}
              </select>
              {errors.warrantyMonths && <p className="text-xs text-red-400">{errors.warrantyMonths}</p>}
            </div>

            <div className="space-y-1.5">
              <label className="block text-sm font-medium text-slate-300">{t("fields.warrantyType")}</label>
              <select value={form.warrantyType} onChange={(e) => set("warrantyType", e.target.value)} style={selectStyle}>
                {WARRANTY_TYPES.map((wt) => <option key={wt.value} value={wt.value} style={{ backgroundColor: "#0f1029" }}>{wt.label}</option>)}
              </select>
            </div>

            <div className="col-span-2 sm:col-span-3 space-y-1.5">
              <label className="block text-sm font-medium text-slate-300">{t("fields.notes")}</label>
              <textarea
                value={form.notes}
                onChange={(e) => set("notes", e.target.value)}
                rows={2}
                className="w-full text-sm text-white placeholder-slate-600 outline-none focus:ring-1 rounded-xl"
                style={{ backgroundColor: "rgba(255,255,255,0.04)", border: "1px solid var(--border)", padding: "10px 14px", resize: "vertical" }}
                placeholder={t("fields.notesPh")}
              />
            </div>
          </div>

          <div className="flex gap-3">
            <Button type="submit" loading={loading}>{t("save")}</Button>
            <Button type="button" variant="secondary" onClick={() => navigate("/warranties")}>{t("cancel")}</Button>
          </div>
        </div>
      </form>
    </div>
  );
}
