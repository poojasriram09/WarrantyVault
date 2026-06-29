import { useState, useEffect } from "react";
import {
  ChevronRight, ChevronLeft, CheckCircle, Wrench,
  ExternalLink, RefreshCw, MapPin, Phone,
} from "lucide-react";
import { useTranslation } from "react-i18next";
import { useWarranties } from "../hooks/useWarranties";
import { useAuthStore } from "../stores/authStore";
import { claimService } from "../services/claim.service";
import { serviceCenterService } from "../services/serviceCenter.service";
import { Button } from "../components/ui/Button";
import { EmptyState } from "../components/ui/EmptyState";
import { Link } from "react-router-dom";
import toast from "react-hot-toast";

export default function ClaimAssistantPage() {
  const { warranties, loading } = useWarranties();
  const { dbUser } = useAuthStore();
  const { t } = useTranslation("claims");
  const { t: tc } = useTranslation("common");

  const [step, setStep] = useState(0);
  const [selected, setSelected] = useState(null);
  const [issue, setIssue] = useState({ summary: "", details: "" });
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const claimable = warranties.filter((w) => w.status !== "expired");
  const STEPS = [t("steps.selectProduct"), t("steps.describeIssue"), t("steps.reviewSubmit")];

  const [serviceCenters, setServiceCenters] = useState([]);
  const [loadingCenters, setLoadingCenters] = useState(false);

  useEffect(() => {
    if (step !== 2 || !selected?.products?.brand) return;
    setLoadingCenters(true);
    serviceCenterService
      .search({ brand: selected.products.brand })
      .then(setServiceCenters)
      .catch(() => setServiceCenters([]))
      .finally(() => setLoadingCenters(false));
  }, [step, selected?.products?.brand]);

  const warrantyLink =
    serviceCenters.find((c) => c.warranty_url && c.warranty_label) ?? null;
  const warrantyLinkNorm = warrantyLink
    ? { label: warrantyLink.warranty_label, url: warrantyLink.warranty_url }
    : null;

  async function handleSubmit() {
    if (!dbUser?.id) {
      toast.error(t("errors.sessionNotLoaded"));
      return;
    }
    if (!selected?.id) {
      toast.error(t("errors.noProduct"));
      return;
    }
    setSubmitting(true);
    try {
      await claimService.create({
        warrantyId: selected.id,
        userId: dbUser.id,
        issueSummary: issue.summary,
        issueDetails: issue.details,
      });
      setSubmitted(true);
    } catch (err) {
      console.error("Claim submit error:", err);
      const msg = err?.message || err?.details || err?.hint || JSON.stringify(err);
      toast.error(`Failed to submit claim: ${msg}`, { duration: 6000 });
    } finally {
      setSubmitting(false);
    }
  }

  function reset() {
    setStep(0);
    setSelected(null);
    setIssue({ summary: "", details: "" });
    setSubmitted(false);
  }

  // ── Success screen ──
  if (submitted) {
    return (
      <div className="max-w-lg mx-auto mt-16 text-center space-y-5">
        <div
          className="h-20 w-20 rounded-2xl flex items-center justify-center mx-auto"
          style={{
            background: "rgba(34,197,94,0.12)",
            border: "1px solid rgba(34,197,94,0.25)",
            boxShadow: "0 0 24px rgba(34,197,94,0.15)",
          }}
        >
          <CheckCircle size={36} style={{ color: "#4ade80" }} />
        </div>
        <div>
          <h2 className="text-xl font-bold text-white">{t("success.title")}</h2>
          <p className="text-sm text-slate-500 mt-2 leading-relaxed">
            {t("success.message", { product: selected.products?.product_name })}
          </p>
        </div>
        {warrantyLinkNorm && (
          <a
            href={warrantyLinkNorm.url}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold transition-all hover:opacity-80"
            style={{
              background: "rgba(16,185,129,0.1)",
              border: "1px solid rgba(16,185,129,0.25)",
              color: "#34d399",
            }}
          >
            <RefreshCw size={14} />
            {warrantyLinkNorm.label}
            <ExternalLink size={12} />
          </a>
        )}
        <div className="flex justify-center gap-3">
          <Button onClick={reset} variant="secondary">{t("success.newClaim")}</Button>
          <Link to="/warranties"><Button>{t("success.viewWarranties")}</Button></Link>
        </div>
      </div>
    );
  }

  // ── Step indicator ──
  const StepIndicator = () => (
    <div className="flex items-center gap-1 mb-8">
      {STEPS.map((label, i) => (
        <div key={i} className="flex items-center gap-1">
          <div className="flex items-center gap-2">
            <div
              className="h-7 w-7 rounded-full flex items-center justify-center text-xs font-bold shrink-0 transition-all"
              style={{
                background: i <= step ? "var(--accent)" : "transparent",
                border: `1px solid ${i <= step ? "var(--accent)" : "var(--border)"}`,
                color: i <= step ? "#fff" : "#475569",
              }}
            >
              {i < step ? <CheckCircle size={13} /> : i + 1}
            </div>
            <span
              className="text-sm font-medium whitespace-nowrap"
              style={{ color: i === step ? "#fff" : i < step ? "var(--accent-light)" : "#475569" }}
            >
              {label}
            </span>
          </div>
          {i < STEPS.length - 1 && (
            <div className="w-6 h-px mx-2 shrink-0" style={{ background: i < step ? "var(--accent)" : "var(--border)" }} />
          )}
        </div>
      ))}
    </div>
  );

  return (
    <div className="w-full max-w-4xl">
      <div className="mb-4">
        <h1 className="text-2xl font-bold text-white">{t("title")}</h1>
        <p className="text-sm text-slate-500 mt-0.5">{t("subtitle")}</p>
      </div>

      <StepIndicator />

      <div className="rounded-2xl p-4" style={{ backgroundColor: "var(--bg-card)", border: "1px solid var(--border)" }}>

        {/* Step 0: Product selector */}
        {step === 0 && (
          <div className="space-y-4">
            <div>
              <h2 className="text-base font-semibold text-white">{t("step1.heading")}</h2>
              <p className="text-sm text-slate-500 mt-0.5">{t("step1.hint")}</p>
            </div>

            {!loading && claimable.length === 0 ? (
              <EmptyState
                icon={Wrench}
                title={t("step1.emptyTitle")}
                description={t("step1.emptySubtitle")}
                action={<Link to="/add-product"><Button>{tc("nav.addProduct")}</Button></Link>}
              />
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-72 overflow-y-auto pr-1">
                {claimable.map((w) => {
                  const isActive = selected?.id === w.id;
                  return (
                    <button key={w.id} onClick={() => setSelected(w)}
                      className="w-full text-left rounded-xl px-4 py-3 transition-all"
                      style={{
                        background: isActive ? "rgba(124,58,237,0.12)" : "rgba(255,255,255,0.03)",
                        border: `1px solid ${isActive ? "var(--accent)" : "var(--border)"}`,
                      }}>
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm font-medium text-white">{w.products?.product_name}</p>
                          <p className="text-xs text-slate-500 mt-0.5">{w.products?.brand} · expires {w.end_date}</p>
                        </div>
                        <span className="text-xs font-medium px-2 py-0.5 rounded-full"
                          style={{
                            background: w.status === "expiring_soon" ? "rgba(245,158,11,0.12)" : "rgba(34,197,94,0.12)",
                            color: w.status === "expiring_soon" ? "#fbbf24" : "#4ade80",
                          }}>
                          {w.status === "expiring_soon" ? tc("status.expiring") : tc("status.active")}
                        </span>
                      </div>
                    </button>
                  );
                })}
              </div>
            )}

            <div className="flex justify-end pt-1">
              <Button disabled={!selected} onClick={() => setStep(1)}>
                {tc("actions.continue")} <ChevronRight size={15} />
              </Button>
            </div>
          </div>
        )}

        {/* Step 1: Issue description */}
        {step === 1 && (
          <div className="space-y-4">
            <div>
              <h2 className="text-base font-semibold text-white">{t("step2.heading")}</h2>
              <p className="text-sm text-slate-500 mt-0.5">
                {t("step2.product", { name: selected?.products?.product_name })}
              </p>
            </div>

            <div className="space-y-1.5">
              <label className="block text-sm font-medium text-slate-300">{t("step2.issueLabel")}</label>
              <input value={issue.summary} onChange={(e) => setIssue((p) => ({ ...p, summary: e.target.value }))}
                placeholder={t("step2.issuePh")}
                className="w-full text-sm text-white placeholder-slate-600 outline-none rounded-xl px-4 py-3 transition-all"
                style={{ backgroundColor: "rgba(255,255,255,0.04)", border: "1px solid var(--border)" }}
                onFocus={(e) => (e.target.style.borderColor = "rgba(124,58,237,0.5)")}
                onBlur={(e) => (e.target.style.borderColor = "var(--border)")} />
            </div>

            <div className="space-y-1.5">
              <label className="block text-sm font-medium text-slate-300">
                {t("step2.detailLabel")}
                <span className="text-slate-600 font-normal ml-1">{t("step2.optional")}</span>
              </label>
              <textarea value={issue.details} onChange={(e) => setIssue((p) => ({ ...p, details: e.target.value }))}
                rows={4} placeholder={t("step2.detailPh")}
                className="w-full text-sm text-white placeholder-slate-600 outline-none rounded-xl transition-all"
                style={{ backgroundColor: "rgba(255,255,255,0.04)", border: "1px solid var(--border)", padding: "10px 14px", resize: "vertical" }}
                onFocus={(e) => (e.target.style.borderColor = "rgba(124,58,237,0.5)")}
                onBlur={(e) => (e.target.style.borderColor = "var(--border)")} />
            </div>

            <div className="flex justify-between pt-1">
              <Button variant="secondary" onClick={() => setStep(0)}>
                <ChevronLeft size={15} /> {tc("actions.back")}
              </Button>
              <Button disabled={!issue.summary.trim()} onClick={() => setStep(2)}>
                {tc("actions.review")} <ChevronRight size={15} />
              </Button>
            </div>
          </div>
        )}

        {/* Step 2: Review & submit */}
        {step === 2 && (
          <div className="space-y-4">
            <div>
              <h2 className="text-base font-semibold text-white">{t("step3.heading")}</h2>
              <p className="text-sm text-slate-500 mt-0.5">{t("step3.hint")}</p>
            </div>

            <div className="rounded-xl divide-y" style={{ border: "1px solid var(--border)", divideColor: "var(--border)" }}>
              {[
                { label: t("step3.product"), value: selected?.products?.product_name },
                { label: t("step3.brand"), value: selected?.products?.brand },
                { label: t("step3.warrantyExpires"), value: selected?.end_date },
                { label: t("step3.issue"), value: issue.summary },
                { label: t("step3.details"), value: issue.details || t("step3.empty") },
              ].map(({ label, value }) => (
                <div key={label} className="flex gap-4 px-4 py-3" style={{ borderBottom: "1px solid var(--border)" }}>
                  <span className="text-xs text-slate-500 w-36 shrink-0 pt-0.5">{label}</span>
                  <span className="text-sm text-white leading-relaxed">{value}</span>
                </div>
              ))}
            </div>

            {/* AI tip */}
            <div className="rounded-xl px-4 py-3 text-sm"
              style={{ background: "rgba(124,58,237,0.08)", border: "1px solid rgba(124,58,237,0.2)" }}>
              <span style={{ color: "var(--accent-light)" }} className="font-medium">{t("step3.aiTip")}</span>
              <span className="text-slate-400">{t("step3.aiTipText")}</span>
            </div>

            {/* Warranty link */}
            {warrantyLinkNorm && (
              <div className="rounded-xl px-4 py-3 flex items-center justify-between gap-3"
                style={{ background: "rgba(16,185,129,0.07)", border: "1px solid rgba(16,185,129,0.2)" }}>
                <div className="flex items-center gap-2.5 min-w-0">
                  <RefreshCw size={14} style={{ color: "#34d399", flexShrink: 0 }} />
                  <div className="min-w-0">
                    <p className="text-xs font-semibold text-emerald-400">{t("step3.warrantyLink")}</p>
                    <p className="text-xs text-slate-500 truncate mt-0.5">{warrantyLinkNorm.label}</p>
                  </div>
                </div>
                <a href={warrantyLinkNorm.url} target="_blank" rel="noopener noreferrer"
                  className="flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-lg shrink-0 transition-all hover:opacity-80"
                  style={{ background: "rgba(16,185,129,0.15)", border: "1px solid rgba(16,185,129,0.3)", color: "#34d399" }}>
                  {t("step3.visitSite")} <ExternalLink size={11} />
                </a>
              </div>
            )}

            {/* Nearby service centers */}
            <div>
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-3">
                {t("step3.nearbyCenters")}
                {selected?.products?.brand ? ` ${t("step3.brandFilter", { brand: selected.products.brand })}` : ""}
              </p>

              {loadingCenters ? (
                <div className="flex items-center gap-2 text-xs text-slate-500 py-2">
                  <span className="animate-spin inline-block w-3 h-3 border border-slate-500 border-t-transparent rounded-full" />
                  {t("step3.loadingCenters")}
                </div>
              ) : serviceCenters.length === 0 ? (
                <p className="text-xs text-slate-600 py-2">{t("step3.noCenters")}</p>
              ) : (
                <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
                  {serviceCenters.map((c) => (
                    <div key={c.id} className="rounded-xl px-4 py-3 flex items-start justify-between gap-3"
                      style={{ background: "rgba(255,255,255,0.02)", border: "1px solid var(--border)" }}>
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-medium text-white truncate">{c.name}</p>
                        {c.address && (
                          <div className="flex items-start gap-1.5 mt-1">
                            <MapPin size={11} className="text-slate-500 mt-0.5 shrink-0" />
                            <p className="text-xs text-slate-500 leading-snug">
                              {c.address}{c.city ? `, ${c.city}` : ""}{c.pincode ? ` — ${c.pincode}` : ""}
                            </p>
                          </div>
                        )}
                        {c.phone && (
                          <div className="flex items-center gap-1.5 mt-1">
                            <Phone size={11} className="text-slate-500 shrink-0" />
                            <a href={`tel:${c.phone}`} className="text-xs text-slate-400 hover:text-white transition-colors">{c.phone}</a>
                          </div>
                        )}
                      </div>
                      <a
                        href={c.map_url || `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(`${c.name} ${c.address || ""} ${c.city || ""}`)}`}
                        target="_blank" rel="noopener noreferrer"
                        className="flex items-center gap-1 text-[11px] font-medium shrink-0 transition-colors hover:text-white"
                        style={{ color: "var(--accent-light)" }}>
                        <MapPin size={11} /> {t("step3.directions")}
                      </a>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="flex justify-between pt-1">
              <Button variant="secondary" onClick={() => setStep(1)}>
                <ChevronLeft size={15} /> {tc("actions.back")}
              </Button>
              <Button loading={submitting} onClick={handleSubmit}>{t("submit")}</Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
