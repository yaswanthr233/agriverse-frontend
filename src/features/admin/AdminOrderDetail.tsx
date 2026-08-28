import { useState } from "react";
import { Link, useParams } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import toast from "react-hot-toast";
import {
  ChevronLeft,
  Clock,
  User,
  Store,
  MapPin,
} from "lucide-react";
import { adminApi } from "@/api/endpoints/admin";
import { ordersApi } from "@/api/endpoints/orders";
import { qk } from "@/api/queryKeys";
import type { OrderStatus } from "@/api/types";
import { nextStatusesFor } from "@/lib/orderTransitions";
import { orderStatusLabel, orderStatusTone } from "@/lib/orderStatus";
import { formatCurrency, formatDateTime } from "@/lib/format";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Select } from "@/components/ui/Select";
import { Skeleton } from "@/components/ui/Skeleton";
import { ErrorState } from "@/components/feedback/ErrorState";
import { OrderTimeline } from "@/features/orders/OrderTimeline";

export function AdminOrderDetail() {
  const { id } = useParams();
  const orderId = Number(id);
  const queryClient = useQueryClient();
  const [selectedStatus, setSelectedStatus] = useState<string>("");

  const {
    data: order,
    isLoading,
    isError,
    error,
    refetch,
  } = useQuery({
    queryKey: qk.adminOrder(orderId),
    queryFn: () => adminApi.order(orderId),
    enabled: Number.isFinite(orderId),
  });

  const updateStatus = useMutation({
    mutationFn: (status: OrderStatus) =>
      ordersApi.updateStatus(orderId, status),
    onSuccess: (updated) => {
      toast.success(
        `Order #${updated.id} status changed to ${orderStatusLabel(updated.status)}`,
      );
      setSelectedStatus("");
      void queryClient.invalidateQueries({ queryKey: ["admin"] });
      void queryClient.invalidateQueries({ queryKey: qk.adminOrder(orderId) });
    },
    onError: () => toast.error("Couldn't update order status."),
  });

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-40" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  if (isError || !order) {
    return <ErrorState error={error} onRetry={() => void refetch()} />;
  }

  const allowedNext = nextStatusesFor("ADMIN", order.status);
  const statusOptions = [
    { value: "", label: "Select new status..." },
    ...allowedNext.map((s) => ({ value: s, label: orderStatusLabel(s) })),
  ];

  return (
    <div className="max-w-4xl space-y-6">
      <Link
        to="/admin/orders"
        className="inline-flex items-center gap-1 text-sm font-medium text-primary-700 hover:underline"
      >
        <ChevronLeft className="size-4" aria-hidden="true" /> Back to orders
      </Link>

      {/* Main Order Card */}
      <Card className="space-y-6 p-6">
        <div className="flex flex-wrap items-start justify-between gap-4 border-b border-border pb-6">
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-bold text-ink-900">
                Order #{order.id}
              </h1>
              <Badge tone={orderStatusTone(order.status)}>
                {orderStatusLabel(order.status)}
              </Badge>
            </div>
            <p className="mt-1 flex items-center gap-1.5 text-xs text-ink-500">
              <Clock className="size-3.5" aria-hidden="true" />
              Placed on {formatDateTime(order.createdAt)}
            </p>
          </div>

          {/* Admin Override Status Selector */}
          <div className="flex items-center gap-2">
            <div className="w-48">
              <Select
                options={statusOptions}
                value={selectedStatus}
                onChange={(e) => setSelectedStatus(e.target.value)}
              />
            </div>
            <Button
              disabled={!selectedStatus}
              loading={updateStatus.isPending}
              onClick={() => {
                if (selectedStatus)
                  updateStatus.mutate(selectedStatus as OrderStatus);
              }}
            >
              Update Status
            </Button>
          </div>
        </div>

        {/* Timeline */}
        <div className="border-b border-border pb-6">
          <h2 className="mb-4 text-xs font-semibold uppercase tracking-wider text-ink-500">
            Fulfilment Progress
          </h2>
          <OrderTimeline status={order.status} />
        </div>

        {/* Buyer, Seller & Delivery Info */}
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-1 rounded-md bg-surface-sunk p-4 text-xs">
            <h3 className="flex items-center gap-1.5 text-sm font-semibold text-ink-900">
              <User className="size-4 text-primary-700" aria-hidden="true" />{" "}
              Buyer Information
            </h3>
            <p className="text-ink-700">
              <strong>Name:</strong> {order.buyerName}
            </p>
            <p className="text-ink-700">
              <strong>Email:</strong> {order.buyerEmail}
            </p>
          </div>

          <div className="space-y-1 rounded-md bg-surface-sunk p-4 text-xs">
            <h3 className="flex items-center gap-1.5 text-sm font-semibold text-ink-900">
              <Store className="size-4 text-primary-700" aria-hidden="true" />{" "}
              Seller / Vendor
            </h3>
            <p className="text-ink-700">
              <strong>Seller Name:</strong>{" "}
              {order.sellerName || "Direct Platform"}
            </p>
            <p className="text-ink-700">
              <strong>Email:</strong>{" "}
              {order.sellerEmail || "support@agriverse.in"}
            </p>
          </div>

          <div className="space-y-1 rounded-md bg-surface-sunk p-4 text-xs sm:col-span-2">
            <h3 className="flex items-center gap-1.5 text-sm font-semibold text-ink-900">
              <MapPin className="size-4 text-primary-700" aria-hidden="true" />{" "}
              Shipping Address & Payment
            </h3>
            <p className="text-ink-700">
              <strong>Delivery Address:</strong> {order.deliveryAddress}
            </p>
            {order.paymentRef && (
              <p className="text-ink-700">
                <strong>Payment Reference / Transaction ID:</strong>{" "}
                {order.paymentRef}
              </p>
            )}
          </div>
        </div>

        {/* Line Items Table */}
        <div className="space-y-3">
          <h2 className="text-xs font-semibold uppercase tracking-wider text-ink-500">
            Purchased Line Items
          </h2>

          <div className="divide-y divide-border rounded-lg border border-border bg-surface">
            {order.items.map((item, idx) => (
              <div
                key={idx}
                className="flex items-center justify-between p-4 text-sm"
              >
                <div>
                  <p className="font-medium text-ink-900">{item.productName}</p>
                  <p className="text-xs text-ink-500">
                    {formatCurrency(item.unitPrice)} × {item.quantity} units
                  </p>
                </div>
                <span className="numeric font-semibold text-ink-900">
                  {formatCurrency(item.subtotal)}
                </span>
              </div>
            ))}
          </div>

          <div className="flex justify-end p-2 text-right">
            <div>
              <span className="text-xs text-ink-500">Total Charged Amount</span>
              <p className="numeric text-2xl font-bold text-ink-900">
                {formatCurrency(order.totalAmount)}
              </p>
            </div>
          </div>
        </div>
      </Card>
    </div>
  );
}
