import { supabase } from "../config/supabase";

export const claimService = {
  async create({ warrantyId, userId, issueSummary, issueDetails }) {
    const { data, error } = await supabase
      .from("claims")
      .insert({
        warranty_id:   warrantyId,
        user_id:       userId,
        issue_summary: issueSummary,
        issue_details: issueDetails,
        status:        "submitted",
      })
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  async getForUser(userId) {
    const { data, error } = await supabase
      .from("claims")
      .select(`*, warranties(*, products(product_name, brand))`)
      .eq("user_id", userId)
      .order("created_at", { ascending: false });

    if (error) throw error;
    return data ?? [];
  },
};
