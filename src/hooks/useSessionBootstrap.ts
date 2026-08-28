import { useEffect } from "react";
import { authApi } from "@/api/endpoints/auth";
import { useAuthStore } from "@/stores/authStore";
import { tokenStorage } from "@/lib/tokenStorage";

/**
 * Runs once on app start.
 * If a token exists, validate it via GET /auth/me and populate the session.
 * Until this resolves, status stays "loading" and guards render a spinner
 * rather than redirecting — otherwise every page refresh bounces to /login.
 */
export function useSessionBootstrap() {
  const setUser = useAuthStore((s) => s.setUser);
  const setStatus = useAuthStore((s) => s.setStatus);
  const clearSession = useAuthStore((s) => s.clearSession);

  useEffect(() => {
    let cancelled = false;

    async function bootstrap() {
      if (!tokenStorage.getAccess()) {
        setStatus("unauthenticated");
        return;
      }
      try {
        const profile = await authApi.me();
        if (cancelled) return;
        setUser({
          userId: profile.id,
          fullName: profile.fullName,
          email: profile.email,
          phone: profile.phone,
          role: profile.role,
          city: profile.city,
          state: profile.state,
          isVerified: profile.isVerified,
          avatarUrl: profile.avatarUrl,
        });
      } catch {
        if (!cancelled) clearSession();
      }
    }

    void bootstrap();
    return () => {
      cancelled = true;
    };
  }, [setUser, setStatus, clearSession]);
}
