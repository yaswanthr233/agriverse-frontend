import { useState } from "react";
import { useNavigate, Navigate } from "react-router-dom";
import { useQuery, useMutation } from "@tanstack/react-query";
import toast from "react-hot-toast";
import { Banknote, CreditCard } from "lucide-react";
import { ordersApi } from "@/api/endpoints/orders";
import { paymentsApi } from "@/api/endpoints/payments";
import { qk } from "@/api/queryKeys";
import { useCartStore } from "@/stores/cartStore";
import { useAuthStore } from "@/stores/authStore";
import { calculateTotals } from "@/lib/checkout";
import { formatCurrency } from "@/lib/format";
import { ApiError } from "@/api/client";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Textarea } from "@/components/ui/Textarea";
import { Spinner } from "@/components/ui/Spinner";
import { cn } from "@/lib/cn";

export function Checkout() {
  const navigate = useNavigate();
  const user = useAuthStore((s) => s.user);
  const items = useCartStore((s) => s.items);
  const subtotal = useCartStore((s) => s.subtotal());
  const clearCart = useCartStore((s) => s.clear);

  const defaultAddress = [user?.city, user?.state].filter(Boolean).join(", ");
  const [address, setAddress] = useState(defaultAddress);
  const [method, setMethod] = useState<"COD" | "RAZORPAY">("COD");
  const [error, setError] = useState<string | null>(null);

  const { data: paymentConfig, isLoading: configLoading } = useQuery({
    queryKey: qk.paymentConfig(),
    queryFn: paymentsApi.config,
  });

  const placeOrder = useMutation({
    mutationFn: ordersApi.place,
    onSuccess: (order) => {
      clearCart();
      toast.success("Order placed");
      navigate(`/app/order-success/${order.id}`, { replace: true });
    },
    onError: (err) => {
      setError(
        err instanceof ApiError ? err.message : "Couldn't place your order.",
      );
    },
  });

  if (items.length === 0) return <Navigate to="/app/cart" replace />;

  const totals = calculateTotals(subtotal);
  const orderItems = items.map((i) => ({
    productId: i.productId,
    quantity: i.quantity,
  }));

  async function handlePlaceOrder() {
    setError(null);

    if (!address.trim()) {
      setError("Please enter a delivery address.");
      return;
    }

    if (method === "COD") {
      placeOrder.mutate({
        deliveryAddress: address,
        items: orderItems,
        paymentMethod: "COD",
      });
      return;
    }

    // Razorpay path — only reachable when the backend reports it enabled.
    try {
      const rp = await paymentsApi.createRazorpayOrder(orderItems);
      const RazorpayCtor = (
        window as unknown as {
          Razorpay?: new (o: unknown) => { open: () => void };
        }
      ).Razorpay;

      if (!RazorpayCtor) {
        setError(
          "The payment window couldn't load. Please choose Cash on Delivery.",
        );
        return;
      }

      new RazorpayCtor({
        key: rp.keyId,
        amount: rp.amountPaise,
        currency: rp.currency,
        order_id: rp.razorpayOrderId,
        name: "AgriVerse",
        handler: (res: {
          razorpay_order_id: string;
          razorpay_payment_id: string;
          razorpay_signature: string;
        }) => {
          placeOrder.mutate({
            deliveryAddress: address,
            items: orderItems,
            paymentMethod: "RAZORPAY",
            razorpayOrderId: res.razorpay_order_id,
            razorpayPaymentId: res.razorpay_payment_id,
            razorpaySignature: res.razorpay_signature,
          });
        },
      }).open();
    } catch (err) {
      setError(
        err instanceof ApiError ? err.message : "Couldn't start the payment.",
      );
    }
  }

  return (
    <div>
      <h1 className="text-2xl font-semibold text-ink-900">Checkout</h1>

      <div className="mt-6 grid gap-6 lg:grid-cols-[1fr_320px]">
        <div className="space-y-6">
          <Card className="p-5">
            <h2 className="font-semibold text-ink-900">1. Delivery address</h2>
            <div className="mt-4">
              <Textarea
                label="Where should we deliver?"
                placeholder="House / village, district, state, PIN"
                value={address}
                onChange={(e) => setAddress(e.target.value)}
              />
            </div>
          </Card>

          <Card className="p-5">
            <h2 className="font-semibold text-ink-900">2. Payment method</h2>

            {configLoading ? (
              <div className="mt-4 flex justify-center py-4">
                <Spinner />
              </div>
            ) : (
              <div className="mt-4 space-y-3">
                <button
                  onClick={() => setMethod("COD")}
                  className={cn(
                    "flex w-full items-center gap-3 rounded-md border p-4 text-left transition-colors",
                    method === "COD"
                      ? "border-primary-600 bg-primary-50"
                      : "border-border hover:bg-surface-sunk",
                  )}
                >
                  <Banknote
                    className="size-5 text-primary-600"
                    aria-hidden="true"
                  />
                  <div>
                    <p className="font-medium text-ink-900">
                      Cash on Delivery
                    </p>
                    <p className="text-sm text-ink-500">
                      Pay when your order arrives.
                    </p>
                  </div>
                </button>

                {/* Only offered when the backend says Razorpay is actually configured. */}
                {paymentConfig?.razorpayEnabled && (
                  <button
                    onClick={() => setMethod("RAZORPAY")}
                    className={cn(
                      "flex w-full items-center gap-3 rounded-md border p-4 text-left transition-colors",
                      method === "RAZORPAY"
                        ? "border-primary-600 bg-primary-50"
                        : "border-border hover:bg-surface-sunk",
                    )}
                  >
                    <CreditCard
                      className="size-5 text-primary-600"
                      aria-hidden="true"
                    />
                    <div>
                      <p className="font-medium text-ink-900">Pay online</p>
                      <p className="text-sm text-ink-500">
                        Card, UPI or net banking via Razorpay.
                      </p>
                    </div>
                  </button>
                )}
              </div>
            )}
          </Card>
        </div>

        <Card className="h-fit p-5">
          <h2 className="font-semibold text-ink-900">3. Review</h2>

          <ul className="mt-4 space-y-2 text-sm">
            {items.map((i) => (
              <li key={i.productId} className="flex justify-between gap-3">
                <span className="min-w-0 truncate text-ink-700">
                  {i.name} × {i.quantity}
                </span>
                <span className="numeric shrink-0 text-ink-900">
                  {formatCurrency(i.price * i.quantity)}
                </span>
              </li>
            ))}
          </ul>

          <dl className="mt-4 space-y-2 border-t border-border pt-4 text-sm">
            <div className="flex justify-between">
              <dt className="text-ink-500">Subtotal</dt>
              <dd className="numeric">{formatCurrency(totals.subtotal)}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-ink-500">Tax (5%)</dt>
              <dd className="numeric">{formatCurrency(totals.tax)}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-ink-500">Delivery</dt>
              <dd className="numeric">
                {totals.shipping === 0
                  ? "Free"
                  : formatCurrency(totals.shipping)}
              </dd>
            </div>
          </dl>

          <div className="mt-4 flex justify-between border-t border-border pt-4">
            <span className="font-semibold text-ink-900">Total</span>
            <span className="numeric text-lg font-semibold text-ink-900">
              {formatCurrency(totals.total)}
            </span>
          </div>

          {error && (
            <p
              role="alert"
              className="mt-4 rounded-md bg-danger-50 px-3 py-2 text-sm text-danger-700"
            >
              {error}
            </p>
          )}

          <Button
            size="lg"
            className="mt-5 w-full"
            loading={placeOrder.isPending}
            onClick={() => void handlePlaceOrder()}
          >
            Place Order
          </Button>
        </Card>
      </div>
    </div>
  );
}
