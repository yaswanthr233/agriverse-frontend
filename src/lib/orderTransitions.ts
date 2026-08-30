import type { OrderStatus, Role } from "@/api/types";

const ALL: OrderStatus[] = [
  "PENDING",
  "CONFIRMED",
  "PACKED",
  "CLAIMED",
  "DISPATCHED",
  "SHIPPED",
  "OUT_FOR_DELIVERY",
  "DELIVERED",
  "CANCELLED",
  "RETURNED",
  "REFUNDED",
];

/** The seller ONLY confirms the order. All subsequent fulfilment is handled by Delivery Partner. */
const SELLER_PATH: Partial<Record<OrderStatus, OrderStatus>> = {
  PENDING: "CONFIRMED",
};

/** The delivery partner's progressive dispatch & delivery path. */
const DELIVERY_PATH: Partial<Record<OrderStatus, OrderStatus>> = {
  CONFIRMED: "CLAIMED",
  PACKED: "CLAIMED",
  CLAIMED: "DISPATCHED",
  DISPATCHED: "SHIPPED",
  SHIPPED: "OUT_FOR_DELIVERY",
  OUT_FOR_DELIVERY: "DELIVERED",
};

/** A buyer may only cancel before the order is confirmed/claimed. */
const FARMER_CANCELLABLE: OrderStatus[] = ["PENDING", "CONFIRMED"];

/**
 * Which statuses may this role set next, given the current status?
 */
export function nextStatusesFor(
  role: Role,
  current: OrderStatus,
): OrderStatus[] {
  switch (role) {
    case "SELLER": {
      const next = SELLER_PATH[current];
      return next ? [next] : [];
    }
    case "FARMER":
      return FARMER_CANCELLABLE.includes(current) ? ["CANCELLED"] : [];
    case "DELIVERY_PARTNER": {
      const next = DELIVERY_PATH[current];
      return next ? [next] : [];
    }
    case "ADMIN":
      return ALL.filter((s) => s !== current);
    default:
      return [];
  }
}
