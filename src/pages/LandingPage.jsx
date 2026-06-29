import { useEffect, useRef, useState, useCallback } from "react";
import { Link, Navigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { useAuthStore } from "../stores/authStore";
import { isAdminEmail } from "../utils/adminGuard";
import LanguageSwitcher from "../components/layout/LanguageSwitcher";
import {
  Zap,
  Bell,
  FileSearch,
  MapPin,
  Bot,
  ChevronRight,
  ArrowRight,
  Upload,
  Clock,
  TrendingUp,
  Lock,
  Sparkles,
  Menu,
  X,
  Shield,
  ScanLine,
  BellRing,
  Cpu,
  MapPinned,
  BarChart3,
  Check,
  Crown,
} from "lucide-react";

/* ─── Intersection observer hook ─────────────────────────── */
function useInView(threshold = 0.15) {
  const ref = useRef(null);
  const [inView, setInView] = useState(false);
  useEffect(() => {
    const obs = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) setInView(true);
      },
      { threshold },
    );
    if (ref.current) obs.observe(ref.current);
    return () => obs.disconnect();
  }, [threshold]);
  return [ref, inView];
}

/* ─── Animated counter ───────────────────────────────────── */
function AnimCounter({ end, duration = 2000, suffix = "", inView }) {
  const [count, setCount] = useState(0);
  useEffect(() => {
    if (!inView) return;
    let start = 0;
    const step = end / (duration / 16);
    const timer = setInterval(() => {
      start += step;
      if (start >= end) {
        setCount(end);
        clearInterval(timer);
      } else setCount(Math.floor(start));
    }, 16);
    return () => clearInterval(timer);
  }, [inView, end, duration]);
  return (
    <>
      {count.toLocaleString()}
      {suffix}
    </>
  );
}

/* ─── Mouse parallax hook ────────────────────────────────── */
function useParallax(intensity = 0.02) {
  const ref = useRef(null);
  const [offset, setOffset] = useState({ x: 0, y: 0 });
  useEffect(() => {
    const handler = (e) => {
      if (!ref.current) return;
      const rect = ref.current.getBoundingClientRect();
      const cx = rect.left + rect.width / 2;
      const cy = rect.top + rect.height / 2;
      setOffset({
        x: (e.clientX - cx) * intensity,
        y: (e.clientY - cy) * intensity,
      });
    };
    window.addEventListener("mousemove", handler);
    return () => window.removeEventListener("mousemove", handler);
  }, [intensity]);
  return [ref, offset];
}

