import { supabase } from "../config/supabase";

export const warrantyService = {
  async getAllForUser(userId) {
    const { data, error } = await supabase
      .from("warranties_with_status")
      .select(`
        *,
        products (
          id, product_name, brand, model_number,
          category, purchase_date, purchase_price, retailer
        )
      `)
      .eq("user_id", userId)
      .order("end_date", { ascending: true });

    if (error) throw error;
    return data;
  },

  async getById(warrantyId) {
    const { data, error } = await supabase
      .from("warranties_with_status")
      .select(`*, products(*), documents(*), claims(*)`)
      .eq("id", warrantyId)
      .single();

    if (error) throw error;
    return data;
  },

  async create(warrantyData) {
    const { data, error } = await supabase
      .from("warranties")
      .insert(warrantyData)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  async delete(warrantyId) {
    // 1. Get the product_id linked to this warranty
    const { data: warranty, error: fetchErr } = await supabase
      .from("warranties")
      .select("product_id")
      .eq("id", warrantyId)
      .single();
    if (fetchErr) throw fetchErr;

    const productId = warranty.product_id;

    // 2. Delete claims for this warranty
    await supabase.from("claims").delete().eq("warranty_id", warrantyId);

    // 3. Delete the warranty
    const { error: wErr } = await supabase
      .from("warranties")
      .delete()
      .eq("id", warrantyId);
    if (wErr) throw wErr;

    // 4. Delete documents for this product
    await supabase.from("documents").delete().eq("product_id", productId);

    // 5. Delete the product itself
    const { error: pErr } = await supabase
      .from("products")
      .delete()
      .eq("id", productId);
    if (pErr) throw pErr;
  },

  async update(warrantyId, productId, { productName, brand, modelNumber, serialNumber,
    category, purchaseDate, purchasePrice, retailer, notes,
    warrantyMonths, warrantyType, startDate }) {

    // Update product fields
    const { error: pErr } = await supabase
      .from("products")
      .update({
        product_name:   productName,
        brand,
        model_number:   modelNumber,
        serial_number:  serialNumber,
        category,
        purchase_date:  purchaseDate,
        purchase_price: purchasePrice ? Number(purchasePrice) : null,
        retailer,
        notes,
        updated_at:     new Date().toISOString(),
      })
      .eq("id", productId);
    if (pErr) throw pErr;

    // Recompute end date from start + duration
    const isDays = typeof warrantyMonths === "string" && warrantyMonths.endsWith("d");
    const end = new Date(startDate);
    if (isDays) {
      end.setDate(end.getDate() + parseInt(warrantyMonths, 10));
    } else {
      end.setMonth(end.getMonth() + Number(warrantyMonths));
    }
    const endDate = end.toISOString().split("T")[0];
    const durationMonths = isDays ? Math.round(parseInt(warrantyMonths, 10) / 30) : Number(warrantyMonths);

    // Update warranty fields
    const { error: wErr } = await supabase
      .from("warranties")
      .update({
        warranty_duration_months: durationMonths,
        warranty_type:            warrantyType,
        start_date:               startDate,
        end_date:                 endDate,
        updated_at:               new Date().toISOString(),
      })
      .eq("id", warrantyId);
    if (wErr) throw wErr;
  },

  async getExpiringWithin(userId, days) {
    const futureDate = new Date();
    futureDate.setDate(futureDate.getDate() + days);

    const { data, error } = await supabase
      .from("warranties_with_status")
      .select(`*, products(product_name, brand)`)
      .eq("user_id", userId)
      .gte("end_date", new Date().toISOString().split("T")[0])
      .lte("end_date", futureDate.toISOString().split("T")[0]);

    if (error) throw error;
    return data;
  },
};
