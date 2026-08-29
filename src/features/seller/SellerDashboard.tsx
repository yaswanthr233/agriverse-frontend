import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import {
  Package,
  ShoppingBag,
  IndianRupee,
  AlertTriangle,
  ArrowRight,
  TrendingUp,
  Clock,
  Plus,
  MapPin,
  Building2,
  Navigation,
  CheckCircle2,
  Phone,
} from "lucide-react";
import { productsApi } from "@/api/endpoints/products";
import { ordersApi } from "@/api/endpoints/orders";
import { qk } from "@/api/queryKeys";
import { useAuthStore } from "@/stores/authStore";
import { deriveSellerStats } from "./deriveSellerStats";
import { formatCurrency, formatDateTime } from "@/lib/format";
import { orderStatusLabel, orderStatusTone } from "@/lib/orderStatus";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Skeleton } from "@/components/ui/Skeleton";
import { EmptyState } from "@/components/feedback/EmptyState";
import { ErrorState } from "@/components/feedback/ErrorState";

export function SellerDashboard() {
  const user = useAuthStore((s) => s.user);

  const productsQuery = useQuery({
    queryKey: qk.myProducts(),
    queryFn: productsApi.mine,
  });

  const ordersQuery = useQuery({
    queryKey: qk.sellerOrders(),
    queryFn: ordersApi.seller,
  });

  const isLoading = productsQuery.isLoading || ordersQuery.isLoading;
  const isError = productsQuery.isError || ordersQuery.isError;
  const error = productsQuery.error || ordersQuery.error;

  const products = productsQuery.data ?? [];
  const orders = ordersQuery.data ?? [];

  const stats = deriveSellerStats(products, orders);
  const lowStockItems = [...stats.outOfStock, ...stats.lowStock].slice(0, 5);
  const recentOrders = [...orders]
    .sort(
      (a, b) =>
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
    )
    .slice(0, 5);

  const isBrandNewSeller =
    !isLoading && !isError && products.length === 0 && orders.length === 0;

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-ink-900">
            Seller Dashboard
          </h1>
          <p className="mt-1 text-sm text-ink-500">
            Store performance metrics, inventory health, business location, and incoming order fulfilment.
          </p>
        </div>
        <div className="flex gap-2">
          <Link to="/seller/products/new">
            <Button size="sm" className="gap-1.5 shadow-xs">
              <Plus className="size-4" aria-hidden="true" /> Add Product
            </Button>
          </Link>
          <Link to="/seller/orders">
            <Button size="sm" variant="outline">
              View All Orders
            </Button>
          </Link>
        </div>
      </div>

      {isLoading && (
        <div className="space-y-6">
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <Skeleton key={i} className="h-28" />
            ))}
          </div>
          <div className="grid gap-6 lg:grid-cols-2">
            <Skeleton className="h-64" />
            <Skeleton className="h-64" />
          </div>
        </div>
      )}

      {isError && (
        <ErrorState
          error={error}
          onRetry={() => {
            void productsQuery.refetch();
            void ordersQuery.refetch();
          }}
        />
      )}

      {isBrandNewSeller && (
        <EmptyState
          icon={Package}
          title="Welcome to your Seller Console"
          description="Get started by listing your first agricultural input product to receive orders from farmers across India."
          action={
            <Link to="/seller/products/new">
              <Button>Add your first product</Button>
            </Link>
          }
        />
      )}

      {!isLoading && !isError && !isBrandNewSeller && (
        <>
          {/* KPI Cards Grid */}
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <Card className="p-5">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold uppercase tracking-wider text-ink-500">
                  Total Products
                </span>
                <Package className="size-4 text-primary-600" aria-hidden="true" />
              </div>
              <p className="numeric mt-2 text-2xl font-bold text-ink-900">
                {stats.totalProducts}
              </p>
              <p className="mt-1 text-xs text-ink-500">
                {stats.activeProducts} active in marketplace
              </p>
            </Card>

            <Card className="p-5">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold uppercase tracking-wider text-ink-500">
                  Total Orders
                </span>
                <ShoppingBag
                  className="size-4 text-primary-600"
                  aria-hidden="true"
                />
              </div>
              <p className="numeric mt-2 text-2xl font-bold text-ink-900">
                {stats.totalOrders}
              </p>
              <p className="mt-1 text-xs text-ink-500">
                Incoming purchase requests
              </p>
            </Card>

            <Card className="p-5">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold uppercase tracking-wider text-ink-500">
                  Delivered Revenue
                </span>
                <IndianRupee
                  className="size-4 text-primary-600"
                  aria-hidden="true"
                />
              </div>
              <p className="numeric mt-2 text-2xl font-bold text-ink-900">
                {formatCurrency(stats.revenue)}
              </p>
              <p className="mt-1 text-xs text-ink-500">
                {formatCurrency(stats.pendingRevenue)} pending fulfilment
              </p>
            </Card>

            <Card className="p-5">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold uppercase tracking-wider text-ink-500">
                  Low / Out of Stock
                </span>
                <AlertTriangle
                  className="size-4 text-warning-600"
                  aria-hidden="true"
                />
              </div>
              <p className="numeric mt-2 text-2xl font-bold text-ink-900">
                {stats.outOfStock.length + stats.lowStock.length}
              </p>
              <p className="mt-1 text-xs text-ink-500">
                {stats.outOfStock.length} out, {stats.lowStock.length} low stock
              </p>
            </Card>
          </div>

          {/* Two Columns: Recent Orders & Inventory Alerts */}
          <div className="grid gap-6 lg:grid-cols-2">
            {/* Recent Orders Card */}
            <Card className="p-6">
              <div className="flex items-center justify-between border-b border-border pb-4">
                <h2 className="font-semibold text-ink-900">Recent Orders</h2>
                <Link
                  to="/seller/orders"
                  className="flex items-center gap-1 text-xs font-medium text-primary-700 hover:underline"
                >
                  View all <ArrowRight className="size-3" aria-hidden="true" />
                </Link>
              </div>

              {recentOrders.length === 0 ? (
                <div className="py-12 text-center text-sm text-ink-500">
                  No orders received yet.
                </div>
              ) : (
                <div className="mt-4 divide-y divide-border">
                  {recentOrders.map((order) => (
                    <div
                      key={order.id}
                      className="flex items-center justify-between py-3"
                    >
                      <div className="space-y-0.5">
                        <div className="flex items-center gap-2">
                          <span className="font-semibold text-sm text-ink-900">
                            #{order.id} · {order.buyerName}
                          </span>
                          <Badge tone={orderStatusTone(order.status)}>
                            {orderStatusLabel(order.status)}
                          </Badge>
                        </div>
                        <p className="flex items-center gap-1 text-xs text-ink-400">
                          <Clock className="size-3" aria-hidden="true" />
                          {formatDateTime(order.createdAt)}
                        </p>
                      </div>
                      <div className="text-right">
                        <span className="numeric text-sm font-bold text-ink-900">
                          {formatCurrency(order.totalAmount)}
                        </span>
                        <p className="text-[11px] text-ink-400">
                          {order.items.length} item
                          {order.items.length === 1 ? "" : "s"}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </Card>

            {/* Low Stock Warning Card */}
            <Card className="p-6">
              <div className="flex items-center justify-between border-b border-border pb-4">
                <div className="flex items-center gap-2">
                  <h2 className="font-semibold text-ink-900">
                    Inventory Alerts
                  </h2>
                  {lowStockItems.length > 0 && (
                    <Badge tone="warning">{lowStockItems.length} alerts</Badge>
                  )}
                </div>
                <Link
                  to="/seller/inventory"
                  className="flex items-center gap-1 text-xs font-medium text-primary-700 hover:underline"
                >
                  Manage inventory{" "}
                  <ArrowRight className="size-3" aria-hidden="true" />
                </Link>
              </div>

              {lowStockItems.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12 text-center text-sm text-ink-500">
                  <TrendingUp
                    className="size-8 text-primary-600"
                    aria-hidden="true"
                  />
                  <p className="mt-2 font-medium text-ink-900">
                    All inventory levels healthy
                  </p>
                  <p className="text-xs text-ink-500">
                    No products below low-stock threshold (10 units).
                  </p>
                </div>
              ) : (
                <div className="mt-4 divide-y divide-border">
                  {lowStockItems.map((item) => (
                    <div
                      key={item.id}
                      className="flex items-center justify-between py-3"
                    >
                      <div>
                        <span className="font-medium text-ink-900">
                          {item.name}
                        </span>
                        <p className="text-xs text-ink-400">
                          Category: {item.categoryLabel || item.category}
                        </p>
                      </div>
                      <div className="flex items-center gap-3">
                        <span
                          className={`numeric text-sm font-semibold ${
                            item.stock === 0
                              ? "text-danger-600"
                              : "text-warning-600"
                          }`}
                        >
                          {item.stock} {item.unit} left
                        </span>
                        <Link to={`/seller/products/${item.id}/edit`}>
                          <Button size="sm" variant="outline">
                            Restock
                          </Button>
                        </Link>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </Card>
          </div>

          {/* Business Location & Warehouse Hub Section */}
          <Card className="p-6 border-primary-100 bg-surface">
            <div className="flex flex-wrap items-center justify-between gap-4 border-b border-border pb-4">
              <div className="flex items-center gap-2.5">
                <Building2 className="size-5 text-primary-600" />
                <div>
                  <h2 className="font-semibold text-ink-900">
                    Business Location & Dispatch Warehouse
                  </h2>
                  <p className="text-xs text-ink-500">
                    Registered pickup facility for AgriVerse delivery partners
                  </p>
                </div>
              </div>
              <Badge tone="success" className="gap-1">
                <CheckCircle2 className="size-3" /> Verified Merchant Hub
              </Badge>
            </div>

            <div className="mt-5 grid gap-6 md:grid-cols-3">
              {/* Warehouse Address */}
              <div className="space-y-2">
                <span className="text-xs font-semibold uppercase tracking-wider text-ink-500">
                  Store Facility
                </span>
                <div className="rounded-lg border border-border bg-surface-sunk/50 p-4 space-y-1.5 text-sm">
                  <p className="font-semibold text-ink-900">{user?.fullName || "Agri-Verse Inputs Hub"}</p>
                  <p className="text-xs text-ink-600 flex items-start gap-1.5">
                    <MapPin className="size-3.5 text-primary-600 shrink-0 mt-0.5" />
                    <span>Plot 42, APMC Market Road, {user?.city || "Guntur"}, {user?.state || "Andhra Pradesh"} - 522001</span>
                  </p>
                  <p className="text-xs text-ink-500 flex items-center gap-1.5 pt-1">
                    <Phone className="size-3 text-ink-400" />
                    <span>{user?.phone || "+91 98765 43210"}</span>
                  </p>
                </div>
              </div>

              {/* GPS Coordinates & Map Visual */}
              <div className="space-y-2">
                <span className="text-xs font-semibold uppercase tracking-wider text-ink-500">
                  Geo Coordinates
                </span>
                <div className="rounded-lg border border-border bg-surface-sunk/50 p-4 space-y-2 text-sm">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-ink-500">Latitude:</span>
                    <span className="font-mono font-medium text-ink-800">16.3067° N</span>
                  </div>
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-ink-500">Longitude:</span>
                    <span className="font-mono font-medium text-ink-800">80.4365° E</span>
                  </div>
                  <div className="pt-2 border-t border-border flex items-center gap-1.5 text-xs text-primary-700 font-medium">
                    <Navigation className="size-3" />
                    <span>Fast Dispatch Zone · 50 km delivery radius</span>
                  </div>
                </div>
              </div>

              {/* Operating Hours */}
              <div className="space-y-2">
                <span className="text-xs font-semibold uppercase tracking-wider text-ink-500">
                  Operating Hours
                </span>
                <div className="rounded-lg border border-border bg-surface-sunk/50 p-4 space-y-2 text-sm">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-ink-600">Monday – Saturday:</span>
                    <span className="font-medium text-ink-900">08:00 AM – 07:00 PM</span>
                  </div>
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-ink-600">Sunday:</span>
                    <span className="font-medium text-ink-900">09:00 AM – 02:00 PM</span>
                  </div>
                  <div className="pt-2 border-t border-border text-xs text-ink-500">
                    Pickup windows: 10:00 AM & 03:00 PM
                  </div>
                </div>
              </div>
            </div>
          </Card>
        </>
      )}
    </div>
  );
}
