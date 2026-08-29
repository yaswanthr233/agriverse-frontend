import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { BrowserRouter } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { DeliveryAvailable } from "./DeliveryAvailable";
import { DeliveryActive } from "./DeliveryActive";
import { DeliveryHistory } from "./DeliveryHistory";
import { DeliveryEarnings } from "./DeliveryEarnings";
import { api } from "@/api/client";

const createTestQueryClient = () =>
  new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  });

vi.mock("@/api/client", () => {
  return {
    api: {
      get: vi.fn((url: string) => {
        if (url.includes("/available")) {
          return Promise.resolve({
            data: [
              {
                id: 101,
                status: "SHIPPED",
                totalAmount: "3000.00",
                deliveryAddress: "Farmer Green Acres, Mandya, Karnataka",
                buyerName: "Ramesh Patel",
                buyerPhone: "9876543210",
                itemCount: 2,
                createdAt: "2026-08-29T10:00:00.000Z",
              },
            ],
          });
        }
        if (url.includes("/earnings")) {
          return Promise.resolve({
            data: {
              totalEarnings: 450,
              thisWeekEarnings: 450,
              totalDeliveries: 3,
              thisWeekDeliveries: 3,
              weeklyBreakdown: [
                { day: "Mon", earnings: 150 },
                { day: "Tue", earnings: 300 },
              ],
              recentTransactions: [
                {
                  orderId: 99,
                  customer: "Suresh Gowda",
                  amount: 150,
                  completedAt: "2026-08-28T14:00:00.000Z",
                },
              ],
            },
          });
        }
        if (url.includes("/pipeline") || url.includes("/delivery")) {
          return Promise.resolve({
            data: [
              {
                id: 101,
                status: "OUT_FOR_DELIVERY",
                totalAmount: 3000,
                deliveryAddress: "Farmer Green Acres, Mandya, Karnataka",
                buyerName: "Ramesh Patel",
                buyerEmail: "ramesh@agriverse.in",
                items: [
                  {
                    productId: 5,
                    productName: "Organic Bio-Fertilizer",
                    productImageUrl: null,
                    quantity: 2,
                    unitPrice: 1500,
                    subtotal: 3000,
                  },
                ],
                createdAt: "2026-08-29T10:00:00.000Z",
                updatedAt: "2026-08-29T11:00:00.000Z",
              },
              {
                id: 99,
                status: "DELIVERED",
                totalAmount: 1800,
                deliveryAddress: "Cauvery Farm, Mysuru, Karnataka",
                buyerName: "Suresh Gowda",
                buyerEmail: "suresh@agriverse.in",
                items: [],
                createdAt: "2026-08-28T09:00:00.000Z",
                updatedAt: "2026-08-28T14:00:00.000Z",
              },
            ],
          });
        }
        return Promise.resolve({ data: [] });
      }),
      post: vi.fn((url: string) => {
        if (url.includes("/claim")) {
          return Promise.resolve({
            data: { id: 101, status: "OUT_FOR_DELIVERY" },
          });
        }
        if (url.includes("/deliver")) {
          return Promise.resolve({
            data: { id: 101, status: "DELIVERED" },
          });
        }
        return Promise.resolve({ data: {} });
      }),
    },
    ApiError: class extends Error {
      errorCode?: string;
      constructor(message: string, errorCode?: string) {
        super(message);
        this.errorCode = errorCode;
      }
    },
  };
});

describe("Delivery Partner Frontend Workflows", () => {
  it("DeliveryAvailable renders orders and allows claiming", async () => {
    render(
      <QueryClientProvider client={createTestQueryClient()}>
        <BrowserRouter>
          <DeliveryAvailable />
        </BrowserRouter>
      </QueryClientProvider>
    );

    expect(await screen.findByText("Farmer Green Acres, Mandya, Karnataka")).toBeInTheDocument();
    expect(screen.getByText("#101")).toBeInTheDocument();

    const claimButton = screen.getByRole("button", { name: /claim order/i });
    fireEvent.click(claimButton);

    await waitFor(() => {
      expect(api.post).toHaveBeenCalledWith("/api/delivery/orders/101/claim");
    });
  });

  it("DeliveryActive renders in-transit consignments and marks as delivered", async () => {
    render(
      <QueryClientProvider client={createTestQueryClient()}>
        <BrowserRouter>
          <DeliveryActive />
        </BrowserRouter>
      </QueryClientProvider>
    );

    expect(await screen.findByText("Order #101")).toBeInTheDocument();
    expect(screen.getByText("Out for Delivery")).toBeInTheDocument();

    const markDeliveredButton = screen.getByRole("button", { name: /mark as delivered/i });
    fireEvent.click(markDeliveredButton);

    const confirmButton = await screen.findByRole("button", { name: /confirm delivered/i });
    fireEvent.click(confirmButton);

    await waitFor(() => {
      expect(api.post).toHaveBeenCalledWith("/api/delivery/orders/101/deliver");
    });
  });

  it("DeliveryHistory displays completed deliveries", async () => {
    render(
      <QueryClientProvider client={createTestQueryClient()}>
        <BrowserRouter>
          <DeliveryHistory />
        </BrowserRouter>
      </QueryClientProvider>
    );

    expect(await screen.findByText("#99")).toBeInTheDocument();
    expect(screen.getAllByText("Suresh Gowda").length).toBeGreaterThan(0);
  });

  it("DeliveryEarnings displays KPI metrics and settlements", async () => {
    render(
      <QueryClientProvider client={createTestQueryClient()}>
        <BrowserRouter>
          <DeliveryEarnings />
        </BrowserRouter>
      </QueryClientProvider>
    );

    expect(await screen.findByText("Total Cumulative Earnings")).toBeInTheDocument();
    expect(screen.getByText("Total Deliveries")).toBeInTheDocument();
  });
});

