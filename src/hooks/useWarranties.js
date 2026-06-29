import { useEffect, useMemo } from "react";
import { useAuthStore } from "../stores/authStore";
import { useWarrantyStore } from "../stores/warrantyStore";

export function useWarranties() {
  const { dbUser } = useAuthStore();
  const { fetchWarranties, warranties, loading, filters } = useWarrantyStore();

  useEffect(() => {
    if (dbUser?.id) fetchWarranties(dbUser.id);
  }, [dbUser?.id]);

  const filteredWarranties = useMemo(() => {
    const filtered = warranties.filter((w) => {
      const productName = w.products?.product_name?.toLowerCase() ?? "";
      const brand = w.products?.brand?.toLowerCase() ?? "";

      if (filters.search) {
        const q = filters.search.toLowerCase();
        if (!productName.includes(q) && !brand.includes(q)) return false;
      }
      if (filters.status !== "all" && w.status !== filters.status) return false;
      if (filters.category !== "all" && w.products?.category !== filters.category) return false;
      if (filters.year !== "all") {
        const purchaseYear = w.start_date?.slice(0, 4);
        if (purchaseYear !== filters.year) return false;
      }
      if (filters.month !== "all") {
        const purchaseMonth = w.start_date?.slice(5, 7);
        if (purchaseMonth !== filters.month) return false;
      }
      return true;
    });

    return filtered.sort((a, b) => {
      switch (filters.sortBy) {
        case "newest":
          return new Date(b.start_date) - new Date(a.start_date);
        case "oldest":
          return new Date(a.start_date) - new Date(b.start_date);
        case "expiry_asc":
          return new Date(a.end_date) - new Date(b.end_date);
        case "expiry_desc":
          return new Date(b.end_date) - new Date(a.end_date);
        default:
          return 0;
      }
    });
  }, [warranties, filters]);

  return { warranties, loading, filteredWarranties };
}
