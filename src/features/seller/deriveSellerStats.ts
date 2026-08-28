import type { OrderResponse, ProductResponse } from "@/api/types";

export const LOW_STOCK_THRESHOLD = 10;

/**
 * The backend has no seller stats endpoint. Everything here is derived
 * from /api/products/my and /api/orders/seller. Do not invent an endpoint.
 */
export function deriveSellerStats(
  products: ProductResponse[],
  orders: OrderResponse[],
) {
  const delivered = orders.filter((o) => o.status === "DELIVERED");
  const pending = orders.filter(
    (o) =>
      !["DELIVERED", "CANCELLED", "RETURNED", "REFUNDED"].includes(o.status),
  );

  return {
    totalProducts: products.length,
    activeProducts: products.filter((p) => p.isActive).length,
    outOfStock: products.filter((p) => p.stock === 0),
    lowStock: products.filter(
      (p) => p.stock > 0 && p.stock < LOW_STOCK_THRESHOLD,
    ),
    totalOrders: orders.length,
    revenue: delivered.reduce((sum, o) => sum + o.totalAmount, 0),
    pendingRevenue: pending.reduce((sum, o) => sum + o.totalAmount, 0),
  };
}

/** Group order totals by "MMM YYYY" for the revenue chart. */
export function monthlyRevenue(orders: OrderResponse[]) {
  const buckets = new Map<string, number>();
  orders
    .filter((o) => o.status === "DELIVERED")
    .forEach((o) => {
      const d = new Date(o.createdAt);
      const key = d.toLocaleString("en-IN", {
        month: "short",
        year: "numeric",
      });
      buckets.set(key, (buckets.get(key) ?? 0) + o.totalAmount);
    });
  return [...buckets.entries()].map(([month, revenue]) => ({ month, revenue }));
}

/** Top products by units sold, from order items. */
export function topProducts(orders: OrderResponse[], limit = 5) {
  const counts = new Map<string, number>();
  orders.forEach((o) =>
    o.items.forEach((i) =>
      counts.set(i.productName, (counts.get(i.productName) ?? 0) + i.quantity),
    ),
  );
  return [...counts.entries()]
    .map(([name, quantity]) => ({ name, quantity }))
    .sort((a, b) => b.quantity - a.quantity)
    .slice(0, limit);
}
