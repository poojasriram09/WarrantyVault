import { differenceInDays, format } from "date-fns";

export function getWarrantyStatus(endDate) {
  const end = new Date(endDate);
  const today = new Date();
  const daysLeft = differenceInDays(end, today);

  if (daysLeft < 0) return { label: "Expired", color: "red", daysLeft: 0 };
  if (daysLeft <= 7) return { label: "Expiring Soon", color: "red", daysLeft };
  if (daysLeft <= 30) return { label: "Expiring Soon", color: "amber", daysLeft };
  return { label: "Active", color: "green", daysLeft };
}

export function formatDate(date) {
  if (!date) return "—";
  try {
    const d = new Date(date);
    if (isNaN(d.getTime())) return "—";
    return format(d, "dd MMM yyyy");
  } catch {
    return "—";
  }
}
