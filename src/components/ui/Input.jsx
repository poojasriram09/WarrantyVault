import clsx from "clsx";

export function Input({ label, error, className, ...props }) {
  return (
    <div className="space-y-1.5">
      {label && (
        <label className="block text-sm font-medium text-slate-300">{label}</label>
      )}
      <input
        className={clsx(
          "w-full px-3.5 py-2.5 rounded-xl text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 transition-all",
          error
            ? "ring-2 ring-red-500/50"
            : "focus:ring-purple-500/50",
          className
        )}
        style={{
          backgroundColor: "var(--bg-card)",
          border: `1px solid ${error ? "rgba(239,68,68,0.4)" : "var(--border)"}`,
        }}
        {...props}
      />
      {error && <p className="text-xs text-red-400">{error}</p>}
    </div>
  );
}
