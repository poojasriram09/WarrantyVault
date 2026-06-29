import { create } from "zustand";
import { warrantyService } from "../services/warranty.service";

export const useWarrantyStore = create((set) => ({
  warranties: [],
  loading: false,
  filters: {
    search: "",
    status: "all",
    category: "all",
    sortBy: "newest",
    year: "all",
    month: "all",
  },

  async fetchWarranties(userId) {
    set({ loading: true });
    try {
      const data = await warrantyService.getAllForUser(userId);
      set({ warranties: data });
    } finally {
      set({ loading: false });
    }
  },

  setFilter(key, value) {
    set((state) => ({
      filters: { ...state.filters, [key]: value },
    }));
  },
}));
