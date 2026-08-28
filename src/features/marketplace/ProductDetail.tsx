import { useState } from "react";
import { useParams, Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { ImageOff, Minus, Plus, ShoppingCart, ChevronRight } from "lucide-react";
import toast from "react-hot-toast";
import { productsApi } from "@/api/endpoints/products";
import { qk } from "@/api/queryKeys";
import { formatCurrency } from "@/lib/format";
import { useCartStore } from "@/stores/cartStore";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Skeleton } from "@/components/ui/Skeleton";
import { ErrorState } from "@/components/feedback/ErrorState";

export function ProductDetail() {
  const { id } = useParams();
  const productId = Number(id);
  const [quantity, setQuantity] = useState(1);
  const addItem = useCartStore((s) => s.addItem);

  const {
    data: product,
    isLoading,
    isError,
    error,
    refetch,
  } = useQuery({
    queryKey: qk.product(productId),
    queryFn: () => productsApi.byId(productId),
    enabled: Number.isFinite(productId),
  });

  if (isLoading) {
    return (
      <div className="mx-auto grid max-w-[1280px] gap-8 px-4 py-8 md:grid-cols-2">
        <Skeleton className="aspect-square" />
        <div className="space-y-4">
          <Skeleton className="h-8 w-3/4" />
          <Skeleton className="h-6 w-32" />
          <Skeleton className="h-24 w-full" />
        </div>
      </div>
    );
  }

  if (isError || !product) {
    return (
      <div className="mx-auto max-w-[1280px] px-4 py-8">
        <ErrorState error={error} onRetry={() => void refetch()} />
      </div>
    );
  }

  const outOfStock = product.stock <= 0;

  function handleAdd() {
    for (let i = 0; i < quantity; i++) {
      addItem(product!);
    }
    toast.success(`${product!.name} added to cart`);
  }

  return (
    <div className="mx-auto max-w-[1280px] px-4 py-8">
      <nav
        className="mb-6 flex items-center gap-1 text-sm text-ink-500"
        aria-label="Breadcrumb"
      >
        <Link to="/marketplace" className="hover:text-ink-900">
          Marketplace
        </Link>
        <ChevronRight className="size-4" aria-hidden="true" />
        <span className="text-ink-900">{product.name}</span>
      </nav>

      <div className="grid gap-8 md:grid-cols-2">
        <div className="flex aspect-square items-center justify-center overflow-hidden rounded-lg border border-border bg-surface-sunk">
          {product.imageUrl ? (
            <img
              src={product.imageUrl}
              alt={product.name}
              className="size-full object-cover"
            />
          ) : (
            <ImageOff className="size-16 text-ink-400" aria-hidden="true" />
          )}
        </div>

        <div>
          <Badge tone="neutral">{product.categoryLabel}</Badge>
          <h1 className="mt-3 text-2xl font-semibold text-ink-900">
            {product.name}
          </h1>
          {product.brand && (
            <p className="mt-1 text-sm text-ink-500">{product.brand}</p>
          )}

          <p className="numeric mt-4 text-3xl font-semibold text-ink-900">
            {formatCurrency(product.price)}
            <span className="ml-2 text-base font-normal text-ink-500">
              per {product.unit}
            </span>
          </p>

          <p className="mt-3 text-sm">
            {outOfStock ? (
              <span className="font-medium text-danger-700">Out of stock</span>
            ) : (
              <span className="text-success-700">
                {product.stock} {product.unit} in stock
              </span>
            )}
          </p>

          {!outOfStock && (
            <div className="mt-6 flex items-center gap-4">
              <div className="flex items-center rounded-md border border-border">
                <button
                  onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                  aria-label="Decrease quantity"
                  className="p-2.5 text-ink-700 hover:bg-surface-sunk disabled:opacity-40"
                  disabled={quantity <= 1}
                >
                  <Minus className="size-4" aria-hidden="true" />
                </button>
                <span className="numeric w-12 text-center">{quantity}</span>
                <button
                  onClick={() =>
                    setQuantity((q) => Math.min(product.stock, q + 1))
                  }
                  aria-label="Increase quantity"
                  className="p-2.5 text-ink-700 hover:bg-surface-sunk disabled:opacity-40"
                  disabled={quantity >= product.stock}
                >
                  <Plus className="size-4" aria-hidden="true" />
                </button>
              </div>

              <Button size="lg" onClick={handleAdd}>
                <ShoppingCart className="size-4" aria-hidden="true" /> Add to
                Cart
              </Button>
            </div>
          )}

          <dl className="mt-8 space-y-3 border-t border-border pt-6 text-sm">
            <div className="flex justify-between">
              <dt className="text-ink-500">Sold by</dt>
              <dd className="text-ink-900">{product.sellerName}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-ink-500">Unit</dt>
              <dd className="text-ink-900">{product.unit}</dd>
            </div>
          </dl>

          {product.description && (
            <div className="mt-8 border-t border-border pt-6">
              <h2 className="font-semibold text-ink-900">Description</h2>
              <p className="mt-2 whitespace-pre-line text-sm leading-relaxed text-ink-700">
                {product.description}
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
