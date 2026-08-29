import { api } from "../client";
import type { OrderResponse, OrderStatus, PlaceOrderRequest } from "../types";

export const ordersApi = {
  place: (body: PlaceOrderRequest) =>
    api.post<OrderResponse>("/api/orders", body).then((r) => r.data),

  mine: () => api.get<OrderResponse[]>("/api/orders/my").then((r) => r.data),

  byId: (id: number) =>
    api.get<OrderResponse>(`/api/orders/${id}`).then((r) => r.data),

  seller: () =>
    api.get<OrderResponse[]>("/api/orders/seller").then((r) => r.data),

  updateStatus: (id: number, status: OrderStatus) =>
    api
      .put<OrderResponse>(`/api/orders/${id}/status`, { status })
      .then((r) => r.data),
};
