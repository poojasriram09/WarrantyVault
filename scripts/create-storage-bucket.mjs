import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  "https://snukdiykaemmhukbsioe.supabase.co",
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNudWtkaXlrYWVtbWh1a2JzaW9lIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3Mjc2MTc3MiwiZXhwIjoyMDg4MzM3NzcyfQ.GwfCTEmVPZNSy2psVsbfsDB6_8Gwqsim_d4Opp5D9oU"
);

const { data: existing } = await supabase.storage.getBucket("documents");
if (existing) {
  console.log("Bucket 'documents' already exists — nothing to do.");
  process.exit(0);
}

const { error } = await supabase.storage.createBucket("documents", {
  public: true,
  fileSizeLimit: 20971520, // 20 MB
  allowedMimeTypes: [
    "image/jpeg", "image/png", "image/webp", "image/gif",
    "application/pdf",
  ],
});

if (error) {
  console.error("Failed to create bucket:", error.message);
  process.exit(1);
}

console.log("Bucket 'documents' created successfully (public, 20 MB limit).");
