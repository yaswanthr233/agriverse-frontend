import { useState } from "react";
import { useNavigate, Navigate } from "react-router-dom";
import { useQuery, useMutation } from "@tanstack/react-query";
import toast from "react-hot-toast";
import {
  Banknote,
  CreditCard,
  MapPin,
  Compass,
  CheckCircle2,
  AlertCircle,
  RefreshCw,
  ExternalLink,
} from "lucide-react";
import { ordersApi } from "@/api/endpoints/orders";
import { paymentsApi } from "@/api/endpoints/payments";
import { qk } from "@/api/queryKeys";
import { useCartStore } from "@/stores/cartStore";
import { useAuthStore } from "@/stores/authStore";
import { calculateTotals } from "@/lib/checkout";
import { formatCurrency } from "@/lib/format";
import { ApiError } from "@/api/client";
import {
  getCurrentGpsLocation,
  getGoogleMapsUrl,
  type GpsLocationResult,
} from "@/lib/location";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Textarea } from "@/components/ui/Textarea";
import { Spinner } from "@/components/ui/Spinner";
import { Badge } from "@/components/ui/Badge";
import { cn } from "@/lib/cn";

export function Checkout() {
  const navigate = useNavigate();
  const user = useAuthStore((s) => s.user);
  const items = useCartStore((s) => s.items);
  const subtotal = useCartStore((s) => s.subtotal());
  const clearCart = useCartStore((s) => s.clear);

  const defaultAddress = [user?.city, user?.state].filter(Boolean).join(", ");
  const [address, setAddress] = useState(defaultAddress);
  const [gpsLocation, setGpsLocation] = useState<GpsLocationResult | null>(null);
  const [isLocating, setIsLocating] = useState(false);
  const [locationError, setLocationError] = useState<string | null>(null);
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
      toast.success("Order placed successfully!");
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

  async function handleCaptureLocation() {
    setIsLocating(true);
    setLocationError(null);
    setError(null);
    try {
      const loc = await getCurrentGpsLocation();
      setGpsLocation(loc);
      if (loc.address && (!address.trim() || address === defaultAddress)) {
        setAddress(loc.address);
      }
      toast.success("Delivery GPS location detected successfully!");
    } catch (err: any) {
      const msg =
        err?.message ||
        "Unable to detect your current location. Please try again or check browser permissions.";
      setLocationError(msg);
      toast.error(msg);
    } finally {
      setIsLocating(false);
    }
  }

  async function handlePlaceOrder() {
    setError(null);

    // Delivery address and GPS verification
    if (!address.trim()) {
      setError("Please enter a delivery address.");
      return;
    }

    if (!gpsLocation || gpsLocation.latitude == null || gpsLocation.longitude == null) {
      setError("Please detect your delivery GPS location before placing the order.");
      return;
    }

    const payload = {
      deliveryAddress: address.trim(),
      deliveryLatitude: gpsLocation.latitude,
      deliveryLongitude: gpsLocation.longitude,
      deliveryAccuracy: gpsLocation.accuracy ?? null,
      items: orderItems,
    };

    if (method === "COD") {
      placeOrder.mutate({
        ...payload,
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
            ...payload,
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

  const mapsUrl = gpsLocation
    ? getGoogleMapsUrl(gpsLocation.latitude, gpsLocation.longitude)
    : null;

  return (
    <div className="mx-auto max-w-5xl">
      <h1 className="text-2xl font-semibold text-ink-900">Checkout</h1>
      <p className="mt-1 text-sm text-ink-500">
        Review items, confirm exact delivery location, and place your order.
      </p>

      <div className="mt-6 grid gap-6 lg:grid-cols-[1fr_340px]">
        <div className="space-y-6">
          {/* 1. Delivery Location (GPS & Address) */}
          <Card className="p-5">
            <div className="flex items-center justify-between">
              <h2 className="font-semibold text-ink-900">1. Delivery Location</h2>
              {gpsLocation && (
                <Badge tone="success" className="gap-1">
                  <CheckCircle2 className="size-3.5" />
                  GPS Coordinates Verified
                </Badge>
              )}
            </div>
            <p className="mt-1 text-xs text-ink-500">
              Provide your exact farm or home location so our delivery partner can navigate directly to you.
            </p>

            {/* GPS Location Capture Card */}
            <div className="mt-4 rounded-xl border border-border bg-surface-sunk p-4">
              {!gpsLocation ? (
                <div className="space-y-3 text-center sm:text-left">
                  <div className="flex flex-col items-center justify-between gap-3 sm:flex-row">
                    <div className="flex items-center gap-2.5">
                      <div className="flex size-10 items-center justify-center rounded-full bg-primary-100 text-primary-700">
                        <MapPin className="size-5" />
                      </div>
                      <div>
                        <p className="font-medium text-ink-900">
                          Current GPS Location
                        </p>
                        <p className="text-xs text-ink-500">
                          Required for accurate door/farm delivery navigation
                        </p>
                      </div>
                    </div>

                    <Button
                      type="button"
                      variant="primary"
                      loading={isLocating}
                      onClick={() => void handleCaptureLocation()}
                      className="gap-2"
                    >
                      <Compass className="size-4" />
                      {isLocating ? "Detecting location..." : "📍 Use Current Location"}
                    </Button>
                  </div>

                  {locationError && (
                    <div className="flex items-start gap-2 rounded-lg bg-danger-50 p-3 text-xs text-danger-700">
                      <AlertCircle className="mt-0.5 size-4 shrink-0" />
                      <span>{locationError}</span>
                    </div>
                  )}
                </div>
              ) : (
                <div className="space-y-3">
                  <div className="flex flex-wrap items-center justify-between gap-2 border-b border-border/70 pb-3">
                    <div className="flex items-center gap-2 text-sm font-semibold text-success-700">
                      <CheckCircle2 className="size-4" />
                      <span>Location detected successfully</span>
                    </div>
                    <div className="flex items-center gap-2">
                      {mapsUrl && (
                        <a
                          href={mapsUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1 text-xs font-medium text-primary-600 hover:text-primary-700 hover:underline"
                        >
                          <ExternalLink className="size-3.5" />
                          View in Maps
                        </a>
                      )}
                      <Button
                        type="button"
                        size="sm"
                        variant="outline"
                        loading={isLocating}
                        onClick={() => void handleCaptureLocation()}
                        className="h-7 gap-1 text-xs"
                      >
                        <RefreshCw className="size-3" />
                        Update Location
                      </Button>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 gap-2 text-xs text-ink-700 sm:grid-cols-3">
                    <div className="rounded-lg bg-surface p-2.5">
                      <span className="text-ink-400">Latitude</span>
                      <p className="numeric font-mono font-semibold text-ink-900">
                        {gpsLocation.latitude.toFixed(6)}
                      </p>
                    </div>
                    <div className="rounded-lg bg-surface p-2.5">
                      <span className="text-ink-400">Longitude</span>
                      <p className="numeric font-mono font-semibold text-ink-900">
                        {gpsLocation.longitude.toFixed(6)}
                      </p>
                    </div>
                    <div className="rounded-lg bg-surface p-2.5">
                      <span className="text-ink-400">Accuracy</span>
                      <p className="numeric font-medium text-ink-900">
                        {gpsLocation.accuracy
                          ? `~${Math.round(gpsLocation.accuracy)} meters`
                          : "High Accuracy"}
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Human Readable Delivery Address */}
            <div className="mt-4">
              <Textarea
                label="Delivery Address / Landmarks"
                placeholder="House / farm number, village name, district, state, landmark"
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                rows={3}
              />
              <p className="mt-1.5 text-xs text-ink-500">
                You can add specific landmarks (e.g. Near Water Tank, Farm Gate #2) to help the delivery partner.
              </p>
            </div>
          </Card>

          {/* 2. Payment method */}
          <Card className="p-5">
            <h2 className="font-semibold text-ink-900">2. Payment method</h2>

            {configLoading ? (
              <div className="mt-4 flex justify-center py-4">
                <Spinner />
              </div>
            ) : (
              <div className="mt-4 space-y-3">
                <button
                  type="button"
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
                      Cash on Delivery (COD)
                    </p>
                    <p className="text-sm text-ink-500">
                      Pay cash or UPI when the delivery partner arrives at your farm.
                    </p>
                  </div>
                </button>

                {/* Only offered when the backend says Razorpay is actually configured. */}
                {paymentConfig?.razorpayEnabled && (
                  <button
                    type="button"
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
                      <p className="font-medium text-ink-900">Pay Online</p>
                      <p className="text-sm text-ink-500">
                        Cards, UPI, or Net Banking via Razorpay.
                      </p>
                    </div>
                  </button>
                )}
              </div>
            )}
          </Card>
        </div>

        {/* 3. Order Summary & Submission */}
        <Card className="h-fit p-5">
          <h2 className="font-semibold text-ink-900">3. Order Summary</h2>

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
            disabled={!gpsLocation || placeOrder.isPending}
            onClick={() => void handlePlaceOrder()}
          >
            {placeOrder.isPending ? "Placing Order..." : "Place Order"}
          </Button>

          {!gpsLocation && (
            <p className="mt-2 text-center text-xs text-ink-500">
              📍 Please click &ldquo;Use Current Location&rdquo; above to enable delivery navigation.
            </p>
          )}
        </Card>
      </div>
    </div>
  );
}
