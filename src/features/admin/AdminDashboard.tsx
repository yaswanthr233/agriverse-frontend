import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import {
  Users,
  ShoppingBag,
  IndianRupee,
  Package,
  ArrowRight,
  ImageOff,
} from "lucide-react";
import { adminApi } from "@/api/endpoints/admin";
import { qk } from "@/api/queryKeys";
import { formatCurrency, formatEnum } from "@/lib/format";
import { orderStatusLabel, orderStatusTone } from "@/lib/orderStatus";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Skeleton } from "@/components/ui/Skeleton";
import { ErrorState } from "@/components/feedback/ErrorState";

export function AdminDashboard() {
  // CRITICAL: Exactly ONE network request on this screen.
  const {
    data: stats,
    isLoading,
    isError,
    error,
    refetch,
  } = useQuery({
    queryKey: qk.adminDashboard(),
    queryFn: adminApi.dashboard,
  });

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-semibold text-ink-900">
          Platform Administration
        </h1>
        <p className="mt-1 text-sm text-ink-500">
          System-wide telemetry, user activity, marketplace turnover, and
          moderation queues.
        </p>
      </div>

      {isLoading && (
        <div className="space-y-6">
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <Skeleton key={i} className="h-28" />
            ))}
          </div>
          <div className="grid gap-6 lg:grid-cols-3">
            <Skeleton className="h-80" />
            <Skeleton className="h-80" />
            <Skeleton className="h-80" />
          </div>
        </div>
      )}

      {isError && <ErrorState error={error} onRetry={() => void refetch()} />}

      {!isLoading && !isError && stats && (
        <>
          {/* KPI Row */}
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <Card className="p-5">
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium text-ink-500">
                  Total Users
                </span>
                <Users
                  className="size-4 text-primary-600"
                  aria-hidden="true"
                />
              </div>
              <p className="numeric mt-2 text-2xl font-bold text-ink-900">
                {stats.totalUsers}
              </p>
              <p className="mt-1 text-xs text-ink-500">
                {stats.activeUsers} active · {stats.suspendedUsers} suspended
              </p>
            </Card>

            <Card className="p-5">
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium text-ink-500">
                  Total Orders
                </span>
                <ShoppingBag
                  className="size-4 text-primary-600"
                  aria-hidden="true"
                />
              </div>
              <p className="numeric mt-2 text-2xl font-bold text-ink-900">
                {stats.totalOrders}
              </p>
              <p className="mt-1 text-xs text-ink-500">
                Platform-wide transactions
              </p>
            </Card>

            <Card className="p-5">
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium text-ink-500">
                  Gross Platform GMV
                </span>
                <IndianRupee
                  className="size-4 text-success-600"
                  aria-hidden="true"
                />
              </div>
              <p className="numeric mt-2 text-2xl font-bold text-ink-900">
                {formatCurrency(stats.totalRevenue)}
              </p>
              <p className="mt-1 text-xs text-success-700">Delivered volume</p>
            </Card>

            <Card className="p-5">
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium text-ink-500">
                  Marketplace Products
                </span>
                <Package
                  className="size-4 text-primary-600"
                  aria-hidden="true"
                />
              </div>
              <p className="numeric mt-2 text-2xl font-bold text-ink-900">
                {stats.totalProducts}
              </p>
              <p className="mt-1 text-xs text-ink-500">
                {stats.activeProducts} live · {stats.inactiveProducts} unlisted
              </p>
            </Card>
          </div>

          {/* User Role Distribution Strip */}
          <Card className="p-5">
            <h2 className="text-xs font-semibold uppercase tracking-wider text-ink-500">
              Registered Accounts by Role
            </h2>
            <div className="mt-4 grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-5">
              {Object.entries(stats.usersByRole).map(([role, count]) => (
                <div key={role} className="rounded-md bg-surface-sunk p-3">
                  <span className="text-xs text-ink-500">
                    {formatEnum(role)}
                  </span>
                  <p className="numeric text-lg font-bold text-ink-900">
                    {count}
                  </p>
                </div>
              ))}
            </div>
          </Card>

          {/* 3 Panels: Recent Users, Recent Orders, Featured Products */}
          <div className="grid gap-6 lg:grid-cols-3">
            {/* Recent Users Panel */}
            <Card className="p-5">
              <div className="flex items-center justify-between border-b border-border pb-3">
                <h3 className="font-semibold text-ink-900">Recent Users</h3>
                <Link
                  to="/admin/users"
                  className="flex items-center gap-1 text-xs text-primary-700 hover:underline"
                >
                  All users{" "}
                  <ArrowRight className="size-3" aria-hidden="true" />
                </Link>
              </div>

              <div className="mt-3 divide-y divide-border">
                {stats.recentUsers.slice(0, 5).map((user) => (
                  <div
                    key={user.id}
                    className="flex items-center justify-between py-2.5"
                  >
                    <div>
                      <p className="text-sm font-medium text-ink-900">
                        {user.fullName}
                      </p>
                      <p className="text-xs text-ink-400">{user.email}</p>
                    </div>
                    <Badge tone="neutral">{formatEnum(user.role)}</Badge>
                  </div>
                ))}
              </div>
            </Card>

            {/* Recent Orders Panel */}
            <Card className="p-5">
              <div className="flex items-center justify-between border-b border-border pb-3">
                <h3 className="font-semibold text-ink-900">Recent Orders</h3>
                <Link
                  to="/admin/orders"
                  className="flex items-center gap-1 text-xs text-primary-700 hover:underline"
                >
                  All orders{" "}
                  <ArrowRight className="size-3" aria-hidden="true" />
                </Link>
              </div>

              <div className="mt-3 divide-y divide-border">
                {stats.recentOrders.slice(0, 5).map((order) => (
                  <div
                    key={order.id}
                    className="flex items-center justify-between py-2.5"
                  >
                    <div>
                      <p className="text-sm font-medium text-ink-900">
                        #{order.id} · {order.buyerName}
                      </p>
                      <p className="numeric text-xs text-ink-400">
                        {formatCurrency(order.totalAmount)}
                      </p>
                    </div>
                    <Badge tone={orderStatusTone(order.status)}>
                      {orderStatusLabel(order.status)}
                    </Badge>
                  </div>
                ))}
              </div>
            </Card>

            {/* Featured / Moderated Products Panel */}
            <Card className="p-5">
              <div className="flex items-center justify-between border-b border-border pb-3">
                <h3 className="font-semibold text-ink-900">Live Products</h3>
                <Link
                  to="/admin/products"
                  className="flex items-center gap-1 text-xs text-primary-700 hover:underline"
                >
                  Moderation{" "}
                  <ArrowRight className="size-3" aria-hidden="true" />
                </Link>
              </div>

              <div className="mt-3 divide-y divide-border">
                {stats.featuredProducts.slice(0, 5).map((prod) => (
                  <div
                    key={prod.id}
                    className="flex items-center justify-between py-2.5"
                  >
                    <div className="flex items-center gap-2.5">
                      <div className="flex size-9 shrink-0 items-center justify-center overflow-hidden rounded bg-surface-sunk">
                        {prod.imageUrl ? (
                          <img
                            src={prod.imageUrl}
                            alt={prod.name}
                            className="size-full object-cover"
                            onError={(e) => {
                              e.currentTarget.style.display = "none";
                            }}
                          />
                        ) : (
                          <ImageOff
                            className="size-4 text-ink-400"
                            aria-hidden="true"
                          />
                        )}
                      </div>
                      <div>
                        <p className="max-w-[140px] truncate text-sm font-medium text-ink-900">
                          {prod.name}
                        </p>
                        <p className="numeric text-xs text-ink-400">
                          {formatCurrency(prod.price)}
                        </p>
                      </div>
                    </div>
                    <Badge tone={prod.isActive ? "success" : "neutral"}>
                      {prod.isActive ? "Active" : "Inactive"}
                    </Badge>
                  </div>
                ))}
              </div>
            </Card>
          </div>
        </>
      )}
    </div>
  );
}
