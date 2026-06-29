import { useState } from "react";
import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { ShieldCheck, PlusCircle } from "lucide-react";
import { useWarranties } from "../hooks/useWarranties";
import { useWarrantyStore } from "../stores/warrantyStore";
import { useAuthStore } from "../stores/authStore";
import { warrantyService } from "../services/warranty.service";
import { WarrantyCard } from "../components/warranty/WarrantyCard";
import { WarrantyDetail } from "../components/warranty/WarrantyDetail";
import { WarrantyEditModal } from "../components/warranty/WarrantyEditModal";
import { FilterBar } from "../components/warranty/FilterBar";
import { Spinner } from "../components/ui/Spinner";
import { EmptyState } from "../components/ui/EmptyState";
import { Button } from "../components/ui/Button";
import toast from "react-hot-toast";

export default function MyWarrantiesPage() {
  const { loading, filteredWarranties } = useWarranties();
  const { fetchWarranties } = useWarrantyStore();
  const { dbUser } = useAuthStore();
  const { t } = useTranslation("warranties");
  const [selected, setSelected] = useState(null);
  const [editing, setEditing] = useState(null);

  async function handleDelete(warrantyId) {
    if (!confirm(t("deleteConfirm"))) return;
    try {
      await warrantyService.delete(warrantyId);
      toast.success(t("deleteSuccess"));
      if (dbUser?.id) fetchWarranties(dbUser.id);
    } catch {
      toast.error(t("deleteFail"));
    }
  }

  if (loading) return <Spinner />;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">{t("title")}</h1>
          <p className="text-sm text-slate-500 mt-0.5">
            {t("count", { count: filteredWarranties.length })}
          </p>
        </div>
        <Link to="/add-product">
          <Button><PlusCircle size={15} /> {t("addProduct")}</Button>
        </Link>
      </div>

      <FilterBar />

      {filteredWarranties.length === 0 ? (
        <EmptyState
          icon={ShieldCheck}
          title={t("empty.title")}
          description={t("empty.subtitle")}
          action={<Link to="/add-product"><Button>{t("addProduct")}</Button></Link>}
        />
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredWarranties.map((w) => (
            <WarrantyCard key={w.id} warranty={w} onView={setSelected} onEdit={setEditing} onDelete={handleDelete} />
          ))}
        </div>
      )}

      <WarrantyDetail warranty={selected} onClose={() => setSelected(null)} />
      <WarrantyEditModal
        warranty={editing}
        onClose={() => setEditing(null)}
        onSaved={() => { if (dbUser?.id) fetchWarranties(dbUser.id); }}
      />
    </div>
  );
}
