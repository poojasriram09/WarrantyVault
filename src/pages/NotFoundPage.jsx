import { Link } from "react-router-dom";
import { Button } from "../components/ui/Button";

export default function NotFoundPage() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center text-center p-4" style={{ backgroundColor: "var(--bg-base)" }}>
      <p className="text-8xl font-bold gradient-text mb-4">404</p>
      <p className="text-xl font-semibold text-white">Page not found</p>
      <p className="text-slate-500 mt-2 text-sm">The page you're looking for doesn't exist.</p>
      <Link to="/dashboard" className="mt-8"><Button>Go to Dashboard</Button></Link>
    </div>
  );
}
