import { Navigate } from "react-router-dom";
import { useAuthStore } from "../../stores/authStore";
import { Spinner } from "../ui/Spinner";

export function ProtectedRoute({ children }) {
  const { user, loading } = useAuthStore();

  if (loading) return <Spinner fullScreen />;
  if (!user) return <Navigate to="/login" replace />;
  return children;
}
