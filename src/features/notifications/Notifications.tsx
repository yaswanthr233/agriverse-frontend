import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Link, useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import {
  Bell,
  CheckCheck,
  ShoppingCart,
  Stethoscope,
  Landmark,
  CloudSun,
  Coins,
  Sparkles,
  ChevronRight,
  CheckCircle2,
  Trash2,
} from "lucide-react";
import { notificationsApi, type NotificationItem } from "@/api/endpoints/notifications";
import { qk } from "@/api/queryKeys";
import { formatRelativeTime } from "@/lib/format";
import { useTranslation } from "@/i18n/useTranslation";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Skeleton } from "@/components/ui/Skeleton";
import { EmptyState } from "@/components/feedback/EmptyState";
import { ErrorState } from "@/components/feedback/ErrorState";
import { cn } from "@/lib/cn";

export function Notifications() {
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const [filter, setFilter] = useState<"all" | "unread">("all");

  const {
    data: items,
    isLoading,
    isError,
    error,
    refetch,
  } = useQuery({
    queryKey: qk.notifications(),
    queryFn: notificationsApi.list,
  });

  const markReadMutation = useMutation({
    mutationFn: (id: string) => notificationsApi.markAsRead(id),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: qk.notifications() });
      void queryClient.invalidateQueries({ queryKey: qk.unreadNotificationsCount() });
    },
  });

  const markAllMutation = useMutation({
    mutationFn: notificationsApi.markAllAsRead,
    onSuccess: () => {
      toast.success(t("notifications.markedAllSuccess", "All notifications marked as read."));
      void queryClient.invalidateQueries({ queryKey: qk.notifications() });
      void queryClient.invalidateQueries({ queryKey: qk.unreadNotificationsCount() });
    },
    onError: () => {
      toast.error(t("action.retry", "Couldn't mark all as read. Please try again."));
    },
  });

  const dismissMutation = useMutation({
    mutationFn: (id: string) => notificationsApi.dismiss(id),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: qk.notifications() });
      void queryClient.invalidateQueries({ queryKey: qk.unreadNotificationsCount() });
    },
  });

  if (isLoading) {
    return (
      <div className="max-w-3xl space-y-4">
        <Skeleton className="h-12 w-48 rounded-lg" />
        <div className="space-y-3 pt-2">
          <Skeleton className="h-20 w-full rounded-xl" />
          <Skeleton className="h-20 w-full rounded-xl" />
          <Skeleton className="h-20 w-full rounded-xl" />
        </div>
      </div>
    );
  }

  if (isError) {
    return (
      <div className="max-w-3xl">
        <ErrorState error={error} onRetry={() => void refetch()} />
      </div>
    );
  }

  const allNotifications = items || [];
  const unreadCount = allNotifications.filter((n) => !n.read).length;
  const filteredItems =
    filter === "unread" ? allNotifications.filter((n) => !n.read) : allNotifications;

  const getIcon = (type: NotificationItem["type"]) => {
    switch (type) {
      case "order":
        return <ShoppingCart className="size-5 text-primary-600" />;
      case "vet":
        return <Stethoscope className="size-5 text-accent-600" />;
      case "scheme":
        return <Landmark className="size-5 text-warning-700" />;
      case "weather":
        return <CloudSun className="size-5 text-primary-500" />;
      case "market":
        return <Coins className="size-5 text-success-700" />;
      case "ai":
        return <Sparkles className="size-5 text-accent-600" />;
      default:
        return <Bell className="size-5 text-ink-600" />;
    }
  };

  const handleNotificationClick = (item: NotificationItem) => {
    if (!item.read) {
      markReadMutation.mutate(item.id);
    }
    if (item.link) {
      navigate(item.link);
    }
  };

  return (
    <div className="max-w-3xl space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-ink-900 flex items-center gap-2.5">
            <Bell className="size-6 text-primary-600" />
            {t("notifications.title", "Notifications")}
            {unreadCount > 0 && (
              <Badge tone="primary" className="ml-1 text-xs">
                {unreadCount} {t("topbar.unread", "unread")}
              </Badge>
            )}
          </h1>
          <p className="mt-1 text-sm text-ink-500">
            {t(
              "notifications.subtitle",
              "Stay updated on your farm activities, orders, advisory warnings, and market prices."
            )}
          </p>
        </div>

        {unreadCount > 0 && (
          <Button
            variant="outline"
            size="sm"
            onClick={() => markAllMutation.mutate()}
            loading={markAllMutation.isPending}
            className="self-start sm:self-center"
          >
            <CheckCheck className="mr-1.5 size-4" />
            {t("action.markAllRead", "Mark all as read")}
          </Button>
        )}
      </div>

      {/* Tabs */}
      <div className="flex gap-2 border-b border-border pb-3">
        <button
          type="button"
          onClick={() => setFilter("all")}
          className={cn(
            "rounded-full px-4 py-1.5 text-xs font-semibold transition-colors",
            filter === "all"
              ? "bg-primary-700 text-white shadow-xs"
              : "bg-surface-sunk text-ink-600 hover:bg-surface-sunk/80 hover:text-ink-900"
          )}
        >
          {t("notifications.allTab", "All")} ({allNotifications.length})
        </button>

        <button
          type="button"
          onClick={() => setFilter("unread")}
          className={cn(
            "rounded-full px-4 py-1.5 text-xs font-semibold transition-colors",
            filter === "unread"
              ? "bg-primary-700 text-white shadow-xs"
              : "bg-surface-sunk text-ink-600 hover:bg-surface-sunk/80 hover:text-ink-900"
          )}
        >
          {t("notifications.unreadTab", "Unread")} ({unreadCount})
        </button>
      </div>

      {/* List / Empty State */}
      {filteredItems.length === 0 ? (
        <Card className="p-8">
          <EmptyState
            icon={CheckCircle2}
            title={t("notifications.emptyTitle", "You're all caught up!")}
            description={t(
              "notifications.emptyDesc",
              "No new notifications right now. Important farm and market updates will appear here."
            )}
          />
        </Card>
      ) : (
        <div className="space-y-2.5">
          {filteredItems.map((item) => (
            <Card
              key={item.id}
              onClick={() => handleNotificationClick(item)}
              className={cn(
                "group relative flex items-start gap-4 p-4 transition-all cursor-pointer hover:border-primary-300 hover:shadow-xs",
                !item.read
                  ? "bg-primary-50/25 border-primary-200"
                  : "bg-surface hover:bg-surface-sunk/30"
              )}
            >
              {/* Unread indicator dot */}
              {!item.read && (
                <span
                  className="absolute left-2 top-1/2 -translate-y-1/2 size-2 rounded-full bg-primary-600"
                  aria-hidden="true"
                />
              )}

              {/* Icon Container */}
              <div
                className={cn(
                  "flex size-10 shrink-0 items-center justify-center rounded-xl",
                  !item.read ? "bg-primary-100/70" : "bg-surface-sunk text-ink-500"
                )}
              >
                {getIcon(item.type)}
              </div>

              {/* Text content */}
              <div className="min-w-0 flex-1 space-y-1">
                <div className="flex items-center justify-between gap-2">
                  <h3
                    className={cn(
                      "text-sm",
                      !item.read
                        ? "font-bold text-ink-900"
                        : "font-medium text-ink-800"
                    )}
                  >
                    {item.title}
                  </h3>
                  <span className="text-[11px] text-ink-400 whitespace-nowrap">
                    {formatRelativeTime(item.createdAt)}
                  </span>
                </div>

                <p className="text-xs text-ink-600 line-clamp-2 leading-relaxed">
                  {item.message}
                </p>
              </div>

              {/* Action buttons */}
              <div className="flex items-center gap-1 self-center pl-2">
                <button
                  type="button"
                  title="Dismiss notification"
                  aria-label="Dismiss notification"
                  onClick={(e) => {
                    e.stopPropagation();
                    dismissMutation.mutate(item.id);
                  }}
                  className="rounded-lg p-1.5 text-ink-400 opacity-0 group-hover:opacity-100 hover:bg-surface-sunk hover:text-ink-700 transition-opacity"
                >
                  <Trash2 className="size-4" />
                </button>

                {item.link && (
                  <ChevronRight className="size-4 text-ink-400 group-hover:text-primary-600 transition-colors" />
                )}
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

