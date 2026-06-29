import { supabase } from "../config/supabase";
import { uploadToStorage } from "../config/supabaseStorage";
import { toISODate, computeEndDate } from "../utils/dateHelpers";

export const productService = {
  async create(productData) {
    const { data, error } = await supabase
      .from("products")
      .insert(productData)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  async addProductWithWarranty({
    userId,
    productName,
    brand,
    modelNumber,
    serialNumber,
    category,
    purchaseDate,
    purchasePrice,
    retailer,
    notes,
    warrantyMonths,
    warrantyType,
    receiptFile,
    receiptDocType = "receipt",
    ocrRawText = null,
  }) {
    const product = await this.create({
      user_id: userId,
      product_name: productName,
      brand: brand || null,
      model_number: modelNumber || null,
      serial_number: serialNumber || null,
      category: category || "other",
      purchase_date: purchaseDate,
      purchase_price: purchasePrice || null,
      retailer: retailer || null,
      notes: notes || null,
    });

    const isDays = typeof warrantyMonths === "string" && warrantyMonths.endsWith("d");
    const endDate = computeEndDate(purchaseDate, isDays ? warrantyMonths : Number(warrantyMonths));
    const durationMonths = isDays ? Math.round(parseInt(warrantyMonths, 10) / 30) : Number(warrantyMonths);

    const { data: warranty, error: wErr } = await supabase
      .from("warranties")
      .insert({
        product_id: product.id,
        user_id: userId,
        warranty_type: warrantyType || "manufacturer",
        start_date: purchaseDate,
        end_date: toISODate(endDate),
        warranty_duration_months: durationMonths,
      })
      .select()
      .single();

    if (wErr) throw wErr;

    if (receiptFile) {
      const uploadResult = await uploadToStorage(receiptFile);
      await supabase.from("documents").insert({
        product_id: product.id,
        user_id: userId,
        doc_type: receiptDocType,
        file_url: uploadResult.secure_url,
        public_id: uploadResult.public_id,
        file_name: receiptFile.name,
        file_size: receiptFile.size,
        mime_type: receiptFile.type,
        ocr_raw_text: ocrRawText || null,
      });
    }

    return { product, warranty };
  },
};
