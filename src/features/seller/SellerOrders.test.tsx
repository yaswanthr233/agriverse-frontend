import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { BrowserRouter } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { SellerOrders } from "./SellerOrders";
import { ordersApi } from "@/api/endpoints/orders";

const createTestQueryClient = () =>
  new QueryClient({
    defaultOptions: {
      queries: { retry: false },
    },
  });

vi.mock("@/api/endpoints/orders", () => ({
  ordersApi: {
    seller: vi.fn().mockResolvedValue([
      {
        id: 6,
        status: "PENDING",
        totalAmount: 1200,
        deliveryAddress: "Farmer Ramesh Farm, Mandya, Karnataka",
        paymentRef: "COD_ORDER",
        buyerName: "Ramesh Patel",
        buyerEmail: "farmer@agriverse.in",
        items: [
          {
            productId: 1,
            productName: "Hybrid Maize Seeds",
            productImageUrl: null,
            quantity: 2,
            unitPrice: 600,
            subtotal: 1200,
          },
        ],
        createdAt: "2026-08-29T10:00:00.000Z",
        updatedAt: "2026-08-29T10:00:00.000Z",
      },
    ]),
    updateStatus: vi.fn().mockResolvedValue({
      id: 6,
      status: "CONFIRMED",
      totalAmount: 1200,
      deliveryAddress: "Farmer Ramesh Farm, Mandya, Karnataka",
      paymentRef: "COD_ORDER",
      buyerName: "Ramesh Patel",
      buyerEmail: "farmer@agriverse.in",
      items: [],
      createdAt: "2026-08-29T10:00:00.000Z",
      updatedAt: "2026-08-29T10:05:00.000Z",
    }),
  },
}));

describe("SellerOrders Component", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders pending order and executes 'Mark as Confirmed' mutation", async () => {
    render(
      <QueryClientProvider client={createTestQueryClient()}>
        <BrowserRouter>
          <SellerOrders />
        </BrowserRouter>
      </QueryClientProvider>
    );

    expect(await screen.findByText("Order #6")).toBeInTheDocument();
    expect(screen.getAllByText("Pending").length).toBeGreaterThan(0);

    const confirmButton = screen.getByRole("button", { name: /mark as confirmed/i });
    expect(confirmButton).toBeInTheDocument();

    fireEvent.click(confirmButton);

    await waitFor(() => {
      expect(ordersApi.updateStatus).toHaveBeenCalledWith(6, "CONFIRMED");
    });
  });
});

