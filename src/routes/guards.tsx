import type { ReactNode } from "react";
import { Navigate, useLocation } from "react-router-dom";
import { useAuthStore } from "@/stores/authStore";
import { homeRouteFor } from "@/lib/roleRoutes";
import type { Role } from "@/api/types";
import { Spinner } from "@/components/ui/Spinner";

export function RequireAuth({ children }: { children: ReactNode }) {
  const status = useAuthStore((s) => s.status);
  const location = useLocation();

  // "loading" is a real state while checking stored token on app start or refresh.
  // Showing spinner until bootstrap completes prevents false bounces to /login or /unauthorized.
  if (status === "loading") {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Spinner className="size-8" />
      </div>
    );
  }

  if (status === "unauthenticated") {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  return <>{children}</>;
}

export function RequireRole({
  roles,
  children,
}: {
  roles: Role[];
  children: ReactNode;
}) {
  const user = useAuthStore((s) => s.user);
  const status = useAuthStore((s) => s.status);
  const location = useLocation();

  // During auth bootstrapping, wait with a spinner rather than evaluating permission on undefined role
  if (status === "loading") {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Spinner className="size-8" />
      </div>
    );
  }

  if (status === "unauthenticated" || !user) {
    return <Navigate to="/login" replace />;
  }

  // If authenticated user attempts to access a route belonging to another role,
  // gracefully redirect them to their own role dashboard.
  if (!roles.includes(user.role) && user.role !== "ADMIN") {
    return <Navigate to={homeRouteFor(user.role, user.verificationStatus)} replace />;
  }

  // If veterinarian is not verified, block access to clinical/vet feature routes and redirect to verification status
  if (user.role === "VETERINARIAN" && roles.includes("VETERINARIAN")) {
    if (user.verificationStatus && user.verificationStatus !== "VERIFIED") {
      if (location.pathname !== "/vet/verification-status") {
        return <Navigate to="/vet/verification-status" replace />;
      }
    }
  }

  return <>{children}</>;
}
