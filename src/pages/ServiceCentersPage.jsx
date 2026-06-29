import { useState, useEffect } from "react";
import { MapPin, Phone, Mail, ExternalLink, Search, Building2, List, Map } from "lucide-react";
import { MapContainer, TileLayer, Marker, Popup } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { useTranslation } from "react-i18next";
import { serviceCenterService } from "../services/serviceCenter.service";
import { Spinner } from "../components/ui/Spinner";
import { EmptyState } from "../components/ui/EmptyState";

delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
  iconUrl:       "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  shadowUrl:     "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
});

const CITY_COORDS = {
  mumbai:[19.076,72.8777],delhi:[28.6139,77.209],bangalore:[12.9716,77.5946],bengaluru:[12.9716,77.5946],
  hyderabad:[17.385,78.4867],chennai:[13.0827,80.2707],kolkata:[22.5726,88.3639],pune:[18.5204,73.8567],
  ahmedabad:[23.0225,72.5714],jaipur:[26.9124,75.7873],surat:[21.1702,72.8311],lucknow:[26.8467,80.9462],
  chandigarh:[30.7333,76.7794],bhopal:[23.2599,77.4126],indore:[22.7196,75.8577],nagpur:[21.1458,79.0882],
  coimbatore:[11.0168,76.9558],kochi:[9.9312,76.2673],vizag:[17.6868,83.2185],noida:[28.5355,77.391],
};

function getCityCoords(cityStr = "") { return CITY_COORDS[cityStr.toLowerCase().trim()] || null; }
function jitter(coords, index) { return [coords[0] + Math.sin(index * 7) * 0.02, coords[1] + Math.cos(index * 5) * 0.02]; }

