/**
 * Full database setup script for WarrantyVault
 * Runs all DDL + seeds via Supabase Management API (service role)
 */
import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL = "https://snukdiykaemmhukbsioe.supabase.co";
const SERVICE_ROLE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNudWtkaXlrYWVtbWh1a2JzaW9lIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3Mjc2MTc3MiwiZXhwIjoyMDg4MzM3NzcyfQ.GwfCTEmVPZNSy2psVsbfsDB6_8Gwqsim_d4Opp5D9oU";
const PROJECT_REF = "snukdiykaemmhukbsioe";

const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY);

// ─── Run SQL via Management API ───────────────────────────────────────────────
async function sql(query, label = "") {
  const res = await fetch(`https://api.supabase.com/v1/projects/${PROJECT_REF}/database/query`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      // Management API needs a PAT — fall back to direct insert seeding below
    },
    body: JSON.stringify({ query }),
  });
  if (!res.ok) {
    // Management API failed (no PAT) — log and continue; DDL must be run via dashboard
    console.warn(`  [MGMT API unavailable] ${label}`);
    return null;
  }
  console.log(`  ✓ ${label}`);
  return res.json();
}

// ─── Full schema SQL ──────────────────────────────────────────────────────────
const SCHEMA_SQL = `
-- ============================================================
-- USERS
-- ============================================================
CREATE TABLE IF NOT EXISTS public.users (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  firebase_uid  TEXT UNIQUE NOT NULL,
  email         TEXT,
  display_name  TEXT,
  avatar_url    TEXT,
  created_at    TIMESTAMPTZ DEFAULT now(),
  updated_at    TIMESTAMPTZ DEFAULT now()
);

-- ============================================================
-- PRODUCTS
-- ============================================================
CREATE TABLE IF NOT EXISTS public.products (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id        UUID REFERENCES public.users(id) ON DELETE CASCADE,
  product_name   TEXT NOT NULL,
  brand          TEXT,
  model_number   TEXT,
  serial_number  TEXT,
  category       TEXT DEFAULT 'other',
  purchase_date  DATE,
  purchase_price NUMERIC(12,2),
  retailer       TEXT,
  notes          TEXT,
  created_at     TIMESTAMPTZ DEFAULT now(),
  updated_at     TIMESTAMPTZ DEFAULT now()
);

-- ============================================================
-- WARRANTIES
-- ============================================================
CREATE TABLE IF NOT EXISTS public.warranties (
  id                       UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id               UUID REFERENCES public.products(id) ON DELETE CASCADE,
  user_id                  UUID REFERENCES public.users(id) ON DELETE CASCADE,
  warranty_type            TEXT DEFAULT 'manufacturer',
  start_date               DATE,
  end_date                 DATE,
  warranty_duration_months INT,
  created_at               TIMESTAMPTZ DEFAULT now(),
  updated_at               TIMESTAMPTZ DEFAULT now()
);

-- ============================================================
-- DOCUMENTS
-- ============================================================
CREATE TABLE IF NOT EXISTS public.documents (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id    UUID REFERENCES public.products(id) ON DELETE CASCADE,
  user_id       UUID REFERENCES public.users(id) ON DELETE CASCADE,
  doc_type      TEXT CHECK (doc_type IN ('invoice','receipt','warranty_card','manual','insurance','other')),
  file_url      TEXT NOT NULL,
  public_id     TEXT,
  file_name     TEXT,
  file_size     INT,
  mime_type     TEXT,
  ocr_raw_text  TEXT,
  uploaded_at   TIMESTAMPTZ DEFAULT now()
);

-- ============================================================
-- CLAIMS
-- ============================================================
CREATE TABLE IF NOT EXISTS public.claims (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  warranty_id    UUID REFERENCES public.warranties(id) ON DELETE CASCADE,
  user_id        UUID REFERENCES public.users(id) ON DELETE CASCADE,
  issue_summary  TEXT,
  issue_details  TEXT,
  status         TEXT DEFAULT 'submitted',
  created_at     TIMESTAMPTZ DEFAULT now(),
  updated_at     TIMESTAMPTZ DEFAULT now()
);

-- ============================================================
-- NOTIFICATIONS
-- ============================================================
CREATE TABLE IF NOT EXISTS public.notifications (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     UUID REFERENCES public.users(id) ON DELETE CASCADE,
  warranty_id UUID REFERENCES public.warranties(id) ON DELETE CASCADE,
  type        TEXT CHECK (type IN ('expiry_0d','expiry_1d','expiry_7d','expiry_30d','expiry_90d')),
  channel     TEXT CHECK (channel IN ('in_app','email','push')),
  message     TEXT,
  is_read     BOOLEAN DEFAULT false,
  created_at  TIMESTAMPTZ DEFAULT now()
);

-- ============================================================
-- CHAT MESSAGES
-- ============================================================
CREATE TABLE IF NOT EXISTS public.chat_messages (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id    UUID REFERENCES public.users(id) ON DELETE CASCADE,
  role       TEXT CHECK (role IN ('user','assistant')),
  content    TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- ============================================================
-- SERVICE CENTERS
-- ============================================================
CREATE TABLE IF NOT EXISTS public.service_centers (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  brand           TEXT NOT NULL,
  name            TEXT NOT NULL,
  address         TEXT,
  area            TEXT,
  city            TEXT,
  state           TEXT,
  pincode         TEXT,
  phone           TEXT,
  email           TEXT,
  latitude        DOUBLE PRECISION,
  longitude       DOUBLE PRECISION,
  map_url         TEXT,
  warranty_label  TEXT,
  warranty_url    TEXT
);

-- ============================================================
-- WARRANTIES STATUS VIEW
-- ============================================================
CREATE OR REPLACE VIEW public.warranties_with_status AS
  SELECT *,
    CASE
      WHEN end_date < CURRENT_DATE THEN 'expired'
      WHEN end_date <= CURRENT_DATE + INTERVAL '30 days' THEN 'expiring_soon'
      ELSE 'active'
    END AS status
  FROM public.warranties;

-- ============================================================
-- INDEXES
-- ============================================================
CREATE INDEX IF NOT EXISTS idx_products_user      ON public.products(user_id);
CREATE INDEX IF NOT EXISTS idx_warranties_user    ON public.warranties(user_id);
CREATE INDEX IF NOT EXISTS idx_warranties_product ON public.warranties(product_id);
CREATE INDEX IF NOT EXISTS idx_documents_product  ON public.documents(product_id);
CREATE INDEX IF NOT EXISTS idx_claims_warranty    ON public.claims(warranty_id);
CREATE INDEX IF NOT EXISTS idx_notifications_user ON public.notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_service_centers_brand ON public.service_centers(brand);
CREATE INDEX IF NOT EXISTS idx_service_centers_city  ON public.service_centers(city);

-- ============================================================
-- RLS
-- ============================================================
ALTER TABLE public.users            ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.products         ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.warranties       ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.documents        ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.claims           ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications    ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.chat_messages    ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.service_centers  ENABLE ROW LEVEL SECURITY;

-- Drop old policies
DO $$ BEGIN
  DROP POLICY IF EXISTS "Users access own data"    ON public.users;
  DROP POLICY IF EXISTS "Users access own products" ON public.products;
  DROP POLICY IF EXISTS "Users access own warranties" ON public.warranties;
  DROP POLICY IF EXISTS "Users access own documents" ON public.documents;
  DROP POLICY IF EXISTS "Users access own claims"  ON public.claims;
  DROP POLICY IF EXISTS "Users access own notifications" ON public.notifications;
  DROP POLICY IF EXISTS "Users access own chats"   ON public.chat_messages;
  DROP POLICY IF EXISTS "Service centers are public" ON public.service_centers;
  DROP POLICY IF EXISTS "Anon full access" ON public.users;
  DROP POLICY IF EXISTS "Anon full access" ON public.products;
  DROP POLICY IF EXISTS "Anon full access" ON public.warranties;
  DROP POLICY IF EXISTS "Anon full access" ON public.documents;
  DROP POLICY IF EXISTS "Anon full access" ON public.claims;
  DROP POLICY IF EXISTS "Anon full access" ON public.notifications;
  DROP POLICY IF EXISTS "Anon full access" ON public.chat_messages;
EXCEPTION WHEN OTHERS THEN NULL;
END $$;

-- Firebase JWTs can't be verified by Supabase RLS directly.
-- Security is enforced at application layer (.eq("user_id", userId)).
CREATE POLICY "Anon full access" ON public.users            FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Anon full access" ON public.products         FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Anon full access" ON public.warranties       FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Anon full access" ON public.documents        FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Anon full access" ON public.claims           FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Anon full access" ON public.notifications    FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Anon full access" ON public.chat_messages    FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Service centers are public" ON public.service_centers FOR SELECT USING (true);
CREATE POLICY "Anon full access" ON public.service_centers  FOR ALL   USING (true) WITH CHECK (true);

-- ============================================================
-- sync_firebase_user RPC
-- ============================================================
CREATE OR REPLACE FUNCTION public.sync_firebase_user(
  p_firebase_uid  TEXT,
  p_email         TEXT,
  p_display_name  TEXT DEFAULT NULL,
  p_avatar_url    TEXT DEFAULT NULL
)
RETURNS public.users
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE v_user public.users;
BEGIN
  INSERT INTO public.users (firebase_uid, email, display_name, avatar_url)
  VALUES (p_firebase_uid, p_email, p_display_name, p_avatar_url)
  ON CONFLICT (firebase_uid) DO UPDATE
    SET email        = EXCLUDED.email,
        display_name = COALESCE(EXCLUDED.display_name, users.display_name),
        avatar_url   = COALESCE(EXCLUDED.avatar_url,   users.avatar_url),
        updated_at   = now()
  RETURNING * INTO v_user;
  RETURN v_user;
END;
$$;

GRANT EXECUTE ON FUNCTION public.sync_firebase_user(TEXT, TEXT, TEXT, TEXT) TO anon;
GRANT EXECUTE ON FUNCTION public.sync_firebase_user(TEXT, TEXT, TEXT, TEXT) TO authenticated;
`;

