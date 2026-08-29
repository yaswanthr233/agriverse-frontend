import dayjs from "dayjs";
import relativeTime from "dayjs/plugin/relativeTime";

dayjs.extend(relativeTime);

const inr = new Intl.NumberFormat("en-IN", {
  style: "currency",
  currency: "INR",
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

export function formatCurrency(amount: number | null | undefined): string {
  if (amount === null || amount === undefined || Number.isNaN(amount)) return "₹0.00";
  return inr.format(amount);
}

/**
 * Java sends LocalDateTime without a timezone ("2026-08-21T10:30:00").
 * dayjs parses this as LOCAL time, which is what we want.
 * Never append "Z" — that shifts every timestamp by the UTC offset.
 */
export function formatDate(value: string | null | undefined): string {
  if (!value) return "—";
  return dayjs(value).format("DD MMM YYYY");
}

export function formatDateTime(value: string | null | undefined): string {
  if (!value) return "—";
  return dayjs(value).format("DD MMM YYYY, hh:mm A");
}

export function formatRelative(value: string | null | undefined): string {
  if (!value) return "—";
  return dayjs(value).fromNow();
}

export const formatRelativeTime = formatRelative;

/** "OUT_FOR_DELIVERY" -> "Out For Delivery". Prefer the backend's categoryLabel when present. */
export function formatEnum(value: string | null | undefined): string {
  if (!value) return "—";
  return value
    .split("_")
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
    .join(" ");
}
