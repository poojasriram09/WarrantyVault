import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  "https://snukdiykaemmhukbsioe.supabase.co",
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNudWtkaXlrYWVtbWh1a2JzaW9lIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3Mjc2MTc3MiwiZXhwIjoyMDg4MzM3NzcyfQ.GwfCTEmVPZNSy2psVsbfsDB6_8Gwqsim_d4Opp5D9oU"
);

const BUCKET = "documents";

// Fetch all docs that still point to Cloudinary
const { data: docs, error } = await supabase
  .from("documents")
  .select("id, file_url, public_id, file_name, mime_type")
  .ilike("file_url", "%cloudinary.com%");

if (error) { console.error("Query failed:", error.message); process.exit(1); }
if (!docs?.length) { console.log("No Cloudinary documents found — nothing to migrate."); process.exit(0); }

console.log(`Found ${docs.length} Cloudinary document(s) to migrate.\n`);

for (const doc of docs) {
  process.stdout.write(`  Migrating: ${doc.file_name ?? doc.id} ... `);

  // 1. Download from Cloudinary
  let buffer, contentType;
  try {
    const res = await fetch(doc.file_url);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    buffer = Buffer.from(await res.arrayBuffer());
    contentType = res.headers.get("content-type") || doc.mime_type || "application/octet-stream";
  } catch (e) {
    console.log(`SKIP (download failed: ${e.message})`);
    continue;
  }

  // 2. Upload to Supabase Storage
  const ext = (doc.file_name ?? "file").split(".").pop();
  const path = `migrated/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;

  const { data: uploaded, error: upErr } = await supabase.storage
    .from(BUCKET)
    .upload(path, buffer, { contentType, upsert: false });

  if (upErr) { console.log(`SKIP (upload failed: ${upErr.message})`); continue; }

  const { data: { publicUrl } } = supabase.storage.from(BUCKET).getPublicUrl(uploaded.path);

  // 3. Update DB row
  const { error: updateErr } = await supabase
    .from("documents")
    .update({ file_url: publicUrl, public_id: uploaded.path })
    .eq("id", doc.id);

  if (updateErr) { console.log(`SKIP (DB update failed: ${updateErr.message})`); continue; }

  console.log("OK");
}

console.log("\nMigration complete.");
