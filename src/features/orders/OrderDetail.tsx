import { useState } from "react";
import { useParams, Link } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import toast from "react-hot-toast";
import { ChevronLeft, ImageOff } from "lucide-react";
import { ordersApi } from "@/api/endpoints/orders";
import { qk } from "@/api/queryKeys";
import {
  CANCELLABLE_STATUSES,
  orderStatusLabel,
  orderStatusTone,
} from "@/lib/orderStatus";
import { formatCurrency, formatDateTime } from "@/lib/format";
import { OrderTimeline } from "./OrderTimeline";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Modal } from "@/components/ui/Modal";
import { Skeleton } from "@/components/ui/Skeleton";
import { ErrorState } from "@/components/feedback/ErrorState";

export function OrderDetail() {
  const { id } = useParams();
  const orderId = Number(id);
  const queryClient = useQueryClient();
  const [confirmOpen, setConfirmOpen] = useState(false);

  const {
    data: order,
    isLoading,
    isError,
    error,
    refetch,
  } = useQuery({
    queryKey: qk.order(orderId),
    queryFn: () => ordersApi.byId(orderId),
    enabled: Number.isFinite(orderId),
  });

  const cancel = useMutation({
    mutationFn: () => ordersApi.updateStatus(orderId, "CANCELLED"),
    onSuccess: () => {
      toast.success("Order cancelled");
      setConfirmOpen(false);
      void queryClient.invalidateQueries({ queryKey: qk.order(orderId) });
      void queryClient.invalidateQueries({ queryKey: qk.myOrders() });
    },
    onError: () => toast.error("Couldn't cancel this order."),
  });

  if (isLoading) return <Skeleton className="h-96 w-full" />;
  if (isError || !order)
    return <ErrorState error={error} onRetry={() => void refetch()} />;

  const canCancel = CANCELLABLE_STATUSES.includes(order.status);

  return (
    <div>
      <Link
        to="/app/orders"
        className="mb-4 inline-flex items-center gap-1 text-sm text-ink-500 hover:text-ink-900"
      >
        <ChevronLeft className="size-4" aria-hidden="true" /> Back to orders
      </Link>

      <div className="flex flex-wrap items-center gap-3">
        <h1 className="numeric text-2xl font-semibold text-ink-900">
          Order #{order.id}
        </h1>
        <Badge tone={orderStatusTone(order.status)}>
          {orderStatusLabel(order.status)}
        </Badge>
      </div>
      <p className="mt-1 text-sm text-ink-500">
        Placed {formatDateTime(order.createdAt)}
      </p>

      <div className="mt-6 grid gap-6 lg:grid-cols-[1fr_320px]">
        <div className="space-y-6">
          <Card className="p-5">
            <h2 className="font-semibold text-ink-900">Items</h2>
            <ul className="mt-4 space-y-4">
              {order.items.map((item) => (
                <li key={item.productId} className="flex gap-4">
                  <div className="flex size-16 shrink-0 items-center justify-center overflow-hidden rounded-md bg-surface-sunk">
                    {item.productImageUrl ? (
                      <img
                        src={item.productImageUrl}
                        alt={item.productName}
                        className="size-full object-cover"
                      />
                    ) : (
                      <ImageOff
                        className="size-5 text-ink-400"
                        aria-hidden="true"
                      />
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="font-medium text-ink-900">
                      {item.productName}
                    </p>
                    <p className="numeric mt-1 text-sm text-ink-500">
                      {formatCurrency(item.unitPrice)} × {item.quantity}
                    </p>
                  </div>
                  <p className="numeric font-medium text-ink-900">
                    {formatCurrency(item.subtotal)}
                  </p>
                </li>
              ))}
            </ul>
          </Card>

          <Card className="p-5">
            <div className="flex items-center justify-between">
              <h2 className="font-semibold text-ink-900">Delivery Address & GPS</h2>
              {order.deliveryLatitude != null && order.deliveryLongitude != null && (
                <Badge tone="success" className="text-xs">GPS Verified</Badge>
              )}
            </div>
            <p className="mt-2 whitespace-pre-line text-sm text-ink-700">
              {order.deliveryAddress}
            </p>
            {order.deliveryLatitude != null && order.deliveryLongitude != null ? (
              <div className="mt-3 flex items-center justify-between rounded-lg bg-surface-sunk p-3 text-xs">
                <span className="font-mono text-ink-600">
                  GPS: {order.deliveryLatitude.toFixed(6)}, {order.deliveryLongitude.toFixed(6)}
                  {order.deliveryAccuracy != null ? ` (Accuracy: ~${Math.round(order.deliveryAccuracy)}m)` : ""}
                </span>
                <a
                  href={`https://www.google.com/maps/search/?api=1&query=${order.deliveryLatitude},${order.deliveryLongitude}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="font-medium text-primary-600 hover:text-primary-700 hover:underline"
                >
                  View on Map ↗
                </a>
              </div>
            ) : null}
          </Card>
        </div>

        <div className="space-y-6">
          <Card className="p-5">
            <h2 className="mb-4 font-semibold text-ink-900">Progress</h2>
            <OrderTimeline status={order.status} />
          </Card>

          <Card className="p-5">
            <div className="flex justify-between">
              <span className="font-semibold text-ink-900">Total</span>
              <span className="numeric text-lg font-semibold text-ink-900">
                {formatCurrency(order.totalAmount)}
              </span>
            </div>
            {order.paymentRef && (
              <p className="mt-2 text-xs text-ink-500">
                Payment ref: {order.paymentRef}
              </p>
            )}

            {canCancel && (
              <Button
                variant="danger"
                className="mt-4 w-full"
                onClick={() => setConfirmOpen(true)}
              >
                Cancel order
              </Button>
            )}
          </Card>
        </div>
      </div>

      <Modal
        open={confirmOpen}
        onClose={() => setConfirmOpen(false)}
        title="Cancel this order?"
        footer={
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setConfirmOpen(false)}>
              Keep order
            </Button>
            <Button
              variant="danger"
              loading={cancel.isPending}
              onClick={() => cancel.mutate()}
            >
              Yes, cancel it
            </Button>
          </div>
        }
      >
        <p className="text-sm text-ink-700">
          This cannot be undone. The seller will be notified.
        </p>
      </Modal>
    </div>
  );
}
