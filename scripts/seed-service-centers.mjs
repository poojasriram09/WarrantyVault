import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL = "https://gikwflwrlgltijamuqqc.supabase.co";
const SERVICE_ROLE_KEY =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imdpa3dmbHdybGdsdGlqYW11cXFjIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3MjYzMjE5MywiZXhwIjoyMDg4MjA4MTkzfQ.nDhMGsAxrdOnfb2bVAClIOx_dh-YhycFXFihXHk45l8";

const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY);

const CENTERS = [
  { brand: "Samsung",   name: "Samsung SmartCafé – Andheri",       address: "Shop 4, Prem Plaza, Andheri West",       city: "Mumbai", state: "Maharashtra", pincode: "400058", phone: "1800 5 7267864", email: "support@samsung.com",   latitude: 19.1313, longitude: 72.8258 },
  { brand: "Samsung",   name: "Samsung Service Centre – Dadar",    address: "22, Govardhan Society, Dadar East",      city: "Mumbai", state: "Maharashtra", pincode: "400014", phone: "1800 5 7267864", email: "support@samsung.com",   latitude: 19.0178, longitude: 72.8478 },
  { brand: "Apple",     name: "Apple Authorised Service – Bandra", address: "Ground Floor, Hill Road, Bandra West",   city: "Mumbai", state: "Maharashtra", pincode: "400050", phone: "1800 2000 744",  email: "support@apple.com",     latitude: 19.0544, longitude: 72.8404 },
  { brand: "Apple",     name: "iCare Apple Service – Powai",       address: "Hiranandani Gardens, Powai",             city: "Mumbai", state: "Maharashtra", pincode: "400076", phone: "022-25701234",   email: "icare@example.com",     latitude: 19.1176, longitude: 72.9060 },
  { brand: "LG",        name: "LG Service Centre – Borivali",      address: "Shop 7, Chandavarkar Rd, Borivali West", city: "Mumbai", state: "Maharashtra", pincode: "400092", phone: "1800 315 9999",  email: "lgcare@lge.com",        latitude: 19.2307, longitude: 72.8567 },
  { brand: "LG",        name: "LG Service Centre – Thane",         address: "Gokhale Road, Naupada, Thane West",      city: "Mumbai", state: "Maharashtra", pincode: "400602", phone: "1800 315 9999",  email: "lgcare@lge.com",        latitude: 19.1972, longitude: 72.9700 },
  { brand: "Sony",      name: "Sony Service Centre – Malad",       address: "S.V. Road, Malad West",                  city: "Mumbai", state: "Maharashtra", pincode: "400064", phone: "1800 103 7799",  email: "sony.india@sony.com",   latitude: 19.1864, longitude: 72.8481 },
  { brand: "Sony",      name: "Sony Authorised – Vashi",           address: "Plot 17, Sector 17, Vashi, Navi Mumbai", city: "Mumbai", state: "Maharashtra", pincode: "400703", phone: "1800 103 7799",  email: "sony.india@sony.com",   latitude: 19.0771, longitude: 73.0071 },
  { brand: "Whirlpool", name: "Whirlpool Service – Kandivali",     address: "Thakur Village, Kandivali East",         city: "Mumbai", state: "Maharashtra", pincode: "400101", phone: "1800 208 1800",  email: "whirlpool@support.com", latitude: 19.2041, longitude: 72.8737 },
  { brand: "Bosch",     name: "Bosch Home Appliance Service",      address: "Kurla-Andheri Road, Saki Naka",          city: "Mumbai", state: "Maharashtra", pincode: "400072", phone: "1800 266 1880",  email: "contact@bosch.in",      latitude: 19.1025, longitude: 72.8851 },
  { brand: "HP",        name: "HP Service Centre – Lower Parel",   address: "Kamala Mills Compound, Lower Parel",     city: "Mumbai", state: "Maharashtra", pincode: "400013", phone: "1800 108 4747",  email: "hp.support@hp.com",     latitude: 18.9972, longitude: 72.8310 },
  { brand: "Dell",      name: "Dell Exclusive Store & Service",    address: "Phoenix Marketcity, Kurla West",         city: "Mumbai", state: "Maharashtra", pincode: "400070", phone: "1800 425 4051",  email: "dell.support@dell.com", latitude: 19.0862, longitude: 72.8793 },
  { brand: "OnePlus",   name: "OnePlus Service Centre – Andheri",  address: "Infinity Mall, Andheri West",            city: "Mumbai", state: "Maharashtra", pincode: "400053", phone: "1800 102 8411",  email: "support@oneplus.com",   latitude: 19.1362, longitude: 72.8296 },
  { brand: "Xiaomi",    name: "Mi Service Centre – Dharavi",       address: "90 Feet Road, Dharavi",                  city: "Mumbai", state: "Maharashtra", pincode: "400017", phone: "1800 103 6286",  email: "support@mi.com",        latitude: 19.0422, longitude: 72.8553 },
  { brand: "Lenovo",    name: "Lenovo Authorised Service – BKC",   address: "G-Block, Bandra Kurla Complex",          city: "Mumbai", state: "Maharashtra", pincode: "400051", phone: "1800 3000 9990", email: "lenovo@support.com",    latitude: 19.0596, longitude: 72.8650 },
];

// Check existing records to avoid duplicates
const { data: existing } = await supabase.from("service_centers").select("name");
const existingNames = new Set((existing ?? []).map((r) => r.name));

const toInsert = CENTERS.filter((c) => !existingNames.has(c.name));

if (toInsert.length === 0) {
  console.log("All service centers already exist — nothing to insert.");
  process.exit(0);
}

const { data, error } = await supabase.from("service_centers").insert(toInsert).select("id, brand, name");

if (error) {
  console.error("Insert failed:", error.message, error.details);
  process.exit(1);
}

console.log(`Inserted ${data.length} service centers:`);
data.forEach((r) => console.log(`  [${r.id}] ${r.brand} — ${r.name}`));
