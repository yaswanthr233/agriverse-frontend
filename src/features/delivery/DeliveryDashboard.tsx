import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import {
  Truck,
  CheckCircle2,
  TrendingUp,
  IndianRupee,
  PackageSearch,
  ArrowRight,
  MapPin,
  Clock,
} from "lucide-react";
import { deliveryApi } from "@/api/endpoints/deliveryPortal";
import { qk } from "@/api/queryKeys";
import { formatCurrency } from "@/lib/format";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { Skeleton } from "@/components/ui/Skeleton";
import { ErrorState } from "@/components/feedback/ErrorState";

export function DeliveryDashboard() {
  const {
    data: pipeline,
    isLoading: isPipeLoading,
    isError: isPipeError,
    error: pipeError,
    refetch: refetchPipe,
  } = useQuery({
    queryKey: qk.deliveryPipeline(),
    queryFn: deliveryApi.pipeline,
  });

  const {
    data: earnings,
    isLoading: isEarnLoading,
    isError: isEarnError,
    error: earnError,
    refetch: refetchEarn,
  } = useQuery({
    queryKey: qk.deliveryEarnings(),
    queryFn: deliveryApi.earnings,
  });

  const isLoading = isPipeLoading || isEarnLoading;
  const isError = isPipeError || isEarnError;
  const error = pipeError || earnError;

  const orders = pipeline ?? [];
  const activeDeliveries = orders.filter(
    (o) => o.status === "OUT_FOR_DELIVERY",
  );
  const deliveredCount = orders.filter((o) => o.status === "DELIVERED").length;

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-semibold text-ink-900">
          Delivery Partner Console
        </h1>
        <p className="mt-1 text-sm text-ink-500">
          Active route assignments, claimable marketplace consignments, and
          payout summaries.
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
        </div>
      )}

      {isError && (
        <ErrorState
          error={error}
          onRetry={() => {
            void refetchPipe();
            void refetchEarn();
          }}
        />
      )}

      {!isLoading && !isError && (
        <>
          {/* KPI Row */}
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <Card className="p-5">
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium text-ink-500">
                  Active Consignments
                </span>
                <Truck
                  className="size-4 text-primary-600"
                  aria-hidden="true"
                />
              </div>
              <p className="numeric mt-2 text-2xl font-bold text-ink-900">
                {activeDeliveries.length}
              </p>
              <p className="mt-1 text-xs text-ink-500">Currently in transit</p>
            </Card>

            <Card className="p-5">
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium text-ink-500">
                  Completed Deliveries
                </span>
                <CheckCircle2
                  className="size-4 text-success-600"
                  aria-hidden="true"
                />
              </div>
              <p className="numeric mt-2 text-2xl font-bold text-ink-900">
                {earnings?.totalDeliveries ?? deliveredCount}
              </p>
              <p className="mt-1 text-xs text-success-700">
                Fulfilled packages
              </p>
            </Card>

            <Card className="p-5">
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium text-ink-500">
                  This Week's Deliveries
                </span>
                <TrendingUp
                  className="size-4 text-accent-600"
                  aria-hidden="true"
                />
              </div>
              <p className="numeric mt-2 text-2xl font-bold text-ink-900">
                {earnings?.thisWeekDeliveries ?? 0}
              </p>
              <p className="mt-1 text-xs text-ink-500">Past 7 days</p>
            </Card>

            <Card className="p-5">
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium text-ink-500">
                  Earned Delivery Fees
                </span>
                <IndianRupee
                  className="size-4 text-success-600"
                  aria-hidden="true"
                />
              </div>
              <p className="numeric mt-2 text-2xl font-bold text-ink-900">
                {formatCurrency(earnings?.totalEarnings ?? 0)}
              </p>
              <p className="mt-1 text-xs text-ink-500">
                This week: {formatCurrency(earnings?.thisWeekEarnings ?? 0)}
              </p>
            </Card>
          </div>

          {/* Quick Action Cards */}
          <div className="grid gap-4 sm:grid-cols-2">
            <Link to="/delivery/available">
              <Card className="p-5 transition-colors hover:border-primary-500">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="flex size-10 items-center justify-center rounded-lg bg-primary-100 text-primary-700">
                      <PackageSearch className="size-5" aria-hidden="true" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-ink-900">
                        Find Available Orders
                      </h3>
                      <p className="text-xs text-ink-500">
                        Claim shipped consignments waiting for transit
                      </p>
                    </div>
                  </div>
                  <ArrowRight
                    className="size-5 text-ink-400"
                    aria-hidden="true"
                  />
                </div>
              </Card>
            </Link>

            <Link to="/delivery/active">
              <Card className="p-5 transition-colors hover:border-primary-500">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="flex size-10 items-center justify-center rounded-lg bg-warning-100 text-warning-700">
                      <Truck className="size-5" aria-hidden="true" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-ink-900">
                        Active Deliveries ({activeDeliveries.length})
                      </h3>
                      <p className="text-xs text-ink-500">
                        Navigate and mark packages as delivered
                      </p>
                    </div>
                  </div>
                  <ArrowRight
                    className="size-5 text-ink-400"
                    aria-hidden="true"
                  />
                </div>
              </Card>
            </Link>
          </div>

          {/* Current In-Transit Consignments List */}
          <Card className="p-6">
            <div className="flex items-center justify-between border-b border-border pb-4">
              <div>
                <h2 className="text-base font-semibold text-ink-900">
                  Consignments In Transit
                </h2>
                <p className="text-xs text-ink-500">
                  Packages currently out for delivery on your route.
                </p>
              </div>
              {activeDeliveries.length > 0 && (
                <Link to="/delivery/active">
                  <Button variant="outline" size="sm">
                    Manage Active Deliveries
                  </Button>
                </Link>
              )}
            </div>

            <div className="mt-4">
              {activeDeliveries.length === 0 ? (
                <div className="py-6 text-center">
                  <p className="mb-3 text-xs text-ink-400">
                    You have no active orders in transit. Check the available
                    queue to claim your next delivery.
                  </p>
                  <Link to="/delivery/available">
                    <Button size="sm">Claim Available Orders</Button>
                  </Link>
                </div>
              ) : (
                <div className="divide-y divide-border">
                  {activeDeliveries.map((order) => (
                    <div
                      key={order.id}
                      className="flex flex-wrap items-center justify-between gap-4 py-3"
                    >
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="font-semibold text-ink-900">
                            Order #{order.id}
                          </span>
                          <Badge tone="warning">Out for Delivery</Badge>
                        </div>
                        <p className="flex items-center gap-1 text-xs text-ink-700">
                          <MapPin
                            className="size-3 text-ink-400"
                            aria-hidden="true"
                          />
                          Destination: {order.deliveryAddress}
                        </p>
                        <p className="flex items-center gap-1 text-[11px] text-ink-400">
                          <Clock className="size-3" aria-hidden="true" />
                          Recipient: {order.buyerName} · Value:{" "}
                          {formatCurrency(order.totalAmount)}
                        </p>
                      </div>

                      <Link to="/delivery/active">
                        <Button variant="outline" size="sm">
                          Complete Delivery
                        </Button>
                      </Link>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </Card>
        </>
      )}
    </div>
  );
}
