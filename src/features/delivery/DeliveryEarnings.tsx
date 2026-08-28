import { useQuery } from "@tanstack/react-query";
import {
  IndianRupee,
  Truck,
  TrendingUp,
  CheckCircle2,
  Receipt,
} from "lucide-react";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
} from "recharts";
import { deliveryApi } from "@/api/endpoints/deliveryPortal";
import { qk } from "@/api/queryKeys";
import { formatCurrency, formatDate } from "@/lib/format";
import { Card } from "@/components/ui/Card";
import { Table } from "@/components/ui/Table";
import { Skeleton } from "@/components/ui/Skeleton";
import { EmptyState } from "@/components/feedback/EmptyState";
import { ErrorState } from "@/components/feedback/ErrorState";

export function DeliveryEarnings() {
  const {
    data: earnings,
    isLoading,
    isError,
    error,
    refetch,
  } = useQuery({
    queryKey: qk.deliveryEarnings(),
    queryFn: deliveryApi.earnings,
  });

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-semibold text-ink-900">
          Delivery Partner Earnings
        </h1>
        <p className="mt-1 text-sm text-ink-500">
          Fulfilment income, weekly delivery bonuses, and recent transaction
          settlements.
        </p>
      </div>

      {isLoading && (
        <div className="space-y-6">
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <Skeleton key={i} className="h-28" />
            ))}
          </div>
          <Skeleton className="h-72 w-full" />
          <Skeleton className="h-64 w-full" />
        </div>
      )}

      {isError && <ErrorState error={error} onRetry={() => void refetch()} />}

      {!isLoading && !isError && earnings && (
        <>
          {/* KPI Row */}
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <Card className="p-5">
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium text-ink-500">
                  Total Cumulative Earnings
                </span>
                <IndianRupee
                  className="size-4 text-success-600"
                  aria-hidden="true"
                />
              </div>
              <p className="numeric mt-2 text-2xl font-bold text-ink-900">
                {formatCurrency(earnings.totalEarnings)}
              </p>
              <p className="mt-1 text-xs text-success-700">Lifetime payouts</p>
            </Card>

            <Card className="p-5">
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium text-ink-500">
                  This Week Earnings
                </span>
                <TrendingUp
                  className="size-4 text-primary-600"
                  aria-hidden="true"
                />
              </div>
              <p className="numeric mt-2 text-2xl font-bold text-ink-900">
                {formatCurrency(earnings.thisWeekEarnings)}
              </p>
              <p className="mt-1 text-xs text-ink-500">Current 7-day period</p>
            </Card>

            <Card className="p-5">
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium text-ink-500">
                  Total Deliveries
                </span>
                <CheckCircle2
                  className="size-4 text-primary-600"
                  aria-hidden="true"
                />
              </div>
              <p className="numeric mt-2 text-2xl font-bold text-ink-900">
                {earnings.totalDeliveries}
              </p>
              <p className="mt-1 text-xs text-ink-500">Packages handed over</p>
            </Card>

            <Card className="p-5">
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium text-ink-500">
                  This Week Deliveries
                </span>
                <Truck
                  className="size-4 text-accent-600"
                  aria-hidden="true"
                />
              </div>
              <p className="numeric mt-2 text-2xl font-bold text-ink-900">
                {earnings.thisWeekDeliveries}
              </p>
              <p className="mt-1 text-xs text-ink-500">Completed this week</p>
            </Card>
          </div>

          {/* Weekly Breakdown Chart */}
          <Card className="p-6">
            <h2 className="text-base font-semibold text-ink-900">
              Weekly Delivery Earnings Trend (₹)
            </h2>
            <p className="mt-1 text-xs text-ink-500">
              Daily earnings credited per fulfilled consignment.
            </p>

            <div className="mt-6 h-72">
              {earnings.weeklyBreakdown.length === 0 ? (
                <div className="flex h-full items-center justify-center text-xs text-ink-400">
                  No weekly earnings data recorded yet.
                </div>
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={earnings.weeklyBreakdown}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} />
                    <XAxis dataKey="day" tick={{ fontSize: 12 }} />
                    <YAxis tick={{ fontSize: 12 }} />
                    <Tooltip
                      formatter={(val: unknown) => [
                        formatCurrency(Number(val)),
                        "Earnings",
                      ]}
                    />
                    <Bar
                      dataKey="earnings"
                      fill="#2563eb"
                      radius={[4, 4, 0, 0]}
                    />
                  </BarChart>
                </ResponsiveContainer>
              )}
            </div>
          </Card>

          {/* Recent Delivery Transactions Table */}
          <Card className="p-6">
            <h2 className="text-base font-semibold text-ink-900">
              Recent Completed Settlements
            </h2>
            <p className="mt-1 text-xs text-ink-500">
              Recent delivery fees credited for handed-over consignments.
            </p>

            <div className="mt-4">
              {earnings.recentTransactions.length === 0 ? (
                <EmptyState
                  icon={Receipt}
                  title="No completed deliveries yet"
                  description="When you complete orders, delivery fee credits will appear in this ledger."
                />
              ) : (
                <Table
                  rows={earnings.recentTransactions}
                  rowKey={(t) => t.orderId}
                  columns={[
                    {
                      key: "id",
                      header: "Order ID",
                      render: (t) => (
                        <span className="font-mono text-xs font-semibold text-primary-700">
                          #{t.orderId}
                        </span>
                      ),
                    },
                    {
                      key: "customer",
                      header: "Recipient / Customer",
                      render: (t) => (
                        <span className="font-medium text-ink-900">
                          {t.customer}
                        </span>
                      ),
                    },
                    {
                      key: "amount",
                      header: "Fee Credited",
                      numeric: true,
                      render: (t) => (
                        <span className="numeric font-semibold text-success-700">
                          {formatCurrency(t.amount)}
                        </span>
                      ),
                    },
                    {
                      key: "date",
                      header: "Completed Date",
                      render: (t) => (
                        <span className="text-xs text-ink-500">
                          {formatDate(t.completedAt)}
                        </span>
                      ),
                    },
                  ]}
                  mobileCard={(t) => (
                    <div className="space-y-2 p-4 text-xs">
                      <div className="flex items-center justify-between">
                        <span className="font-mono font-semibold text-primary-700">
                          Order #{t.orderId}
                        </span>
                        <span className="numeric text-sm font-bold text-success-700">
                          {formatCurrency(t.amount)}
                        </span>
                      </div>
                      <p className="font-medium text-ink-700">
                        Recipient: {t.customer}
                      </p>
                      <p className="text-ink-400">
                        Delivered on {formatDate(t.completedAt)}
                      </p>
                    </div>
                  )}
                />
              )}
            </div>
          </Card>
        </>
      )}
    </div>
  );
}
