import { describe, it, expect, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import { MemoryRouter, Routes, Route } from "react-router-dom";
import { RequireAuth, RequireRole } from "./guards";
import { useAuthStore } from "@/stores/authStore";
import type { AuthResponse } from "@/api/types";

const farmer: AuthResponse = {
  accessToken: "a",
  refreshToken: "r",
  tokenType: "Bearer",
  expiresIn: 1,
  refreshExpiresIn: 1,
  userId: 1,
  fullName: "F",
  email: "f@a.in",
  phone: "1",
  role: "FARMER",
  city: null,
  state: null,
  isVerified: true,
  avatarUrl: null,
};

function renderAt(path: string, element: React.ReactNode) {
  return render(
    <MemoryRouter initialEntries={[path]}>
      <Routes>
        <Route path={path} element={element} />
        <Route path="/login" element={<div>Login Page</div>} />
        <Route path="/unauthorized" element={<div>No Access</div>} />
      </Routes>
    </MemoryRouter>,
  );
}

describe("RequireAuth", () => {
  beforeEach(() => useAuthStore.getState().clearSession());

  it("redirects to login when unauthenticated", () => {
    useAuthStore.setState({ status: "unauthenticated" });
    renderAt(
      "/secret",
      <RequireAuth>
        <div>Secret</div>
      </RequireAuth>,
    );
    expect(screen.getByText("Login Page")).toBeInTheDocument();
  });

  it("renders children when authenticated", () => {
    useAuthStore.getState().setSession(farmer);
    renderAt(
      "/secret",
      <RequireAuth>
        <div>Secret</div>
      </RequireAuth>,
    );
    expect(screen.getByText("Secret")).toBeInTheDocument();
  });

  it("does NOT redirect while status is loading", () => {
    useAuthStore.setState({ status: "loading" });
    renderAt(
      "/secret",
      <RequireAuth>
        <div>Secret</div>
      </RequireAuth>,
    );
    expect(screen.queryByText("Login Page")).toBeNull();
  });
});

describe("RequireRole", () => {
  it("blocks a farmer from an admin route without logging them out", () => {
    useAuthStore.getState().setSession(farmer);
    renderAt(
      "/admin",
      <RequireRole roles={["ADMIN"]}>
        <div>Admin</div>
      </RequireRole>,
    );
    expect(screen.getByText("No Access")).toBeInTheDocument();
    expect(useAuthStore.getState().user).not.toBeNull(); // still signed in
  });

  it("allows a matching role", () => {
    useAuthStore.getState().setSession(farmer);
    renderAt(
      "/app",
      <RequireRole roles={["FARMER"]}>
        <div>Farm</div>
      </RequireRole>,
    );
    expect(screen.getByText("Farm")).toBeInTheDocument();
  });
});
