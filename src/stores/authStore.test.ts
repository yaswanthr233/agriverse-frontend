import { describe, it, expect, beforeEach } from "vitest";
import { useAuthStore } from "./authStore";
import type { AuthResponse } from "@/api/types";

const response: AuthResponse = {
  accessToken: "access-1",
  refreshToken: "refresh-1",
  tokenType: "Bearer",
  expiresIn: 900000,
  refreshExpiresIn: 604800000,
  userId: 7,
  fullName: "Demo Farmer",
  email: "farmer@agriverse.in",
  phone: "9999999999",
  role: "FARMER",
  city: "Guntur",
  state: "AP",
  isVerified: true,
  avatarUrl: null,
};

describe("authStore", () => {
  beforeEach(() => {
    localStorage.clear();
    useAuthStore.getState().clearSession();
  });

  it("starts unauthenticated with a loading status", () => {
    expect(useAuthStore.getState().user).toBeNull();
  });

  it("stores the role from the top level of AuthResponse", () => {
    useAuthStore.getState().setSession(response);
    expect(useAuthStore.getState().user?.role).toBe("FARMER");
    expect(useAuthStore.getState().status).toBe("authenticated");
  });

  it("persists tokens to storage on setSession", () => {
    useAuthStore.getState().setSession(response);
    expect(localStorage.getItem("agriverse.accessToken")).toBe("access-1");
  });

  it("wipes user and tokens on clearSession", () => {
    useAuthStore.getState().setSession(response);
    useAuthStore.getState().clearSession();
    expect(useAuthStore.getState().user).toBeNull();
    expect(useAuthStore.getState().status).toBe("unauthenticated");
    expect(localStorage.getItem("agriverse.accessToken")).toBeNull();
  });
});
