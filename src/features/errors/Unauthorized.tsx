import { Link } from "react-router-dom";
import { Lock } from "lucide-react";
import { useAuthStore } from "@/stores/authStore";
import { homeRouteFor } from "@/lib/roleRoutes";
import { Button } from "@/components/ui/Button";

export function Unauthorized() {
  const user = useAuthStore((s) => s.user);

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-surface-alt px-4 text-center">
      <Lock className="size-12 text-ink-400" aria-hidden="true" />
      <h1 className="mt-4 text-2xl font-semibold text-ink-900">
        You don't have access
      </h1>
      <p className="mt-2 max-w-sm text-ink-500">
        Your account doesn't have permission to view this page. You are still
        signed in.
      </p>
      <Link to={homeRouteFor(user?.role)} className="mt-6">
        <Button>Back to my dashboard</Button>
      </Link>
    </div>
  );
}
