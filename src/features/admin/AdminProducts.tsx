import { useState } from "react";
import { useSearchParams } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import toast from "react-hot-toast";
import { Package, Power, ImageOff } from "lucide-react";
import { adminApi, type AdminProductQuery } from "@/api/endpoints/admin";
import { qk } from "@/api/queryKeys";
import type { ProductCategory, ProductAdminResponse } from "@/api/types";
import { PRODUCT_CATEGORIES } from "@/lib/categories";
import { useDebounce } from "@/hooks/useDebounce";
import { formatCurrency } from "@/lib/format";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { Badge } from "@/components/ui/Badge";
import { Table } from "@/components/ui/Table";
import { Pagination } from "@/components/ui/Pagination";
import { Skeleton } from "@/components/ui/Skeleton";
import { EmptyState } from "@/components/feedback/EmptyState";
import { ErrorState } from "@/components/feedback/ErrorState";

const CATEGORY_OPTIONS = [
  { value: "ALL", label: "All Categories" },
  ...PRODUCT_CATEGORIES,
];

const ACTIVE_OPTIONS = [
  { value: "ALL", label: "All Listings" },
  { value: "TRUE", label: "Active Only" },
  { value: "FALSE", label: "Inactive Only" },
];

export function AdminProducts() {
  const queryClient = useQueryClient();
  const [searchParams, setSearchParams] = useSearchParams();

  const categoryParam = searchParams.get("category") || "ALL";
  const activeParam = searchParams.get("active") || "ALL";
  const searchParam = searchParams.get("search") || "";
  const pageParam = parseInt(searchParams.get("page") || "0", 10);

  const [searchInput, setSearchInput] = useState(searchParam);
  const debouncedSearch = useDebounce(searchInput, 400);

  const query: AdminProductQuery = {
    category:
      categoryParam === "ALL" ? null : (categoryParam as ProductCategory),
    active: activeParam === "ALL" ? null : activeParam === "TRUE",
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
    queryKey: qk.adminProducts(query),
    queryFn: () => adminApi.products(query),
  });

  const setActive = useMutation({
    mutationFn: ({ id, active }: { id: number; active: boolean }) =>
      adminApi.setProductActive(id, active),
    onSuccess: (updated) => {
      toast.success(
        `Listing #${updated.id} is now ${updated.isActive ? "active" : "inactive"}`,
      );
      void queryClient.invalidateQueries({ queryKey: ["admin"] });
    },
    onError: () => toast.error("Couldn't update product moderation status."),
  });

  function updateQuery(
    updates: Partial<{
      category: string;
      active: string;
      page: number;
      search: string;
    }>,
  ) {
    const next = new URLSearchParams(searchParams);
    if (updates.category !== undefined) {
      if (updates.category === "ALL") next.delete("category");
      else next.set("category", updates.category);
      next.set("page", "0");
    }
    if (updates.active !== undefined) {
      if (updates.active === "ALL") next.delete("active");
      else next.set("active", updates.active);
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

  const products = pageData?.content ?? [];
  const totalPages = pageData?.totalPages ?? 0;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-ink-900">
          Product Moderation
        </h1>
        <p className="mt-1 text-sm text-ink-500">
          Moderate vendor marketplace listings, categories, prices, and
          compliance.
        </p>
      </div>

      {/* Filters Row */}
      <div className="flex flex-wrap items-center gap-4">
        <div className="w-full max-w-xs">
          <Input
            placeholder="Search by product name..."
            value={searchInput}
            onChange={(e) => {
              setSearchInput(e.target.value);
              updateQuery({ search: e.target.value });
            }}
          />
        </div>
        <div className="w-48">
          <Select
            options={CATEGORY_OPTIONS}
            value={categoryParam}
            onChange={(e) => updateQuery({ category: e.target.value })}
          />
        </div>
        <div className="w-40">
          <Select
            options={ACTIVE_OPTIONS}
            value={activeParam}
            onChange={(e) => updateQuery({ active: e.target.value })}
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

      {!isLoading && !isError && products.length === 0 && (
        <EmptyState
          icon={Package}
          title="No products found"
          description="No marketplace products match the active moderation filters."
        />
      )}

      {!isLoading && !isError && products.length > 0 && (
        <>
          <Table<ProductAdminResponse>
            rows={products}
            rowKey={(p) => p.id}
            columns={[
              {
                key: "product",
                header: "Product",
                render: (p) => (
                  <div className="flex items-center gap-3">
                    <div className="flex size-10 shrink-0 items-center justify-center overflow-hidden rounded border border-border bg-surface-sunk">
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
                key: "seller",
                header: "Seller",
                render: (p) => (
                  <div className="space-y-0.5">
                    <span className="text-xs font-medium text-ink-900">
                      {p.sellerName}
                    </span>
                    <p className="text-[11px] text-ink-400">{p.sellerEmail}</p>
                  </div>
                ),
              },
              {
                key: "price",
                header: "Price",
                numeric: true,
                render: (p) => (
                  <span className="numeric text-ink-900">
                    {formatCurrency(p.price)}
                  </span>
                ),
              },
              {
                key: "stock",
                header: "Stock",
                numeric: true,
                render: (p) => (
                  <span className="numeric text-ink-700">
                    {p.stock} {p.unit}
                  </span>
                ),
              },
              {
                key: "status",
                header: "Status",
                render: (p) => (
                  <Badge tone={p.isActive ? "success" : "neutral"}>
                    {p.isActive ? "Active" : "Inactive"}
                  </Badge>
                ),
              },
              {
                key: "actions",
                header: "",
                numeric: true,
                render: (p) => (
                  <Button
                    variant="outline"
                    size="sm"
                    loading={
                      setActive.isPending && setActive.variables?.id === p.id
                    }
                    onClick={() =>
                      setActive.mutate({ id: p.id, active: !p.isActive })
                    }
                  >
                    <Power className="mr-1.5 size-3.5" aria-hidden="true" />
                    {p.isActive ? "Deactivate" : "Activate"}
                  </Button>
                ),
              },
            ]}
            mobileCard={(p) => (
              <div className="space-y-3 p-4">
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="font-medium text-ink-900">{p.name}</h3>
                    <p className="text-xs text-ink-500">
                      Seller: {p.sellerName}
                    </p>
                    <p className="numeric mt-1 text-xs text-ink-700">
                      {formatCurrency(p.price)} · {p.stock} {p.unit}
                    </p>
                  </div>
                  <Badge tone={p.isActive ? "success" : "neutral"}>
                    {p.isActive ? "Active" : "Inactive"}
                  </Badge>
                </div>

                <div className="flex justify-end border-t border-border pt-2">
                  <Button
                    variant="outline"
                    size="sm"
                    loading={
                      setActive.isPending && setActive.variables?.id === p.id
                    }
                    onClick={() =>
                      setActive.mutate({ id: p.id, active: !p.isActive })
                    }
                  >
                    {p.isActive ? "Deactivate" : "Activate"}
                  </Button>
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
