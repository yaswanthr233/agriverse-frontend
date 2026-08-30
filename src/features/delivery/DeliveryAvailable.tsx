import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import toast from "react-hot-toast";
import { PackageCheck, MapPin, Phone, ExternalLink, Compass, Package, RefreshCw, CheckCircle } from "lucide-react";
import { deliveryApi } from "@/api/endpoints/deliveryPortal";
import { qk } from "@/api/queryKeys";
import { ApiError } from "@/api/client";
import { formatCurrency, formatDateTime } from "@/lib/format";
import { getGoogleMapsUrl } from "@/lib/location";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { Skeleton } from "@/components/ui/Skeleton";
import { EmptyState } from "@/components/feedback/EmptyState";
import { ErrorState } from "@/components/feedback/ErrorState";

export function DeliveryAvailable() {
  const queryClient = useQueryClient();
  const [raceMessage, setRaceMessage] = useState<string | null>(null);

  const { data, isLoading, isError, error, refetch, isFetching } = useQuery({
    queryKey: qk.deliveryAvailable(),
    queryFn: deliveryApi.available,
    refetchInterval: 10000,
  });

  const claim = useMutation({
    mutationFn: deliveryApi.claim,
    onSuccess: (order) => {
      toast.success(`Order #${order.id} accepted! It is now in your Active Deliveries.`);
      setRaceMessage(null);
      void queryClient.invalidateQueries({ queryKey: qk.deliveryAvailable() });
      void queryClient.invalidateQueries({ queryKey: qk.deliveryPipeline() });
      void queryClient.invalidateQueries({ queryKey: ["delivery", "active"] });
    },
    onError: (err) => {
      if (err instanceof ApiError && err.errorCode === "INVALID_STATUS") {
        setRaceMessage(
          "That order was just accepted/claimed by someone else. The list has been refreshed.",
        );
        void queryClient.invalidateQueries({
          queryKey: qk.deliveryAvailable(),
        });
        return;
      }
      toast.error(
        err instanceof ApiError ? err.message : "Couldn't claim that order.",
      );
    },
  });

  if (isLoading) {
    return (
      <div className="space-y-4">
        <div>
          <h1 className="text-2xl font-semibold text-ink-900">Available Orders</h1>
          <p className="mt-1 text-ink-500">Confirmed orders waiting for a delivery partner.</p>
        </div>
        <div className="space-y-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="h-44 w-full" />
          ))}
        </div>
      </div>
    );
  }

  if (isError) {
    return (
      <div className="space-y-4">
        <div>
          <h1 className="text-2xl font-semibold text-ink-900">Available Orders</h1>
          <p className="mt-1 text-ink-500">Confirmed orders waiting for a delivery partner.</p>
        </div>
        <ErrorState
          error={error}
          title="Unable to load available orders."
          description="Failed to retrieve available delivery consignments. Please try again."
          onRetry={() => void refetch()}
        />
      </div>
    );
  }

  const availableOrders = data ?? [];

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-ink-900">Available Orders</h1>
          <p className="mt-1 text-ink-500">
            Confirmed orders ready for delivery partner acceptance, dispatch, and farmer delivery.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Badge tone="neutral">{availableOrders.length} Available</Badge>
          <Button
            variant="outline"
            size="sm"
            onClick={() => void refetch()}
            loading={isFetching}
            className="gap-1.5 text-xs"
          >
            <RefreshCw className="size-3.5" />
            Refresh
          </Button>
        </div>
      </div>

      {raceMessage && (
        <p
          role="status"
          className="rounded-md bg-warning-50 px-3 py-2 text-sm text-warning-700"
        >
          {raceMessage}
        </p>
      )}

      <div>
        {availableOrders.length === 0 ? (
          <EmptyState
            icon={PackageCheck}
            title="No orders are currently available"
            description="When sellers confirm orders, they will appear here to claim for dispatch and delivery."
          />
        ) : (
          <div className="space-y-4">
            {availableOrders.map((order) => {
              const mapsUrl = getGoogleMapsUrl(
                order.deliveryLatitude,
                order.deliveryLongitude
              );

              return (
                <Card key={order.id} className="p-5 hover:border-primary-300 transition-colors">
                  <div className="flex flex-wrap items-start justify-between gap-4">
                    <div className="min-w-0 flex-1 space-y-3">
                      <div className="flex flex-wrap items-center gap-3">
                        <span className="numeric text-lg font-bold text-ink-900">
                          Order #{order.id}
                        </span>
                        <Badge tone="info">Confirmed by Seller</Badge>
                        {mapsUrl ? (
                          <Badge tone="success" className="gap-1 text-xs">
                            <Compass className="size-3" />
                            GPS Location Verified
                          </Badge>
                        ) : (
                          <Badge tone="neutral" className="text-xs">
                            Postal Address
                          </Badge>
                        )}
                      </div>

                      {/* Delivery Address & GPS Navigation */}
                      <div className="rounded-lg border border-border/80 bg-surface-sunk p-3 text-sm">
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex items-start gap-2">
                            <MapPin
                              className="mt-0.5 size-4 shrink-0 text-primary-600"
                              aria-hidden="true"
                            />
                            <div>
                              <span className="text-xs font-semibold uppercase tracking-wider text-ink-500">
                                Farmer Delivery Destination
                              </span>
                              <p className="mt-0.5 font-medium text-ink-900">
                                {order.deliveryAddress}
                              </p>
                              {order.deliveryLatitude != null && order.deliveryLongitude != null && (
                                <p className="mt-0.5 font-mono text-xs text-ink-600">
                                  GPS: {order.deliveryLatitude.toFixed(6)}, {order.deliveryLongitude.toFixed(6)}
                                  {order.deliveryAccuracy != null
                                    ? ` (~${Math.round(order.deliveryAccuracy)}m accuracy)`
                                    : ""}
                                </p>
                              )}
                            </div>
                          </div>

                          {mapsUrl && (
                            <a
                              href={mapsUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex shrink-0 items-center gap-1.5 rounded-md border border-primary-300 bg-white px-2.5 py-1 text-xs font-semibold text-primary-700 shadow-xs transition hover:bg-primary-50"
                            >
                              <ExternalLink className="size-3.5" />
                              Open in Maps
                            </a>
                          )}
                        </div>
                      </div>

                      {/* Buyer / Farmer Contact */}
                      <p className="flex items-center gap-2 text-sm text-ink-700">
                        <Phone
                          className="size-4 shrink-0 text-ink-400"
                          aria-hidden="true"
                        />
                        <span className="font-semibold">{order.buyerName}</span>
                        {order.buyerPhone && order.buyerPhone !== "N/A" && (
                          <>
                            <span>·</span>
                            <a
                              href={`tel:${order.buyerPhone}`}
                              className="text-primary-700 hover:underline"
                            >
                              {order.buyerPhone}
                            </a>
                          </>
                        )}
                      </p>

                      {/* Package Contents / Real Product Items */}
                      <div className="rounded-lg border border-border/60 bg-surface p-3 text-xs space-y-1.5">
                        <span className="flex items-center gap-1.5 font-semibold text-ink-700">
                          <Package className="size-3.5 text-primary-600" aria-hidden="true" />
                          Package Items ({(order.items && order.items.length > 0) ? order.items.length : order.itemCount} items):
                        </span>
                        {order.items && order.items.length > 0 ? (
                          <ul className="list-disc space-y-1 pl-4 text-ink-800">
                            {order.items.map((item, idx) => (
                              <li key={idx} className="leading-relaxed">
                                <span className="font-medium">{item.productName}</span> — <span className="font-semibold text-ink-900">{item.quantity} units</span>
                                {item.unitPrice ? ` (₹${item.unitPrice}/unit)` : ""}
                              </li>
                            ))}
                          </ul>
                        ) : (
                          <p className="text-ink-500 italic pl-4">
                            {order.itemCount > 0 ? `${order.itemCount} agricultural products in parcel` : "Standard agricultural supply consignment"}
                          </p>
                        )}
                      </div>

                      <p className="text-xs text-ink-400">
                        Placed {formatDateTime(order.createdAt)}
                      </p>
                    </div>

                    <div className="text-right space-y-3">
                      <div>
                        <span className="text-xs text-ink-500">Total Consignment Value</span>
                        <p className="numeric text-xl font-bold text-ink-900">
                          {formatCurrency(Number(order.totalAmount))}
                        </p>
                      </div>

                      <Button
                        loading={claim.isPending && claim.variables === order.id}
                        onClick={() => claim.mutate(order.id)}
                        className="w-full sm:w-auto gap-1.5"
                      >
                        <CheckCircle className="size-4" />
                        Accept Order
                      </Button>
                    </div>
                  </div>
                </Card>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
