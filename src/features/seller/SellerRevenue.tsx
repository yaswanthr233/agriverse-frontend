import { useQuery } from "@tanstack/react-query";
import {
  IndianRupee,
  TrendingUp,
  ShoppingBag,
  Calculator,
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
import { ordersApi } from "@/api/endpoints/orders";
import { qk } from "@/api/queryKeys";
import {
  deriveSellerStats,
  monthlyRevenue,
  topProducts,
} from "./deriveSellerStats";
import { formatCurrency } from "@/lib/format";
import { orderStatusLabel } from "@/lib/orderStatus";
import type { OrderStatus } from "@/api/types";
import { Card } from "@/components/ui/Card";
import { Skeleton } from "@/components/ui/Skeleton";
import { EmptyState } from "@/components/feedback/EmptyState";
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

export function SellerRevenue() {
  const {
    data: orders,
    isLoading,
    isError,
    error,
    refetch,
  } = useQuery({
    queryKey: qk.sellerOrders(),
    queryFn: ordersApi.seller,
  });

  const orderList = orders ?? [];
  const stats = deriveSellerStats([], orderList);

  const avgOrderValue =
    stats.totalOrders > 0
      ? (stats.revenue + stats.pendingRevenue) / stats.totalOrders
      : 0;

  const monthlyData = monthlyRevenue(orderList);
  const topList = topProducts(orderList, 5);

  // Group status distribution for Pie Chart
  const statusBuckets = new Map<string, number>();
  orderList.forEach((o) => {
    statusBuckets.set(o.status, (statusBuckets.get(o.status) ?? 0) + 1);
  });
  const statusData = [...statusBuckets.entries()].map(([status, count]) => ({
    name: orderStatusLabel(status as OrderStatus),
    value: count,
  }));

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-semibold text-ink-900">
          Revenue & Sales Analytics
        </h1>
        <p className="mt-1 text-sm text-ink-500">
          Income insights, order fulfilment breakdown, and top-selling product
          volumes.
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

      {!isLoading && !isError && orderList.length === 0 && (
        <EmptyState
          icon={IndianRupee}
          title="No revenue generated yet"
          description="Analytics will automatically calculate as soon as your customer orders are placed and delivered."
        />
      )}

      {!isLoading && !isError && orderList.length > 0 && (
        <>
          {/* KPI Cards */}
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <Card className="p-5">
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium text-ink-500">
                  Delivered Revenue
                </span>
                <IndianRupee
                  className="size-4 text-success-600"
                  aria-hidden="true"
                />
              </div>
              <p className="numeric mt-2 text-2xl font-bold text-ink-900">
                {formatCurrency(stats.revenue)}
              </p>
              <p className="mt-1 text-xs text-success-700">
                Settled and fulfilled
              </p>
            </Card>

            <Card className="p-5">
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium text-ink-500">
                  Pending Revenue
                </span>
                <TrendingUp
                  className="size-4 text-primary-600"
                  aria-hidden="true"
                />
              </div>
              <p className="numeric mt-2 text-2xl font-bold text-ink-900">
                {formatCurrency(stats.pendingRevenue)}
              </p>
              <p className="mt-1 text-xs text-ink-500">
                Orders in transit/prep
              </p>
            </Card>

            <Card className="p-5">
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium text-ink-500">
                  Total Orders
                </span>
                <ShoppingBag
                  className="size-4 text-info-600"
                  aria-hidden="true"
                />
              </div>
              <p className="numeric mt-2 text-2xl font-bold text-ink-900">
                {stats.totalOrders}
              </p>
              <p className="mt-1 text-xs text-ink-500">Processed order count</p>
            </Card>

            <Card className="p-5">
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium text-ink-500">
                  Avg Order Value
                </span>
                <Calculator
                  className="size-4 text-accent-600"
                  aria-hidden="true"
                />
              </div>
              <p className="numeric mt-2 text-2xl font-bold text-ink-900">
                {formatCurrency(avgOrderValue)}
              </p>
              <p className="mt-1 text-xs text-ink-500">Per customer order</p>
            </Card>
          </div>

          {/* Charts Row */}
          <div className="grid gap-6 lg:grid-cols-2">
            {/* Monthly Delivered Revenue */}
            <Card className="p-6">
              <h2 className="text-base font-semibold text-ink-900">
                Monthly Delivered Revenue (₹)
              </h2>
              <p className="mt-1 text-xs text-ink-500">
                Settled income grouped from completed order dates.
              </p>

              <div className="mt-6 h-72">
                {monthlyData.length === 0 ? (
                  <div className="flex h-full items-center justify-center text-xs text-ink-400">
                    No delivered orders yet to chart monthly revenue.
                  </div>
                ) : (
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={monthlyData}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} />
                      <XAxis dataKey="month" tick={{ fontSize: 12 }} />
                      <YAxis tick={{ fontSize: 12 }} />
                      <Tooltip
                        formatter={(val: unknown) => [
                          formatCurrency(Number(val)),
                          "Revenue",
                        ]}
                      />
                      <Bar
                        dataKey="revenue"
                        fill="#16a34a"
                        radius={[4, 4, 0, 0]}
                      />
                    </BarChart>
                  </ResponsiveContainer>
                )}
              </div>
            </Card>

            {/* Order Status Distribution */}
            <Card className="p-6">
              <h2 className="text-base font-semibold text-ink-900">
                Order Status Distribution
              </h2>
              <p className="mt-1 text-xs text-ink-500">
                Fulfilment progression across all customer purchases.
              </p>

              <div className="mt-6 h-72">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={statusData}
                      dataKey="value"
                      nameKey="name"
                      cx="50%"
                      cy="50%"
                      outerRadius={85}
                      label={({ name, percent }: { name?: string; percent?: number }) =>
                        `${name ?? ""} ${percent !== undefined ? `(${(percent * 100).toFixed(0)}%)` : ""}`
                      }
                    >
                      {statusData.map((_, index) => (
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
          </div>

          {/* Top Products Table */}
          <Card className="p-6">
            <h2 className="text-base font-semibold text-ink-900">
              Top Selling Products by Units Sold
            </h2>
            <p className="mt-1 text-xs text-ink-500">
              Most requested items across all placed order line items.
            </p>

            <div className="mt-4 divide-y divide-border">
              {topList.map((item, i) => (
                <div key={i} className="flex items-center justify-between py-3">
                  <div className="flex items-center gap-3">
                    <span className="flex size-6 items-center justify-center rounded-full bg-primary-100 text-xs font-semibold text-primary-700">
                      {i + 1}
                    </span>
                    <span className="font-medium text-ink-900">
                      {item.name}
                    </span>
                  </div>
                  <span className="numeric text-sm font-semibold text-ink-900">
                    {item.quantity} units sold
                  </span>
                </div>
              ))}
            </div>
          </Card>
        </>
      )}
    </div>
  );
}
