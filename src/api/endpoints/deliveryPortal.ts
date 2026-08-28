import { api } from "../client";
import type {
  DeliveryEarningsResponse,
  DeliveryOrderBrief,
  OrderResponse,
} from "../types";

export const deliveryApi = {
  // Requires the Task 1 backend fix. Returns orders in SHIPPED.
  available: () =>
    api
      .get<DeliveryOrderBrief[]>("/api/delivery/orders/available")
      .then((r) => r.data),

  // 400 INVALID_STATUS if the order is no longer SHIPPED (someone else claimed it).
  claim: (id: number) =>
    api
      .post<DeliveryOrderBrief>(`/api/delivery/orders/${id}/claim`)
      .then((r) => r.data),

  // 400 INVALID_STATUS if the order is not OUT_FOR_DELIVERY.
  deliver: (id: number) =>
    api
      .post<DeliveryOrderBrief>(`/api/delivery/orders/${id}/deliver`)
      .then((r) => r.data),

  // These two live on OrderController and already used the correct role.
  pipeline: () =>
    api.get<OrderResponse[]>("/api/orders/delivery").then((r) => r.data),

  earnings: () =>
    api
      .get<DeliveryEarningsResponse>("/api/orders/delivery/earnings")
      .then((r) => r.data),
};
