import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import toast from "react-hot-toast";
import { Plus, Edit2, Trash2, Package, ImageOff } from "lucide-react";
import { productsApi } from "@/api/endpoints/products";
import { qk } from "@/api/queryKeys";
import type { ProductResponse } from "@/api/types";
import { formatCurrency } from "@/lib/format";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Badge } from "@/components/ui/Badge";
import { Table } from "@/components/ui/Table";
import { Modal } from "@/components/ui/Modal";
import { Skeleton } from "@/components/ui/Skeleton";
import { EmptyState } from "@/components/feedback/EmptyState";
import { ErrorState } from "@/components/feedback/ErrorState";

export function SellerProducts() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");
  const [deletingProduct, setDeletingProduct] =
    useState<ProductResponse | null>(null);

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

  const deleteMutation = useMutation({
    mutationFn: (id: number) => productsApi.remove(id),
    onSuccess: () => {
      toast.success("Product deleted");
      setDeletingProduct(null);
      void queryClient.invalidateQueries({ queryKey: qk.myProducts() });
    },
    onError: () => toast.error("Couldn't delete product."),
  });

  const filtered =
    products?.filter((p) =>
      p.name.toLowerCase().includes(search.toLowerCase().trim()),
    ) ?? [];

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-ink-900">Products</h1>
          <p className="mt-1 text-sm text-ink-500">
            Manage your store catalogue, prices, stock levels, and visibility.
          </p>
        </div>
        <Link to="/seller/products/new">
          <Button>
            <Plus className="size-4" aria-hidden="true" /> Add Product
          </Button>
        </Link>
      </div>

      <div className="flex items-center gap-4">
        <div className="w-full max-w-sm">
          <Input
            placeholder="Search products by name..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
      </div>

      {isLoading && (
        <div className="space-y-3">
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-20 w-full" />
          <Skeleton className="h-20 w-full" />
          <Skeleton className="h-20 w-full" />
        </div>
      )}

      {isError && <ErrorState error={error} onRetry={() => void refetch()} />}

      {!isLoading && !isError && products?.length === 0 && (
        <EmptyState
          icon={Package}
          title="No products yet"
          description="You haven't listed any agricultural products in your catalogue."
          action={
            <Button onClick={() => navigate("/seller/products/new")}>
              Add your first product
            </Button>
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
                  <div className="flex size-12 shrink-0 items-center justify-center overflow-hidden rounded-md border border-border bg-surface-sunk">
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
                        className="size-5 text-ink-400"
                        aria-hidden="true"
                      />
                    )}
                  </div>
                  <div>
                    <span className="font-medium text-ink-900">{p.name}</span>
                    {p.brand && (
                      <p className="text-xs text-ink-400">{p.brand}</p>
                    )}
                  </div>
                </div>
              ),
            },
            {
              key: "category",
              header: "Category",
              render: (p) => (
                <Badge tone="neutral">{p.categoryLabel || p.category}</Badge>
              ),
            },
            {
              key: "price",
              header: "Price",
              numeric: true,
              render: (p) => (
                <span className="numeric font-medium text-ink-900">
                  {formatCurrency(p.price)}
                </span>
              ),
            },
            {
              key: "stock",
              header: "Stock",
              numeric: true,
              render: (p) => (
                <span
                  className={`numeric font-medium ${
                    p.stock === 0
                      ? "text-danger-600"
                      : p.stock < 10
                        ? "text-warning-600"
                        : "text-ink-900"
                  }`}
                >
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
                <div className="flex items-center justify-end gap-2">
                  <Link to={`/seller/products/${p.id}/edit`}>
                    <Button variant="ghost" size="sm">
                      <Edit2
                        className="size-4 text-ink-600"
                        aria-hidden="true"
                      />
                    </Button>
                  </Link>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setDeletingProduct(p)}
                  >
                    <Trash2
                      className="size-4 text-danger-600"
                      aria-hidden="true"
                    />
                  </Button>
                </div>
              ),
            },
          ]}
          mobileCard={(p) => (
            <div className="flex items-center justify-between gap-4 p-4">
              <div className="flex items-center gap-3">
                <div className="flex size-12 shrink-0 items-center justify-center overflow-hidden rounded-md border border-border bg-surface-sunk">
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
                      className="size-5 text-ink-400"
                      aria-hidden="true"
                    />
                  )}
                </div>
                <div>
                  <h3 className="font-medium text-ink-900">{p.name}</h3>
                  <p className="numeric text-xs text-ink-500">
                    {formatCurrency(p.price)} · {p.stock} in stock
                  </p>
                  <Badge
                    tone={p.isActive ? "success" : "neutral"}
                    className="mt-1"
                  >
                    {p.isActive ? "Active" : "Inactive"}
                  </Badge>
                </div>
              </div>
              <div className="flex items-center gap-1">
                <Link to={`/seller/products/${p.id}/edit`}>
                  <Button variant="ghost" size="sm">
                    <Edit2
                      className="size-4 text-ink-600"
                      aria-hidden="true"
                    />
                  </Button>
                </Link>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setDeletingProduct(p)}
                >
                  <Trash2
                    className="size-4 text-danger-600"
                    aria-hidden="true"
                  />
                </Button>
              </div>
            </div>
          )}
        />
      )}

      {/* Delete Confirmation Modal */}
      <Modal
        open={deletingProduct !== null}
        onClose={() => setDeletingProduct(null)}
        title="Delete Product"
      >
        <div className="space-y-4">
          <p className="text-sm text-ink-700">
            Are you sure you want to delete{" "}
            <span className="font-semibold text-ink-900">
              {deletingProduct?.name}
            </span>
            ? This action cannot be undone and will remove it from the public
            marketplace.
          </p>
          <div className="flex justify-end gap-2">
            <Button
              variant="outline"
              onClick={() => setDeletingProduct(null)}
            >
              Cancel
            </Button>
            <Button
              variant="danger"
              loading={deleteMutation.isPending}
              onClick={() => {
                if (deletingProduct) deleteMutation.mutate(deletingProduct.id);
              }}
            >
              Delete
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
