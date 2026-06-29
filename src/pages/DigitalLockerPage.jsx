import { useState, useEffect, useCallback } from "react";
import { FileText, Download, ExternalLink, Search, Lock, Loader2, PlusCircle } from "lucide-react";
import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { supabase } from "../config/supabase";
import { useAuthStore } from "../stores/authStore";
import { Spinner } from "../components/ui/Spinner";
import { EmptyState } from "../components/ui/EmptyState";

const DOC_TYPE_KEYS = {
  receipt:   "filters.receipt",
  invoice:   "filters.invoice",
  manual:    "filters.manual",
  insurance: "filters.insurance",
  other:     "filters.other",
};

const DOC_TYPE_STYLE = {
  receipt:  { color: "#a78bfa", bg: "rgba(167,139,250,0.1)" },
  invoice:  { color: "#60a5fa", bg: "rgba(96,165,250,0.1)"  },
  manual:   { color: "#f59e0b", bg: "rgba(245,158,11,0.1)"  },
  insurance:{ color: "#f97316", bg: "rgba(249,115,22,0.1)"  },
  other:    { color: "#94a3b8", bg: "rgba(148,163,184,0.1)" },
};

const ALL_TYPES = ["all", "receipt", "invoice", "manual", "insurance", "other"];

function formatBytes(bytes) {
  if (!bytes) return null;
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
}

function formatDate(ts) {
  if (!ts) return null;
  return new Date(ts).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });
}

async function triggerDownload(url, filename) {
  try {
    const res = await fetch(url);
    if (!res.ok) throw new Error("fetch failed");
    const blob = await res.blob();
    const objectUrl = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = objectUrl;
    a.download = filename || "document";
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(objectUrl);
  } catch {
    window.open(url, "_blank", "noopener,noreferrer");
  }
}

function DocCard({ doc, t }) {
  const [downloading, setDownloading] = useState(false);
  const style = DOC_TYPE_STYLE[doc.doc_type] ?? DOC_TYPE_STYLE.other;
  const typeLabel = t(DOC_TYPE_KEYS[doc.doc_type] ?? "filters.other");
  const isPdf = doc.mime_type === "application/pdf" || doc.file_name?.toLowerCase().endsWith(".pdf");

  async function handleDownload() {
    setDownloading(true);
    await triggerDownload(doc.file_url, doc.file_name);
    setDownloading(false);
  }

  return (
    <div
      className="rounded-2xl p-4 flex flex-col gap-3 transition-all duration-200 hover:translate-y-[-2px]"
      style={{ backgroundColor: "var(--bg-card)", border: "1px solid var(--border)" }}
      onMouseEnter={(e) => (e.currentTarget.style.borderColor = "rgba(124,58,237,0.3)")}
      onMouseLeave={(e) => (e.currentTarget.style.borderColor = "var(--border)")}
    >
      <div className="flex items-start justify-between gap-2">
        <div
          className="h-11 w-11 rounded-xl flex items-center justify-center shrink-0"
          style={{ backgroundColor: style.bg, border: `1px solid ${style.color}30` }}
        >
          <FileText size={20} style={{ color: style.color }} />
        </div>
        <div className="flex items-center gap-1.5">
          {isPdf && (
            <span className="text-[10px] font-bold uppercase tracking-widest px-2 py-0.5 rounded-md"
              style={{ background: "rgba(239,68,68,0.12)", color: "#f87171" }}>
              {t("pdf")}
            </span>
          )}
          <span className="text-[10px] font-bold uppercase tracking-widest px-2 py-0.5 rounded-md"
            style={{ background: style.bg, color: style.color }}>
            {typeLabel}
          </span>
        </div>
      </div>

      <div className="min-w-0">
        <p className="text-sm font-semibold text-white leading-snug truncate">
          {doc.products?.product_name ?? t("unknownProduct")}
        </p>
        {doc.products?.brand && (
          <p className="text-xs text-slate-500 mt-0.5">{doc.products.brand}</p>
        )}
      </div>

      <div className="space-y-1 text-xs text-slate-500">
        {doc.file_name && <p className="truncate" title={doc.file_name}>{doc.file_name}</p>}
        <div className="flex items-center gap-2">
          {formatBytes(doc.file_size) && <span>{formatBytes(doc.file_size)}</span>}
          {doc.uploaded_at && <span className="ml-auto">{formatDate(doc.uploaded_at)}</span>}
        </div>
      </div>

      <div className="flex gap-2 mt-auto pt-1" style={{ borderTop: "1px solid var(--border)" }}>
        <a href={doc.file_url} target="_blank" rel="noopener noreferrer"
          className="flex-1 flex items-center justify-center gap-1.5 py-1.5 rounded-lg text-xs font-medium transition-all hover:opacity-80"
          style={{ background: "rgba(124,58,237,0.12)", color: "var(--accent-light)", border: "1px solid rgba(124,58,237,0.2)" }}>
          <ExternalLink size={11} /> {t("view")}
        </a>
        <button onClick={handleDownload} disabled={downloading}
          className="flex-1 flex items-center justify-center gap-1.5 py-1.5 rounded-lg text-xs font-medium transition-all hover:opacity-80 disabled:opacity-50"
          style={{ background: "rgba(255,255,255,0.04)", color: "#94a3b8", border: "1px solid var(--border)" }}>
          {downloading
            ? <><Loader2 size={11} className="animate-spin" /> {t("downloading")}</>
            : <><Download size={11} /> {t("download")}</>}
        </button>
      </div>
    </div>
  );
}

