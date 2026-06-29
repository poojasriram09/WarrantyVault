import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL = "https://gikwflwrlgltijamuqqc.supabase.co";
const SERVICE_ROLE_KEY =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imdpa3dmbHdybGdsdGlqYW11cXFjIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3MjYzMjE5MywiZXhwIjoyMDg4MjA4MTkzfQ.nDhMGsAxrdOnfb2bVAClIOx_dh-YhycFXFihXHk45l8";

const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY);

// Google Maps links using exact coordinates + place name for precision
const MAP_URLS = {
  "Samsung SmartCafé – Andheri":       "https://www.google.com/maps/search/?api=1&query=Samsung+SmartCafe+Andheri+West+Mumbai",
  "Samsung Service Centre – Dadar":    "https://www.google.com/maps/search/?api=1&query=Samsung+Service+Centre+Dadar+East+Mumbai",
  "Apple Authorised Service – Bandra": "https://www.google.com/maps/search/?api=1&query=Apple+Authorised+Service+Hill+Road+Bandra+West+Mumbai",
  "iCare Apple Service – Powai":       "https://www.google.com/maps/search/?api=1&query=Apple+Service+Centre+Hiranandani+Gardens+Powai+Mumbai",
  "LG Service Centre – Borivali":      "https://www.google.com/maps/search/?api=1&query=LG+Service+Centre+Chandavarkar+Road+Borivali+West+Mumbai",
  "LG Service Centre – Thane":         "https://www.google.com/maps/search/?api=1&query=LG+Service+Centre+Gokhale+Road+Naupada+Thane+West",
  "Sony Service Centre – Malad":       "https://www.google.com/maps/search/?api=1&query=Sony+Service+Centre+SV+Road+Malad+West+Mumbai",
  "Sony Authorised – Vashi":           "https://www.google.com/maps/search/?api=1&query=Sony+Authorised+Service+Centre+Sector+17+Vashi+Navi+Mumbai",
  "Whirlpool Service – Kandivali":     "https://www.google.com/maps/search/?api=1&query=Whirlpool+Service+Centre+Thakur+Village+Kandivali+East+Mumbai",
  "Bosch Home Appliance Service":      "https://www.google.com/maps/search/?api=1&query=Bosch+Home+Appliance+Service+Centre+Saki+Naka+Mumbai",
  "HP Service Centre – Lower Parel":   "https://www.google.com/maps/search/?api=1&query=HP+Service+Centre+Kamala+Mills+Lower+Parel+Mumbai",
  "Dell Exclusive Store & Service":    "https://www.google.com/maps/search/?api=1&query=Dell+Exclusive+Store+Service+Phoenix+Marketcity+Kurla+Mumbai",
  "OnePlus Service Centre – Andheri":  "https://www.google.com/maps/search/?api=1&query=OnePlus+Service+Centre+Infinity+Mall+Andheri+West+Mumbai",
  "Mi Service Centre – Dharavi":       "https://www.google.com/maps/search/?api=1&query=Mi+Xiaomi+Service+Centre+90+Feet+Road+Dharavi+Mumbai",
  "Lenovo Authorised Service – BKC":   "https://www.google.com/maps/search/?api=1&query=Lenovo+Authorised+Service+Centre+Bandra+Kurla+Complex+Mumbai",
};

let successCount = 0;
let failCount = 0;

for (const [name, map_url] of Object.entries(MAP_URLS)) {
  const { error } = await supabase
    .from("service_centers")
    .update({ map_url })
    .eq("name", name);

  if (error) {
    console.error(`  FAIL  ${name}:`, error.message);
    failCount++;
  } else {
    console.log(`  OK    ${name}`);
    successCount++;
  }
}

console.log(`\nDone: ${successCount} updated, ${failCount} failed`);
