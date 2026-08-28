import type { OrderStatus, Role } from "@/api/types";

const ALL: OrderStatus[] = [
  "PENDING",
  "CONFIRMED",
  "PACKED",
  "SHIPPED",
  "OUT_FOR_DELIVERY",
  "DELIVERED",
  "CANCELLED",
  "RETURNED",
  "REFUNDED",
];

/** The seller's fulfilment path. After SHIPPED, delivery takes over. */
const SELLER_PATH: Partial<Record<OrderStatus, OrderStatus>> = {
  PENDING: "CONFIRMED",
  CONFIRMED: "PACKED",
  PACKED: "SHIPPED",
};

/** A buyer may only cancel before the order is packed. */
const FARMER_CANCELLABLE: OrderStatus[] = ["PENDING", "CONFIRMED"];

/**
 * Which statuses may this role set next, given the current status?
 * Returning a narrow list (rather than every status) prevents a seller
 * from jumping an order straight to REFUNDED from a dropdown.
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
    case "DELIVERY_PARTNER":
      if (current === "SHIPPED") return ["OUT_FOR_DELIVERY"];
      if (current === "OUT_FOR_DELIVERY") return ["DELIVERED"];
      return [];
    case "ADMIN":
      return ALL.filter((s) => s !== current);
    default:
      return [];
  }
}
