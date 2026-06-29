export function Avatar({ src, name, size = "md" }) {
  const sizes = { sm: "h-7 w-7 text-xs", md: "h-9 w-9 text-sm", lg: "h-12 w-12 text-base" };
  const initials = name
    ? name.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2)
    : "?";

  if (src) {
    return <img src={src} alt={name} className={`${sizes[size]} rounded-full object-cover`} />;
  }

  return (
    <div
      className={`${sizes[size]} rounded-full font-semibold flex items-center justify-center text-white`}
      style={{ background: "linear-gradient(135deg, #7c3aed, #4f46e5)" }}
    >
      {initials}
    </div>
  );
}
