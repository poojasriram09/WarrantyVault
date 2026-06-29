export const ADMIN_EMAIL = import.meta.env.VITE_ADMIN_EMAIL || null;

export function isAdminEmail(email) {
  return !!ADMIN_EMAIL && email === ADMIN_EMAIL;
}
