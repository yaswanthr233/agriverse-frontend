import { useQuery } from "@tanstack/react-query";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  PieChart,
  Pie,
  Cell,
} from "recharts";
import { TrendingUp } from "lucide-react";
import { analyticsApi } from "@/api/endpoints/analytics";
import { qk } from "@/api/queryKeys";
import { Card } from "@/components/ui/Card";
import { Skeleton } from "@/components/ui/Skeleton";
import { EmptyState } from "@/components/feedback/EmptyState";
import { ErrorState } from "@/components/feedback/ErrorState";
import { formatCurrency } from "@/lib/format";

const CHART_COLORS = [
  "#15803d", // primary-700
  "#eab308", // accent-500
  "#ea580c", // warm-600
  "#0284c7", // info-600
  "#16a34a", // primary-600
  "#8b5cf6", // purple
  "#ec4899", // pink
];

export function FarmerAnalytics() {
  const { data, isLoading, isError, error, refetch } = useQuery({
    queryKey: qk.farmerAnalytics(),
    queryFn: analyticsApi.farmer,
  });

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div>
          <Skeleton className="h-8 w-48" />
          <Skeleton className="mt-2 h-4 w-72" />
        </div>
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
    );
  }

  if (isError) {
    return <ErrorState error={error} onRetry={() => void refetch()} />;
  }

  const hasData =
    data &&
    ((data.kpis && data.kpis.length > 0) ||
      (data.monthlyCashflow && data.monthlyCashflow.length > 0) ||
      (data.expenseBreakdown && data.expenseBreakdown.length > 0) ||
      (data.yieldTrend && data.yieldTrend.length > 0));

  if (!hasData) {
    return (
      <EmptyState
        icon={TrendingUp}
        title="Not enough data yet"
        description="Log some expenses and crops to see your farm analytics and trends."
      />
    );
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-semibold text-ink-900">Farm analytics</h1>
        <p className="mt-1 text-ink-500">
          Financial performance, expense breakdown and yield trends.
        </p>
      </div>

      {/* KPI Cards */}
      {data.kpis && data.kpis.length > 0 && (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {data.kpis.map((kpi) => (
            <Card key={kpi.label} className="p-5">
              <p className="text-sm text-ink-500">{kpi.label}</p>
              <p className="numeric mt-2 text-2xl font-semibold text-ink-900">
                {kpi.value}
              </p>
              {kpi.trend && (
                <p className="mt-1 text-xs text-ink-500">{kpi.trend}</p>
              )}
            </Card>
          ))}
        </div>
      )}

      {/* Charts Grid */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Monthly Cashflow */}
        <Card className="p-5">
          <h2 className="font-semibold text-ink-900">Monthly cashflow</h2>
          <p className="text-xs text-ink-500">Income vs. farm expenses</p>
          <div className="mt-4 h-[280px]">
            {data.monthlyCashflow && data.monthlyCashflow.length > 0 ? (
              <ResponsiveContainer width="100%" height={280}>
                <BarChart data={data.monthlyCashflow}>
                  <XAxis dataKey="month" tick={{ fontSize: 12 }} />
                  <YAxis
                    tick={{ fontSize: 12 }}
                    tickFormatter={(v) =>
                      `₹${v >= 1000 ? `${(v / 1000).toFixed(0)}k` : v}`
                    }
                  />
                  <Tooltip
                    formatter={(val) =>
                      typeof val === "number"
                        ? formatCurrency(val)
                        : String(val ?? "")
                    }
                  />
                  <Legend />
                  <Bar
                    dataKey="income"
                    name="Income"
                    fill="#15803d"
                    radius={[4, 4, 0, 0]}
                  />
                  <Bar
                    dataKey="expense"
                    name="Expense"
                    fill="#ea580c"
                    radius={[4, 4, 0, 0]}
                  />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex h-full items-center justify-center text-sm text-ink-400">
                No cashflow data available
              </div>
            )}
          </div>
        </Card>

        {/* Expense Breakdown */}
        <Card className="p-5">
          <h2 className="font-semibold text-ink-900">Expense breakdown</h2>
          <p className="text-xs text-ink-500">Distribution across categories</p>
          <div className="mt-4 h-[280px]">
            {data.expenseBreakdown && data.expenseBreakdown.length > 0 ? (
              <ResponsiveContainer width="100%" height={280}>
                <PieChart>
                  <Pie
                    data={data.expenseBreakdown}
                    dataKey="value"
                    nameKey="name"
                    cx="50%"
                    cy="50%"
                    outerRadius={85}
                    innerRadius={45}
                    paddingAngle={2}
                    label={({
                      name,
                      percent,
                    }: {
                      name?: string;
                      percent?: number;
                    }) =>
                      `${name ?? ""}: ${((percent ?? 0) * 100).toFixed(0)}%`
                    }
                    labelLine={false}
                  >
                    {data.expenseBreakdown.map((_, index) => (
                      <Cell
                        key={`cell-${index}`}
                        fill={CHART_COLORS[index % CHART_COLORS.length]}
                      />
                    ))}
                  </Pie>
                  <Tooltip
                    formatter={(val) =>
                      typeof val === "number"
                        ? formatCurrency(val)
                        : String(val ?? "")
                    }
                  />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex h-full items-center justify-center text-sm text-ink-400">
                No expense breakdown data available
              </div>
            )}
          </div>
        </Card>

        {/* Yield Trend */}
        <Card className="p-5 lg:col-span-2">
          <h2 className="font-semibold text-ink-900">Yield trend</h2>
          <p className="text-xs text-ink-500">
            Yield per acre across crops (kg/acre)
          </p>
          <div className="mt-4 h-[280px]">
            {data.yieldTrend && data.yieldTrend.length > 0 ? (
              <ResponsiveContainer width="100%" height={280}>
                <BarChart data={data.yieldTrend}>
                  <XAxis dataKey="cropName" tick={{ fontSize: 12 }} />
                  <YAxis
                    tick={{ fontSize: 12 }}
                    tickFormatter={(v) => `${v} kg`}
                  />
                  <Tooltip formatter={(val) => `${val} kg / acre`} />
                  <Bar
                    dataKey="yieldPerAcre"
                    name="Yield (kg/acre)"
                    fill="#0284c7"
                    radius={[4, 4, 0, 0]}
                  />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex h-full items-center justify-center text-sm text-ink-400">
                No yield data available
              </div>
            )}
          </div>
        </Card>
      </div>
    </div>
  );
}
