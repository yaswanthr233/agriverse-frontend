import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import {
  Sprout,
  Package,
  TrendingUp,
  Wheat,
  Stethoscope,
  Bot,
  MapPin,
  Clock,
  ArrowRight,
  TrendingDown,
  CloudSun,
  ShieldCheck,
  ShoppingBag,
} from "lucide-react";
import { farmApi } from "@/api/endpoints/farm";
import { analyticsApi } from "@/api/endpoints/analytics";
import { ordersApi } from "@/api/endpoints/orders";
import { marketApi } from "@/api/endpoints/market";
import { vetsApi } from "@/api/endpoints/vets";
import { qk } from "@/api/queryKeys";
import { useAuthStore } from "@/stores/authStore";
import { formatCurrency, formatDate, formatDateTime } from "@/lib/format";
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
    retry: false,
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

  const marketPricesQuery = useQuery({
    queryKey: qk.marketPrices(),
    queryFn: marketApi.prices,
  });

  const appointmentsQuery = useQuery({
    queryKey: qk.myAppointments(),
    queryFn: vetsApi.myAppointments,
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

  /* ── State 2: no farm profile ──────────────────────── */
  const farmMissing =
    farmQuery.isError &&
    farmQuery.error instanceof ApiError &&
    (farmQuery.error.status === 404 || farmQuery.error.status === 400);

  if (farmMissing || (farmQuery.isSuccess && !farmQuery.data)) {
    return (
      <EmptyState
        icon={Sprout}
        title="Set up your farm"
        description="Add your farm details to unlock crop tracking, expense logging, and personalized analytics."
        action={
          <Link to="/app/farm">
            <Button size="lg">Create farm profile</Button>
          </Link>
        }
      />
    );
  }

  /* ── State 3: genuine error ─────────────────────────── */
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
  const recentOrders = ordersQuery.data?.slice(0, 4) ?? [];
  const topPrices = marketPricesQuery.data?.slice(0, 4) ?? [];
  const upcomingAppts = appointmentsQuery.data?.slice(0, 2) ?? [];

  return (
    <div className="space-y-8">
      {/* Top Welcome Header */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-ink-900">
            {greeting()}, {user?.fullName?.split(" ")[0]} 👋
          </h1>
          <p className="mt-1 text-sm text-ink-500 flex items-center gap-1.5">
            <MapPin className="size-4 text-primary-600" />
            <span className="font-medium text-ink-700">{farm?.farmName}</span> · {farm?.district || farm?.village || "Andhra Pradesh"}, {farm?.state || "India"}
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Link to="/app/ai">
            <Button size="sm" className="gap-1.5 shadow-xs">
              <Bot className="size-4" /> Ask AgriVerse AI
            </Button>
          </Link>
          <Link to="/marketplace">
            <Button size="sm" variant="outline" className="gap-1.5">
              <ShoppingBag className="size-4" /> Shop Inputs
            </Button>
          </Link>
        </div>
      </div>

      {/* KPI Cards Grid */}
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
            <p className="text-xs font-semibold uppercase tracking-wider text-ink-500">
              {kpi.label}
            </p>
            <p className="numeric mt-2 text-2xl font-bold text-ink-900">
              {kpi.value}
            </p>
            {kpi.trend && (
              <p className="mt-1 text-xs text-primary-700 font-medium">
                {kpi.trend}
              </p>
            )}
          </Card>
        ))}
      </div>

      {/* Quick Action Navigation Buttons */}
      <Card className="p-5">
        <h2 className="text-sm font-semibold uppercase tracking-wider text-ink-500 mb-3">
          Quick Actions
        </h2>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
          <Link to="/app/crops">
            <Button variant="outline" className="w-full justify-center gap-2 text-xs">
              <Wheat className="size-4 text-primary-600" /> Crops
            </Button>
          </Link>
          <Link to="/market-prices">
            <Button variant="outline" className="w-full justify-center gap-2 text-xs">
              <TrendingUp className="size-4 text-primary-600" /> Mandi Rates
            </Button>
          </Link>
          <Link to="/marketplace">
            <Button variant="outline" className="w-full justify-center gap-2 text-xs">
              <Package className="size-4 text-primary-600" /> Marketplace
            </Button>
          </Link>
          <Link to="/app/vets">
            <Button variant="outline" className="w-full justify-center gap-2 text-xs">
              <Stethoscope className="size-4 text-primary-600" /> Book a Vet
            </Button>
          </Link>
          <Link to="/app/orders">
            <Button variant="outline" className="w-full justify-center gap-2 text-xs">
              <Clock className="size-4 text-primary-600" /> My Orders
            </Button>
          </Link>
          <Link to="/app/ai">
            <Button variant="outline" className="w-full justify-center gap-2 text-xs border-primary-300 bg-primary-50/50 text-primary-800">
              <Bot className="size-4 text-primary-700" /> AI Advisory
            </Button>
          </Link>
        </div>
      </Card>

      {/* Main Two-Column Row: Market Prices & Recent Orders */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Mandi Prices Preview Card */}
        <Card className="p-5">
          <div className="flex items-center justify-between border-b border-border pb-3">
            <div className="flex items-center gap-2">
              <TrendingUp className="size-4 text-primary-600" />
              <h2 className="font-semibold text-ink-900">Live Mandi Prices</h2>
            </div>
            <Link
              to="/market-prices"
              className="flex items-center gap-1 text-xs font-medium text-primary-700 hover:underline"
            >
              View all markets <ArrowRight className="size-3" />
            </Link>
          </div>

          <div className="mt-3 divide-y divide-border">
            {marketPricesQuery.isLoading && (
              <div className="space-y-3 py-2">
                <Skeleton className="h-10 w-full" />
                <Skeleton className="h-10 w-full" />
              </div>
            )}
            {!marketPricesQuery.isLoading && topPrices.length === 0 && (
              <p className="py-6 text-center text-xs text-ink-500">
                No market prices recorded for today.
              </p>
            )}
            {topPrices.map((p) => {
              const isUp = (p.changePercent ?? 0) > 0 || p.trend === "UP";
              const isDown = (p.changePercent ?? 0) < 0 || p.trend === "DOWN";
              return (
                <div key={p.id} className="flex items-center justify-between py-2.5">
                  <div>
                    <span className="font-semibold text-sm text-ink-900">
                      {p.commodity}
                    </span>
                    <p className="text-xs text-ink-400">{p.mandi}</p>
                  </div>
                  <div className="text-right">
                    <span className="numeric text-sm font-bold text-ink-900">
                      {formatCurrency(p.modalPrice)}{" "}
                      <span className="text-[11px] font-normal text-ink-500">/ qtl</span>
                    </span>
                    <div className="flex items-center justify-end gap-1 text-xs">
                      {isUp && <TrendingUp className="size-3 text-success-600" />}
                      {isDown && <TrendingDown className="size-3 text-danger-600" />}
                      <span
                        className={`font-semibold ${
                          isUp
                            ? "text-success-700"
                            : isDown
                              ? "text-danger-700"
                              : "text-ink-500"
                        }`}
                      >
                        {p.changePercent
                          ? `${p.changePercent > 0 ? "+" : ""}${p.changePercent}%`
                          : p.trend}
                      </span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </Card>

        {/* Recent Orders Card */}
        <Card className="p-5">
          <div className="flex items-center justify-between border-b border-border pb-3">
            <div className="flex items-center gap-2">
              <ShoppingBag className="size-4 text-primary-600" />
              <h2 className="font-semibold text-ink-900">Recent Orders</h2>
            </div>
            <Link
              to="/app/orders"
              className="flex items-center gap-1 text-xs font-medium text-primary-700 hover:underline"
            >
              View all <ArrowRight className="size-3" />
            </Link>
          </div>

          <div className="mt-3">
            {ordersQuery.isLoading && (
              <div className="space-y-2 py-2">
                <Skeleton className="h-10 w-full" />
                <Skeleton className="h-10 w-full" />
              </div>
            )}
            {!ordersQuery.isLoading && recentOrders.length === 0 && (
              <div className="py-8 text-center text-xs text-ink-500">
                No orders placed yet. Explore the{" "}
                <Link to="/marketplace" className="text-primary-700 underline font-medium">
                  marketplace
                </Link>{" "}
                to order seeds and fertilizers.
              </div>
            )}
            <ul className="divide-y divide-border">
              {recentOrders.map((o) => (
                <li
                  key={o.id}
                  className="flex items-center justify-between gap-3 py-2.5"
                >
                  <div className="min-w-0">
                    <Link
                      to={`/app/orders/${o.id}`}
                      className="numeric font-semibold text-sm text-ink-900 hover:text-primary-700"
                    >
                      Order #{o.id}
                    </Link>
                    <p className="text-xs text-ink-400">
                      {formatDate(o.createdAt)}
                    </p>
                  </div>
                  <div className="flex items-center gap-3">
                    <Badge tone={orderStatusTone(o.status)}>
                      {orderStatusLabel(o.status)}
                    </Badge>
                    <span className="numeric text-sm font-bold text-ink-900">
                      {formatCurrency(o.totalAmount)}
                    </span>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        </Card>
      </div>

      {/* Upcoming Veterinary Appointments (if any) */}
      {upcomingAppts.length > 0 && (
        <Card className="p-5 bg-surface border-primary-100">
          <div className="flex items-center justify-between border-b border-border pb-3">
            <div className="flex items-center gap-2">
              <Stethoscope className="size-4 text-primary-600" />
              <h2 className="font-semibold text-ink-900">Upcoming Veterinary Appointments</h2>
            </div>
            <Link
              to="/app/vets"
              className="text-xs font-medium text-primary-700 hover:underline"
            >
              Consultations
            </Link>
          </div>

          <div className="mt-3 grid gap-3 sm:grid-cols-2">
            {upcomingAppts.map((appt) => (
              <div
                key={appt.id}
                className="flex items-center justify-between rounded-lg border border-border bg-surface-sunk/40 p-3.5"
              >
                <div>
                  <span className="font-semibold text-sm text-ink-900">
                    {appt.vetName || "Veterinarian Doctor"}
                  </span>
                  <p className="text-xs text-ink-500 mt-0.5">
                    {appt.animalDescription || "Livestock consultation"}
                  </p>
                  <p className="text-xs text-primary-700 font-medium mt-1">
                    {formatDateTime(appt.scheduledAt)}
                  </p>
                </div>
                <Badge
                  tone={
                    appt.status === "CONFIRMED"
                      ? "success"
                      : appt.status === "PENDING"
                        ? "warning"
                        : "neutral"
                  }
                >
                  {appt.status}
                </Badge>
              </div>
            ))}
          </div>
        </Card>
      )}
    </div>
  );
}