/* ─── Particle field (canvas) ────────────────────────────── */
function ParticleCanvas() {
  const canvasRef = useRef(null);
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    let animId;
    let particles = [];
    const resize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };
    resize();
    window.addEventListener("resize", resize);

    for (let i = 0; i < 60; i++) {
      particles.push({
        x: Math.random() * canvas.width,
        y: Math.random() * canvas.height,
        vx: (Math.random() - 0.5) * 0.3,
        vy: (Math.random() - 0.5) * 0.3,
        r: Math.random() * 1.5 + 0.5,
        o: Math.random() * 0.4 + 0.1,
      });
    }

    function draw() {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      particles.forEach((p) => {
        p.x += p.vx;
        p.y += p.vy;
        if (p.x < 0) p.x = canvas.width;
        if (p.x > canvas.width) p.x = 0;
        if (p.y < 0) p.y = canvas.height;
        if (p.y > canvas.height) p.y = 0;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(167, 139, 250, ${p.o})`;
        ctx.fill();
      });
      // Draw connections
      for (let i = 0; i < particles.length; i++) {
        for (let j = i + 1; j < particles.length; j++) {
          const dx = particles[i].x - particles[j].x;
          const dy = particles[i].y - particles[j].y;
          const dist = Math.sqrt(dx * dx + dy * dy);
          if (dist < 120) {
            ctx.beginPath();
            ctx.moveTo(particles[i].x, particles[i].y);
            ctx.lineTo(particles[j].x, particles[j].y);
            ctx.strokeStyle = `rgba(124, 58, 237, ${0.08 * (1 - dist / 120)})`;
            ctx.lineWidth = 0.5;
            ctx.stroke();
          }
        }
      }
      animId = requestAnimationFrame(draw);
    }
    draw();
    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener("resize", resize);
    };
  }, []);
  return (
    <canvas
      ref={canvasRef}
      className="fixed inset-0 pointer-events-none"
      style={{ zIndex: 0, opacity: 0.7 }}
    />
  );
}

/* ─── Feature card ───────────────────────────────────────── */
function FeatureCard({
  icon: Icon,
  title,
  desc,
  delay,
  inView,
  accent,
  index,
}) {
  const [hovered, setHovered] = useState(false);
  return (
    <div
      style={{
        opacity: inView ? 1 : 0,
        transform: inView
          ? "translateY(0) scale(1)"
          : "translateY(50px) scale(0.95)",
        transition: `all 0.7s cubic-bezier(0.16, 1, 0.3, 1) ${delay}ms`,
      }}
    >
      <div
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
        style={{
          background: hovered
            ? `linear-gradient(135deg, ${accent.from}, ${accent.to})`
            : `linear-gradient(135deg, ${accent.from}44, ${accent.to}22)`,
          padding: "1px",
          borderRadius: "24px",
          transition: "all 0.5s cubic-bezier(0.16, 1, 0.3, 1)",
          boxShadow: hovered
            ? `0 8px 40px ${accent.glow}, 0 0 0 1px ${accent.from}44`
            : "none",
        }}
      >
        <div
          style={{
            background: hovered
              ? "rgba(6, 6, 20, 0.88)"
              : "rgba(6, 6, 20, 0.95)",
            backdropFilter: "blur(40px)",
            borderRadius: "23px",
            padding: "2rem",
            position: "relative",
            overflow: "hidden",
            transform: hovered ? "scale(1.02)" : "scale(1)",
            transition: "all 0.5s cubic-bezier(0.16, 1, 0.3, 1)",
            minHeight: "220px",
          }}
        >
          {/* Sweep beam */}
          <div
            style={{
              position: "absolute",
              top: 0,
              left: hovered ? "150%" : "-100%",
              width: "60%",
              height: "100%",
              background: `linear-gradient(105deg, transparent 30%, ${accent.from}15 50%, transparent 70%)`,
              transition: "left 0.8s cubic-bezier(0.16, 1, 0.3, 1)",
              pointerEvents: "none",
            }}
          />

          {/* Icon */}
          <div
            style={{
              position: "relative",
              marginBottom: "1.5rem",
              display: "inline-block",
            }}
          >
            <div
              style={{
                position: "absolute",
                inset: "-12px",
                borderRadius: "50%",
                background: `radial-gradient(circle, ${accent.glow} 0%, transparent 70%)`,
                opacity: hovered ? 0.8 : 0.3,
                transition: "opacity 0.5s",
                filter: "blur(12px)",
                pointerEvents: "none",
              }}
            />
            <div
              style={{
                width: 64,
                height: 64,
                borderRadius: "18px",
                background: `linear-gradient(135deg, ${accent.from}25, ${accent.to}12)`,
                border: `1px solid ${accent.from}50`,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                position: "relative",
                boxShadow: hovered ? `0 0 30px ${accent.glow}` : "none",
                transition: "box-shadow 0.5s",
              }}
            >
              <Icon size={28} style={{ color: accent.light }} />
            </div>
          </div>

          <h3
            style={{
              color: "#fff",
              fontWeight: 700,
              fontSize: "1.1rem",
              marginBottom: "0.6rem",
              letterSpacing: "-0.01em",
            }}
          >
            {title}
          </h3>
          <p
            style={{
              color: "#64748b",
              fontSize: "0.875rem",
              lineHeight: 1.7,
              margin: 0,
            }}
          >
            {desc}
          </p>
        </div>
      </div>
    </div>
  );
}

/* ─── MAIN LANDING PAGE ─────────────────────────────────── */
export default function LandingPage() {
  const { user, loading, dbUser } = useAuthStore();
  const { t } = useTranslation("landing");
  const [mobileOpen, setMobileOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [heroReady, setHeroReady] = useState(false);

  const [featRef, featInView] = useInView(0.08);
  const [statsRef, statsInView] = useInView(0.3);
  const [stepsRef, stepsInView] = useInView(0.15);
  const [pricingRef, pricingInView] = useInView(0.1);
  const [ctaRef, ctaInView] = useInView(0.2);
  const [heroParallaxRef, heroOffset] = useParallax(0.015);

  useEffect(() => {
    const t = setTimeout(() => setHeroReady(true), 150);
    const onScroll = () => setScrolled(window.scrollY > 30);
    window.addEventListener("scroll", onScroll);
    return () => {
      clearTimeout(t);
      window.removeEventListener("scroll", onScroll);
    };
  }, []);

  if (!loading && user) {
    return (
      <Navigate
        to={dbUser && isAdminEmail(dbUser.email) ? "/admin" : "/dashboard"}
        replace
      />
    );
  }

  const ACCENTS = [
    {
      from: "#7c3aed",
      to: "#a78bfa",
      glow: "rgba(124,58,237,0.45)",
      light: "#a78bfa",
    },
    {
      from: "#f59e0b",
      to: "#fbbf24",
      glow: "rgba(245,158,11,0.4)",
      light: "#fcd34d",
    },
    {
      from: "#06b6d4",
      to: "#22d3ee",
      glow: "rgba(6,182,212,0.4)",
      light: "#22d3ee",
    },
    {
      from: "#10b981",
      to: "#34d399",
      glow: "rgba(16,185,129,0.4)",
      light: "#34d399",
    },
    {
      from: "#6366f1",
      to: "#818cf8",
      glow: "rgba(99,102,241,0.4)",
      light: "#a5b4fc",
    },
    {
      from: "#ec4899",
      to: "#f472b6",
      glow: "rgba(236,72,153,0.4)",
      light: "#f9a8d4",
    },
  ];

  const features = [
    { icon: ScanLine, title: t("features.ocrTitle"), desc: t("features.ocrDesc"), accent: ACCENTS[0] },
    { icon: BellRing, title: t("features.reminderTitle"), desc: t("features.reminderDesc"), accent: ACCENTS[1] },
    { icon: Cpu, title: t("features.claimTitle"), desc: t("features.claimDesc"), accent: ACCENTS[2] },
    { icon: MapPinned, title: t("features.mapTitle"), desc: t("features.mapDesc"), accent: ACCENTS[3] },
    { icon: Lock, title: t("features.lockerTitle"), desc: t("features.lockerDesc"), accent: ACCENTS[4] },
    { icon: BarChart3, title: t("features.analyticsTitle"), desc: t("features.analyticsDesc"), accent: ACCENTS[5] },
  ];

  const stats = [
    { value: 2847, suffix: "+", label: "Warranties Tracked" },
    { value: 98, suffix: "%", label: "OCR Accuracy" },
    { value: 524, suffix: "+", label: "Claims Filed" },
    { value: 15, suffix: "s", label: "Avg. Scan Time" },
  ];

  return (
    <div className="min-h-screen" style={{ background: "#030014" }}>
      <ParticleCanvas />

      {/* ── Gradient Orbs ── */}
      <div
        className="fixed inset-0 pointer-events-none overflow-hidden"
        style={{ zIndex: 0 }}
      >
        <div
          style={{
            position: "absolute",
            top: "-25%",
            left: "-15%",
            width: "55vw",
            height: "55vw",
            borderRadius: "50%",
            background:
              "radial-gradient(circle, rgba(124,58,237,0.15) 0%, transparent 65%)",
            animation: "orbDrift1 18s ease-in-out infinite",
            filter: "blur(40px)",
          }}
        />
        <div
          style={{
            position: "absolute",
            top: "25%",
            right: "-20%",
            width: "50vw",
            height: "50vw",
            borderRadius: "50%",
            background:
              "radial-gradient(circle, rgba(59,130,246,0.1) 0%, transparent 65%)",
            animation: "orbDrift2 22s ease-in-out infinite",
            filter: "blur(50px)",
          }}
        />
        <div
          style={{
            position: "absolute",
            bottom: "-10%",
            left: "30%",
            width: "45vw",
            height: "45vw",
            borderRadius: "50%",
            background:
              "radial-gradient(circle, rgba(168,85,247,0.08) 0%, transparent 65%)",
            animation: "orbDrift1 25s ease-in-out infinite reverse",
            filter: "blur(60px)",
          }}
        />
        {/* Noise grain overlay */}
        <div
          style={{
            position: "absolute",
            inset: 0,
            backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)' opacity='0.04'/%3E%3C/svg%3E")`,
            opacity: 0.5,
          }}
        />
      </div>

      {/* ── Keyframes ── */}
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;500;600;700;800;900&family=JetBrains+Mono:wght@400;500&display=swap');

        @keyframes orbDrift1 {
          0%, 100% { transform: translate(0, 0) scale(1); }
          33% { transform: translate(4%, 6%) scale(1.06); }
          66% { transform: translate(-3%, 4%) scale(0.96); }
        }
        @keyframes orbDrift2 {
          0%, 100% { transform: translate(0, 0) scale(1); }
          50% { transform: translate(-5%, 7%) scale(1.1); }
        }
        @keyframes heroReveal {
          from { opacity: 0; transform: translateY(40px) scale(0.97); filter: blur(8px); }
          to { opacity: 1; transform: translateY(0) scale(1); filter: blur(0); }
        }
        @keyframes shimmerFlow {
          0% { background-position: -300% center; }
          100% { background-position: 300% center; }
        }
        @keyframes pulseGlow {
          0%, 100% { box-shadow: 0 0 20px rgba(124,58,237,0.4), 0 0 60px rgba(124,58,237,0.15); }
          50% { box-shadow: 0 0 40px rgba(124,58,237,0.6), 0 0 100px rgba(124,58,237,0.25); }
        }
        @keyframes float3d {
          0%, 100% { transform: translateY(0px) rotateX(0deg) rotateY(0deg); }
          25% { transform: translateY(-8px) rotateX(1deg) rotateY(-1deg); }
          50% { transform: translateY(-14px) rotateX(0deg) rotateY(1deg); }
          75% { transform: translateY(-6px) rotateX(-1deg) rotateY(0deg); }
        }
        @keyframes float3d2 {
          0%, 100% { transform: translateY(0px) rotateX(0deg); }
          50% { transform: translateY(-10px) rotateX(1.5deg); }
        }
        @keyframes borderRotate {
          0% { background-position: 0% 50%; }
          100% { background-position: 200% 50%; }
        }
        @keyframes slideConnector {
          from { width: 0; }
          to { width: 100%; }
        }
        @keyframes countPulse {
          0%, 100% { transform: scale(1); }
          50% { transform: scale(1.05); }
        }
        @keyframes stepPulse {
          0%, 100% { transform: scale(1); box-shadow: 0 0 30px rgba(124,58,237,0.4), 0 0 60px rgba(124,58,237,0.15); }
          50% { transform: scale(1.1); box-shadow: 0 0 40px rgba(124,58,237,0.6), 0 0 80px rgba(124,58,237,0.3); }
        }
        .font-outfit { font-family: 'Outfit', sans-serif; }
        .font-mono { font-family: 'JetBrains Mono', monospace; }
        .shimmer-gradient {
          background: linear-gradient(90deg, #7c3aed 0%, #60a5fa 25%, #a78bfa 50%, #60a5fa 75%, #7c3aed 100%);
          background-size: 300% auto;
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
          animation: shimmerFlow 5s linear infinite;
        }
        .glass-morphism {
          background: rgba(6, 6, 20, 0.6);
          backdrop-filter: blur(24px);
          -webkit-backdrop-filter: blur(24px);
          border: 1px solid rgba(255,255,255,0.06);
        }
        .glow-button {
          animation: pulseGlow 3s ease-in-out infinite;
          transition: all 0.3s cubic-bezier(0.16, 1, 0.3, 1);
        }
        .glow-button:hover {
          transform: translateY(-2px) scale(1.03);
          box-shadow: 0 0 50px rgba(124,58,237,0.7), 0 0 120px rgba(124,58,237,0.3) !important;
        }
      `}</style>

      {/* ── NAVBAR ── */}
      <nav
        className="fixed top-0 left-0 right-0 z-50 transition-all duration-500 font-outfit"
        style={{
          background: scrolled ? "rgba(3,0,20,0.8)" : "transparent",
          backdropFilter: scrolled ? "blur(24px)" : "none",
          borderBottom: scrolled ? "1px solid rgba(255,255,255,0.05)" : "none",
        }}
      >
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <img
              src="/logo.png"
              alt="WarrantyVault"
              className="w-8 h-8 rounded-lg object-cover"
            />
            <span className="text-white font-bold text-lg tracking-tight">
              Warranty<span className="shimmer-gradient">Vault</span>
            </span>
          </div>

          <div className="hidden md:flex items-center gap-8">
            {[
              { href: "#features", label: t("navbar.features") },
              { href: "#how-it-works", label: t("navbar.howItWorks") },
              { href: "#pricing", label: t("navbar.pricing") },
            ].map((item) => (
              <a
                key={item.href}
                href={item.href}
                className="text-slate-500 hover:text-white text-sm transition-all duration-300 hover:tracking-wide"
              >
                {item.label}
              </a>
            ))}
          </div>

          <div className="hidden md:flex items-center gap-3">
            <LanguageSwitcher compact />
            <Link
              to="/login"
              className="text-slate-400 hover:text-white text-sm transition-colors px-4 py-2"
            >
              {t("navbar.signIn")}
            </Link>
            <Link
              to="/signup"
              className="glow-button flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold text-white"
              style={{
                background: "linear-gradient(135deg, #7c3aed, #6d28d9)",
              }}
            >
              {t("navbar.getStarted")} <ChevronRight size={14} />
            </Link>
          </div>

          <button
            className="md:hidden text-slate-400 hover:text-white transition-colors"
            onClick={() => setMobileOpen(!mobileOpen)}
          >
            {mobileOpen ? <X size={22} /> : <Menu size={22} />}
          </button>
        </div>

        {mobileOpen && (
          <div className="md:hidden px-6 pb-6 flex flex-col gap-4 glass-morphism">
            {[
              { href: "#features", label: t("navbar.features") },
              { href: "#how-it-works", label: t("navbar.howItWorks") },
              { href: "#pricing", label: t("navbar.pricing") },
            ].map((item) => (
              <a
                key={item.href}
                href={item.href}
                className="text-slate-400 text-sm py-1"
                onClick={() => setMobileOpen(false)}
              >
                {item.label}
              </a>
            ))}
            <div className="py-2">
              <LanguageSwitcher />
            </div>
            <div
              className="flex flex-col gap-2 pt-2"
              style={{ borderTop: "1px solid rgba(255,255,255,0.06)" }}
            >
              <Link to="/login" className="text-slate-300 text-sm py-2">
                {t("navbar.signIn")}
              </Link>
              <Link
                to="/signup"
                className="px-5 py-3 rounded-xl text-sm font-semibold text-white text-center"
                style={{
                  background: "linear-gradient(135deg, #7c3aed, #6d28d9)",
                }}
              >
                {t("navbar.getStarted")}
              </Link>
            </div>
          </div>
        )}
      </nav>

      {/* ── HERO ── */}
      <section
        className="relative z-10 pt-36 pb-28 px-6 max-w-7xl mx-auto font-outfit"
        ref={heroParallaxRef}
      >
        <div className="flex flex-col lg:flex-row items-center gap-20">
          {/* Left */}
          <div
            className="flex-1 flex flex-col gap-7 max-w-2xl"
            style={{
              opacity: heroReady ? 1 : 0,
              transform: heroReady ? "translateY(0)" : "translateY(40px)",
              filter: heroReady ? "blur(0)" : "blur(8px)",
              transition: "all 1s cubic-bezier(0.16, 1, 0.3, 1)",
            }}
          >
            {/* Badge */}
            <div
              className="inline-flex items-center gap-2 w-fit px-4 py-2 rounded-full text-xs font-medium"
              style={{
                background: "rgba(124,58,237,0.1)",
                border: "1px solid rgba(124,58,237,0.25)",
                color: "#a78bfa",
                animationDelay: "0.2s",
                opacity: heroReady ? 1 : 0,
                transform: heroReady ? "translateY(0)" : "translateY(20px)",
                transition: "all 0.8s cubic-bezier(0.16, 1, 0.3, 1) 0.2s",
              }}
            >
              <Sparkles size={12} />
              {t("hero.badge")}
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
            </div>

            {/* Headline */}
            <h1
              style={{
                fontSize: "clamp(2.8rem, 6vw, 4.5rem)",
                fontWeight: 900,
                lineHeight: 1.05,
                letterSpacing: "-0.03em",
                opacity: heroReady ? 1 : 0,
                transform: heroReady ? "translateY(0)" : "translateY(30px)",
                transition: "all 1s cubic-bezier(0.16, 1, 0.3, 1) 0.3s",
              }}
            >
              <span style={{ color: "#e2e8f0" }}>{t("hero.heading1")}</span>
              <br />
              <span style={{ color: "#e2e8f0" }}>{t("hero.heading2")}</span>
              <span className="shimmer-gradient">{t("hero.heading3")}</span>
            </h1>

            {/* Sub */}
            <p
              style={{
                color: "#64748b",
                fontSize: "1.15rem",
                lineHeight: 1.7,
                maxWidth: "520px",
                opacity: heroReady ? 1 : 0,
                transform: heroReady ? "translateY(0)" : "translateY(20px)",
                transition: "all 1s cubic-bezier(0.16, 1, 0.3, 1) 0.5s",
              }}
            >
              {t("hero.sub")}
            </p>

            {/* CTAs */}
            <div
              className="flex flex-wrap gap-4 items-center"
              style={{
                opacity: heroReady ? 1 : 0,
                transform: heroReady ? "translateY(0)" : "translateY(20px)",
                transition: "all 1s cubic-bezier(0.16, 1, 0.3, 1) 0.65s",
              }}
            >
              <Link
                to="/signup"
                className="glow-button flex items-center gap-2.5 px-8 py-4 rounded-2xl font-bold text-white text-base"
                style={{
                  background:
                    "linear-gradient(135deg, #7c3aed 0%, #4f46e5 50%, #6d28d9 100%)",
                }}
              >
                {t("hero.cta")} <ArrowRight size={18} />
              </Link>
              <Link
                to="/login"
                className="flex items-center gap-2 px-7 py-4 rounded-2xl font-semibold text-sm transition-all duration-300 hover:border-purple-500/40 hover:text-white"
                style={{
                  border: "1px solid rgba(255,255,255,0.08)",
                  color: "#94a3b8",
                  background: "rgba(255,255,255,0.02)",
                }}
              >
                {t("hero.altCta")}
              </Link>
            </div>

            {/* Trust */}
            {/* <div
              className="flex items-center gap-6 pt-3"
              style={{
                opacity: heroReady ? 1 : 0,
                transition: "all 1s ease 0.8s",
              }}
            >
              {["Free forever", "No credit card", "60s setup"].map((t) => (
                <div
                  key={t}
                  className="flex items-center gap-1.5 text-xs"
                  style={{ color: "#475569" }}
                >
                  <div className="w-1 h-1 rounded-full bg-emerald-500" />
                  {t}
                </div>
              ))}
            </div> */}
          </div>

          {/* Right — Floating 3D cards */}
          <div
            className="flex-1 relative w-full max-w-lg min-h-[460px] hidden lg:block"
            style={{
              opacity: heroReady ? 1 : 0,
              transform: heroReady
                ? `translateX(0) translate3d(${heroOffset.x}px, ${heroOffset.y}px, 0)`
                : "translateX(60px)",
              transition: heroReady
                ? "opacity 1.2s ease 0.4s"
                : "all 1.2s cubic-bezier(0.16, 1, 0.3, 1) 0.4s",
              perspective: "1000px",
            }}
          >
            {/* Main warranty card */}
            <div
              className="absolute top-6 left-0 w-[290px] rounded-2xl p-5 glass-morphism"
              style={{
                boxShadow:
                  "0 8px 40px rgba(124,58,237,0.15), 0 0 0 1px rgba(124,58,237,0.1)",
                animation: "float3d 7s ease-in-out infinite",
              }}
            >
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div
                    className="w-10 h-10 rounded-xl flex items-center justify-center text-lg"
                    style={{ background: "rgba(124,58,237,0.15)" }}
                  >
                    📱
                  </div>
                  <div>
                    <div className="text-white font-semibold text-sm">
                      Samsung Galaxy S24
                    </div>
                    <div className="text-slate-600 text-xs font-mono">
                      Electronics
                    </div>
                  </div>
                </div>
                <span
                  className="px-2.5 py-1 rounded-full text-[10px] font-bold tracking-wider uppercase"
                  style={{
                    background: "rgba(52,211,153,0.1)",
                    color: "#34d399",
                    border: "1px solid rgba(52,211,153,0.2)",
                  }}
                >
                  Active
                </span>
              </div>
              <div
                style={{
                  height: 1,
                  background: "rgba(255,255,255,0.05)",
                  margin: "0 0 14px",
                }}
              />
              <div className="flex justify-between text-xs mb-4">
                <div>
                  <div className="text-slate-600 mb-1">Purchased</div>
                  <div className="text-white font-medium">Jan 15, 2025</div>
                </div>
                <div>
                  <div className="text-slate-600 mb-1">Expires</div>
                  <div style={{ color: "#a78bfa" }} className="font-medium">
                    Jan 15, 2026
                  </div>
                </div>
                <div>
                  <div className="text-slate-600 mb-1">Days Left</div>
                  <div className="text-white font-bold font-mono">316</div>
                </div>
              </div>
              <div
                className="h-1.5 rounded-full"
                style={{ background: "rgba(255,255,255,0.06)" }}
              >
                <div
                  className="h-1.5 rounded-full"
                  style={{
                    width: "13%",
                    background: "linear-gradient(90deg, #7c3aed, #60a5fa)",
                  }}
                />
              </div>
            </div>

            {/* Notification card */}
            <div
              className="absolute top-2 right-0 w-[240px] rounded-xl p-4 glass-morphism flex items-center gap-3"
              style={{
                boxShadow: "0 8px 30px rgba(251,146,60,0.1)",
                animation: "float3d2 8s ease-in-out 0.5s infinite",
              }}
            >
              <div
                className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
                style={{
                  background: "rgba(251,146,60,0.12)",
                  border: "1px solid rgba(251,146,60,0.2)",
                }}
              >
                <Bell size={16} className="text-orange-400" />
              </div>
              <div>
                <div className="text-white text-xs font-semibold">
                  Warranty Expiring!
                </div>
                <div className="text-slate-500 text-xs mt-0.5 font-mono">
                  Sony TV · 7 days left
                </div>
              </div>
            </div>

            {/* OCR card */}
            <div
              className="absolute bottom-16 right-4 w-[230px] rounded-xl p-4 glass-morphism"
              style={{
                boxShadow: "0 8px 30px rgba(96,165,250,0.08)",
                animation: "float3d 9s ease-in-out 1s infinite",
              }}
            >
              <div className="flex items-center gap-2 mb-3">
                <FileSearch size={14} className="text-blue-400" />
                <span className="text-blue-400 text-xs font-semibold">
                  OCR Complete
                </span>
                <span
                  className="ml-auto text-[10px] px-2 py-0.5 rounded-full font-mono"
                  style={{
                    background: "rgba(52,211,153,0.1)",
                    color: "#34d399",
                  }}
                >
                  98%
                </span>
              </div>
              {[
                { l: "Brand", v: "Apple Inc." },
                { l: "Date", v: "Mar 12, 2025" },
                { l: "Amount", v: "₹1,29,900" },
              ].map(({ l, v }) => (
                <div
                  key={l}
                  className="flex justify-between text-xs py-1.5"
                  style={{ borderTop: "1px solid rgba(255,255,255,0.03)" }}
                >
                  <span className="text-slate-600">{l}</span>
                  <span className="text-white font-medium font-mono">{v}</span>
                </div>
              ))}
            </div>

            {/* Stats mini */}
            {/* <div
              className="absolute bottom-2 left-4 w-[170px] rounded-xl p-3.5 glass-morphism flex items-center gap-3"
              style={{ animation: "float3d2 6s ease-in-out 2s infinite" }}
            >
              <div
                className="w-10 h-10 rounded-xl flex items-center justify-center"
                style={{ background: "rgba(52,211,153,0.1)" }}
              >
                <Shield size={18} className="text-emerald-400" />
              </div>
              <div>
                <div className="text-white font-bold text-sm font-mono">12</div>
                <div className="text-slate-500 text-[11px]">Protected</div>
              </div>
            </div> */}
          </div>
        </div>
      </section>

      {/* ── STATS ── */}
      {/* <section
        id="stats"
        ref={statsRef}
        className="relative z-10 py-20 px-6 font-outfit"
      >
        <div className="max-w-5xl mx-auto">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            {stats.map((s, i) => (
              <div
                key={s.label}
                className="text-center rounded-2xl p-6 glass-morphism"
                style={{
                  opacity: statsInView ? 1 : 0,
                  transform: statsInView
                    ? "translateY(0) scale(1)"
                    : "translateY(30px) scale(0.9)",
                  transition: `all 0.7s cubic-bezier(0.16, 1, 0.3, 1) ${i * 120}ms`,
                }}
              >
                <div
                  className="font-mono font-bold text-3xl md:text-4xl mb-2"
                  style={{
                    background: "linear-gradient(135deg, #a78bfa, #60a5fa)",
                    WebkitBackgroundClip: "text",
                    WebkitTextFillColor: "transparent",
                  }}
                >
                  <AnimCounter
                    end={s.value}
                    suffix={s.suffix}
                    inView={statsInView}
                  />
                </div>
                <div className="text-slate-500 text-xs uppercase tracking-widest font-medium">
                  {s.label}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section> */}

      {/* ── FEATURES ── */}
      <section
        id="features"
        ref={featRef}
        className="relative z-10 py-28 px-6 font-outfit overflow-hidden"
      >
        <div className="max-w-7xl mx-auto relative">
          <div
            className="text-center mb-20"
            style={{
              opacity: featInView ? 1 : 0,
              transform: featInView ? "none" : "translateY(30px)",
              transition: "all 0.8s cubic-bezier(0.16, 1, 0.3, 1)",
            }}
          >
            <div
              className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-xs font-medium mb-6"
              style={{
                background: "rgba(124,58,237,0.08)",
                border: "1px solid rgba(124,58,237,0.2)",
                color: "#a78bfa",
              }}
            >
              <Zap size={12} /> {t("features.badge")}
            </div>
            <h2
              style={{
                fontSize: "clamp(2rem, 4vw, 3.2rem)",
                fontWeight: 800,
                color: "#e2e8f0",
                marginBottom: "1.2rem",
                letterSpacing: "-0.02em",
                lineHeight: 1.15,
              }}
            >
              {t("features.heading")}
              <br />
              <span className="shimmer-gradient">{t("features.headingHighlight")}</span>
            </h2>
            <p
              style={{
                color: "#64748b",
                fontSize: "1.1rem",
                maxWidth: "520px",
                margin: "0 auto",
                lineHeight: 1.7,
              }}
            >
              {t("features.sub")}
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {features.map((f, i) => (
              <FeatureCard
                key={f.title}
                {...f}
                index={i}
                delay={i * 80}
                inView={featInView}
              />
            ))}
          </div>
        </div>
      </section>

      {/* ── HOW IT WORKS ── */}
      <section
        id="how-it-works"
        ref={stepsRef}
        className="relative z-10 py-28 px-6 font-outfit"
        style={{ background: "rgba(6,6,20,0.5)" }}
      >
        <div className="max-w-5xl mx-auto">
          <div
            className="text-center mb-16"
            style={{
              opacity: stepsInView ? 1 : 0,
              transform: stepsInView ? "none" : "translateY(30px)",
              transition: "all 0.8s cubic-bezier(0.16, 1, 0.3, 1)",
            }}
          >
            <div
              className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-xs font-medium mb-6"
              style={{
                background: "rgba(124,58,237,0.08)",
                border: "1px solid rgba(124,58,237,0.2)",
                color: "#a78bfa",
              }}
            >
              <Clock size={12} /> {t("howItWorks.badge")}
            </div>
            <h2
              style={{
                fontSize: "clamp(2rem, 4vw, 3.2rem)",
                fontWeight: 800,
                color: "#e2e8f0",
                marginBottom: "1rem",
                letterSpacing: "-0.02em",
              }}
            >
              {t("howItWorks.heading")}<span className="shimmer-gradient">{t("howItWorks.headingHighlight")}</span>
            </h2>
            <p style={{ color: "#64748b", fontSize: "1.1rem" }}>
              {t("howItWorks.sub")}
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 relative">
            {[
              { num: "1", title: t("howItWorks.step1Title"), desc: t("howItWorks.step1Desc") },
              { num: "2", title: t("howItWorks.step2Title"), desc: t("howItWorks.step2Desc") },
              { num: "3", title: t("howItWorks.step3Title"), desc: t("howItWorks.step3Desc") },
            ].map((s, i) => (
              <div
                key={s.num}
                className="flex flex-col items-center text-center gap-5"
                style={{
                  opacity: stepsInView ? 1 : 0,
                  transform: stepsInView ? "translateY(0)" : "translateY(40px)",
                  transition: `all 0.8s cubic-bezier(0.16, 1, 0.3, 1) ${i * 200 + 200}ms`,
                }}
              >
                <div className="relative">
                  {/* Purple gradient circle with number */}
                  <div
                    className="w-16 h-16 rounded-full flex items-center justify-center relative"
                    style={{
                      background: "linear-gradient(135deg, #7c3aed, #6d28d9)",
                      boxShadow:
                        "0 0 30px rgba(124,58,237,0.4), 0 0 60px rgba(124,58,237,0.15)",
                      animation: `stepPulse 3s ease-in-out ${i * 0.4}s infinite`,
                    }}
                  >
                    <span className="text-white font-bold text-lg">
                      {s.num}
                    </span>
                  </div>
                  {/* Glow */}
                  <div
                    className="absolute inset-0 rounded-full"
                    style={{
                      background:
                        "radial-gradient(circle, rgba(124,58,237,0.3) 0%, transparent 70%)",
                      filter: "blur(16px)",
                      pointerEvents: "none",
                    }}
                  />
                </div>
                <h3 className="text-white font-bold text-lg">{s.title}</h3>
                <p className="text-slate-500 text-sm leading-relaxed max-w-[280px]">
                  {s.desc}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── PRICING ── */}
      <section
        id="pricing"
        ref={pricingRef}
        className="relative z-10 py-28 px-6 font-outfit"
      >
        <div className="max-w-6xl mx-auto">
          <div
            className="text-center mb-16"
            style={{
              opacity: pricingInView ? 1 : 0,
              transform: pricingInView ? "none" : "translateY(30px)",
              transition: "all 0.8s cubic-bezier(0.16, 1, 0.3, 1)",
            }}
          >
            <div
              className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-xs font-medium mb-6"
              style={{
                background: "rgba(124,58,237,0.08)",
                border: "1px solid rgba(124,58,237,0.2)",
                color: "#a78bfa",
              }}
            >
              <Crown size={12} /> {t("pricing.badge")}
            </div>
            <h2
              style={{
                fontSize: "clamp(2rem, 4vw, 3.2rem)",
                fontWeight: 800,
                color: "#e2e8f0",
                marginBottom: "1rem",
                letterSpacing: "-0.02em",
                lineHeight: 1.15,
              }}
            >
              {t("pricing.heading")}<span className="shimmer-gradient">{t("pricing.headingHighlight")}</span>
            </h2>
            <p style={{ color: "#64748b", fontSize: "1.1rem", maxWidth: "480px", margin: "0 auto", lineHeight: 1.7 }}>
              {t("pricing.sub")}
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[
              {
                name: t("pricing.free"),
                price: "₹0",
                period: t("pricing.forever"),
                desc: t("pricing.freeDesc"),
                accent: { from: "#64748b", to: "#94a3b8", glow: "rgba(100,116,139,0.3)" },
                features: [
                  t("pricing.feat_5warranties"),
                  t("pricing.feat_basicOcr"),
                  t("pricing.feat_emailAlerts"),
                  t("pricing.feat_dashboard"),
                  t("pricing.feat_claimAssistant"),
                ],
                cta: t("pricing.freeCta"),
                popular: false,
              },
              {
                name: t("pricing.pro"),
                price: "₹99",
                period: t("pricing.perMonth"),
                desc: t("pricing.proDesc"),
                accent: { from: "#7c3aed", to: "#a78bfa", glow: "rgba(124,58,237,0.45)" },
                features: [
                  t("pricing.feat_unlimited"),
                  t("pricing.feat_priorityOcr"),
                  t("pricing.feat_locker"),
                  t("pricing.feat_gmail"),
                  t("pricing.feat_family"),
                  t("pricing.feat_prioritySupport"),
                ],
                cta: t("pricing.proCta"),
                popular: true,
              },
              {
                name: t("pricing.business"),
                price: "₹499",
                period: t("pricing.perMonth"),
                desc: t("pricing.businessDesc"),
                accent: { from: "#f59e0b", to: "#fbbf24", glow: "rgba(245,158,11,0.35)" },
                features: [
                  t("pricing.feat_everythingPro"),
                  t("pricing.feat_team"),
                  t("pricing.feat_bulkApi"),
                  t("pricing.feat_analytics"),
                  t("pricing.feat_manager"),
                  t("pricing.feat_integrations"),
                ],
                cta: t("pricing.businessCta"),
                popular: false,
              },
            ].map((plan, i) => (
              <div
                key={plan.name}
                style={{
                  opacity: pricingInView ? 1 : 0,
                  transform: pricingInView ? "translateY(0) scale(1)" : "translateY(50px) scale(0.95)",
                  transition: `all 0.7s cubic-bezier(0.16, 1, 0.3, 1) ${i * 120}ms`,
                }}
              >
                <div
                  style={{
                    background: plan.popular
                      ? `linear-gradient(135deg, ${plan.accent.from}, ${plan.accent.to})`
                      : `linear-gradient(135deg, ${plan.accent.from}33, ${plan.accent.to}18)`,
                    padding: "1px",
                    borderRadius: "24px",
                    boxShadow: plan.popular
                      ? `0 8px 40px ${plan.accent.glow}, 0 0 0 1px ${plan.accent.from}44`
                      : "none",
                  }}
                >
                  <div
                    style={{
                      background: "rgba(6, 6, 20, 0.95)",
                      backdropFilter: "blur(40px)",
                      borderRadius: "23px",
                      padding: "2rem",
                      position: "relative",
                      overflow: "hidden",
                      display: "flex",
                      flexDirection: "column",
                      minHeight: "440px",
                    }}
                  >
                    {/* Popular badge */}
                    {plan.popular && (
                      <div
                        className="absolute top-0 right-6"
                        style={{
                          background: "linear-gradient(135deg, #7c3aed, #6d28d9)",
                          color: "#fff",
                          fontSize: "0.65rem",
                          fontWeight: 700,
                          letterSpacing: "0.08em",
                          textTransform: "uppercase",
                          padding: "6px 14px",
                          borderRadius: "0 0 12px 12px",
                        }}
                      >
                        {t("pricing.mostPopular")}
                      </div>
                    )}

                    {/* Plan name */}
                    <div
                      className="text-xs font-semibold uppercase tracking-widest mb-4"
                      style={{ color: plan.accent.to }}
                    >
                      {plan.name}
                    </div>

                    {/* Price */}
                    <div className="flex items-baseline gap-1.5 mb-1">
                      <span
                        className="font-mono font-bold"
                        style={{
                          fontSize: "2.8rem",
                          lineHeight: 1,
                          color: "#e2e8f0",
                        }}
                      >
                        {plan.price}
                      </span>
                      <span className="text-slate-600 text-sm">{plan.period}</span>
                    </div>

                    <p className="text-slate-500 text-sm mb-6">{plan.desc}</p>

                    {/* Divider */}
                    <div style={{ height: 1, background: "rgba(255,255,255,0.06)", marginBottom: "1.5rem" }} />

                    {/* Features list */}
                    <ul className="flex flex-col gap-3 mb-8 flex-1">
                      {plan.features.map((f) => (
                        <li key={f} className="flex items-center gap-2.5 text-sm">
                          <div
                            className="w-5 h-5 rounded-full flex items-center justify-center shrink-0"
                            style={{
                              background: `${plan.accent.from}20`,
                              border: `1px solid ${plan.accent.from}40`,
                            }}
                          >
                            <Check size={11} style={{ color: plan.accent.to }} />
                          </div>
                          <span className="text-slate-300">{f}</span>
                        </li>
                      ))}
                    </ul>

                    {/* CTA button */}
                    <Link
                      to="/signup"
                      className="w-full text-center py-3.5 rounded-xl font-semibold text-sm transition-all duration-300"
                      style={
                        plan.popular
                          ? {
                              background: `linear-gradient(135deg, ${plan.accent.from}, ${plan.accent.to})`,
                              color: "#fff",
                              boxShadow: `0 4px 20px ${plan.accent.glow}`,
                            }
                          : {
                              background: "rgba(255,255,255,0.04)",
                              border: "1px solid rgba(255,255,255,0.08)",
                              color: "#94a3b8",
                            }
                      }
                    >
                      {plan.cta}
                    </Link>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA ── */}
      <section ref={ctaRef} className="relative z-10 py-28 px-6 font-outfit">
        <div
          className="max-w-4xl mx-auto"
          style={{
            opacity: ctaInView ? 1 : 0,
            transform: ctaInView
              ? "translateY(0) scale(1)"
              : "translateY(40px) scale(0.97)",
            transition: "all 0.8s cubic-bezier(0.16, 1, 0.3, 1)",
          }}
        >
          <div
            className="rounded-3xl p-12 md:p-16 relative overflow-hidden"
            style={{
              background:
                "linear-gradient(135deg, rgba(124,58,237,0.12) 0%, rgba(59,130,246,0.06) 100%)",
              border: "1px solid rgba(124,58,237,0.15)",
            }}
          >
            {/* Glow blob */}
            <div
              className="absolute inset-0 pointer-events-none"
              style={{
                background:
                  "radial-gradient(ellipse at 50% 0%, rgba(124,58,237,0.2) 0%, transparent 60%)",
              }}
            />
            {/* Grid pattern */}
            <div
              className="absolute inset-0 pointer-events-none"
              style={{
                backgroundImage:
                  "linear-gradient(rgba(124,58,237,0.03) 1px, transparent 1px), linear-gradient(90deg, rgba(124,58,237,0.03) 1px, transparent 1px)",
                backgroundSize: "40px 40px",
              }}
            />

            <div className="relative text-center">
              <h2
                style={{
                  fontSize: "clamp(2rem, 4vw, 3rem)",
                  fontWeight: 800,
                  color: "#e2e8f0",
                  marginBottom: "1rem",
                  letterSpacing: "-0.02em",
                  lineHeight: 1.15,
                }}
              >
                {t("cta.heading")}
                <br />
                <span className="shimmer-gradient">{t("cta.headingHighlight")}</span>
              </h2>
              <p
                style={{
                  color: "#64748b",
                  fontSize: "1.1rem",
                  marginBottom: "2.5rem",
                  maxWidth: "460px",
                  margin: "0 auto 2.5rem",
                  lineHeight: 1.7,
                }}
              >
                {t("cta.sub")}
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
                <Link
                  to="/signup"
                  className="glow-button flex items-center gap-2.5 px-10 py-4 rounded-2xl font-bold text-white text-base"
                  style={{
                    background:
                      "linear-gradient(135deg, #7c3aed, #4f46e5, #6d28d9)",
                  }}
                >
                  {t("cta.button")} <ArrowRight size={18} />
                </Link>
                <Link
                  to="/login"
                  className="text-slate-500 hover:text-slate-300 text-sm transition-colors"
                >
                  {t("cta.altLink")}
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── FOOTER ── */}
      <footer
        className="relative z-10 py-10 px-6 font-outfit"
        style={{ borderTop: "1px solid rgba(255,255,255,0.04)" }}
      >
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <img
              src="/logo.png"
              alt="WarrantyVault"
              className="w-7 h-7 rounded-lg object-cover"
            />
            <span className="text-white font-bold">
              Warranty<span className="shimmer-gradient">Vault</span>
            </span>
          </div>
          <p className="text-slate-700 text-xs">
            {t("footer.copyright")}
          </p>
        </div>
      </footer>
    </div>
  );
}
