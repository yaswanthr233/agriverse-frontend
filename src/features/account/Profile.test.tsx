import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import { BrowserRouter } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Profile } from "./Profile";
import { useAuthStore } from "@/stores/authStore";

const createTestQueryClient = () =>
  new QueryClient({
    defaultOptions: {
      queries: { retry: false },
    },
  });

vi.mock("@/api/endpoints/user", () => ({
  userApi: {
    getMe: vi.fn().mockResolvedValue({
      id: 1,
      fullName: "Farmer Ramesh",
      email: "ramesh@agriverse.in",
      phone: "9876543210",
      role: "FARMER",
      city: "Mandya",
      state: "Karnataka",
      isVerified: true,
      avatarUrl: null,
      createdAt: "2026-01-01T00:00:00.000Z",
      updatedAt: "2026-01-01T00:00:00.000Z",
    }),
    updateProfile: vi.fn(),
    changePassword: vi.fn(),
  },
}));

describe("Profile Component", () => {
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

  it("renders profile details and role badge", async () => {
    render(
      <QueryClientProvider client={createTestQueryClient()}>
        <BrowserRouter>
          <Profile />
        </BrowserRouter>
      </QueryClientProvider>
    );

    const nameMatches = await screen.findAllByText("Farmer Ramesh");
    expect(nameMatches.length).toBeGreaterThan(0);
    expect(screen.getAllByText("Farmer").length).toBeGreaterThan(0);
    expect(screen.getAllByText("ramesh@agriverse.in").length).toBeGreaterThan(0);
    expect(screen.getByRole("button", { name: /edit profile/i })).toBeInTheDocument();
  });
});

