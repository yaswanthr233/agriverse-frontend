import { Link, useNavigate } from "react-router-dom";
import { ShoppingCart, Minus, Plus, Trash2, ImageOff } from "lucide-react";
import { useCartStore } from "@/stores/cartStore";
import { calculateTotals, FREE_SHIPPING_THRESHOLD } from "@/lib/checkout";
import { formatCurrency } from "@/lib/format";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { EmptyState } from "@/components/feedback/EmptyState";

export function Cart() {
  const navigate = useNavigate();
  const items = useCartStore((s) => s.items);
  const setQuantity = useCartStore((s) => s.setQuantity);
  const removeItem = useCartStore((s) => s.removeItem);
  const subtotal = useCartStore((s) => s.subtotal());

  if (items.length === 0) {
    return (
      <EmptyState
        icon={ShoppingCart}
        title="Your cart is empty"
        description="Browse the marketplace and add what your farm needs."
        action={
          <Link to="/marketplace">
            <Button>Explore Marketplace</Button>
          </Link>
        }
      />
    );
  }

  const totals = calculateTotals(subtotal);
  const awayFromFreeShipping = FREE_SHIPPING_THRESHOLD - subtotal;

  return (
    <div>
      <h1 className="text-2xl font-semibold text-ink-900">Your cart</h1>

      <div className="mt-6 grid gap-6 lg:grid-cols-[1fr_320px]">
        <div className="space-y-3">
          {items.map((item) => (
            <Card key={item.productId} className="flex gap-4 p-4">
              <div className="flex size-20 shrink-0 items-center justify-center overflow-hidden rounded-md bg-surface-sunk">
                {item.imageUrl ? (
                  <img
                    src={item.imageUrl}
                    alt={item.name}
                    className="size-full object-cover"
                  />
                ) : (
                  <ImageOff
                    className="size-6 text-ink-400"
                    aria-hidden="true"
                  />
                )}
              </div>

              <div className="min-w-0 flex-1">
                <Link
                  to={`/product/${item.productId}`}
                  className="font-medium text-ink-900 hover:text-primary-700"
                >
                  {item.name}
                </Link>
                <p className="numeric mt-1 text-sm text-ink-500">
                  {formatCurrency(item.price)} per {item.unit}
                </p>

                <div className="mt-3 flex items-center gap-3">
                  <div className="flex items-center rounded-md border border-border">
                    <button
                      onClick={() =>
                        setQuantity(item.productId, item.quantity - 1)
                      }
                      aria-label={`Decrease quantity of ${item.name}`}
                      className="p-2 text-ink-700 hover:bg-surface-sunk"
                    >
                      <Minus className="size-3.5" aria-hidden="true" />
                    </button>
                    <span className="numeric w-10 text-center text-sm">
                      {item.quantity}
                    </span>
                    <button
                      onClick={() =>
                        setQuantity(item.productId, item.quantity + 1)
                      }
                      disabled={item.quantity >= item.stock}
                      aria-label={`Increase quantity of ${item.name}`}
                      className="p-2 text-ink-700 hover:bg-surface-sunk disabled:opacity-40"
                    >
                      <Plus className="size-3.5" aria-hidden="true" />
                    </button>
                  </div>

                  <button
                    onClick={() => removeItem(item.productId)}
                    className="flex items-center gap-1 text-sm text-danger-700 hover:underline"
                  >
                    <Trash2 className="size-4" aria-hidden="true" /> Remove
                  </button>
                </div>
              </div>

              <p className="numeric font-semibold text-ink-900">
                {formatCurrency(item.price * item.quantity)}
              </p>
            </Card>
          ))}
        </div>

        <Card className="h-fit p-5">
          <h2 className="font-semibold text-ink-900">Order summary</h2>

          <dl className="mt-4 space-y-2 text-sm">
            <div className="flex justify-between">
              <dt className="text-ink-500">Subtotal</dt>
              <dd className="numeric text-ink-900">
                {formatCurrency(totals.subtotal)}
              </dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-ink-500">Tax (5%)</dt>
              <dd className="numeric text-ink-900">
                {formatCurrency(totals.tax)}
              </dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-ink-500">Delivery</dt>
              <dd className="numeric text-ink-900">
                {totals.shipping === 0
                  ? "Free"
                  : formatCurrency(totals.shipping)}
              </dd>
            </div>
          </dl>

          {totals.shipping > 0 && awayFromFreeShipping > 0 && (
            <p className="mt-3 rounded-md bg-accent-50 px-3 py-2 text-xs text-ink-700">
              Add {formatCurrency(awayFromFreeShipping)} more for free delivery.
            </p>
          )}

          <div className="mt-4 flex justify-between border-t border-border pt-4">
            <span className="font-semibold text-ink-900">Total</span>
            <span className="numeric text-lg font-semibold text-ink-900">
              {formatCurrency(totals.total)}
            </span>
          </div>

          <Button
            size="lg"
            className="mt-5 w-full"
            onClick={() => navigate("/app/checkout")}
          >
            Proceed to Checkout
          </Button>
          <Link to="/marketplace">
            <Button variant="ghost" className="mt-2 w-full">
              Continue shopping
            </Button>
          </Link>
        </Card>
      </div>
    </div>
  );
}
