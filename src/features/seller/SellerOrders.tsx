import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import toast from "react-hot-toast";
import { ShoppingBag, Clock, User, MapPin } from "lucide-react";
import { ordersApi } from "@/api/endpoints/orders";
import { qk } from "@/api/queryKeys";
import type { OrderResponse, OrderStatus } from "@/api/types";
import { nextStatusesFor } from "@/lib/orderTransitions";
import { orderStatusLabel, orderStatusTone } from "@/lib/orderStatus";
import { formatCurrency, formatDateTime } from "@/lib/format";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Tabs } from "@/components/ui/Tabs";
import { Skeleton } from "@/components/ui/Skeleton";
import { EmptyState } from "@/components/feedback/EmptyState";
import { ErrorState } from "@/components/feedback/ErrorState";

const FILTER_TABS = [
  { id: "ALL", label: "All Orders" },
  { id: "PENDING", label: "Pending" },
  { id: "CONFIRMED", label: "Confirmed" },
  { id: "PACKED", label: "Packed" },
  { id: "SHIPPED", label: "Shipped" },
  { id: "DELIVERED", label: "Delivered" },
  { id: "CANCELLED", label: "Cancelled" },
];

export function SellerOrders() {
  const queryClient = useQueryClient();
  const [activeStatus, setActiveStatus] = useState("ALL");

  const {
    data: orders,
    isLoading,
    isError,
    error,
    refetch,
  } = useQuery({
    queryKey: qk.sellerOrders(),
    queryFn: ordersApi.seller,
  });

  const advance = useMutation({
    mutationFn: ({ id, status }: { id: number; status: OrderStatus }) =>
      ordersApi.updateStatus(id, status),
    onSuccess: (updated) => {
      toast.success(
        `Order #${updated.id} marked as ${orderStatusLabel(updated.status)}`,
      );
      void queryClient.invalidateQueries({ queryKey: qk.sellerOrders() });
    },
    onError: () => toast.error("Couldn't update order status."),
  });

  const filtered =
    orders?.filter(
      (o) => activeStatus === "ALL" || o.status === activeStatus,
    ) ?? [];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-ink-900">Seller Orders</h1>
        <p className="mt-1 text-sm text-ink-500">
          Process, confirm, pack, and advance fulfilment on incoming customer
          orders.
        </p>
      </div>

      <Tabs
        tabs={FILTER_TABS}
        active={activeStatus}
        onChange={setActiveStatus}
      />

      {isLoading && (
        <div className="space-y-4">
          <Skeleton className="h-44 w-full" />
          <Skeleton className="h-44 w-full" />
          <Skeleton className="h-44 w-full" />
        </div>
      )}

      {isError && <ErrorState error={error} onRetry={() => void refetch()} />}

      {!isLoading && !isError && orders?.length === 0 && (
        <EmptyState
          icon={ShoppingBag}
          title="No orders yet"
          description="Orders for your listed products will appear here as buyers place them."
        />
      )}

      {!isLoading &&
        !isError &&
        orders &&
        orders.length > 0 &&
        filtered.length === 0 && (
          <div className="py-12 text-center text-sm text-ink-500">
            No orders match the selected status filter.
          </div>
        )}

      <div className="space-y-4">
        {filtered.map((order: OrderResponse) => {
          const next = nextStatusesFor("SELLER", order.status);

          return (
            <Card key={order.id} className="space-y-4 p-5">
              <div className="flex flex-wrap items-start justify-between gap-3 border-b border-border pb-3">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-ink-900">
                      Order #{order.id}
                    </span>
                    <Badge tone={orderStatusTone(order.status)}>
                      {orderStatusLabel(order.status)}
                    </Badge>
                  </div>
                  <p className="mt-1 flex items-center gap-1.5 text-xs text-ink-500">
                    <Clock className="size-3.5" aria-hidden="true" />
                    Placed on {formatDateTime(order.createdAt)}
                  </p>
                </div>

                <div className="text-right">
                  <span className="numeric text-lg font-bold text-ink-900">
                    {formatCurrency(order.totalAmount)}
                  </span>
                  {order.paymentRef && (
                    <p className="text-xs text-ink-400">
                      Ref: {order.paymentRef}
                    </p>
                  )}
                </div>
              </div>

              {/* Customer & Delivery address */}
              <div className="grid gap-2 text-xs text-ink-700 sm:grid-cols-2">
                <div className="flex items-center gap-1.5">
                  <User className="size-3.5 text-ink-400" aria-hidden="true" />
                  <span>
                    <strong>Buyer:</strong> {order.buyerName} (
                    {order.buyerEmail})
                  </span>
                </div>
                <div className="flex items-center gap-1.5">
                  <MapPin
                    className="size-3.5 text-ink-400"
                    aria-hidden="true"
                  />
                  <span className="truncate" title={order.deliveryAddress}>
                    <strong>Ship to:</strong> {order.deliveryAddress}
                  </span>
                </div>
              </div>

              {/* Items List */}
              <div className="space-y-1.5 rounded-md bg-surface-sunk p-3 text-xs">
                {order.items.map((item, idx) => (
                  <div
                    key={idx}
                    className="flex items-center justify-between text-ink-800"
                  >
                    <span>
                      {item.productName}{" "}
                      <span className="text-ink-400">× {item.quantity}</span>
                    </span>
                    <span className="numeric font-medium">
                      {formatCurrency(item.subtotal)}
                    </span>
                  </div>
                ))}
              </div>

              {/* Fulfilment Action Control */}
              <div className="flex items-center justify-between pt-2">
                <span className="text-xs text-ink-400">
                  {order.status === "SHIPPED"
                    ? "Shipped — delivery partner handles transit & drop-off."
                    : order.status === "DELIVERED"
                      ? "Order completed and delivered to customer."
                      : order.status === "CANCELLED"
                        ? "Order has been cancelled."
                        : `Current Stage: ${orderStatusLabel(order.status)}`}
                </span>

                {next.length > 0 ? (
                  <Button
                    size="sm"
                    loading={
                      advance.isPending && advance.variables?.id === order.id
                    }
                    onClick={() =>
                      advance.mutate({ id: order.id, status: next[0] })
                    }
                  >
                    Mark as {orderStatusLabel(next[0])}
                  </Button>
                ) : (
                  <span className="text-xs font-medium text-ink-500">
                    No action available
                  </span>
                )}
              </div>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
