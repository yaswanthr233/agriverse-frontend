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
                status: "CONFIRMED",
                totalAmount: 3500,
                deliveryAddress: "12-45, Farm Road, Mandya, Karnataka, 571401",
                deliveryLatitude: 12.5234,
                deliveryLongitude: 76.8976,
                deliveryAccuracy: 12,
                buyerName: "Ramesh Patel",
                buyerPhone: "9876543210",
                itemCount: 3,
                items: [
                  { productId: 1, productName: "Guntur Chilli Seeds", quantity: 5, unitPrice: 200, subtotal: 1000 },
                  { productId: 2, productName: "Hybrid Tomato Seeds", quantity: 10, unitPrice: 150, subtotal: 1500 },
                  { productId: 3, productName: "Organic Bio-Fertilizer", quantity: 2, unitPrice: 500, subtotal: 1000 },
                ],
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
                status: "CLAIMED",
                totalAmount: 3500,
                deliveryAddress: "12-45, Farm Road, Mandya, Karnataka, 571401",
                deliveryLatitude: 12.5234,
                deliveryLongitude: 76.8976,
                deliveryAccuracy: 12,
                buyerName: "Ramesh Patel",
                buyerPhone: "9876543210",
                buyerEmail: "ramesh@agriverse.in",
                items: [
                  {
                    productId: 1,
                    productName: "Guntur Chilli Seeds",
                    quantity: 5,
                    unitPrice: 200,
                    subtotal: 1000,
                  },
                  {
                    productId: 2,
                    productName: "Hybrid Tomato Seeds",
                    quantity: 10,
                    unitPrice: 150,
                    subtotal: 1500,
                  },
                  {
                    productId: 3,
                    productName: "Organic Bio-Fertilizer",
                    quantity: 2,
                    unitPrice: 500,
                    subtotal: 1000,
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
                deliveryLatitude: null,
                deliveryLongitude: null,
                deliveryAccuracy: null,
                buyerName: "Suresh Gowda",
                buyerEmail: "suresh@agriverse.in",
                items: [
                  {
                    productId: 4,
                    productName: "Paddy Seeds",
                    quantity: 3,
                    unitPrice: 600,
                    subtotal: 1800,
                  },
                ],
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
            data: { id: 101, status: "CLAIMED" },
          });
        }
        if (url.includes("/dispatch")) {
          return Promise.resolve({
            data: { id: 101, status: "DISPATCHED" },
          });
        }
        if (url.includes("/ship")) {
          return Promise.resolve({
            data: { id: 101, status: "SHIPPED" },
          });
        }
        if (url.includes("/start-delivery")) {
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

describe("Delivery Partner Frontend Workflows with Real Product Items & Progressive Actions", () => {
  it("DeliveryAvailable renders confirmed orders with real product items and executes Accept Order", async () => {
    render(
      <QueryClientProvider client={createTestQueryClient()}>
        <BrowserRouter>
          <DeliveryAvailable />
        </BrowserRouter>
      </QueryClientProvider>
    );

    expect(await screen.findByText("12-45, Farm Road, Mandya, Karnataka, 571401")).toBeInTheDocument();
    expect(screen.getByText("Order #101")).toBeInTheDocument();
    expect(screen.getByText("Confirmed by Seller")).toBeInTheDocument();
    expect(screen.getByText(/Guntur Chilli Seeds/i)).toBeInTheDocument();
    expect(screen.getByText(/5 units/i)).toBeInTheDocument();
    expect(screen.getByText(/Hybrid Tomato Seeds/i)).toBeInTheDocument();
    expect(screen.getByText(/10 units/i)).toBeInTheDocument();
    expect(screen.getByText(/Organic Bio-Fertilizer/i)).toBeInTheDocument();
    expect(screen.getByText(/2 units/i)).toBeInTheDocument();
    expect(screen.getByText("GPS Location Verified")).toBeInTheDocument();
    expect(screen.getByText(/Open in Maps/i)).toBeInTheDocument();

    const acceptButton = screen.getByRole("button", { name: /accept order/i });
    fireEvent.click(acceptButton);

    await waitFor(() => {
      expect(api.post).toHaveBeenCalledWith("/api/delivery/orders/101/claim");
    });
  });

  it("DeliveryActive renders claimed consignment and executes Mark as Dispatched", async () => {
    render(
      <QueryClientProvider client={createTestQueryClient()}>
        <BrowserRouter>
          <DeliveryActive />
        </BrowserRouter>
      </QueryClientProvider>
    );

    expect(await screen.findByText("Order #101")).toBeInTheDocument();
    expect(screen.getByText(/Guntur Chilli Seeds/i)).toBeInTheDocument();
    expect(screen.getByText(/5 units/i)).toBeInTheDocument();
    expect(screen.getByText("GPS Verified Destination")).toBeInTheDocument();

    const dispatchButton = screen.getByRole("button", { name: /mark as dispatched/i });
    fireEvent.click(dispatchButton);

    await waitFor(() => {
      expect(api.post).toHaveBeenCalledWith("/api/delivery/orders/101/dispatch");
    });
  });

  it("DeliveryHistory displays completed deliveries with delivered products", async () => {
    render(
      <QueryClientProvider client={createTestQueryClient()}>
        <BrowserRouter>
          <DeliveryHistory />
        </BrowserRouter>
      </QueryClientProvider>
    );

    expect(await screen.findByText("#99")).toBeInTheDocument();
    expect(screen.getAllByText("Suresh Gowda").length).toBeGreaterThan(0);
    expect(screen.getAllByText(/Paddy Seeds × 3/i).length).toBeGreaterThan(0);
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
