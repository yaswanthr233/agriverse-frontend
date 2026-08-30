import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { MemoryRouter, Routes, Route } from "react-router-dom";
import { Login } from "./Login";
import { RequireRole } from "@/routes/guards";
import { authApi } from "@/api/endpoints/auth";
import { ApiError } from "@/api/client";
import { useAuthStore } from "@/stores/authStore";
import type { AuthResponse } from "@/api/types";

const mockNavigate = vi.fn();
vi.mock("react-router-dom", async () => {
  const actual = await vi.importActual("react-router-dom");
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  };
});

vi.mock("@/api/endpoints/auth", () => ({
  authApi: {
    lookupRole: vi.fn(),
    login: vi.fn(),
  },
}));

function makeUser(role: AuthResponse["role"]): AuthResponse {
  return {
    accessToken: "test-token",
    refreshToken: "test-refresh",
    tokenType: "Bearer",
    expiresIn: 900,
    refreshExpiresIn: 604800,
    userId: 1,
    fullName: "Test User",
    email: "user@agriverse.in",
    phone: "9876543210",
    role,
    city: null,
    state: null,
    isVerified: true,
    avatarUrl: null,
  };
}

describe("Role Security & Registered Role Enforcement (Frontend)", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    useAuthStore.getState().clearSession();
  });

  it("TEST 1: Farmer logs in with Farmer role selected -> Succeeds and redirects to Farmer Dashboard", async () => {
    vi.mocked(authApi.login).mockResolvedValueOnce(makeUser("FARMER"));

    render(
      <MemoryRouter>
        <Login />
      </MemoryRouter>
    );

    fireEvent.change(screen.getByLabelText(/login as/i), { target: { value: "FARMER" } });
    fireEvent.change(screen.getByLabelText(/email/i), { target: { value: "farmer@agriverse.in" } });
    fireEvent.change(screen.getByLabelText(/password/i), { target: { value: "Password123" } });

    fireEvent.click(screen.getByRole("button", { name: /sign in/i }));

    await waitFor(() => {
      expect(authApi.login).toHaveBeenCalledWith({
        email: "farmer@agriverse.in",
        password: "Password123",
        role: "FARMER",
      });
      expect(mockNavigate).toHaveBeenCalledWith("/app/dashboard", { replace: true });
    });
  });

  it("TEST 2: Farmer account attempts to log in as Seller -> Backend rejects with 403 and exact message is displayed", async () => {
    const error403 = new ApiError("This account is registered as Farmer. You cannot login as Seller.", 403);
    vi.mocked(authApi.login).mockRejectedValueOnce(error403);

    render(
      <MemoryRouter>
        <Login />
      </MemoryRouter>
    );

    fireEvent.change(screen.getByLabelText(/login as/i), { target: { value: "SELLER" } });
    fireEvent.change(screen.getByLabelText(/email/i), { target: { value: "farmer@agriverse.in" } });
    fireEvent.change(screen.getByLabelText(/password/i), { target: { value: "Password123" } });

    fireEvent.click(screen.getByRole("button", { name: /sign in/i }));

    expect(
      await screen.findByText("This account is registered as Farmer. You cannot login as Seller.")
    ).toBeInTheDocument();
    expect(useAuthStore.getState().user).toBeNull();
    expect(useAuthStore.getState().status).not.toBe("authenticated");
  });

  it("TEST 3: Form preserves user-selected role when submitting credentials", async () => {
    vi.mocked(authApi.login).mockResolvedValueOnce(makeUser("VETERINARIAN"));

    render(
      <MemoryRouter>
        <Login />
      </MemoryRouter>
    );

    fireEvent.change(screen.getByLabelText(/login as/i), { target: { value: "VETERINARIAN" } });
    fireEvent.change(screen.getByLabelText(/email/i), { target: { value: "dr.ananya@agriverse.in" } });
    fireEvent.change(screen.getByLabelText(/password/i), { target: { value: "Password123" } });

    fireEvent.click(screen.getByRole("button", { name: /sign in/i }));

    await waitFor(() => {
      expect(authApi.login).toHaveBeenCalledWith({
        email: "dr.ananya@agriverse.in",
        password: "Password123",
        role: "VETERINARIAN",
      });
      expect(mockNavigate).toHaveBeenCalledWith("/vet/dashboard", { replace: true });
    });
  });

  it("TEST 4: Seller account attempting to access Farmer route -> Blocked by RequireRole and redirected to Seller Dashboard", () => {
    useAuthStore.getState().setSession(makeUser("SELLER"));

    render(
      <MemoryRouter initialEntries={["/app/dashboard"]}>
        <Routes>
          <Route
            path="/app/dashboard"
            element={
              <RequireRole roles={["FARMER"]}>
                <div>Farmer Dashboard Protected Content</div>
              </RequireRole>
            }
          />
          <Route path="/seller/dashboard" element={<div>Seller Home Dashboard</div>} />
        </Routes>
      </MemoryRouter>
    );

    expect(screen.queryByText("Farmer Dashboard Protected Content")).toBeNull();
    expect(screen.getByText("Seller Home Dashboard")).toBeInTheDocument();
  });

  it("TEST 5: Farmer account manually entering /admin/dashboard -> Blocked by RequireRole and redirected to Farmer Dashboard", () => {
    useAuthStore.getState().setSession(makeUser("FARMER"));

    render(
      <MemoryRouter initialEntries={["/admin/dashboard"]}>
        <Routes>
          <Route
            path="/admin/dashboard"
            element={
              <RequireRole roles={["ADMIN"]}>
                <div>Admin Dashboard Protected Content</div>
              </RequireRole>
            }
          />
          <Route path="/app/dashboard" element={<div>Farmer Home Dashboard</div>} />
        </Routes>
      </MemoryRouter>
    );

    expect(screen.queryByText("Admin Dashboard Protected Content")).toBeNull();
    expect(screen.getByText("Farmer Home Dashboard")).toBeInTheDocument();
  });
});
