import { useState } from "react";
import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { Layers, Edit2, ImageOff } from "lucide-react";
import { productsApi } from "@/api/endpoints/products";
import { qk } from "@/api/queryKeys";
import type { ProductResponse } from "@/api/types";
import { formatCurrency } from "@/lib/format";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { Tabs } from "@/components/ui/Tabs";
import { Table } from "@/components/ui/Table";
import { Skeleton } from "@/components/ui/Skeleton";
import { EmptyState } from "@/components/feedback/EmptyState";
import { ErrorState } from "@/components/feedback/ErrorState";

const BANDS = [
  { id: "ALL", label: "All Items" },
  { id: "OUT", label: "Out of Stock (0)" },
  { id: "LOW", label: "Low Stock (< 10)" },
  { id: "HEALTHY", label: "Healthy (≥ 10)" },
];

export function SellerInventory() {
  const [selectedBand, setSelectedBand] = useState("ALL");

  const {
    data: products,
    isLoading,
    isError,
    error,
    refetch,
  } = useQuery({
    queryKey: qk.myProducts(),
    queryFn: productsApi.mine,
  });

  const sortedProducts = [...(products ?? [])].sort(
    (a, b) => a.stock - b.stock,
  );

  const filtered = sortedProducts.filter((p) => {
    if (selectedBand === "OUT") return p.stock === 0;
    if (selectedBand === "LOW") return p.stock > 0 && p.stock < 10;
    if (selectedBand === "HEALTHY") return p.stock >= 10;
    return true;
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-ink-900">
            Inventory Management
          </h1>
          <p className="mt-1 text-sm text-ink-500">
            Monitor stock thresholds, units, out-of-stock items, and restock
            priorities.
          </p>
        </div>
      </div>

      <Tabs tabs={BANDS} active={selectedBand} onChange={setSelectedBand} />

      {isLoading && (
        <div className="space-y-3">
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-20 w-full" />
          <Skeleton className="h-20 w-full" />
        </div>
      )}

      {isError && <ErrorState error={error} onRetry={() => void refetch()} />}

      {!isLoading && !isError && products?.length === 0 && (
        <EmptyState
          icon={Layers}
          title="No inventory recorded"
          description="Your product catalogue has no registered items yet."
          action={
            <Link to="/seller/products/new">
              <Button>Add a product</Button>
            </Link>
          }
        />
      )}

      {!isLoading && !isError && products && products.length > 0 && (
        <Table<ProductResponse>
          rows={filtered}
          rowKey={(p) => p.id}
          columns={[
            {
              key: "product",
              header: "Product",
              render: (p) => (
                <div className="flex items-center gap-3">
                  <div className="flex size-10 shrink-0 items-center justify-center overflow-hidden rounded-md border border-border bg-surface-sunk">
                    {p.imageUrl ? (
                      <img
                        src={p.imageUrl}
                        alt={p.name}
                        className="size-full object-cover"
                        onError={(e) => {
                          e.currentTarget.style.display = "none";
                        }}
                      />
                    ) : (
                      <ImageOff
                        className="size-4 text-ink-400"
                        aria-hidden="true"
                      />
                    )}
                  </div>
                  <div>
                    <span className="font-medium text-ink-900">{p.name}</span>
                    <p className="text-xs text-ink-400">
                      {p.categoryLabel || p.category}
                    </p>
                  </div>
                </div>
              ),
            },
            {
              key: "stock",
              header: "Stock Level",
              numeric: true,
              render: (p) => (
                <div className="flex items-center justify-end gap-2">
                  <span
                    className={`numeric font-semibold ${
                      p.stock === 0
                        ? "text-danger-600"
                        : p.stock < 10
                          ? "text-warning-600"
                          : "text-success-700"
                    }`}
                  >
                    {p.stock} {p.unit}
                  </span>
                  <Badge
                    tone={
                      p.stock === 0
                        ? "danger"
                        : p.stock < 10
                          ? "warning"
                          : "success"
                    }
                  >
                    {p.stock === 0
                      ? "Out of Stock"
                      : p.stock < 10
                        ? "Low Stock"
                        : "Healthy"}
                  </Badge>
                </div>
              ),
            },
            {
              key: "price",
              header: "Unit Price",
              numeric: true,
              render: (p) => (
                <span className="numeric text-ink-900">
                  {formatCurrency(p.price)}
                </span>
              ),
            },
            {
              key: "actions",
              header: "",
              numeric: true,
              render: (p) => (
                <Link to={`/seller/products/${p.id}/edit`}>
                  <Button variant="outline" size="sm">
                    <Edit2 className="size-3.5" aria-hidden="true" /> Update
                    Stock
                  </Button>
                </Link>
              ),
            },
          ]}
          mobileCard={(p) => (
            <div className="flex items-center justify-between gap-4 p-4">
              <div>
                <h3 className="font-medium text-ink-900">{p.name}</h3>
                <p className="numeric text-xs text-ink-500">
                  {formatCurrency(p.price)} / {p.unit}
                </p>
                <div className="mt-1 flex items-center gap-2">
                  <span
                    className={`numeric text-xs font-semibold ${
                      p.stock === 0
                        ? "text-danger-600"
                        : p.stock < 10
                          ? "text-warning-600"
                          : "text-success-700"
                    }`}
                  >
                    {p.stock} in stock
                  </span>
                  <Badge
                    tone={
                      p.stock === 0
                        ? "danger"
                        : p.stock < 10
                          ? "warning"
                          : "success"
                    }
                  >
                    {p.stock === 0
                      ? "Out of Stock"
                      : p.stock < 10
                        ? "Low"
                        : "Healthy"}
                  </Badge>
                </div>
              </div>
              <Link to={`/seller/products/${p.id}/edit`}>
                <Button variant="outline" size="sm">
                  Update
                </Button>
              </Link>
            </div>
          )}
        />
      )}
    </div>
  );
}
