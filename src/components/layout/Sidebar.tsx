import { NavLink } from "react-router-dom";
import { Bell, Settings, LogOut, Sprout } from "lucide-react";
import { useAuthStore } from "@/stores/authStore";
import { NAV_ITEMS } from "@/lib/navigation";
import { cn } from "@/lib/cn";

export function Sidebar({ onNavigate }: { onNavigate?: () => void }) {
  const user = useAuthStore((s) => s.user);
  const clearSession = useAuthStore((s) => s.clearSession);
  if (!user) return null;

  const items = NAV_ITEMS[user.role];

  const linkClass = ({ isActive }: { isActive: boolean }) =>
    cn(
      "flex items-center gap-3 rounded-md px-3 py-2 text-sm transition-colors",
      isActive
        ? "bg-primary-50 font-medium text-primary-700"
        : "text-ink-700 hover:bg-surface-sunk",
    );

  return (
    <aside className="flex h-full w-[260px] flex-col border-r border-border bg-surface">
      <div className="flex h-16 items-center gap-2 border-b border-border px-5">
        <Sprout className="size-6 text-primary-600" aria-hidden="true" />
        <span className="font-display text-lg text-primary-700">AgriVerse</span>
      </div>

      <nav className="flex-1 space-y-1 overflow-y-auto p-3">
        {items.map(({ label, to, icon: Icon }) => (
          <NavLink key={to} to={to} className={linkClass} onClick={onNavigate}>
            <Icon className="size-4 shrink-0" aria-hidden="true" />
            {label}
          </NavLink>
        ))}
      </nav>

      <div className="space-y-1 border-t border-border p-3">
        <NavLink to="/notifications" className={linkClass} onClick={onNavigate}>
          <Bell className="size-4" aria-hidden="true" /> Notifications
        </NavLink>
        <NavLink to="/settings" className={linkClass} onClick={onNavigate}>
          <Settings className="size-4" aria-hidden="true" /> Settings
        </NavLink>
        <button
          onClick={clearSession}
          className="flex w-full items-center gap-3 rounded-md px-3 py-2 text-sm text-danger-700 hover:bg-danger-50"
        >
          <LogOut className="size-4" aria-hidden="true" /> Sign out
        </button>
      </div>
    </aside>
  );
}
