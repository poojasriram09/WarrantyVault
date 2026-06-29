import clsx from "clsx";

const variants = {
  primary: "text-white btn-glow",
  secondary: "text-slate-300 hover:text-white hover:border-white/20",
  danger: "text-white",
  ghost: "text-slate-400 hover:text-white hover:bg-white/5",
};

const variantStyles = {
  primary: { background: "linear-gradient(135deg, #7c3aed, #4f46e5)" },
  secondary: { backgroundColor: "transparent", border: "1px solid rgba(255,255,255,0.1)" },
  danger: { background: "linear-gradient(135deg, #dc2626, #b91c1c)" },
  ghost: {},
};

export function Button({ children, variant = "primary", className, loading, disabled, style, ...props }) {
  return (
    <button
      disabled={disabled || loading}
      className={clsx(
        "inline-flex items-center justify-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-purple-500/50 focus:ring-offset-1 focus:ring-offset-transparent disabled:opacity-40 disabled:cursor-not-allowed",
        variants[variant],
        className
      )}
      style={{ ...variantStyles[variant], ...style }}
      {...props}
    >
      {loading && (
        <div className="animate-spin h-4 w-4 border-2 border-current border-t-transparent rounded-full" />
      )}
      {children}
    </button>
  );
}
