import { useState } from "react";
import { Link } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import toast from "react-hot-toast";
import {
  Truck,
  MapPin,
  Phone,
  CheckCircle,
  Package,
  ExternalLink,
  Navigation,
  Compass,
  Send,
  ArrowRightCircle,
} from "lucide-react";
import { deliveryApi } from "@/api/endpoints/deliveryPortal";
import { qk } from "@/api/queryKeys";
import { ApiError } from "@/api/client";
import type { OrderResponse } from "@/api/types";
import { orderStatusLabel, orderStatusTone } from "@/lib/orderStatus";
import { formatCurrency, formatDateTime } from "@/lib/format";
import { getGoogleMapsUrl } from "@/lib/location";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { Modal } from "@/components/ui/Modal";
import { Skeleton } from "@/components/ui/Skeleton";
import { EmptyState } from "@/components/feedback/EmptyState";
import { ErrorState } from "@/components/feedback/ErrorState";

export function DeliveryActive() {
  const queryClient = useQueryClient();
  const [confirming, setConfirming] = useState<OrderResponse | null>(null);

  const {
    data: orders,
    isLoading,
    isError,
    error,
    refetch,
  } = useQuery({
    queryKey: qk.deliveryPipeline(),
    queryFn: deliveryApi.pipeline,
  });

  const invalidateAll = () => {
    void queryClient.invalidateQueries({ queryKey: qk.deliveryPipeline() });
    void queryClient.invalidateQueries({ queryKey: qk.deliveryAvailable() });
    void queryClient.invalidateQueries({ queryKey: qk.deliveryEarnings() });
  };

  const dispatch = useMutation({
    mutationFn: deliveryApi.dispatch,
    onSuccess: (updated) => {
      toast.success(`Order #${updated.id} marked as Dispatched.`);
      invalidateAll();
    },
    onError: (err) => {
      toast.error(err instanceof ApiError ? err.message : "Couldn't dispatch order.");
    },
  });

  const ship = useMutation({
    mutationFn: deliveryApi.ship,
    onSuccess: (updated) => {
      toast.success(`Order #${updated.id} marked as Shipped.`);
      invalidateAll();
    },
    onError: (err) => {
      toast.error(err instanceof ApiError ? err.message : "Couldn't mark as shipped.");
    },
  });

  const startDelivery = useMutation({
    mutationFn: deliveryApi.startDelivery,
    onSuccess: (updated) => {
      toast.success(`Order #${updated.id} is now Out for Delivery.`);
      invalidateAll();
    },
    onError: (err) => {
      toast.error(err instanceof ApiError ? err.message : "Couldn't start delivery.");
    },
  });

  const deliver = useMutation({
    mutationFn: deliveryApi.deliver,
    onSuccess: () => {
      toast.success("Marked as delivered successfully");
      setConfirming(null);
      invalidateAll();
    },
    onError: (err) => {
      if (err instanceof ApiError && err.errorCode === "INVALID_STATUS") {
        toast.error("This order is no longer out for delivery.");
        invalidateAll();
        return;
      }
      toast.error(
        err instanceof ApiError
          ? err.message
          : "Couldn't complete the delivery.",
      );
    },
  });

  const activeOrders = (orders ?? []).filter(
    (o) =>
      o.status === "CLAIMED" ||
      o.status === "DISPATCHED" ||
      o.status === "SHIPPED" ||
      o.status === "OUT_FOR_DELIVERY",
  );

  if (isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-44 w-full" />
        <Skeleton className="h-44 w-full" />
      </div>
    );
  }

  if (isError) {
    return <ErrorState error={error} onRetry={() => void refetch()} />;
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-ink-900">
          Active Deliveries
        </h1>
        <p className="mt-1 text-sm text-ink-500">
          Consignments claimed and in progress. Progress orders through dispatch, shipping, transit, and delivery.
        </p>
      </div>

      {activeOrders.length === 0 ? (
        <EmptyState
          icon={Truck}
          title="No active deliveries"
          description="You don't have any packages currently in progress."
          action={
            <Link to="/delivery/available">
              <Button>Find Orders to Deliver</Button>
            </Link>
          }
        />
      ) : (
        <div className="space-y-4">
          {activeOrders.map((order) => {
            const mapsUrl = getGoogleMapsUrl(
              order.deliveryLatitude,
              order.deliveryLongitude
            );

            return (
              <Card
                key={order.id}
                className="border-l-4 border-l-primary-500 p-5 space-y-4"
              >
                <div className="flex flex-wrap items-start justify-between gap-4">
                  <div className="min-w-0 flex-1 space-y-3">
                    <div className="flex flex-wrap items-center gap-3">
                      <span className="numeric text-lg font-bold text-ink-900">
                        Order #{order.id}
                      </span>
                      <Badge tone={orderStatusTone(order.status)}>
                        {orderStatusLabel(order.status)}
                      </Badge>
                      {mapsUrl ? (
                        <Badge tone="success" className="gap-1 text-xs">
                          <Compass className="size-3" />
                          GPS Verified Destination
                        </Badge>
                      ) : (
                        <Badge tone="neutral" className="text-xs">
                          Address Only
                        </Badge>
                      )}
                    </div>

                    {/* Destination Address & GPS Navigation */}
                    <div className="rounded-xl border border-primary-100 bg-surface-sunk p-4 text-sm">
                      <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
                        <div className="flex items-start gap-2.5">
                          <div className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-primary-100 text-primary-700">
                            <MapPin className="size-4" aria-hidden="true" />
                          </div>
                          <div>
                            <span className="text-xs font-bold uppercase tracking-wider text-ink-500">
                              Delivery Destination
                            </span>
                            <p className="mt-0.5 font-semibold text-ink-900">
                              {order.deliveryAddress}
                            </p>
                            {order.deliveryLatitude != null &&
                              order.deliveryLongitude != null && (
                                <p className="mt-1 font-mono text-xs text-ink-600">
                                  GPS: {order.deliveryLatitude.toFixed(6)},{" "}
                                  {order.deliveryLongitude.toFixed(6)}
                                  {order.deliveryAccuracy != null
                                    ? ` (Accuracy: ~${Math.round(order.deliveryAccuracy)}m)`
                                    : ""}
                                </p>
                              )}
                          </div>
                        </div>

                        {mapsUrl ? (
                          <a
                            href={mapsUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center justify-center gap-2 rounded-lg bg-primary-600 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-primary-700 active:scale-95"
                          >
                            <Navigation className="size-4" />
                            🧭 Navigate
                          </a>
                        ) : (
                          <span className="text-xs italic text-ink-400">
                            Delivery location coordinates not available for this order.
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Buyer Contact */}
                    <div className="flex flex-wrap items-center gap-4 text-xs text-ink-700">
                      <span className="flex items-center gap-1.5 font-medium">
                        <Phone
                          className="size-3.5 text-ink-400"
                          aria-hidden="true"
                        />
                        Recipient: {order.buyerName}
                        {order.buyerPhone ? ` · ${order.buyerPhone}` : ""}
                      </span>
                      <span className="text-ink-400">
                        Updated {formatDateTime(order.updatedAt || order.createdAt)}
                      </span>
                    </div>

                    {/* Line Items */}
                    <div className="border-t border-border pt-2">
                      <span className="mb-1 flex items-center gap-1 text-xs font-medium text-ink-600">
                        <Package className="size-3.5 text-primary-600" aria-hidden="true" />
                        Package Contents ({order.items.length} items):
                      </span>
                      <ul className="list-disc space-y-0.5 pl-4 text-xs text-ink-800">
                        {order.items.map((item, idx) => (
                          <li key={idx}>
                            <span className="font-medium">{item.productName}</span> × <span className="font-semibold">{item.quantity} units</span>
                            {item.unitPrice ? ` (₹${item.unitPrice}/unit)` : ""}
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>

                  <div className="space-y-3 text-right">
                    <div>
                      <span className="text-xs text-ink-500">Consignment Value</span>
                      <p className="numeric text-xl font-bold text-ink-900">
                        {formatCurrency(order.totalAmount)}
                      </p>
                    </div>

                    {/* Progressive Delivery Action Control */}
                    {order.status === "CLAIMED" && (
                      <Button
                        onClick={() => dispatch.mutate(order.id)}
                        loading={dispatch.isPending && dispatch.variables === order.id}
                        className="w-full gap-1.5"
                      >
                        <Send className="size-4" />
                        Mark as Dispatched
                      </Button>
                    )}

                    {order.status === "DISPATCHED" && (
                      <Button
                        onClick={() => ship.mutate(order.id)}
                        loading={ship.isPending && ship.variables === order.id}
                        className="w-full gap-1.5"
                      >
                        <Truck className="size-4" />
                        Mark as Shipped
                      </Button>
                    )}

                    {order.status === "SHIPPED" && (
                      <Button
                        onClick={() => startDelivery.mutate(order.id)}
                        loading={startDelivery.isPending && startDelivery.variables === order.id}
                        className="w-full gap-1.5"
                      >
                        <ArrowRightCircle className="size-4" />
                        Start Delivery
                      </Button>
                    )}

                    {order.status === "OUT_FOR_DELIVERY" && (
                      <Button
                        onClick={() => setConfirming(order)}
                        className="w-full gap-1.5"
                      >
                        <CheckCircle className="size-4" />
                        Mark as Delivered
                      </Button>
                    )}
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      )}

      {/* Confirmation Modal */}
      <Modal
        open={confirming !== null}
        onClose={() => setConfirming(null)}
        title="Confirm Delivery Completion"
      >
        <div className="space-y-4">
          <p className="text-sm text-ink-700">
            Are you sure you want to mark Order{" "}
            <strong>#{confirming?.id}</strong> as delivered to{" "}
            <strong>{confirming?.buyerName}</strong> at{" "}
            <strong>{confirming?.deliveryAddress}</strong>?
          </p>
          <p className="text-xs text-ink-500">
            This will finalize the order lifecycle, notify the buyer, and credit
            your delivery earnings.
          </p>
          <div className="flex justify-end gap-2 border-t border-border pt-4">
            <Button variant="outline" onClick={() => setConfirming(null)}>
              Cancel
            </Button>
            <Button
              loading={deliver.isPending}
              onClick={() => {
                if (confirming) deliver.mutate(confirming.id);
              }}
            >
              Confirm Delivered
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