// ─── Service center seed data ─────────────────────────────────────────────────
const SERVICE_CENTERS = [
  { brand:"Samsung",   name:"Samsung SmartCafé – Andheri",       address:"Shop 4, Prem Plaza, Andheri West",       area:"Andheri",     city:"Mumbai", state:"Maharashtra", pincode:"400058", phone:"1800 5 7267864", email:"support@samsung.com",   latitude:19.1313, longitude:72.8258, map_url:"https://www.google.com/maps/search/?api=1&query=Samsung+SmartCafe+Andheri+West+Mumbai",                                          warranty_label:"Samsung Warranty & Repair",       warranty_url:"https://www.samsung.com/in/support/warranty/" },
  { brand:"Samsung",   name:"Samsung Service Centre – Dadar",    address:"22, Govardhan Society, Dadar East",      area:"Dadar",       city:"Mumbai", state:"Maharashtra", pincode:"400014", phone:"1800 5 7267864", email:"support@samsung.com",   latitude:19.0178, longitude:72.8478, map_url:"https://www.google.com/maps/search/?api=1&query=Samsung+Service+Centre+Dadar+East+Mumbai",                                       warranty_label:"Samsung Warranty & Repair",       warranty_url:"https://www.samsung.com/in/support/warranty/" },
  { brand:"Apple",     name:"Apple Authorised Service – Bandra", address:"Ground Floor, Hill Road, Bandra West",   area:"Bandra",      city:"Mumbai", state:"Maharashtra", pincode:"400050", phone:"1800 2000 744",  email:"support@apple.com",     latitude:19.0544, longitude:72.8404, map_url:"https://www.google.com/maps/search/?api=1&query=Apple+Authorised+Service+Hill+Road+Bandra+West+Mumbai",                         warranty_label:"Apple Repair & Service",          warranty_url:"https://support.apple.com/en-in/repair" },
  { brand:"Apple",     name:"iCare Apple Service – Powai",       address:"Hiranandani Gardens, Powai",             area:"Powai",       city:"Mumbai", state:"Maharashtra", pincode:"400076", phone:"022-25701234",   email:"icare@example.com",     latitude:19.1176, longitude:72.9060, map_url:"https://www.google.com/maps/search/?api=1&query=Apple+Service+Centre+Hiranandani+Gardens+Powai+Mumbai",                         warranty_label:"Apple Repair & Service",          warranty_url:"https://support.apple.com/en-in/repair" },
  { brand:"LG",        name:"LG Service Centre – Borivali",      address:"Shop 7, Chandavarkar Rd, Borivali West", area:"Borivali",    city:"Mumbai", state:"Maharashtra", pincode:"400092", phone:"1800 315 9999",  email:"lgcare@lge.com",        latitude:19.2307, longitude:72.8567, map_url:"https://www.google.com/maps/search/?api=1&query=LG+Service+Centre+Chandavarkar+Road+Borivali+West+Mumbai",                      warranty_label:"LG Warranty Registration",        warranty_url:"https://www.lg.com/in/support/warranty-information" },
  { brand:"LG",        name:"LG Service Centre – Thane",         address:"Gokhale Road, Naupada, Thane West",      area:"Thane",       city:"Mumbai", state:"Maharashtra", pincode:"400602", phone:"1800 315 9999",  email:"lgcare@lge.com",        latitude:19.1972, longitude:72.9700, map_url:"https://www.google.com/maps/search/?api=1&query=LG+Service+Centre+Gokhale+Road+Naupada+Thane+West",                             warranty_label:"LG Warranty Registration",        warranty_url:"https://www.lg.com/in/support/warranty-information" },
  { brand:"Sony",      name:"Sony Service Centre – Malad",       address:"S.V. Road, Malad West",                  area:"Malad",       city:"Mumbai", state:"Maharashtra", pincode:"400064", phone:"1800 103 7799",  email:"sony.india@sony.com",   latitude:19.1864, longitude:72.8481, map_url:"https://www.google.com/maps/search/?api=1&query=Sony+Service+Centre+SV+Road+Malad+West+Mumbai",                                  warranty_label:"Sony Warranty & Support",         warranty_url:"https://www.sony.co.in/en/articles/warranty" },
  { brand:"Sony",      name:"Sony Authorised – Vashi",           address:"Plot 17, Sector 17, Vashi, Navi Mumbai", area:"Vashi",       city:"Mumbai", state:"Maharashtra", pincode:"400703", phone:"1800 103 7799",  email:"sony.india@sony.com",   latitude:19.0771, longitude:73.0071, map_url:"https://www.google.com/maps/search/?api=1&query=Sony+Authorised+Service+Centre+Sector+17+Vashi+Navi+Mumbai",                    warranty_label:"Sony Warranty & Support",         warranty_url:"https://www.sony.co.in/en/articles/warranty" },
  { brand:"Whirlpool", name:"Whirlpool Service – Kandivali",     address:"Thakur Village, Kandivali East",         area:"Kandivali",   city:"Mumbai", state:"Maharashtra", pincode:"400101", phone:"1800 208 1800",  email:"whirlpool@support.com", latitude:19.2041, longitude:72.8737, map_url:"https://www.google.com/maps/search/?api=1&query=Whirlpool+Service+Centre+Thakur+Village+Kandivali+East+Mumbai",                  warranty_label:"Whirlpool Warranty Extension",    warranty_url:"https://www.whirlpool.co.in/extended-warranty.html" },
  { brand:"Bosch",     name:"Bosch Home Appliance Service",      address:"Kurla-Andheri Road, Saki Naka",          area:"Saki Naka",   city:"Mumbai", state:"Maharashtra", pincode:"400072", phone:"1800 266 1880",  email:"contact@bosch.in",      latitude:19.1025, longitude:72.8851, map_url:"https://www.google.com/maps/search/?api=1&query=Bosch+Home+Appliance+Service+Centre+Saki+Naka+Mumbai",                          warranty_label:"Bosch Home Warranty & Service",   warranty_url:"https://www.bosch-home.com/in/services/warranty.html" },
  { brand:"HP",        name:"HP Service Centre – Lower Parel",   address:"Kamala Mills Compound, Lower Parel",     area:"Lower Parel", city:"Mumbai", state:"Maharashtra", pincode:"400013", phone:"1800 108 4747",  email:"hp.support@hp.com",     latitude:18.9972, longitude:72.8310, map_url:"https://www.google.com/maps/search/?api=1&query=HP+Service+Centre+Kamala+Mills+Lower+Parel+Mumbai",                              warranty_label:"HP Warranty Check & Extend",      warranty_url:"https://support.hp.com/in-en/checkwarranty" },
  { brand:"Dell",      name:"Dell Exclusive Store & Service",    address:"Phoenix Marketcity, Kurla West",         area:"Kurla",       city:"Mumbai", state:"Maharashtra", pincode:"400070", phone:"1800 425 4051",  email:"dell.support@dell.com", latitude:19.0862, longitude:72.8793, map_url:"https://www.google.com/maps/search/?api=1&query=Dell+Exclusive+Store+Service+Phoenix+Marketcity+Kurla+Mumbai",                   warranty_label:"Dell Warranty Status & Renew",    warranty_url:"https://www.dell.com/en-in/lp/dt/dell-pro-support" },
  { brand:"OnePlus",   name:"OnePlus Service Centre – Andheri",  address:"Infinity Mall, Andheri West",            area:"Andheri",     city:"Mumbai", state:"Maharashtra", pincode:"400053", phone:"1800 102 8411",  email:"support@oneplus.com",   latitude:19.1362, longitude:72.8296, map_url:"https://www.google.com/maps/search/?api=1&query=OnePlus+Service+Centre+Infinity+Mall+Andheri+West+Mumbai",                       warranty_label:"OnePlus Warranty & Repair",       warranty_url:"https://www.oneplus.com/in/support/warranty" },
  { brand:"Xiaomi",    name:"Mi Service Centre – Dharavi",       address:"90 Feet Road, Dharavi",                  area:"Dharavi",     city:"Mumbai", state:"Maharashtra", pincode:"400017", phone:"1800 103 6286",  email:"support@mi.com",        latitude:19.0422, longitude:72.8553, map_url:"https://www.google.com/maps/search/?api=1&query=Mi+Xiaomi+Service+Centre+90+Feet+Road+Dharavi+Mumbai",                          warranty_label:"Xiaomi Mi Care Warranty",         warranty_url:"https://www.mi.com/in/service/warranty" },
  { brand:"Lenovo",    name:"Lenovo Authorised Service – BKC",   address:"G-Block, Bandra Kurla Complex",          area:"BKC",         city:"Mumbai", state:"Maharashtra", pincode:"400051", phone:"1800 3000 9990", email:"lenovo@support.com",    latitude:19.0596, longitude:72.8650, map_url:"https://www.google.com/maps/search/?api=1&query=Lenovo+Authorised+Service+Centre+Bandra+Kurla+Complex+Mumbai",                   warranty_label:"Lenovo Warranty Lookup & Extend", warranty_url:"https://pcsupport.lenovo.com/in/en/warrantylookup" },
];

