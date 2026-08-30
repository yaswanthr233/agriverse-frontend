import { api } from "../client";
import type {
  DeliveryEarningsResponse,
  DeliveryOrderBrief,
  OrderResponse,
} from "../types";

export const deliveryApi = {
  // Returns confirmed orders waiting for a delivery partner
  available: () =>
    api
      .get<DeliveryOrderBrief[]>("/api/delivery/orders/available")
      .then((r) => r.data),

  // 400 INVALID_STATUS if the order is no longer CONFIRMED/available
  claim: (id: number) =>
    api
      .post<DeliveryOrderBrief>(`/api/delivery/orders/${id}/claim`)
      .then((r) => r.data),

  // Mark as Dispatched
  dispatch: (id: number) =>
    api
      .post<DeliveryOrderBrief>(`/api/delivery/orders/${id}/dispatch`)
      .then((r) => r.data),

  // Mark as Shipped
  ship: (id: number) =>
    api
      .post<DeliveryOrderBrief>(`/api/delivery/orders/${id}/ship`)
      .then((r) => r.data),

  // Start Delivery / Out for Delivery
  startDelivery: (id: number) =>
    api
      .post<DeliveryOrderBrief>(`/api/delivery/orders/${id}/start-delivery`)
      .then((r) => r.data),

  // Mark as Delivered
  deliver: (id: number) =>
    api
      .post<DeliveryOrderBrief>(`/api/delivery/orders/${id}/deliver`)
      .then((r) => r.data),

  // Active deliveries assigned to delivery partner
  active: () =>
    api
      .get<DeliveryOrderBrief[]>("/api/delivery/orders/active")
      .then((r) => r.data),

  // Delivery history assigned to delivery partner
  history: () =>
    api
      .get<DeliveryOrderBrief[]>("/api/delivery/orders/history")
      .then((r) => r.data),

  // Pipeline (all assigned and active delivery orders)
  pipeline: () =>
    api.get<OrderResponse[]>("/api/orders/delivery").then((r) => r.data),

  earnings: () =>
    api
      .get<DeliveryEarningsResponse>("/api/orders/delivery/earnings")
      .then((r) => r.data),
};
