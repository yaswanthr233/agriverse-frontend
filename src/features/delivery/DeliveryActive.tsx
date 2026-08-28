import { useState } from "react";
import { Link } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import toast from "react-hot-toast";
import { Truck, MapPin, Phone, CheckCircle, Package } from "lucide-react";
import { deliveryApi } from "@/api/endpoints/deliveryPortal";
import { qk } from "@/api/queryKeys";
import { ApiError } from "@/api/client";
import type { OrderResponse } from "@/api/types";
import { formatCurrency, formatDateTime } from "@/lib/format";
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

  const deliver = useMutation({
    mutationFn: deliveryApi.deliver,
    onSuccess: () => {
      toast.success("Marked as delivered successfully");
      setConfirming(null);
      void queryClient.invalidateQueries({ queryKey: qk.deliveryPipeline() });
      void queryClient.invalidateQueries({ queryKey: qk.deliveryEarnings() });
    },
    onError: (err) => {
      if (err instanceof ApiError && err.errorCode === "INVALID_STATUS") {
        toast.error("This order is no longer out for delivery.");
        void queryClient.invalidateQueries({ queryKey: qk.deliveryPipeline() });
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
    (o) => o.status === "OUT_FOR_DELIVERY",
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
          Consignments currently claimed and in transit to customer
          destinations.
        </p>
      </div>

      {activeOrders.length === 0 ? (
        <EmptyState
          icon={Truck}
          title="No active deliveries"
          description="You don't have any packages currently in transit."
          action={
            <Link to="/delivery/available">
              <Button>Find Orders to Deliver</Button>
            </Link>
          }
        />
      ) : (
        <div className="space-y-4">
          {activeOrders.map((order) => (
            <Card
              key={order.id}
              className="border-l-4 border-l-primary-500 p-5"
            >
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div className="min-w-0 flex-1 space-y-3">
                  <div className="flex items-center gap-3">
                    <span className="numeric text-lg font-bold text-ink-900">
                      Order #{order.id}
                    </span>
                    <Badge tone="warning">Out for Delivery</Badge>
                  </div>

                  {/* Destination Address Highlight */}
                  <div className="rounded-lg bg-surface-sunk p-3 text-sm">
                    <div className="flex items-start gap-2">
                      <MapPin
                        className="mt-0.5 size-4 shrink-0 text-primary-600"
                        aria-hidden="true"
                      />
                      <div>
                        <span className="text-xs font-semibold uppercase tracking-wider text-ink-500">
                          Delivery Destination
                        </span>
                        <p className="mt-0.5 font-semibold text-ink-900">
                          {order.deliveryAddress}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Buyer Contact */}
                  <div className="flex flex-wrap items-center gap-4 text-xs text-ink-700">
                    <span className="flex items-center gap-1.5 font-medium">
                      <Phone
                        className="size-3.5 text-ink-400"
                        aria-hidden="true"
                      />
                      Recipient: {order.buyerName} ·{" "}
                      <a
                        href={`tel:${order.buyerEmail}`}
                        className="font-semibold text-primary-700 hover:underline"
                      >
                        Contact Buyer
                      </a>
                    </span>
                    <span className="text-ink-400">
                      Claimed / In transit since{" "}
                      {formatDateTime(order.updatedAt || order.createdAt)}
                    </span>
                  </div>

                  {/* Line Items */}
                  <div className="border-t border-border pt-2">
                    <span className="mb-1 flex items-center gap-1 text-xs text-ink-500">
                      <Package className="size-3" aria-hidden="true" /> Package
                      Contents ({order.items.length} items):
                    </span>
                    <ul className="list-disc space-y-0.5 pl-4 text-xs text-ink-700">
                      {order.items.map((item, idx) => (
                        <li key={idx}>
                          {item.productName} × {item.quantity} units
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>

                <div className="space-y-3 text-right">
                  <div>
                    <span className="text-xs text-ink-500">Order Value</span>
                    <p className="numeric text-xl font-bold text-ink-900">
                      {formatCurrency(order.totalAmount)}
                    </p>
                  </div>

                  <Button
                    onClick={() => setConfirming(order)}
                    className="w-full"
                  >
                    <CheckCircle
                      className="mr-1.5 size-4"
                      aria-hidden="true"
                    />
                    Mark as Delivered
                  </Button>
                </div>
              </div>
            </Card>
          ))}
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
