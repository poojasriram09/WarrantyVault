import { Navigate, Outlet } from "react-router-dom";
import { useAuthStore } from "../../stores/authStore";
import { isAdminEmail } from "../../utils/adminGuard";

// Renders child routes for regular users.
// Redirects admin-only accounts to /admin.
export function UserOnlyRoute() {
  const { dbUser } = useAuthStore();

  if (dbUser && isAdminEmail(dbUser.email)) {
    return <Navigate to="/admin" replace />;
  }

  return <Outlet />;
}
