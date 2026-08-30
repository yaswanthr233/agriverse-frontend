import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { Package, MapPin, Compass } from "lucide-react";
import { ordersApi } from "@/api/endpoints/orders";
import { qk } from "@/api/queryKeys";
import { orderStatusLabel, orderStatusTone } from "@/lib/orderStatus";
import { formatCurrency, formatDate } from "@/lib/format";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Skeleton } from "@/components/ui/Skeleton";
import { Tabs } from "@/components/ui/Tabs";
import { EmptyState } from "@/components/feedback/EmptyState";
import { ErrorState } from "@/components/feedback/ErrorState";

import { useAuthStore } from "@/stores/authStore";

const FILTERS = [
  { id: "ALL", label: "All" },
  { id: "PENDING", label: "Pending" },
  { id: "SHIPPED", label: "Shipped" },
  { id: "DELIVERED", label: "Delivered" },
  { id: "CANCELLED", label: "Cancelled" },
];

export function OrderList() {
  const [filter, setFilter] = useState("ALL");
  const user = useAuthStore((s) => s.user);

  const { data, isLoading, isError, error, refetch } = useQuery({
    queryKey: qk.myOrders(),
    queryFn: ordersApi.mine,
  });

  useEffect(() => {
    if (isError && error) {
      console.error("MY ORDERS QUERY ERROR", error);
      console.error("MY ORDERS USER", user);
      console.error("MY ORDERS DATA", data);
    }
  }, [isError, error, user, data]);

  // Robust client-side filter matching actual backend lifecycle status states
  const orders = (data || []).filter((o) => {
    if (filter === "ALL") return true;
    if (filter === "PENDING") {
      return (
        o.status === "PENDING" ||
        o.status === "CONFIRMED" ||
        o.status === "PACKED"
      );
    }
    if (filter === "SHIPPED") {
      return o.status === "SHIPPED" || o.status === "OUT_FOR_DELIVERY";
    }
    if (filter === "DELIVERED") {
      return o.status === "DELIVERED";
    }
    if (filter === "CANCELLED") {
      return (
        o.status === "CANCELLED" ||
        o.status === "RETURNED" ||
        o.status === "REFUNDED"
      );
    }
    return o.status === filter;
  });

  return (
    <div>
      <h1 className="text-2xl font-semibold text-ink-900">My orders</h1>

      <div className="mt-6">
        <Tabs tabs={FILTERS} active={filter} onChange={setFilter} />
      </div>

      <div className="mt-6">
        {isLoading && (
          <div className="space-y-3">
            {Array.from({ length: 3 }).map((_, i) => (
              <Skeleton key={i} className="h-28 w-full" />
            ))}
          </div>
        )}

        {isError && <ErrorState error={error} onRetry={() => void refetch()} />}

        {!isLoading && !isError && orders.length === 0 && (
          filter === "ALL" ? (
            <EmptyState
              icon={Package}
              title="No orders yet"
              description="Products you buy will appear here."
              action={
                <Link to="/marketplace">
                  <Button>Start shopping</Button>
                </Link>
              }
            />
          ) : (
            <EmptyState
              icon={Package}
              title={`No ${filter.toLowerCase()} orders`}
              description="Try a different filter."
            />
          )
        )}

        <div className="space-y-3">
          {orders.map((order) => {
            const hasGps =
              order.deliveryLatitude != null && order.deliveryLongitude != null;

            return (
              <Card
                key={order.id}
                className="flex flex-wrap items-center justify-between gap-4 p-4"
              >
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-3">
                    <span className="numeric font-medium text-ink-900">
                      #{order.id}
                    </span>
                    <Badge tone={orderStatusTone(order.status)}>
                      {orderStatusLabel(order.status)}
                    </Badge>
                    {hasGps ? (
                      <Badge tone="success" className="gap-1 text-xs">
                        <Compass className="size-3" />
                        GPS Saved
                      </Badge>
                    ) : (
                      <span className="text-xs text-ink-400">
                        {order.deliveryAddress ? "Address Only" : "Delivery location not available"}
                      </span>
                    )}
                  </div>
                  <p className="mt-1 text-sm text-ink-500">
                    {order.items?.length ?? 0} item
                    {order.items?.length === 1 ? "" : "s"} ·{" "}
                    {formatDate(order.createdAt)}
                  </p>
                  {order.deliveryAddress && (
                    <p className="mt-1 flex items-center gap-1 text-xs text-ink-600">
                      <MapPin className="size-3 text-ink-400" />
                      <span className="truncate max-w-md">{order.deliveryAddress}</span>
                    </p>
                  )}
                </div>

                <div className="flex items-center gap-4">
                  <p className="numeric font-semibold text-ink-900">
                    {formatCurrency(order.totalAmount)}
                  </p>

                  <Link to={`/app/orders/${order.id}`}>
                    <Button variant="outline" size="sm">
                      View
                    </Button>
                  </Link>
                </div>
              </Card>
            );
          })}
        </div>
      </div>
    </div>
  );
}
