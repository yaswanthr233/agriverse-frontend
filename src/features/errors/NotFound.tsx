import { Link } from "react-router-dom";
import { Button } from "@/components/ui/Button";

export function NotFound() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-surface-alt px-4 text-center">
      <p className="font-display text-6xl text-primary-600">404</p>
      <h1 className="mt-4 text-2xl font-semibold text-ink-900">Page not found</h1>
      <p className="mt-2 max-w-sm text-ink-500">
        The page you're looking for doesn't exist or has moved.
      </p>
      <Link to="/" className="mt-6">
        <Button>Go Home</Button>
      </Link>
    </div>
  );
}
