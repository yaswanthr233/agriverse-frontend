import { Link } from "react-router-dom";
import { ImageOff, ShoppingCart } from "lucide-react";
import type { ProductResponse } from "@/api/types";
import { formatCurrency } from "@/lib/format";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";

interface ProductCardProps {
  product: ProductResponse;
  onAddToCart?: (product: ProductResponse) => void;
}

// NOTE: no rating, no stars, no wishlist — the backend has none of these.
export function ProductCard({ product, onAddToCart }: ProductCardProps) {
  const outOfStock = product.stock <= 0;

  return (
    <Card interactive className="flex flex-col overflow-hidden">
      <Link to={`/product/${product.id}`} className="block">
        <div className="flex aspect-[4/3] items-center justify-center bg-surface-sunk">
          {product.imageUrl ? (
            <img
              src={product.imageUrl}
              alt={product.name}
              className="size-full object-cover"
              loading="lazy"
            />
          ) : (
            <ImageOff className="size-10 text-ink-400" aria-hidden="true" />
          )}
        </div>
      </Link>

      <div className="flex flex-1 flex-col gap-2 p-4">
        <Badge tone="neutral" className="self-start">
          {product.categoryLabel}
        </Badge>

        <Link
          to={`/product/${product.id}`}
          className="line-clamp-2 font-medium text-ink-900 hover:text-primary-700"
        >
          {product.name}
        </Link>

        <p className="text-sm text-ink-500">{product.sellerName}</p>

        <div className="mt-auto flex items-end justify-between gap-2 pt-2">
          <div>
            <p className="numeric text-lg font-semibold text-ink-900">
              {formatCurrency(product.price)}
            </p>
            <p className="text-xs text-ink-500">per {product.unit}</p>
          </div>

          {onAddToCart && (
            <Button
              size="sm"
              disabled={outOfStock}
              onClick={() => onAddToCart(product)}
            >
              <ShoppingCart className="size-4" aria-hidden="true" />
              {outOfStock ? "Out of stock" : "Add"}
            </Button>
          )}
        </div>
      </div>
    </Card>
  );
}
