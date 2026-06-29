import { addMonths, addDays, format, differenceInDays } from "date-fns";

export function computeEndDate(purchaseDateStr, duration) {
  const start = new Date(purchaseDateStr);
  if (typeof duration === "string" && duration.endsWith("d")) {
    return addDays(start, parseInt(duration, 10));
  }
  return addMonths(start, Number(duration));
}

export function toISODate(date) {
  return format(new Date(date), "yyyy-MM-dd");
}

export function daysUntil(dateStr) {
  return differenceInDays(new Date(dateStr), new Date());
}
