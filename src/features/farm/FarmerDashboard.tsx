import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { Sprout, Package, TrendingUp, Wheat } from "lucide-react";
import { farmApi } from "@/api/endpoints/farm";
import { analyticsApi } from "@/api/endpoints/analytics";
import { ordersApi } from "@/api/endpoints/orders";
import { qk } from "@/api/queryKeys";
import { useAuthStore } from "@/stores/authStore";
import { formatCurrency, formatDate } from "@/lib/format";
import { orderStatusLabel, orderStatusTone } from "@/lib/orderStatus";
import { ApiError } from "@/api/client";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Skeleton } from "@/components/ui/Skeleton";
import { EmptyState } from "@/components/feedback/EmptyState";
import { ErrorState } from "@/components/feedback/ErrorState";

function greeting() {
  const h = new Date().getHours();
  if (h < 12) return "Good morning";
  if (h < 17) return "Good afternoon";
  return "Good evening";
}

export function FarmerDashboard() {
  const user = useAuthStore((s) => s.user);

  const farmQuery = useQuery({
    queryKey: qk.myFarm(),
    queryFn: farmApi.mine,
    retry: false, // a missing farm is expected, not a transient failure
  });

  const analyticsQuery = useQuery({
    queryKey: qk.farmerAnalytics(),
    queryFn: analyticsApi.farmer,
    enabled: farmQuery.isSuccess,
  });

  const ordersQuery = useQuery({
    queryKey: qk.myOrders(),
    queryFn: ordersApi.mine,
  });

  /* ── State 1: loading ───────────────────────────────── */
  if (farmQuery.isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-10 w-64" />
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-28" />
          ))}
        </div>
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  /* ── State 2: no farm profile — NOT an error, NOT loading ─ */
  const farmMissing =
    farmQuery.isError &&
    farmQuery.error instanceof ApiError &&
    (farmQuery.error.status === 404 || farmQuery.error.status === 400);

  if (farmMissing || (farmQuery.isSuccess && !farmQuery.data)) {
    return (
      <EmptyState
        icon={Sprout}
        title="Set up your farm"
        description="Add your farm details to unlock crop tracking, expense logging and personalised analytics."
        action={
          <Link to="/app/farm">
            <Button size="lg">Create farm profile</Button>
          </Link>
        }
      />
    );
  }

  /* ── State 3: a genuine error ───────────────────────── */
  if (farmQuery.isError) {
    return (
      <ErrorState
        error={farmQuery.error}
        onRetry={() => void farmQuery.refetch()}
      />
    );
  }

  /* ── State 4: ready ─────────────────────────────────── */
  const farm = farmQuery.data;
  const recentOrders = ordersQuery.data?.slice(0, 5) ?? [];

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-semibold text-ink-900">
          {greeting()}, {user?.fullName?.split(" ")[0]} 👋
        </h1>
        <p className="mt-1 text-ink-500">
          {farm?.farmName} · {farm?.district}, {farm?.state}
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {analyticsQuery.isLoading &&
          Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-28" />
          ))}

        {analyticsQuery.isError && (
          <Card className="p-5 sm:col-span-2 lg:col-span-4">
            <ErrorState
              error={analyticsQuery.error}
              onRetry={() => void analyticsQuery.refetch()}
            />
          </Card>
        )}

        {analyticsQuery.data?.kpis.map((kpi) => (
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

      <div className="grid gap-6 lg:grid-cols-2">
        <Card className="p-5">
          <div className="flex items-center justify-between">
            <h2 className="font-semibold text-ink-900">Recent orders</h2>
            <Link
              to="/app/orders"
              className="text-sm text-primary-700 hover:underline"
            >
              View all
            </Link>
          </div>

          <div className="mt-4">
            {ordersQuery.isLoading && (
              <div className="space-y-2">
                {Array.from({ length: 3 }).map((_, i) => (
                  <Skeleton key={i} className="h-12" />
                ))}
              </div>
            )}
            {ordersQuery.isError && (
              <ErrorState
                error={ordersQuery.error}
                onRetry={() => void ordersQuery.refetch()}
              />
            )}
            {!ordersQuery.isLoading &&
              !ordersQuery.isError &&
              recentOrders.length === 0 && (
                <p className="py-6 text-center text-sm text-ink-500">
                  No orders yet.
                </p>
              )}
            <ul className="divide-y divide-border">
              {recentOrders.map((o) => (
                <li
                  key={o.id}
                  className="flex items-center justify-between gap-3 py-3"
                >
                  <div className="min-w-0">
                    <Link
                      to={`/app/orders/${o.id}`}
                      className="numeric font-medium text-ink-900 hover:text-primary-700"
                    >
                      #{o.id}
                    </Link>
                    <p className="text-xs text-ink-500">
                      {formatDate(o.createdAt)}
                    </p>
                  </div>
                  <Badge tone={orderStatusTone(o.status)}>
                    {orderStatusLabel(o.status)}
                  </Badge>
                  <span className="numeric text-sm font-medium text-ink-900">
                    {formatCurrency(o.totalAmount)}
                  </span>
                </li>
              ))}
            </ul>
          </div>
        </Card>

        <Card className="p-5">
          <h2 className="font-semibold text-ink-900">Quick actions</h2>
          <div className="mt-4 grid grid-cols-2 gap-3">
            <Link to="/app/crops">
              <Button variant="outline" className="w-full">
                <Wheat className="size-4" aria-hidden="true" /> Crops
              </Button>
            </Link>
            <Link to="/app/expenses">
              <Button variant="outline" className="w-full">
                <TrendingUp className="size-4" aria-hidden="true" /> Expenses
              </Button>
            </Link>
            <Link to="/marketplace">
              <Button variant="outline" className="w-full">
                <Package className="size-4" aria-hidden="true" /> Shop
              </Button>
            </Link>
            <Link to="/app/analytics">
              <Button variant="outline" className="w-full">
                <TrendingUp className="size-4" aria-hidden="true" /> Analytics
              </Button>
            </Link>
          </div>
        </Card>
      </div>
    </div>
  );
}
