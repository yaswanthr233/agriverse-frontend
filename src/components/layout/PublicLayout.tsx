import { Outlet, Link, NavLink } from "react-router-dom";
import { Sprout } from "lucide-react";
import { useAuthStore } from "@/stores/authStore";
import { homeRouteFor } from "@/lib/roleRoutes";
import { Button } from "@/components/ui/Button";
import { Footer } from "./Footer";
import { cn } from "@/lib/cn";

// Public nav links ONLY to endpoints that work without a token.
// Schemes and search require auth — they must not appear here.
const PUBLIC_LINKS = [
  { label: "Marketplace", to: "/marketplace" },
  { label: "Livestock", to: "/livestock" },
  { label: "Weather", to: "/weather" },
  { label: "Market Prices", to: "/market-prices" },
];

export function PublicLayout() {
  const user = useAuthStore((s) => s.user);

  return (
    <div className="flex min-h-screen flex-col bg-surface-alt">
      <header className="border-b border-border bg-surface">
        <div className="mx-auto flex h-16 max-w-[1280px] items-center gap-6 px-4">
          <Link to="/" className="flex items-center gap-2">
            <Sprout className="size-6 text-primary-600" aria-hidden="true" />
            <span className="font-display text-lg text-primary-700">
              AgriVerse
            </span>
          </Link>

          <nav className="hidden gap-5 md:flex">
            {PUBLIC_LINKS.map(({ label, to }) => (
              <NavLink
                key={to}
                to={to}
                className={({ isActive }) =>
                  cn(
                    "text-sm",
                    isActive
                      ? "font-medium text-primary-700"
                      : "text-ink-700 hover:text-ink-900",
                  )
                }
              >
                {label}
              </NavLink>
            ))}
          </nav>

          <div className="ml-auto">
            {user ? (
              <Link to={homeRouteFor(user.role)}>
                <Button size="sm">Go to Dashboard</Button>
              </Link>
            ) : (
              <Link to="/login">
                <Button size="sm">Sign in</Button>
              </Link>
            )}
          </div>
        </div>
      </header>

      <main className="flex-1">
        <Outlet />
      </main>
      <Footer />
    </div>
  );
}
