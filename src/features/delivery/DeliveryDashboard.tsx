import { useEffect } from "react";
import { Link } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import toast from "react-hot-toast";
import {
  Truck,
  CheckCircle2,
  TrendingUp,
  IndianRupee,
  PackageSearch,
  ArrowRight,
  MapPin,
  Clock,
  Compass,
  Navigation,
  ExternalLink,
} from "lucide-react";
import { deliveryApi } from "@/api/endpoints/deliveryPortal";
import { qk } from "@/api/queryKeys";
import { formatCurrency, formatDateTime } from "@/lib/format";
import { getGoogleMapsUrl } from "@/lib/location";
import { useAuthStore } from "@/stores/authStore";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { Skeleton } from "@/components/ui/Skeleton";
import { ErrorState } from "@/components/feedback/ErrorState";

export function DeliveryDashboard() {
  const queryClient = useQueryClient();
  const user = useAuthStore((s) => s.user);

  const {
    data: pipeline,
    isLoading: isPipeLoading,
    isError: isPipeError,
    error: pipeError,
    refetch: refetchPipe,
  } = useQuery({
    queryKey: qk.deliveryPipeline(),
    queryFn: deliveryApi.pipeline,
    refetchInterval: 15000,
  });

  const {
    data: availableOrders,
    isLoading: isAvailLoading,
    isError: isAvailError,
    error: availError,
    refetch: refetchAvail,
  } = useQuery({
    queryKey: qk.deliveryAvailable(),
    queryFn: deliveryApi.available,
    refetchInterval: 15000,
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

  const claim = useMutation({
    mutationFn: deliveryApi.claim,
    onSuccess: () => {
      toast.success("Order claimed — now in active transit!");
      void queryClient.invalidateQueries({ queryKey: qk.deliveryAvailable() });
      void queryClient.invalidateQueries({ queryKey: qk.deliveryPipeline() });
    },
    onError: (err: any) => {
      toast.error(err?.message || "Could not claim order.");
    },
  });

  const isLoading = isPipeLoading || isEarnLoading || isAvailLoading;
  const isError = isPipeError || isEarnError || isAvailError;
  const error = pipeError || earnError || availError;

  useEffect(() => {
    if (isError && error) {
      console.error("DELIVERY DASHBOARD ERROR", error);
      console.error("DELIVERY DASHBOARD USER", user);
    }
  }, [isError, error, user]);

  const orders = pipeline ?? [];
  const activeDeliveries = orders.filter(
    (o) =>
      o.status === "CLAIMED" ||
      o.status === "DISPATCHED" ||
      o.status === "SHIPPED" ||
      o.status === "OUT_FOR_DELIVERY",
  );
  const deliveredCount = orders.filter((o) => o.status === "DELIVERED").length;
  const availableCount = availableOrders?.length ?? 0;

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
            void refetchAvail();
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
                  Available Orders
                </span>
                <PackageSearch
                  className="size-4 text-primary-600"
                  aria-hidden="true"
                />
              </div>
              <p className="numeric mt-2 text-2xl font-bold text-ink-900">
                {availableCount}
              </p>
              <p className="mt-1 text-xs text-ink-500">Ready for pickup</p>
            </Card>

            <Card className="p-5">
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium text-ink-500">
                  Active Consignments
                </span>
                <Truck
                  className="size-4 text-warning-600"
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

          {/* Quick Action Navigation */}
          <div className="grid gap-4 sm:grid-cols-3">
            <Link to="/delivery/available">
              <Card className="p-5 transition-colors hover:border-primary-500">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="flex size-10 items-center justify-center rounded-lg bg-primary-100 text-primary-700">
                      <PackageSearch className="size-5" aria-hidden="true" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-ink-900">
                        Available Orders ({availableCount})
                      </h3>
                      <p className="text-xs text-ink-500">
                        Claim packages ready for delivery
                      </p>
                    </div>
                  </div>
                  <ArrowRight className="size-5 text-ink-400" />
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
                        Active In Transit ({activeDeliveries.length})
                      </h3>
                      <p className="text-xs text-ink-500">
                        Navigate and fulfill packages
                      </p>
                    </div>
                  </div>
                  <ArrowRight className="size-5 text-ink-400" />
                </div>
              </Card>
            </Link>

            <Link to="/delivery/history">
              <Card className="p-5 transition-colors hover:border-primary-500">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="flex size-10 items-center justify-center rounded-lg bg-success-100 text-success-700">
                      <CheckCircle2 className="size-5" aria-hidden="true" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-ink-900">
                        Delivery History ({deliveredCount})
                      </h3>
                      <p className="text-xs text-ink-500">
                        View fulfilled delivery ledger
                      </p>
                    </div>
                  </div>
                  <ArrowRight className="size-5 text-ink-400" />
                </div>
              </Card>
            </Link>
          </div>

          {/* Active Deliveries (In Transit) */}
          <Card className="p-6">
            <div className="flex items-center justify-between border-b border-border pb-4">
              <div>
                <h2 className="text-base font-semibold text-ink-900">
                  Active Consignments In Transit ({activeDeliveries.length})
                </h2>
                <p className="text-xs text-ink-500">
                  Orders you have claimed and are currently delivering.
                </p>
              </div>
              {activeDeliveries.length > 0 && (
                <Link to="/delivery/active">
                  <Button variant="outline" size="sm">
                    Open Navigation View
                  </Button>
                </Link>
              )}
            </div>

            <div className="mt-4">
              {activeDeliveries.length === 0 ? (
                <div className="py-6 text-center">
                  <p className="mb-3 text-xs text-ink-400">
                    You have no active orders in transit. Claim an available order below to start delivery.
                  </p>
                  {availableCount > 0 && (
                    <Link to="/delivery/available">
                      <Button size="sm">Claim Available Orders ({availableCount})</Button>
                    </Link>
                  )}
                </div>
              ) : (
                <div className="divide-y divide-border">
                  {activeDeliveries.map((order) => {
                    const mapsUrl = getGoogleMapsUrl(
                      order.deliveryLatitude,
                      order.deliveryLongitude
                    );

                    return (
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
                            {mapsUrl ? (
                              <Badge tone="success" className="gap-1 text-xs">
                                <Compass className="size-3" />
                                GPS Verified
                              </Badge>
                            ) : null}
                          </div>
                          <p className="flex items-center gap-1 text-xs text-ink-700">
                            <MapPin
                              className="size-3 text-primary-600"
                              aria-hidden="true"
                            />
                            {order.deliveryAddress}
                          </p>
                          <p className="flex items-center gap-1 text-[11px] text-ink-400">
                            <Clock className="size-3" aria-hidden="true" />
                            Recipient: {order.buyerName} · Value:{" "}
                            {formatCurrency(order.totalAmount)}
                          </p>
                        </div>

                        <div className="flex items-center gap-2">
                          {mapsUrl && (
                            <a
                              href={mapsUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center gap-1 rounded-md border border-primary-300 bg-white px-2.5 py-1 text-xs font-semibold text-primary-700 shadow-sm hover:bg-primary-50"
                            >
                              <Navigation className="size-3" />
                              Navigate
                            </a>
                          )}
                          <Link to="/delivery/active">
                            <Button variant="primary" size="sm">
                              Complete
                            </Button>
                          </Link>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </Card>

          {/* Available Orders Ready to Claim */}
          <Card className="p-6">
            <div className="flex items-center justify-between border-b border-border pb-4">
              <div>
                <h2 className="text-base font-semibold text-ink-900">
                  Available Marketplace Orders ({availableCount})
                </h2>
                <p className="text-xs text-ink-500">
                  Packages packaged and ready for delivery partner pickup.
                </p>
              </div>
              <Link to="/delivery/available">
                <Button variant="outline" size="sm">
                  View All Available
                </Button>
              </Link>
            </div>

            <div className="mt-4">
              {!availableOrders || availableOrders.length === 0 ? (
                <div className="py-6 text-center text-xs text-ink-400">
                  No new orders are currently awaiting delivery pickup. When sellers pack or ship orders, they will appear here automatically.
                </div>
              ) : (
                <div className="divide-y divide-border">
                  {availableOrders.slice(0, 5).map((order) => {
                    const mapsUrl = getGoogleMapsUrl(
                      order.deliveryLatitude,
                      order.deliveryLongitude
                    );

                    return (
                      <div
                        key={order.id}
                        className="flex flex-wrap items-center justify-between gap-4 py-3"
                      >
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <span className="font-semibold text-ink-900">
                              Order #{order.id}
                            </span>
                            <Badge tone="neutral">Ready for Pickup</Badge>
                            {mapsUrl ? (
                              <Badge tone="success" className="gap-1 text-xs">
                                <Compass className="size-3" />
                                GPS Available
                              </Badge>
                            ) : null}
                          </div>
                          <p className="flex items-center gap-1 text-xs text-ink-700">
                            <MapPin
                              className="size-3 text-primary-600"
                              aria-hidden="true"
                            />
                            {order.deliveryAddress}
                          </p>
                          <p className="text-[11px] text-ink-400">
                            Recipient: {order.buyerName} · Value:{" "}
                            {formatCurrency(Number(order.totalAmount))} · Placed:{" "}
                            {formatDateTime(order.createdAt)}
                          </p>
                        </div>

                        <div className="flex items-center gap-2">
                          {mapsUrl && (
                            <a
                              href={mapsUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center gap-1 text-xs text-primary-600 hover:underline"
                            >
                              <ExternalLink className="size-3" />
                              Map
                            </a>
                          )}
                          <Button
                            size="sm"
                            loading={claim.isPending && claim.variables === order.id}
                            onClick={() => claim.mutate(order.id)}
                          >
                            Claim Order
                          </Button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </Card>
        </>
      )}
    </div>
  );
}
