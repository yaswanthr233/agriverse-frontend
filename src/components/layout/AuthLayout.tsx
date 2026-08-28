import { Outlet, Link } from "react-router-dom";
import { Sprout } from "lucide-react";

export function AuthLayout() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-surface-alt px-4 py-12">
      <Link to="/" className="mb-8 flex items-center gap-2">
        <Sprout className="size-7 text-primary-600" aria-hidden="true" />
        <span className="font-display text-2xl text-primary-700">AgriVerse</span>
      </Link>
      <div className="w-full max-w-md rounded-lg border border-border bg-surface p-6 shadow-sm sm:p-8">
        <Outlet />
      </div>
    </div>
  );
}
