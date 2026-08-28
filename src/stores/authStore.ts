import { create } from "zustand";
import type { AuthResponse, AuthUser } from "@/api/types";
import { tokenStorage } from "@/lib/tokenStorage";

export type AuthStatus = "loading" | "authenticated" | "unauthenticated";

interface AuthState {
  user: AuthUser | null;
  accessToken: string | null;
  refreshToken: string | null;
  status: AuthStatus;
  setSession: (res: AuthResponse) => void;
  setUser: (user: AuthUser) => void;
  setStatus: (status: AuthStatus) => void;
  clearSession: () => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  accessToken: tokenStorage.getAccess(),
  refreshToken: tokenStorage.getRefresh(),
  status: "loading",

  setSession: (res) => {
    tokenStorage.set(res.accessToken, res.refreshToken);
    set({
      accessToken: res.accessToken,
      refreshToken: res.refreshToken,
      status: "authenticated",
      user: {
        userId: res.userId,
        fullName: res.fullName,
        email: res.email,
        phone: res.phone,
        role: res.role,        // ← the single source of role
        city: res.city,
        state: res.state,
        isVerified: res.isVerified,
        avatarUrl: res.avatarUrl,
      },
    });
  },

  setUser: (user) => set({ user, status: "authenticated" }),
  setStatus: (status) => set({ status }),

  clearSession: () => {
    tokenStorage.clear();
    set({ user: null, accessToken: null, refreshToken: null, status: "unauthenticated" });
  },
}));
