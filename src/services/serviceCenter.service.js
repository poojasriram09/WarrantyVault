import { supabase } from "../config/supabase";

export const serviceCenterService = {
  async search({ brand = "", area = "" } = {}) {
    let query = supabase.from("service_centers").select("*").order("brand").order("name");

    if (brand.trim()) {
      query = query.ilike("brand", `%${brand.trim()}%`);
    }
    if (area.trim()) {
      query = query.ilike("area", `%${area.trim()}%`);
    }

    const { data, error } = await query;
    if (error) throw error;
    return data ?? [];
  },
};
