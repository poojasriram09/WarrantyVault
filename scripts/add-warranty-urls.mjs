import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL = "https://gikwflwrlgltijamuqqc.supabase.co";
const SERVICE_ROLE_KEY =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imdpa3dmbHdybGdsdGlqYW11cXFjIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3MjYzMjE5MywiZXhwIjoyMDg4MjA4MTkzfQ.nDhMGsAxrdOnfb2bVAClIOx_dh-YhycFXFihXHk45l8";

const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY);

// One warranty URL per brand — applied to every row sharing that brand
const BRAND_WARRANTY = {
  Samsung:   { label: "Samsung Warranty & Repair",       url: "https://www.samsung.com/in/support/warranty/" },
  Apple:     { label: "Apple Repair & Service",          url: "https://support.apple.com/en-in/repair" },
  LG:        { label: "LG Warranty Registration",        url: "https://www.lg.com/in/support/warranty-information" },
  Sony:      { label: "Sony Warranty & Support",         url: "https://www.sony.co.in/en/articles/warranty" },
  Bosch:     { label: "Bosch Home Warranty & Service",   url: "https://www.bosch-home.com/in/services/warranty.html" },
  Whirlpool: { label: "Whirlpool Warranty Extension",    url: "https://www.whirlpool.co.in/extended-warranty.html" },
  HP:        { label: "HP Warranty Check & Extend",      url: "https://support.hp.com/in-en/checkwarranty" },
  Dell:      { label: "Dell Warranty Status & Renew",    url: "https://www.dell.com/en-in/lp/dt/dell-pro-support" },
  Lenovo:    { label: "Lenovo Warranty Lookup & Extend", url: "https://pcsupport.lenovo.com/in/en/warrantylookup" },
  OnePlus:   { label: "OnePlus Warranty & Repair",       url: "https://www.oneplus.com/in/support/warranty" },
  Xiaomi:    { label: "Xiaomi Mi Care Warranty",         url: "https://www.mi.com/in/service/warranty" },
};

// First: add the two new columns (ignore error if they already exist)
const addColRes = await fetch(
  `https://api.supabase.com/v1/projects/gikwflwrlgltijamuqqc/database/query`,
  { method: "POST" }
);
// We can't run DDL via REST — do it via supabase-js workaround:
// Insert a dummy row to test column existence, then handle gracefully.
// Instead we'll just update and if columns are missing the script will fail clearly.

let successCount = 0;
let failCount = 0;

for (const [brand, { label, url }] of Object.entries(BRAND_WARRANTY)) {
  const { error } = await supabase
    .from("service_centers")
    .update({ warranty_label: label, warranty_url: url })
    .eq("brand", brand);

  if (error) {
    console.error(`  FAIL  ${brand}:`, error.message);
    failCount++;
  } else {
    console.log(`  OK    ${brand} → ${label}`);
    successCount++;
  }
}

console.log(`\nDone: ${successCount} brands updated, ${failCount} failed`);
console.log("\nNOTE: If you see column errors, run this SQL in Supabase Dashboard first:");
console.log("  ALTER TABLE public.service_centers");
console.log("    ADD COLUMN IF NOT EXISTS warranty_label TEXT,");
console.log("    ADD COLUMN IF NOT EXISTS warranty_url TEXT;");
