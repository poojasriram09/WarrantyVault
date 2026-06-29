import { supabase } from "../config/supabase";
import { isAdminEmail } from "../utils/adminGuard";

function assertAdmin(email) {
  if (!isAdminEmail(email)) {
    throw new Error("Unauthorized: admin access required");
  }
}

export const adminService = {
  async getPlatformStats(callerEmail) {
    assertAdmin(callerEmail);
    const [usersRes, warrantiesRes, productsRes, claimsRes, notificationsRes] =
      await Promise.allSettled([
        supabase.from("users").select("id, created_at, email, display_name"),
        supabase
          .from("warranties_with_status")
          .select("id, status, created_at, end_date, user_id"),
        supabase
          .from("products")
          .select("id, category, created_at, user_id"),
        supabase.from("claims").select("id, status, created_at, user_id"),
        supabase
          .from("notifications")
          .select("id, is_read, created_at, user_id"),
      ]);

    const users =
      usersRes.status === "fulfilled" ? usersRes.value.data || [] : [];
    const warranties =
      warrantiesRes.status === "fulfilled"
        ? warrantiesRes.value.data || []
        : [];
    const products =
      productsRes.status === "fulfilled" ? productsRes.value.data || [] : [];
    const claims =
      claimsRes.status === "fulfilled" ? claimsRes.value.data || [] : [];
    const notifications =
      notificationsRes.status === "fulfilled"
        ? notificationsRes.value.data || []
        : [];

    const now = new Date();
    const thirtyDaysAgo = new Date(now - 30 * 24 * 60 * 60 * 1000);

    return {
      totalUsers: users.length,
      totalWarranties: warranties.length,
      totalProducts: products.length,
      totalClaims: claims.length,
      warrantyBreakdown: {
        active: warranties.filter((w) => w.status === "active").length,
        expiring: warranties.filter((w) => w.status === "expiring_soon").length,
        expired: warranties.filter((w) => w.status === "expired").length,
      },
      newUsersThisMonth: users.filter(
        (u) => new Date(u.created_at) >= thirtyDaysAgo
      ).length,
      newWarrantiesThisMonth: warranties.filter(
        (w) => new Date(w.created_at) >= thirtyDaysAgo
      ).length,
      unreadNotifications: notifications.filter((n) => !n.is_read).length,
      categoryBreakdown: products.reduce((acc, p) => {
        acc[p.category] = (acc[p.category] || 0) + 1;
        return acc;
      }, {}),
      recentUsers: [...users]
        .sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
        .slice(0, 8),
    };
  },

  async getAllUsers(callerEmail) {
    assertAdmin(callerEmail);
    const { data, error } = await supabase
      .from("users")
      .select("*")
      .order("created_at", { ascending: false });
    if (error) throw error;
    return data || [];
  },

  async getAllWarranties(callerEmail) {
    assertAdmin(callerEmail);
    const { data, error } = await supabase
      .from("warranties_with_status")
      .select(
        `*, products(product_name, brand, category, purchase_price)`
      )
      .order("created_at", { ascending: false });
    if (error) throw error;
    return data || [];
  },

  async getAllClaims(callerEmail) {
    assertAdmin(callerEmail);
    const { data, error } = await supabase
      .from("claims")
      .select("*, users(display_name, email)")
      .order("created_at", { ascending: false });
    if (error) throw error;
    return data || [];
  },

  async getServiceCenters(callerEmail) {
    assertAdmin(callerEmail);
    const { data, error } = await supabase
      .from("service_centers")
      .select("*")
      .order("created_at", { ascending: false });
    if (error) throw error;
    return data || [];
  },
};
