import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Settings } from "./Settings";
import { I18nProvider } from "@/i18n/useTranslation";
import { useAuthStore } from "@/stores/authStore";

const createTestQueryClient = () =>
  new QueryClient({
    defaultOptions: {
      queries: { retry: false },
    },
  });

vi.mock("@/api/endpoints/settings", () => ({
  settingsApi: {
    get: vi.fn().mockResolvedValue({
      language: "en",
      notificationsEnabled: true,
      orderNotifications: true,
      marketNotifications: true,
      weatherNotifications: true,
      aiNotifications: true,
      updatedAt: "2026-08-29T10:00:00.000Z",
    }),
    update: vi.fn().mockResolvedValue({
      language: "te",
      notificationsEnabled: true,
      orderNotifications: true,
      marketNotifications: true,
      weatherNotifications: true,
      aiNotifications: true,
      updatedAt: "2026-08-29T10:00:00.000Z",
    }),
  },
}));

describe("Settings Component", () => {
  beforeEach(() => {
    localStorage.clear();
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

  it("renders language options including English, Telugu, and Hindi", async () => {
    render(
      <I18nProvider>
        <QueryClientProvider client={createTestQueryClient()}>
          <Settings />
        </QueryClientProvider>
      </I18nProvider>
    );

    expect(await screen.findAllByText("English")).toBeDefined();
    expect(screen.getByText("తెలుగు")).toBeInTheDocument();
    expect(screen.getByText("हिन्दी")).toBeInTheDocument();
  });

  it("persists language selection to localStorage on click", async () => {
    render(
      <I18nProvider>
        <QueryClientProvider client={createTestQueryClient()}>
          <Settings />
        </QueryClientProvider>
      </I18nProvider>
    );

    const teluguCard = (await screen.findByText("తెలుగు")).closest("div");
    if (teluguCard) {
      fireEvent.click(teluguCard);
    }

    expect(localStorage.getItem("agriverse_lang")).toBe("te");
    expect(localStorage.getItem("agriverse_ai_lang")).toBe("te");
  });

  it("switches to Security tab and renders Change Password form", async () => {
    render(
      <I18nProvider>
        <QueryClientProvider client={createTestQueryClient()}>
          <Settings />
        </QueryClientProvider>
      </I18nProvider>
    );

    const secTab = await screen.findByRole("button", { name: /security/i });
    fireEvent.click(secTab);

    expect(screen.getByText("Change Password")).toBeInTheDocument();
    expect(screen.getByLabelText(/current password \*/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/^new password \*/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/confirm new password \*/i)).toBeInTheDocument();
  });
});