// ─── Main ─────────────────────────────────────────────────────────────────────
console.log("=== WarrantyVault Database Setup ===\n");

// Step 1: Try Management API for DDL
console.log("Step 1: Creating schema via Management API…");
const mgmtRes = await fetch(`https://api.supabase.com/v1/projects/${PROJECT_REF}/database/query`, {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({ query: SCHEMA_SQL }),
});

if (mgmtRes.ok) {
  console.log("  ✓ Schema created via Management API\n");
} else {
  const err = await mgmtRes.text();
  console.log(`  ✗ Management API unavailable (needs PAT): ${mgmtRes.status}`);
  console.log("\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
  console.log("  ACTION REQUIRED: Run the schema SQL in Supabase Dashboard");
  console.log("  Dashboard → SQL Editor → paste contents of:");
  console.log("  scripts/schema.sql");
  console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n");

  // Write schema to a file for easy copy-paste
  const fs = await import("fs");
  fs.writeFileSync("scripts/schema.sql", SCHEMA_SQL);
  console.log("  schema.sql written — paste it in the SQL Editor, then re-run this script.\n");
  process.exit(1);
}

// Step 2: Seed service centers
console.log("Step 2: Seeding service centers…");
const { data: existing } = await supabase.from("service_centers").select("name");
const existingNames = new Set((existing ?? []).map((r) => r.name));
const toInsert = SERVICE_CENTERS.filter((c) => !existingNames.has(c.name));

if (toInsert.length === 0) {
  console.log("  ✓ All service centers already present\n");
} else {
  const { data, error } = await supabase.from("service_centers").insert(toInsert).select("brand, name");
  if (error) {
    console.error("  ✗ Seed failed:", error.message);
  } else {
    data.forEach((r) => console.log(`  ✓ ${r.brand} — ${r.name}`));
    console.log();
  }
}

console.log("=== Setup complete ===");
