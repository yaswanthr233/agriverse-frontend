import { api } from "../client";
import type {
  CreateRazorpayOrderResponse,
  PaymentConfigResponse,
} from "../types";

export const paymentsApi = {
  config: () =>
    api.get<PaymentConfigResponse>("/api/payments/config").then((r) => r.data),

  createRazorpayOrder: (items: { productId: number; quantity: number }[]) =>
    api
      .post<CreateRazorpayOrderResponse>(
        "/api/payments/razorpay/create-order",
        { items },
      )
      .then((r) => r.data),
};
