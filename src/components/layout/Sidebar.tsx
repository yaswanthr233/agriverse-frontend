import { NavLink } from "react-router-dom";
import { Bell, Settings, LogOut, Sprout } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { useAuthStore } from "@/stores/authStore";
import { NAV_ITEMS } from "@/lib/navigation";
import { notificationsApi } from "@/api/endpoints/notifications";
import { qk } from "@/api/queryKeys";
import { useTranslation } from "@/i18n/useTranslation";
import { cn } from "@/lib/cn";

const NAV_KEY_MAP: Record<string, string> = {
  "/app/dashboard": "nav.dashboard",
  "/seller/dashboard": "nav.dashboard",
  "/admin/dashboard": "nav.dashboard",
  "/vet/dashboard": "nav.dashboard",
  "/delivery/dashboard": "nav.dashboard",
  "/app/farm": "nav.farm",
  "/app/crops": "nav.crops",
  "/app/livestock": "nav.livestock",
  "/app/expenses": "nav.expenses",
  "/app/analytics": "nav.analytics",
  "/marketplace": "nav.marketplace",
  "/app/orders": "nav.orders",
  "/seller/orders": "nav.orders",
  "/admin/orders": "nav.orders",
  "/weather": "nav.weather",
  "/market-prices": "nav.marketPrices",
  "/app/schemes": "nav.schemes",
  "/admin/schemes": "nav.schemes",
  "/app/vets": "nav.vets",
  "/app/ai": "nav.ai",
  "/seller/products": "nav.products",
  "/admin/products": "nav.products",
  "/seller/inventory": "nav.inventory",
  "/seller/revenue": "nav.revenue",
  "/admin/users": "nav.users",
  "/admin/sellers": "nav.sellers",
  "/admin/analytics": "nav.analytics",
  "/vet/appointments": "nav.appointments",
  "/vet/patients": "nav.patients",
  "/vet/earnings": "nav.earnings",
  "/delivery/available": "nav.available",
  "/delivery/active": "nav.active",
  "/delivery/history": "nav.history",
  "/delivery/earnings": "nav.earnings",
};

export function Sidebar({ onNavigate }: { onNavigate?: () => void }) {
  const { t } = useTranslation();
  const user = useAuthStore((s) => s.user);
  const clearSession = useAuthStore((s) => s.clearSession);

  const { data: unreadData } = useQuery({
    queryKey: qk.unreadNotificationsCount(),
    queryFn: notificationsApi.unreadCount,
    refetchInterval: 30000,
    enabled: Boolean(user),
  });

  if (!user) return null;

  const items = NAV_ITEMS[user.role] || [];
  const unreadCount = unreadData?.unreadCount || 0;

  const linkClass = ({ isActive }: { isActive: boolean }) =>
    cn(
      "flex items-center justify-between rounded-md px-3 py-2 text-sm transition-colors",
      isActive
        ? "bg-primary-50 font-medium text-primary-700"
        : "text-ink-700 hover:bg-surface-sunk"
    );

  return (
    <aside className="flex h-full w-[260px] flex-col border-r border-border bg-surface">
      <div className="flex h-16 items-center gap-2 border-b border-border px-5">
        <Sprout className="size-6 text-primary-600" aria-hidden="true" />
        <span className="font-display text-lg text-primary-700">AgriVerse</span>
      </div>

      <nav className="flex-1 space-y-1 overflow-y-auto p-3">
        {items.map(({ label, to, icon: Icon }) => {
          const translationKey = NAV_KEY_MAP[to];
          const displayLabel = translationKey ? t(translationKey, label) : label;

          return (
            <NavLink key={to} to={to} className={linkClass} onClick={onNavigate}>
              <div className="flex items-center gap-3">
                <Icon className="size-4 shrink-0" aria-hidden="true" />
                <span>{displayLabel}</span>
              </div>
            </NavLink>
          );
        })}
      </nav>

      <div className="space-y-1 border-t border-border p-3">
        <NavLink to="/notifications" className={linkClass} onClick={onNavigate}>
          <div className="flex items-center gap-3">
            <Bell className="size-4" aria-hidden="true" />
            <span>{t("nav.notifications", "Notifications")}</span>
          </div>
          {unreadCount > 0 && (
            <span className="flex size-5 items-center justify-center rounded-full bg-primary-600 text-[11px] font-bold text-white shadow-xs">
              {unreadCount > 9 ? "9+" : unreadCount}
            </span>
          )}
        </NavLink>

        <NavLink to="/settings" className={linkClass} onClick={onNavigate}>
          <div className="flex items-center gap-3">
            <Settings className="size-4" aria-hidden="true" />
            <span>{t("nav.settings", "Settings")}</span>
          </div>
        </NavLink>

        <button
          onClick={clearSession}
          className="flex w-full items-center gap-3 rounded-md px-3 py-2 text-sm text-danger-700 hover:bg-danger-50 transition-colors"
        >
          <LogOut className="size-4" aria-hidden="true" />
          <span>{t("nav.signOut", "Sign out")}</span>
        </button>
      </div>
    </aside>
  );
}
