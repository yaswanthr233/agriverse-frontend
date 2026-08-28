import { Menu, ShoppingBag } from "lucide-react";
import { Link } from "react-router-dom";
import { useAuthStore } from "@/stores/authStore";
import { useCartStore } from "@/stores/cartStore";

export function Topbar({ onMenuClick }: { onMenuClick: () => void }) {
  const user = useAuthStore((s) => s.user);
  const cartCount = useCartStore((s) => s.count());

  const isFarmer = user?.role === "FARMER";

  return (
    <header className="flex h-16 items-center gap-4 border-b border-border bg-surface px-5">
      <button
        onClick={onMenuClick}
        aria-label="Open navigation"
        className="rounded-md p-2 text-ink-700 hover:bg-surface-sunk lg:hidden"
      >
        <Menu className="size-5" aria-hidden="true" />
      </button>

      <div className="ml-auto flex items-center gap-4">
        {isFarmer && (
          <Link
            to="/app/cart"
            className="relative rounded-full p-2 text-ink-600 hover:bg-surface-sunk"
            aria-label="Shopping cart"
          >
            <ShoppingBag className="size-5" aria-hidden="true" />
            {cartCount > 0 && (
              <span className="absolute -right-1 -top-1 flex size-5 items-center justify-center rounded-full bg-primary-600 text-[11px] font-bold text-white">
                {cartCount}
              </span>
            )}
          </Link>
        )}

        <span className="hidden text-sm text-ink-500 sm:inline">
          {user?.fullName}
        </span>
        <div className="flex size-9 items-center justify-center rounded-full bg-primary-100 text-sm font-medium text-primary-700">
          {user?.fullName?.charAt(0).toUpperCase() ?? "?"}
        </div>
      </div>
    </header>
  );
}
