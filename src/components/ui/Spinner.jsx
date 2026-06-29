export function Spinner({ fullScreen = false }) {
  const spinner = (
    <div
      className="animate-spin h-9 w-9 rounded-full"
      style={{
        border: "2px solid rgba(124,58,237,0.2)",
        borderTopColor: "#7c3aed",
        boxShadow: "0 0 12px rgba(124,58,237,0.3)",
      }}
    />
  );

  if (fullScreen) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: "var(--bg-base)" }}>
        {spinner}
      </div>
    );
  }

  return <div className="flex justify-center p-10">{spinner}</div>;
}
