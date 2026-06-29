import { supabase } from "./supabase";

const BUCKET = "documents";

export async function uploadToStorage(file) {
  const ext = file.name.split(".").pop();
  const path = `${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;

  const { data, error } = await supabase.storage
    .from(BUCKET)
    .upload(path, file, { cacheControl: "3600", upsert: false });

  if (error) throw error;

  const { data: { publicUrl } } = supabase.storage
    .from(BUCKET)
    .getPublicUrl(data.path);

  return { secure_url: publicUrl, public_id: data.path };
}

export async function deleteFromStorage(publicId) {
  const { error } = await supabase.storage.from(BUCKET).remove([publicId]);
  if (error) throw error;
}
