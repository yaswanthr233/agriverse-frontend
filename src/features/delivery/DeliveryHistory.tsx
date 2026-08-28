import { useQuery } from "@tanstack/react-query";
import { History, MapPin } from "lucide-react";
import { deliveryApi } from "@/api/endpoints/deliveryPortal";
import { qk } from "@/api/queryKeys";
import type { OrderResponse } from "@/api/types";
import { formatCurrency, formatDateTime } from "@/lib/format";
import { Table } from "@/components/ui/Table";
import { Badge } from "@/components/ui/Badge";
import { Skeleton } from "@/components/ui/Skeleton";
import { EmptyState } from "@/components/feedback/EmptyState";
import { ErrorState } from "@/components/feedback/ErrorState";

export function DeliveryHistory() {
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

  const deliveredOrders = (orders ?? [])
    .filter((o) => o.status === "DELIVERED")
    .sort(
      (a, b) =>
        new Date(b.updatedAt || b.createdAt).getTime() -
        new Date(a.updatedAt || a.createdAt).getTime(),
    );

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-ink-900">
          Delivery History
        </h1>
        <p className="mt-1 text-sm text-ink-500">
          Archived ledger of all completed deliveries fulfilled by your partner
          account.
        </p>
      </div>

      {isLoading && (
        <div className="space-y-3">
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-16 w-full" />
          <Skeleton className="h-16 w-full" />
        </div>
      )}

      {isError && <ErrorState error={error} onRetry={() => void refetch()} />}

      {!isLoading && !isError && deliveredOrders.length === 0 && (
        <EmptyState
          icon={History}
          title="No completed deliveries yet"
          description="Packages you claim and mark as delivered will automatically appear in this history."
        />
      )}

      {!isLoading && !isError && deliveredOrders.length > 0 && (
        <Table<OrderResponse>
          rows={deliveredOrders}
          rowKey={(o) => o.id}
          columns={[
            {
              key: "order",
              header: "Order",
              render: (o) => (
                <div className="space-y-0.5">
                  <span className="font-semibold text-ink-900">#{o.id}</span>
                  <p className="text-xs text-ink-400">
                    {o.items?.length ?? 1} item(s)
                  </p>
                </div>
              ),
            },
            {
              key: "buyer",
              header: "Recipient",
              render: (o) => (
                <span className="text-xs font-medium text-ink-900">
                  {o.buyerName}
                </span>
              ),
            },
            {
              key: "destination",
              header: "Delivery Address",
              render: (o) => (
                <span className="block max-w-xs truncate text-xs text-ink-700">
                  {o.deliveryAddress}
                </span>
              ),
            },
            {
              key: "total",
              header: "Order Value",
              numeric: true,
              render: (o) => (
                <span className="numeric font-semibold text-ink-900">
                  {formatCurrency(o.totalAmount)}
                </span>
              ),
            },
            {
              key: "status",
              header: "Status",
              render: () => <Badge tone="success">Delivered</Badge>,
            },
            {
              key: "date",
              header: "Delivered On",
              render: (o) => (
                <span className="text-xs text-ink-500">
                  {formatDateTime(o.updatedAt || o.createdAt)}
                </span>
              ),
            },
          ]}
          mobileCard={(o) => (
            <div className="space-y-2 p-4 text-xs">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="font-bold text-ink-900">Order #{o.id}</span>
                  <Badge tone="success">Delivered</Badge>
                </div>
                <span className="numeric text-sm font-bold text-ink-900">
                  {formatCurrency(o.totalAmount)}
                </span>
              </div>
              <p className="font-medium text-ink-700">To: {o.buyerName}</p>
              <p className="flex items-start gap-1 text-ink-500">
                <MapPin
                  className="mt-0.5 size-3 shrink-0"
                  aria-hidden="true"
                />
                {o.deliveryAddress}
              </p>
              <p className="mt-1 border-t border-border pt-1 text-ink-400">
                Completed on {formatDateTime(o.updatedAt || o.createdAt)}
              </p>
            </div>
          )}
        />
      )}
    </div>
  );
}
