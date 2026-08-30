import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { BrowserRouter } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { OrderList } from "./OrderList";
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
      get: vi.fn(),
      post: vi.fn(),
      put: vi.fn(),
    },
    ApiError: class extends Error {
      status: number;
      errorCode?: string;
      constructor(message: string, status = 500, errorCode?: string) {
        super(message);
        this.status = status;
        this.errorCode = errorCode;
      }
    },
  };
});

const sampleOrders = [
  {
    id: 101,
    status: "PENDING",
    totalAmount: 1500,
    deliveryAddress: "Green Farm, Guntur, AP",
    deliveryLatitude: 16.3067,
    deliveryLongitude: 80.4365,
    deliveryAccuracy: 10,
    paymentRef: "PAY_123",
    buyerName: "Yashwanth",
    buyerEmail: "yashwanth@agriverse.in",
    items: [
      {
        productId: 1,
        productName: "Bio Fertilizer",
        quantity: 1,
        unitPrice: 1500,
        subtotal: 1500,
      },
    ],
    createdAt: "2026-08-30T07:00:00.000Z",
    updatedAt: "2026-08-30T07:00:00.000Z",
  },
  {
    id: 102,
    status: "SHIPPED",
    totalAmount: 3200,
    deliveryAddress: "Kisan Colony, Vijayawada",
    deliveryLatitude: null,
    deliveryLongitude: null,
    deliveryAccuracy: null,
    paymentRef: "PAY_124",
    buyerName: "Yashwanth",
    buyerEmail: "yashwanth@agriverse.in",
    items: [
      {
        productId: 2,
        productName: "Hybrid Seeds",
        quantity: 2,
        unitPrice: 1600,
        subtotal: 3200,
      },
    ],
    createdAt: "2026-08-29T10:00:00.000Z",
    updatedAt: "2026-08-29T12:00:00.000Z",
  },
  {
    id: 103,
    status: "DELIVERED",
    totalAmount: 850,
    deliveryAddress: "Rural Hub, Mandya",
    deliveryLatitude: 12.5234,
    deliveryLongitude: 76.8976,
    deliveryAccuracy: 15,
    paymentRef: "PAY_125",
    buyerName: "Yashwanth",
    buyerEmail: "yashwanth@agriverse.in",
    items: [
      {
        productId: 3,
        productName: "Sprayer Nozzle",
        quantity: 1,
        unitPrice: 850,
        subtotal: 850,
      },
    ],
    createdAt: "2026-08-28T09:00:00.000Z",
    updatedAt: "2026-08-28T16:00:00.000Z",
  },
];

describe("My Orders Frontend Component", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders farmer orders list with GPS badges and legacy address fallback", async () => {
    vi.mocked(api.get).mockResolvedValueOnce({ data: sampleOrders });

    render(
      <QueryClientProvider client={createTestQueryClient()}>
        <BrowserRouter>
          <OrderList />
        </BrowserRouter>
      </QueryClientProvider>
    );

    expect(await screen.findByText("#101")).toBeInTheDocument();
    expect(screen.getByText("#102")).toBeInTheDocument();
    expect(screen.getByText("#103")).toBeInTheDocument();

    // Order 101 has GPS
    expect(screen.getAllByText("GPS Saved").length).toBeGreaterThanOrEqual(1);

    // Order 102 has no coordinates -> displays legacy address
    expect(screen.getByText("Address Only")).toBeInTheDocument();
  });

  it("filters orders by status tabs correctly", async () => {
    vi.mocked(api.get).mockResolvedValueOnce({ data: sampleOrders });

    render(
      <QueryClientProvider client={createTestQueryClient()}>
        <BrowserRouter>
          <OrderList />
        </BrowserRouter>
      </QueryClientProvider>
    );

    expect(await screen.findByText("#101")).toBeInTheDocument();

    // Click 'Shipped' tab
    const shippedTab = screen.getByRole("tab", { name: /Shipped/i });
    fireEvent.click(shippedTab);

    expect(screen.getByText("#102")).toBeInTheDocument();
    expect(screen.queryByText("#101")).not.toBeInTheDocument();
    expect(screen.queryByText("#103")).not.toBeInTheDocument();

    // Click 'Delivered' tab
    const deliveredTab = screen.getByRole("tab", { name: /Delivered/i });
    fireEvent.click(deliveredTab);

    expect(screen.getByText("#103")).toBeInTheDocument();
    expect(screen.queryByText("#101")).not.toBeInTheDocument();
  });

  it("renders clean EmptyState when user has zero orders", async () => {
    vi.mocked(api.get).mockResolvedValueOnce({ data: [] });

    render(
      <QueryClientProvider client={createTestQueryClient()}>
        <BrowserRouter>
          <OrderList />
        </BrowserRouter>
      </QueryClientProvider>
    );

    expect(await screen.findByText("No orders yet")).toBeInTheDocument();
    expect(screen.getByText("Start shopping")).toBeInTheDocument();
  });
});

