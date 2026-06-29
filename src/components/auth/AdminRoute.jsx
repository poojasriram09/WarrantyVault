import { Navigate } from "react-router-dom";
import { useAuthStore } from "../../stores/authStore";
import { isAdminEmail } from "../../utils/adminGuard";
import { Spinner } from "../ui/Spinner";

export function AdminRoute({ children }) {
  const { dbUser, loading } = useAuthStore();

  if (loading) return <Spinner />;
  if (!dbUser) return <Navigate to="/login" replace />;
  if (!isAdminEmail(dbUser.email)) return <Navigate to="/dashboard" replace />;

  return children;
}
