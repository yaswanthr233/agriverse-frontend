import type { OrderStatus } from "@/api/types";
import type { Tone } from "@/components/ui/Badge";

const TONES: Record<OrderStatus, Tone> = {
  PENDING: "warning",
  CONFIRMED: "info",
  PACKED: "info",
  CLAIMED: "info",
  DISPATCHED: "primary",
  SHIPPED: "primary",
  OUT_FOR_DELIVERY: "primary",
  DELIVERED: "success",
  CANCELLED: "danger",
  RETURNED: "danger",
  REFUNDED: "danger",
};

const LABELS: Record<OrderStatus, string> = {
  PENDING: "Pending",
  CONFIRMED: "Confirmed",
  PACKED: "Packed",
  CLAIMED: "Claimed / Accepted",
  DISPATCHED: "Dispatched",
  SHIPPED: "Shipped",
  OUT_FOR_DELIVERY: "Out for Delivery",
  DELIVERED: "Delivered",
  CANCELLED: "Cancelled",
  RETURNED: "Returned",
  REFUNDED: "Refunded",
};

/** The happy path, in order. Terminal states are NOT on this path. */
export const ORDER_TIMELINE: OrderStatus[] = [
  "PENDING",
  "CONFIRMED",
  "CLAIMED",
  "DISPATCHED",
  "SHIPPED",
  "OUT_FOR_DELIVERY",
  "DELIVERED",
];

export const TERMINAL_STATUSES: OrderStatus[] = [
  "CANCELLED",
  "RETURNED",
  "REFUNDED",
];

/** A buyer may only cancel before the order is claimed/dispatched. */
export const CANCELLABLE_STATUSES: OrderStatus[] = ["PENDING", "CONFIRMED"];

export const orderStatusTone = (s: OrderStatus): Tone => TONES[s] || "neutral";
export const orderStatusLabel = (s: OrderStatus): string => LABELS[s] || s;
