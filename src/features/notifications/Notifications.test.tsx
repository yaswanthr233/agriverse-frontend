import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { BrowserRouter } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Notifications } from "./Notifications";
import { I18nProvider } from "@/i18n/useTranslation";
import { useAuthStore } from "@/stores/authStore";

const createTestQueryClient = () =>
  new QueryClient({
    defaultOptions: {
      queries: { retry: false },
    },
  });

vi.mock("@/api/endpoints/notifications", () => ({
  notificationsApi: {
    list: vi.fn().mockResolvedValue([
      {
        id: "order-101-CONFIRMED",
        type: "order",
        title: "Order Confirmed",
        message: "Order #101 has been confirmed by the seller.",
        read: false,
        createdAt: "2026-08-29T10:00:00.000Z",
        link: "/app/orders",
      },
      {
        id: "order-100-DELIVERED",
        type: "order",
        title: "Order Delivered",
        message: "Order #100 has been delivered successfully.",
        read: true,
        createdAt: "2026-08-28T10:00:00.000Z",
        link: "/app/orders",
      },
    ]),
    unreadCount: vi.fn().mockResolvedValue({ unreadCount: 1 }),
    markAsRead: vi.fn().mockResolvedValue({ success: true }),
    markAllAsRead: vi.fn().mockResolvedValue({ success: true, data: { markedCount: 1 } }),
    dismiss: vi.fn().mockResolvedValue({ success: true }),
    clearAll: vi.fn().mockResolvedValue({ success: true }),
  },
}));

describe("Notifications Component", () => {
  beforeEach(() => {
    useAuthStore.setState({
      user: {
        userId: 1,
        fullName: "Farmer Ramesh",
        email: "ramesh@agriverse.in",
        phone: "9876543210",
        role: "FARMER",
        city: "Mandya",
        state: "Karnataka",
        isVerified: true,
        avatarUrl: null,
      },
      status: "authenticated",
    });
  });

  it("renders notifications list and filter tabs", async () => {
    render(
      <I18nProvider>
        <QueryClientProvider client={createTestQueryClient()}>
          <BrowserRouter>
            <Notifications />
          </BrowserRouter>
        </QueryClientProvider>
      </I18nProvider>
    );

    expect(await screen.findByText("Order Confirmed")).toBeInTheDocument();
    expect(screen.getByText("Order Delivered")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /^all \(/i })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /^unread \(/i })).toBeInTheDocument();
  });

  it("switches to unread tab and filters unread notifications", async () => {
    render(
      <I18nProvider>
        <QueryClientProvider client={createTestQueryClient()}>
          <BrowserRouter>
            <Notifications />
          </BrowserRouter>
        </QueryClientProvider>
      </I18nProvider>
    );

    expect(await screen.findByText("Order Confirmed")).toBeInTheDocument();

    const unreadTab = screen.getByRole("button", { name: /^unread \(/i });
    fireEvent.click(unreadTab);

    expect(screen.getByText("Order Confirmed")).toBeInTheDocument();
    expect(screen.queryByText("Order Delivered")).not.toBeInTheDocument();
  });
});

