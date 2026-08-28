import { useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { ShoppingBag, Eye, Clock } from "lucide-react";
import { adminApi, type AdminOrderQuery } from "@/api/endpoints/admin";
import { qk } from "@/api/queryKeys";
import type { OrderAdminResponse, OrderStatus } from "@/api/types";
import { useDebounce } from "@/hooks/useDebounce";
import { formatCurrency, formatDateTime } from "@/lib/format";
import { orderStatusLabel, orderStatusTone } from "@/lib/orderStatus";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { Badge } from "@/components/ui/Badge";
import { Table } from "@/components/ui/Table";
import { Pagination } from "@/components/ui/Pagination";
import { Skeleton } from "@/components/ui/Skeleton";
import { EmptyState } from "@/components/feedback/EmptyState";
import { ErrorState } from "@/components/feedback/ErrorState";

const STATUS_OPTIONS = [
  { value: "ALL", label: "All Order Statuses" },
  { value: "PENDING", label: "Pending" },
  { value: "CONFIRMED", label: "Confirmed" },
  { value: "PACKED", label: "Packed" },
  { value: "SHIPPED", label: "Shipped" },
  { value: "OUT_FOR_DELIVERY", label: "Out for Delivery" },
  { value: "DELIVERED", label: "Delivered" },
  { value: "CANCELLED", label: "Cancelled" },
  { value: "RETURNED", label: "Returned" },
  { value: "REFUNDED", label: "Refunded" },
];

export function AdminOrders() {
  const [searchParams, setSearchParams] = useSearchParams();

  const statusParam = searchParams.get("status") || "ALL";
  const searchParam = searchParams.get("search") || "";
  const pageParam = parseInt(searchParams.get("page") || "0", 10);

  const [searchInput, setSearchInput] = useState(searchParam);
  const debouncedSearch = useDebounce(searchInput, 400);

  const query: AdminOrderQuery = {
    status: statusParam === "ALL" ? null : (statusParam as OrderStatus),
    search: debouncedSearch || undefined,
    page: pageParam,
    size: 20,
  };

  const {
    data: pageData,
    isLoading,
    isError,
    error,
    refetch,
  } = useQuery({
    queryKey: qk.adminOrders(query),
    queryFn: () => adminApi.orders(query),
  });

  function updateQuery(
    updates: Partial<{ status: string; page: number; search: string }>,
  ) {
    const next = new URLSearchParams(searchParams);
    if (updates.status !== undefined) {
      if (updates.status === "ALL") next.delete("status");
      else next.set("status", updates.status);
      next.set("page", "0");
    }
    if (updates.page !== undefined) {
      next.set("page", updates.page.toString());
    }
    if (updates.search !== undefined) {
      if (!updates.search) next.delete("search");
      else next.set("search", updates.search);
      next.set("page", "0");
    }
    setSearchParams(next);
  }

  const orders = pageData?.content ?? [];
  const totalPages = pageData?.totalPages ?? 0;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-ink-900">
          Order Oversight
        </h1>
        <p className="mt-1 text-sm text-ink-500">
          Global view of transactions, order lifecycle states, and customer
          dispute resolution.
        </p>
      </div>

      {/* Filters Row */}
      <div className="flex flex-wrap items-center gap-4">
        <div className="w-full max-w-xs">
          <Input
            placeholder="Search by order ID, buyer, address..."
            value={searchInput}
            onChange={(e) => {
              setSearchInput(e.target.value);
              updateQuery({ search: e.target.value });
            }}
          />
        </div>
        <div className="w-56">
          <Select
            options={STATUS_OPTIONS}
            value={statusParam}
            onChange={(e) => updateQuery({ status: e.target.value })}
          />
        </div>
      </div>

      {isLoading && (
        <div className="space-y-3">
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-16 w-full" />
          <Skeleton className="h-16 w-full" />
        </div>
      )}

      {isError && <ErrorState error={error} onRetry={() => void refetch()} />}

      {!isLoading && !isError && orders.length === 0 && (
        <EmptyState
          icon={ShoppingBag}
          title="No orders found"
          description="No customer orders match the current status and search criteria."
        />
      )}

      {!isLoading && !isError && orders.length > 0 && (
        <>
          <Table<OrderAdminResponse>
            rows={orders}
            rowKey={(o) => o.id}
            columns={[
              {
                key: "order",
                header: "Order",
                render: (o) => (
                  <div className="space-y-0.5">
                    <span className="font-semibold text-ink-900">#{o.id}</span>
                    <p className="flex items-center gap-1 text-[11px] text-ink-400">
                      <Clock className="size-3" aria-hidden="true" />
                      {formatDateTime(o.createdAt)}
                    </p>
                  </div>
                ),
              },
              {
                key: "parties",
                header: "Buyer / Seller",
                render: (o) => (
                  <div className="space-y-0.5 text-xs">
                    <p className="font-medium text-ink-900">
                      <strong>Buyer:</strong> {o.buyerName}
                    </p>
                    <p className="text-ink-500">
                      <strong>Seller:</strong>{" "}
                      {o.sellerName || "Direct / Vendor"}
                    </p>
                  </div>
                ),
              },
              {
                key: "items",
                header: "Items",
                numeric: true,
                render: (o) => (
                  <span className="numeric text-xs text-ink-700">
                    {o.items?.length ?? o.itemCount ?? 1} item(s)
                  </span>
                ),
              },
              {
                key: "total",
                header: "Total",
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
                render: (o) => (
                  <Badge tone={orderStatusTone(o.status)}>
                    {orderStatusLabel(o.status)}
                  </Badge>
                ),
              },
              {
                key: "actions",
                header: "",
                numeric: true,
                render: (o) => (
                  <Link to={`/admin/orders/${o.id}`}>
                    <Button variant="ghost" size="sm">
                      <Eye
                        className="size-4 text-ink-600"
                        aria-hidden="true"
                      />
                    </Button>
                  </Link>
                ),
              },
            ]}
            mobileCard={(o) => (
              <div className="space-y-3 p-4">
                <div className="flex items-start justify-between">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-ink-900">
                        Order #{o.id}
                      </span>
                      <Badge tone={orderStatusTone(o.status)}>
                        {orderStatusLabel(o.status)}
                      </Badge>
                    </div>
                    <p className="mt-1 text-xs text-ink-500">
                      Buyer: {o.buyerName} · Seller: {o.sellerName || "Vendor"}
                    </p>
                  </div>
                  <span className="numeric font-bold text-ink-900">
                    {formatCurrency(o.totalAmount)}
                  </span>
                </div>

                <div className="flex items-center justify-between border-t border-border pt-2 text-xs">
                  <span className="text-ink-400">
                    {formatDateTime(o.createdAt)}
                  </span>
                  <Link to={`/admin/orders/${o.id}`}>
                    <Button variant="outline" size="sm">
                      View details
                    </Button>
                  </Link>
                </div>
              </div>
            )}
          />

          <Pagination
            page={pageParam}
            totalPages={totalPages}
            onChange={(newPage) => updateQuery({ page: newPage })}
          />
        </>
      )}
    </div>
  );
}
