import { useState } from "react";
import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { Package } from "lucide-react";
import { ordersApi } from "@/api/endpoints/orders";
import { qk } from "@/api/queryKeys";
import { orderStatusLabel, orderStatusTone } from "@/lib/orderStatus";
import { formatCurrency, formatDate } from "@/lib/format";
import type { OrderStatus } from "@/api/types";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Skeleton } from "@/components/ui/Skeleton";
import { Tabs } from "@/components/ui/Tabs";
import { EmptyState } from "@/components/feedback/EmptyState";
import { ErrorState } from "@/components/feedback/ErrorState";

const FILTERS = [
  { id: "ALL", label: "All" },
  { id: "PENDING", label: "Pending" },
  { id: "SHIPPED", label: "Shipped" },
  { id: "DELIVERED", label: "Delivered" },
  { id: "CANCELLED", label: "Cancelled" },
];

export function OrderList() {
  const [filter, setFilter] = useState("ALL");

  const { data, isLoading, isError, error, refetch } = useQuery({
    queryKey: qk.myOrders(),
    queryFn: ordersApi.mine,
  });

  // The endpoint takes no status filter, so filter client-side.
  const orders =
    data?.filter(
      (o) => filter === "ALL" || o.status === (filter as OrderStatus),
    ) ?? [];

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
          {orders.map((order) => (
            <Card
              key={order.id}
              className="flex flex-wrap items-center gap-4 p-4"
            >
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-3">
                  <span className="numeric font-medium text-ink-900">
                    #{order.id}
                  </span>
                  <Badge tone={orderStatusTone(order.status)}>
                    {orderStatusLabel(order.status)}
                  </Badge>
                </div>
                <p className="mt-1 text-sm text-ink-500">
                  {order.items.length} item
                  {order.items.length === 1 ? "" : "s"} ·{" "}
                  {formatDate(order.createdAt)}
                </p>
              </div>

              <p className="numeric font-semibold text-ink-900">
                {formatCurrency(order.totalAmount)}
              </p>

              <Link to={`/app/orders/${order.id}`}>
                <Button variant="outline" size="sm">
                  View
                </Button>
              </Link>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
}
