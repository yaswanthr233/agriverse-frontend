import { useState, useRef, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  Menu,
  ShoppingBag,
  Bell,
  User as UserIcon,
  Settings,
  LogOut,
  ChevronDown,
  CheckCheck,
  ChevronRight,
} from "lucide-react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuthStore } from "@/stores/authStore";
import { useCartStore } from "@/stores/cartStore";
import { notificationsApi } from "@/api/endpoints/notifications";
import { qk } from "@/api/queryKeys";
import { formatEnum, formatRelativeTime } from "@/lib/format";
import { useTranslation } from "@/i18n/useTranslation";
import { Badge } from "@/components/ui/Badge";
import { cn } from "@/lib/cn";

export function Topbar({ onMenuClick }: { onMenuClick: () => void }) {
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  const user = useAuthStore((s) => s.user);
  const clearSession = useAuthStore((s) => s.clearSession);
  const cartCount = useCartStore((s) => s.count());
  const navigate = useNavigate();

  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [notifOpen, setNotifOpen] = useState(false);

  const menuRef = useRef<HTMLDivElement>(null);
  const notifRef = useRef<HTMLDivElement>(null);

  const isFarmer = user?.role === "FARMER";

  // Fetch live notifications and unread count
  const { data: unreadData } = useQuery({
    queryKey: qk.unreadNotificationsCount(),
    queryFn: notificationsApi.unreadCount,
    refetchInterval: 30000,
    enabled: Boolean(user),
  });

  const { data: notifList } = useQuery({
    queryKey: qk.notifications(),
    queryFn: notificationsApi.list,
    enabled: Boolean(user && notifOpen),
  });

  const markAllMutation = useMutation({
    mutationFn: notificationsApi.markAllAsRead,
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: qk.notifications() });
      void queryClient.invalidateQueries({ queryKey: qk.unreadNotificationsCount() });
    },
  });

  const unreadCount = unreadData?.unreadCount || 0;
  const recentNotifications = (notifList || []).slice(0, 5);

  // Close menus on click outside or escape key
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setDropdownOpen(false);
      }
      if (notifRef.current && !notifRef.current.contains(event.target as Node)) {
        setNotifOpen(false);
      }
    }

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setDropdownOpen(false);
        setNotifOpen(false);
      }
    }

    if (dropdownOpen || notifOpen) {
      document.addEventListener("mousedown", handleClickOutside);
      document.addEventListener("keydown", handleKeyDown);
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [dropdownOpen, notifOpen]);

  const handleSignOut = () => {
    setDropdownOpen(false);
    clearSession();
    navigate("/login");
  };

  const roleColorTone: Record<string, "success" | "warning" | "neutral" | "danger"> = {
    FARMER: "success",
    SELLER: "warning",
    VETERINARIAN: "neutral",
    DELIVERY_PARTNER: "neutral",
    ADMIN: "danger",
  };

  const currentTone = user?.role ? roleColorTone[user.role] || "neutral" : "neutral";

  return (
    <header className="flex h-16 items-center gap-4 border-b border-border bg-surface px-5">
      <button
        onClick={onMenuClick}
        aria-label="Open navigation"
        className="rounded-md p-2 text-ink-700 hover:bg-surface-sunk lg:hidden"
      >
        <Menu className="size-5" aria-hidden="true" />
      </button>

      <div className="ml-auto flex items-center gap-3 sm:gap-4">
        {isFarmer && (
          <Link
            to="/app/cart"
            className="relative rounded-full p-2 text-ink-600 hover:bg-surface-sunk transition-colors"
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

        {/* Topbar Notification Dropdown */}
        <div className="relative" ref={notifRef}>
          <button
            type="button"
            onClick={() => {
              setNotifOpen((prev) => !prev);
              setDropdownOpen(false);
            }}
            aria-label={t("topbar.notifications", "Notifications")}
            aria-expanded={notifOpen}
            className={cn(
              "relative rounded-full p-2 text-ink-600 transition-colors focus:outline-none focus:ring-2 focus:ring-primary-500",
              notifOpen ? "bg-surface-sunk text-primary-700" : "hover:bg-surface-sunk"
            )}
          >
            <Bell className="size-5" aria-hidden="true" />
            {unreadCount > 0 && (
              <span className="absolute -right-1 -top-1 flex size-5 items-center justify-center rounded-full bg-primary-600 text-[11px] font-bold text-white shadow-xs">
                {unreadCount > 9 ? "9+" : unreadCount}
              </span>
            )}
          </button>

          {/* Quick Notification Panel */}
          {notifOpen && (
            <div
              role="dialog"
              className="absolute right-0 top-full mt-2 w-80 sm:w-96 rounded-xl border border-border bg-surface shadow-xl z-50 animate-in fade-in slide-in-from-top-2 duration-150 overflow-hidden"
            >
              <div className="flex items-center justify-between border-b border-border px-4 py-3 bg-surface-sunk/30">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-bold text-ink-900">
                    {t("topbar.notifications", "Notifications")}
                  </span>
                  {unreadCount > 0 && (
                    <Badge tone="primary" className="text-[10px]">
                      {unreadCount} {t("topbar.unread", "unread")}
                    </Badge>
                  )}
                </div>
                {unreadCount > 0 && (
                  <button
                    type="button"
                    onClick={() => markAllMutation.mutate()}
                    className="text-xs font-medium text-primary-600 hover:text-primary-800 flex items-center gap-1"
                  >
                    <CheckCheck className="size-3.5" />
                    {t("action.markAllRead", "Mark all read")}
                  </button>
                )}
              </div>

              <div className="max-h-72 overflow-y-auto divide-y divide-border/60">
                {recentNotifications.length === 0 ? (
                  <div className="p-6 text-center text-xs text-ink-500">
                    {t("topbar.noNotifications", "No notifications yet")}
                  </div>
                ) : (
                  recentNotifications.map((item) => (
                    <div
                      key={item.id}
                      onClick={() => {
                        setNotifOpen(false);
                        if (!item.read) {
                          void notificationsApi.markAsRead(item.id);
                          void queryClient.invalidateQueries({ queryKey: qk.unreadNotificationsCount() });
                        }
                        if (item.link) navigate(item.link);
                        else navigate("/notifications");
                      }}
                      className={cn(
                        "p-3 text-left transition-colors cursor-pointer hover:bg-surface-sunk/50",
                        !item.read ? "bg-primary-50/20" : ""
                      )}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <p
                          className={cn(
                            "text-xs leading-tight",
                            !item.read ? "font-bold text-ink-900" : "font-medium text-ink-700"
                          )}
                        >
                          {item.title}
                        </p>
                        <span className="text-[10px] text-ink-400 whitespace-nowrap">
                          {formatRelativeTime(item.createdAt)}
                        </span>
                      </div>
                      <p className="text-[11px] text-ink-500 line-clamp-1 mt-0.5">
                        {item.message}
                      </p>
                    </div>
                  ))
                )}
              </div>

              <div className="border-t border-border p-2 bg-surface-sunk/20 text-center">
                <Link
                  to="/notifications"
                  onClick={() => setNotifOpen(false)}
                  className="inline-flex items-center gap-1 text-xs font-semibold text-primary-700 hover:text-primary-900 p-1"
                >
                  <span>{t("topbar.viewAll", "View all notifications")}</span>
                  <ChevronRight className="size-3.5" />
                </Link>
              </div>
            </div>
          )}
        </div>

        {/* Top-Right Profile Dropdown Area */}
        <div className="relative" ref={menuRef}>
          <button
            type="button"
            onClick={() => {
              setDropdownOpen((prev) => !prev);
              setNotifOpen(false);
            }}
            aria-expanded={dropdownOpen}
            aria-haspopup="menu"
            className={cn(
              "flex items-center gap-2.5 rounded-lg p-1.5 transition-colors focus:outline-none focus:ring-2 focus:ring-primary-500",
              dropdownOpen ? "bg-surface-sunk" : "hover:bg-surface-sunk"
            )}
          >
            <div className="flex size-9 shrink-0 items-center justify-center overflow-hidden rounded-full border border-primary-200 bg-primary-100 text-sm font-medium text-primary-700">
              {user?.avatarUrl ? (
                <img
                  src={user.avatarUrl}
                  alt={user.fullName}
                  className="size-full object-cover"
                />
              ) : (
                user?.fullName?.charAt(0).toUpperCase() ?? "?"
              )}
            </div>

            <div className="hidden text-left sm:block">
              <p className="text-xs font-semibold text-ink-900 leading-tight">
                {user?.fullName}
              </p>
              <p className="text-[10px] text-ink-500 capitalize">
                {user?.role ? formatEnum(user.role).toLowerCase() : "User"}
              </p>
            </div>

            <ChevronDown
              className={cn(
                "size-4 text-ink-400 transition-transform duration-200",
                dropdownOpen && "rotate-180 text-primary-600"
              )}
              aria-hidden="true"
            />
          </button>

          {/* Dropdown Menu Modal / Card */}
          {dropdownOpen && (
            <div
              role="menu"
              className="absolute right-0 top-full mt-2 w-64 rounded-xl border border-border bg-surface p-1.5 shadow-lg z-50 animate-in fade-in slide-in-from-top-2 duration-150"
            >
              {/* Header Info */}
              <div className="px-3 py-2.5 border-b border-border/80">
                <div className="flex items-center gap-2.5">
                  <div className="flex size-10 shrink-0 items-center justify-center overflow-hidden rounded-full bg-primary-100 text-sm font-bold text-primary-700">
                    {user?.avatarUrl ? (
                      <img
                        src={user.avatarUrl}
                        alt={user.fullName}
                        className="size-full object-cover"
                      />
                    ) : (
                      user?.fullName?.charAt(0).toUpperCase() ?? "?"
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-semibold text-ink-900">
                      {user?.fullName}
                    </p>
                    <p className="truncate text-xs text-ink-500 font-mono">
                      {user?.email}
                    </p>
                  </div>
                </div>
                <div className="mt-2">
                  <Badge tone={currentTone} className="text-[10px]">
                    {user?.role ? formatEnum(user.role) : "User"}
                  </Badge>
                </div>
              </div>

              {/* Navigation Links */}
              <div className="py-1">
                <Link
                  to="/profile"
                  role="menuitem"
                  onClick={() => setDropdownOpen(false)}
                  className="flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm text-ink-700 hover:bg-surface-sunk transition-colors"
                >
                  <UserIcon className="size-4 text-ink-500" aria-hidden="true" />
                  <span>{t("nav.profile", "Profile")}</span>
                </Link>

                <Link
                  to="/settings"
                  role="menuitem"
                  onClick={() => setDropdownOpen(false)}
                  className="flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm text-ink-700 hover:bg-surface-sunk transition-colors"
                >
                  <Settings className="size-4 text-ink-500" aria-hidden="true" />
                  <span>{t("nav.settings", "Settings")}</span>
                </Link>
              </div>

              {/* Sign out */}
              <div className="border-t border-border/80 pt-1">
                <button
                  type="button"
                  role="menuitem"
                  onClick={handleSignOut}
                  className="flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-sm text-danger-700 hover:bg-danger-50 transition-colors"
                >
                  <LogOut className="size-4 text-danger-600" aria-hidden="true" />
                  <span>{t("nav.signOut", "Sign out")}</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