export default function DigitalLockerPage() {
  const { dbUser } = useAuthStore();
  const { t } = useTranslation("locker");
  const { t: tc } = useTranslation("common");
  const [docs, setDocs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState("all");

  const fetchDocs = useCallback(async () => {
    if (!dbUser?.id) return;
    setLoading(true);
    const { data, error } = await supabase
      .from("documents")
      .select("*, products(product_name, brand)")
      .eq("user_id", dbUser.id)
      .order("uploaded_at", { ascending: false });
    if (!error) setDocs(data ?? []);
    setLoading(false);
  }, [dbUser?.id]);

  useEffect(() => { fetchDocs(); }, [fetchDocs]);

  const filtered = docs.filter((d) => {
    const matchType = typeFilter === "all" || d.doc_type === typeFilter;
    const q = search.trim().toLowerCase();
    const matchSearch = !q
      || d.file_name?.toLowerCase().includes(q)
      || d.products?.product_name?.toLowerCase().includes(q)
      || d.products?.brand?.toLowerCase().includes(q)
      || d.doc_type?.toLowerCase().includes(q);
    return matchType && matchSearch;
  });

  const inputStyle = {
    backgroundColor: "var(--bg-card)",
    border: "1px solid var(--border)",
  };

  return (
    <div>
      <div className="mb-6 flex items-start justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white">{t("title")}</h1>
          <p className="text-sm text-slate-500 mt-0.5">{t("subtitle")}</p>
        </div>
        {docs.length > 0 && (
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium"
            style={{ background: "rgba(124,58,237,0.1)", border: "1px solid rgba(124,58,237,0.2)", color: "var(--accent-light)" }}>
            <Lock size={12} /> {t("docCount", { count: docs.length })}
          </div>
        )}
      </div>

      {!loading && docs.length > 0 && (
        <div className="flex flex-wrap gap-3 mb-6">
          <div className="relative">
            <Search size={13} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-600" />
            <input value={search} onChange={(e) => setSearch(e.target.value)}
              placeholder={t("searchPh")}
              className="pl-9 pr-4 py-2.5 text-sm text-white placeholder-slate-600 outline-none rounded-xl w-64"
              style={inputStyle}
              onFocus={(e) => (e.target.style.borderColor = "rgba(124,58,237,0.5)")}
              onBlur={(e) => (e.target.style.borderColor = "var(--border)")} />
          </div>
          <div className="flex gap-1 rounded-xl p-1"
            style={{ backgroundColor: "rgba(255,255,255,0.04)", border: "1px solid var(--border)" }}>
            {ALL_TYPES.map((tp) => (
              <button key={tp} onClick={() => setTypeFilter(tp)}
                className="px-3 py-1.5 rounded-lg text-xs font-medium capitalize transition-all"
                style={typeFilter === tp
                  ? { background: "linear-gradient(135deg, #7c3aed, #4f46e5)", color: "#fff" }
                  : { color: "#64748b" }}>
                {tp === "all" ? t("filters.all") : t(DOC_TYPE_KEYS[tp] ?? "filters.other")}
              </button>
            ))}
          </div>
        </div>
      )}

      {loading ? (
        <Spinner />
      ) : docs.length === 0 ? (
        <EmptyState icon={Lock} title={t("empty.title")} description={t("empty.subtitle")}
          action={
            <Link to="/add-product"
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold text-white btn-glow transition-all"
              style={{ background: "var(--accent)" }}>
              <PlusCircle size={15} /> {tc("nav.addProduct")}
            </Link>
          } />
      ) : filtered.length === 0 ? (
        <EmptyState icon={Search} title={t("noMatch.title")} description={t("noMatch.subtitle")} />
      ) : (
        <>
          <p className="text-xs text-slate-500 mb-4">
            {t("docCount", { count: filtered.length })}
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {filtered.map((doc) => <DocCard key={doc.id} doc={doc} t={t} />)}
          </div>
        </>
      )}
    </div>
  );
}
