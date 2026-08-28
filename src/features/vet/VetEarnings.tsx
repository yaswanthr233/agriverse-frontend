import { useQuery } from "@tanstack/react-query";
import {
  IndianRupee,
  CheckCircle,
  TrendingUp,
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
import { vetPortalApi } from "@/api/endpoints/vetPortal";
import { qk } from "@/api/queryKeys";
import { formatCurrency, formatDate } from "@/lib/format";
import { Card } from "@/components/ui/Card";
import { Table } from "@/components/ui/Table";
import { Skeleton } from "@/components/ui/Skeleton";
import { EmptyState } from "@/components/feedback/EmptyState";
import { ErrorState } from "@/components/feedback/ErrorState";

export function VetEarnings() {
  const {
    data: earnings,
    isLoading,
    isError,
    error,
    refetch,
  } = useQuery({
    queryKey: qk.vetEarnings(),
    queryFn: vetPortalApi.earnings,
  });

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-semibold text-ink-900">
          Veterinary Practice Earnings
        </h1>
        <p className="mt-1 text-sm text-ink-500">
          Consultation revenue breakdown, monthly disbursement trends, and
          recent transaction settlements.
        </p>
      </div>

      {isLoading && (
        <div className="space-y-6">
          <div className="grid gap-4 sm:grid-cols-3">
            {Array.from({ length: 3 }).map((_, i) => (
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
          <div className="grid gap-4 sm:grid-cols-3">
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
              <p className="mt-1 text-xs text-success-700">
                Lifetime settled consultations
              </p>
            </Card>

            <Card className="p-5">
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium text-ink-500">
                  This Month Earnings
                </span>
                <TrendingUp
                  className="size-4 text-primary-600"
                  aria-hidden="true"
                />
              </div>
              <p className="numeric mt-2 text-2xl font-bold text-ink-900">
                {formatCurrency(earnings.thisMonthEarnings)}
              </p>
              <p className="mt-1 text-xs text-ink-500">
                Current calendar period
              </p>
            </Card>

            <Card className="p-5">
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium text-ink-500">
                  Completed Visits
                </span>
                <CheckCircle
                  className="size-4 text-primary-600"
                  aria-hidden="true"
                />
              </div>
              <p className="numeric mt-2 text-2xl font-bold text-ink-900">
                {earnings.completedVisits}
              </p>
              <p className="mt-1 text-xs text-ink-500">Animals treated</p>
            </Card>
          </div>

          {/* Monthly Breakdown Chart */}
          <Card className="p-6">
            <h2 className="text-base font-semibold text-ink-900">
              Monthly Earnings Trend (₹)
            </h2>
            <p className="mt-1 text-xs text-ink-500">
              Historical consultation fees credited per billing month.
            </p>

            <div className="mt-6 h-72">
              {earnings.monthlyBreakdown.length === 0 ? (
                <div className="flex h-full items-center justify-center text-xs text-ink-400">
                  No monthly earnings data recorded yet.
                </div>
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={earnings.monthlyBreakdown}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} />
                    <XAxis dataKey="month" tick={{ fontSize: 12 }} />
                    <YAxis tick={{ fontSize: 12 }} />
                    <Tooltip
                      formatter={(val: unknown) => [
                        formatCurrency(Number(val)),
                        "Earnings",
                      ]}
                    />
                    <Bar
                      dataKey="earnings"
                      fill="#16a34a"
                      radius={[4, 4, 0, 0]}
                    />
                  </BarChart>
                </ResponsiveContainer>
              )}
            </div>
          </Card>

          {/* Recent Transactions Table */}
          <Card className="p-6">
            <h2 className="text-base font-semibold text-ink-900">
              Recent Clinical Transactions
            </h2>
            <p className="mt-1 text-xs text-ink-500">
              Individual consultation fees settled for treated livestock.
            </p>

            <div className="mt-4">
              {earnings.recentTransactions.length === 0 ? (
                <EmptyState
                  icon={Receipt}
                  title="No settled transactions yet"
                  description="Completed veterinary appointments with recorded fees will appear in this ledger."
                />
              ) : (
                <Table
                  rows={earnings.recentTransactions}
                  rowKey={(t) => t.appointmentId}
                  columns={[
                    {
                      key: "id",
                      header: "Visit ID",
                      render: (t) => (
                        <span className="font-mono text-xs font-semibold text-primary-700">
                          #{t.appointmentId}
                        </span>
                      ),
                    },
                    {
                      key: "farmer",
                      header: "Client / Farmer",
                      render: (t) => (
                        <span className="font-medium text-ink-900">
                          {t.farmerName}
                        </span>
                      ),
                    },
                    {
                      key: "animal",
                      header: "Animal / Case",
                      render: (t) => (
                        <span className="text-xs text-ink-700">{t.animal}</span>
                      ),
                    },
                    {
                      key: "amount",
                      header: "Amount",
                      numeric: true,
                      render: (t) => (
                        <span className="numeric font-semibold text-ink-900">
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
                          Visit #{t.appointmentId}
                        </span>
                        <span className="numeric text-sm font-bold text-ink-900">
                          {formatCurrency(t.amount)}
                        </span>
                      </div>
                      <p className="font-medium text-ink-700">
                        {t.farmerName} · {t.animal}
                      </p>
                      <p className="text-ink-400">
                        Settled on {formatDate(t.completedAt)}
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
