import { useQuery } from "@tanstack/react-query";
import {
  IndianRupee,
  ShoppingBag,
  Calculator,
  Users,
  CheckCircle,
  XCircle,
} from "lucide-react";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  PieChart,
  Pie,
  Cell,
  Legend,
} from "recharts";
import { adminApi } from "@/api/endpoints/admin";
import { qk } from "@/api/queryKeys";
import { formatCurrency, formatEnum } from "@/lib/format";
import { orderStatusLabel } from "@/lib/orderStatus";
import type { OrderStatus } from "@/api/types";
import { Card } from "@/components/ui/Card";
import { Skeleton } from "@/components/ui/Skeleton";
import { ErrorState } from "@/components/feedback/ErrorState";

const PIE_COLORS = [
  "#16a34a",
  "#2563eb",
  "#f59e0b",
  "#8b5cf6",
  "#06b6d4",
  "#ef4444",
  "#64748b",
];

export function AdminAnalytics() {
  // CRITICAL: There is no /api/admin/analytics endpoint.
  // Everything here comes from AdminDashboardStats. Do not invent one.
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

  const avgOrderValue =
    stats && stats.totalOrders > 0
      ? stats.totalRevenue / stats.totalOrders
      : 0;

  const usersByRole = stats
    ? Object.entries(stats.usersByRole).map(([role, count]) => ({
        name: formatEnum(role),
        value: count,
      }))
    : [];

  const ordersByStatus = stats
    ? Object.entries(stats.ordersByStatus).map(([status, count]) => ({
        name: orderStatusLabel(status as OrderStatus),
        count,
      }))
    : [];

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-semibold text-ink-900">
          Platform Analytics & Insights
        </h1>
        <p className="mt-1 text-sm text-ink-500">
          User demographics, order fulfilment lifecycle analytics, and catalog
          health.
        </p>
      </div>

      {isLoading && (
        <div className="space-y-6">
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <Skeleton key={i} className="h-28" />
            ))}
          </div>
          <div className="grid gap-6 lg:grid-cols-2">
            <Skeleton className="h-80" />
            <Skeleton className="h-80" />
          </div>
        </div>
      )}

      {isError && <ErrorState error={error} onRetry={() => void refetch()} />}

      {!isLoading && !isError && stats && (
        <>
          {/* KPI Overview */}
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
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
              <p className="mt-1 text-xs text-ink-500">Lifetime transactions</p>
            </Card>

            <Card className="p-5">
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium text-ink-500">
                  Avg Platform Order
                </span>
                <Calculator
                  className="size-4 text-accent-600"
                  aria-hidden="true"
                />
              </div>
              <p className="numeric mt-2 text-2xl font-bold text-ink-900">
                {formatCurrency(avgOrderValue)}
              </p>
              <p className="mt-1 text-xs text-ink-500">Per customer cart</p>
            </Card>

            <Card className="p-5">
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium text-ink-500">
                  Active Users Ratio
                </span>
                <Users className="size-4 text-info-600" aria-hidden="true" />
              </div>
              <p className="numeric mt-2 text-2xl font-bold text-ink-900">
                {stats.totalUsers > 0
                  ? `${((stats.activeUsers / stats.totalUsers) * 100).toFixed(0)}%`
                  : "0%"}
              </p>
              <p className="mt-1 text-xs text-ink-500">
                {stats.activeUsers} of {stats.totalUsers} enabled
              </p>
            </Card>
          </div>

          {/* Charts Row */}
          <div className="grid gap-6 lg:grid-cols-2">
            {/* User Role Demographics */}
            <Card className="p-6">
              <h2 className="text-base font-semibold text-ink-900">
                User Role Demographics
              </h2>
              <p className="mt-1 text-xs text-ink-500">
                Account distribution across platform participant roles.
              </p>

              <div className="mt-6 h-72">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={usersByRole}
                      dataKey="value"
                      nameKey="name"
                      cx="50%"
                      cy="50%"
                      outerRadius={85}
                      label={({
                        name,
                        percent,
                      }: {
                        name?: string;
                        percent?: number;
                      }) =>
                        `${name ?? ""} ${
                          percent !== undefined
                            ? `(${(percent * 100).toFixed(0)}%)`
                            : ""
                        }`
                      }
                    >
                      {usersByRole.map((_, index) => (
                        <Cell
                          key={`cell-${index}`}
                          fill={PIE_COLORS[index % PIE_COLORS.length]}
                        />
                      ))}
                    </Pie>
                    <Tooltip />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </Card>

            {/* Orders by Status */}
            <Card className="p-6">
              <h2 className="text-base font-semibold text-ink-900">
                Orders by Fulfilment Status
              </h2>
              <p className="mt-1 text-xs text-ink-500">
                Distribution of transactions across the complete lifecycle.
              </p>

              <div className="mt-6 h-72">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={ordersByStatus}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} />
                    <XAxis
                      dataKey="name"
                      tick={{ fontSize: 11 }}
                      interval={0}
                      angle={-20}
                      textAnchor="end"
                      height={40}
                    />
                    <YAxis tick={{ fontSize: 12 }} />
                    <Tooltip />
                    <Bar
                      dataKey="count"
                      fill="#2563eb"
                      radius={[4, 4, 0, 0]}
                    />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </Card>
          </div>

          {/* Product Catalog Health */}
          <Card className="p-6">
            <h2 className="text-base font-semibold text-ink-900">
              Product Catalog Moderation & Health
            </h2>
            <p className="mt-1 text-xs text-ink-500">
              Total items submitted by sellers vs. actively listed on the
              marketplace.
            </p>

            <div className="mt-4 grid gap-4 sm:grid-cols-2">
              <div className="flex items-center gap-3 rounded-lg border border-success-200 bg-success-50/50 p-4">
                <CheckCircle
                  className="size-8 text-success-600"
                  aria-hidden="true"
                />
                <div>
                  <span className="numeric text-2xl font-bold text-success-900">
                    {stats.activeProducts}
                  </span>
                  <p className="text-xs text-success-700">
                    Active & visible in public marketplace
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-3 rounded-lg border border-danger-200 bg-danger-50/50 p-4">
                <XCircle
                  className="size-8 text-danger-600"
                  aria-hidden="true"
                />
                <div>
                  <span className="numeric text-2xl font-bold text-danger-900">
                    {stats.inactiveProducts}
                  </span>
                  <p className="text-xs text-danger-700">
                    Unlisted, disabled or moderated products
                  </p>
                </div>
              </div>
            </div>
          </Card>
        </>
      )}
    </div>
  );
}