function CenterCard({ center, t }) {
  return (
    <div
      className="rounded-2xl p-5 flex flex-col gap-3 transition-all duration-200 hover:translate-y-[-2px]"
      style={{ backgroundColor: "var(--bg-card)", border: "1px solid var(--border)" }}
      onMouseEnter={(e) => (e.currentTarget.style.borderColor = "rgba(124,58,237,0.3)")}
      onMouseLeave={(e) => (e.currentTarget.style.borderColor = "var(--border)")}
    >
      <div>
        <span className="inline-block text-[10px] font-bold uppercase tracking-widest px-2 py-0.5 rounded-md mb-2"
          style={{ background: "rgba(124,58,237,0.15)", color: "var(--accent-light)" }}>
          {center.brand}
        </span>
        <h3 className="text-sm font-semibold text-white leading-snug">{center.name}</h3>
      </div>

      <div className="space-y-1.5 text-xs text-slate-400">
        {center.address && (
          <div className="flex gap-2 items-start">
            <MapPin size={12} className="mt-0.5 shrink-0" style={{ color: "var(--accent-light)" }} />
            <span>{center.address}{center.city ? `, ${center.city}` : ""}{center.pincode ? ` — ${center.pincode}` : ""}</span>
          </div>
        )}
        {center.phone && (
          <div className="flex gap-2 items-center">
            <Phone size={12} style={{ color: "var(--accent-light)" }} />
            <a href={`tel:${center.phone}`} className="hover:text-white transition-colors">{center.phone}</a>
          </div>
        )}
        {center.email && (
          <div className="flex gap-2 items-center">
            <Mail size={12} style={{ color: "var(--accent-light)" }} />
            <a href={`mailto:${center.email}`} className="hover:text-white transition-colors truncate">{center.email}</a>
          </div>
        )}
      </div>

      <div className="flex flex-wrap gap-3 mt-auto">
        {center.warranty_url && (
          <a href={center.warranty_url} target="_blank" rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 text-xs font-medium transition-colors hover:text-white"
            style={{ color: "#fbbf24" }}>
            <ExternalLink size={11} /> {center.warranty_label || t("warrantyInfo")}
          </a>
        )}
        {center.map_url ? (
          <a href={center.map_url} target="_blank" rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 text-xs font-medium transition-colors hover:text-white"
            style={{ color: "var(--accent-light)" }}>
            <ExternalLink size={11} /> {t("openInMaps")}
          </a>
        ) : center.address && (
          <a href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(`${center.name} ${center.address} ${center.city || ""}`)}`}
            target="_blank" rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 text-xs font-medium transition-colors hover:text-white"
            style={{ color: "var(--accent-light)" }}>
            <ExternalLink size={11} /> {t("getDirections")}
          </a>
        )}
      </div>
    </div>
  );
}

function CentersMap({ centers, city, t }) {
  const defaultCenter = [20.5937, 78.9629];
  const cityCoords = getCityCoords(city);
  const mapCenter = cityCoords || defaultCenter;
  const mapZoom = cityCoords ? 12 : 5;
  const plottable = centers.filter((c) => getCityCoords(c.city));

  return (
    <div className="rounded-2xl overflow-hidden" style={{ height: 480, border: "1px solid var(--border)" }}>
      <MapContainer center={mapCenter} zoom={mapZoom} style={{ height: "100%", width: "100%", background: "#0a0b1e" }} key={`${mapCenter}-${mapZoom}`}>
        <TileLayer url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png" attribution='&copy; <a href="https://carto.com/">CARTO</a>' />
        {plottable.map((c, i) => {
          const coords = jitter(getCityCoords(c.city), i);
          return (
            <Marker key={c.id} position={coords}>
              <Popup>
                <div style={{ minWidth: 160 }}>
                  <strong>{c.name}</strong><br />
                  <span style={{ color: "#7c3aed" }}>{c.brand}</span>
                  {c.address && <><br />{c.address}</>}
                  {c.city && <><br />{c.city}</>}
                  {c.phone && <><br /><a href={`tel:${c.phone}`}>{c.phone}</a></>}
                </div>
              </Popup>
            </Marker>
          );
        })}
      </MapContainer>
      {plottable.length === 0 && centers.length > 0 && (
        <div className="absolute inset-0 flex items-center justify-center" style={{ pointerEvents: "none" }}>
          <p className="text-slate-400 text-sm bg-black/60 px-4 py-2 rounded-xl">{t("mapHint")}</p>
        </div>
      )}
    </div>
  );
}

export default function ServiceCentersPage() {
  const { t } = useTranslation("serviceCenters");
  const [centers, setCenters] = useState([]);
  const [allCenters, setAllCenters] = useState([]);
  const [loading, setLoading] = useState(true);
  const [brand, setBrand] = useState("");
  const [area, setArea] = useState("");
  const [searched, setSearched] = useState(false);
  const [view, setView] = useState("list");

  const areas = [...new Set(allCenters.map((c) => c.area).filter(Boolean))].sort();

  useEffect(() => { load(); }, []);

  async function load(filters = {}) {
    setLoading(true);
    try {
      const data = await serviceCenterService.search(filters);
      setCenters(data);
      if (!filters.brand && !filters.area) setAllCenters(data);
    } catch { setCenters([]); }
    finally { setLoading(false); }
  }

  function handleSearch(e) { e.preventDefault(); setSearched(true); load({ brand, area }); }
  function handleClear() { setBrand(""); setArea(""); setSearched(false); load(); }

  const inputStyle = { backgroundColor: "var(--bg-card)", border: "1px solid var(--border)" };

  return (
    <div>
      <div className="mb-6 flex items-start justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white">{t("title")}</h1>
          <p className="text-sm text-slate-500 mt-0.5">{t("subtitle")}</p>
        </div>
        <div className="flex gap-1 rounded-xl p-1" style={{ backgroundColor: "rgba(255,255,255,0.04)", border: "1px solid var(--border)" }}>
          {[
            { id: "list", icon: List, label: t("listView") },
            { id: "map", icon: Map, label: t("mapView") },
          ].map(({ id, icon: Icon, label }) => (
            <button key={id} onClick={() => setView(id)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all"
              style={view === id ? { background: "linear-gradient(135deg, #7c3aed, #4f46e5)", color: "#fff" } : { color: "#64748b" }}>
              <Icon size={13} /> {label}
            </button>
          ))}
        </div>
      </div>

      <form onSubmit={handleSearch} className="flex flex-wrap gap-3 mb-6">
        <div className="relative">
          <Search size={13} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-600" />
          <input value={brand} onChange={(e) => setBrand(e.target.value)} placeholder={t("brandPh")}
            className="pl-9 pr-4 py-2.5 text-sm text-white placeholder-slate-600 outline-none rounded-xl w-52" style={inputStyle}
            onFocus={(e) => (e.target.style.borderColor = "rgba(124,58,237,0.5)")}
            onBlur={(e) => (e.target.style.borderColor = "var(--border)")} />
        </div>
        <div className="relative">
          <MapPin size={13} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-600 pointer-events-none" />
          <select value={area} onChange={(e) => setArea(e.target.value)}
            className="pl-9 pr-4 py-2.5 text-sm text-white outline-none rounded-xl w-52 appearance-none"
            style={{ ...inputStyle, color: area ? "#fff" : "#475569" }}>
            <option value="" style={{ backgroundColor: "#0f1029", color: "#94a3b8" }}>{t("allAreas")}</option>
            {areas.map((a) => <option key={a} value={a} style={{ backgroundColor: "#0f1029", color: "#fff" }}>{a}</option>)}
          </select>
        </div>
        <button type="submit" className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold text-white btn-glow transition-all"
          style={{ background: "var(--accent)" }}>
          <Search size={14} /> {t("search")}
        </button>
        {searched && (
          <button type="button" onClick={handleClear}
            className="px-4 py-2.5 rounded-xl text-sm font-medium text-slate-400 hover:text-white transition-colors"
            style={{ border: "1px solid var(--border)" }}>
            {t("clear")}
          </button>
        )}
      </form>

      {loading ? (
        <Spinner />
      ) : centers.length === 0 ? (
        <EmptyState icon={Building2}
          title={searched ? t("noResults") : t("empty")}
          description={searched ? t("noResultsHint") : t("emptyHint")} />
      ) : (
        <>
          {searched && (
            <p className="text-xs text-slate-500 mb-4">
              {t("resultCount", { count: centers.length })}
            </p>
          )}
          {view === "list" ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {centers.map((c) => <CenterCard key={c.id} center={c} t={t} />)}
            </div>
          ) : (
            <div className="relative">
              <CentersMap centers={centers} city="mumbai" t={t} />
              <p className="text-xs text-slate-600 mt-2 text-center">{t("mapAttribution")}</p>
            </div>
          )}
        </>
      )}
    </div>
  );
}
