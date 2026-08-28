import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import {
  ArrowRight,
  ShieldCheck,
  Truck,
  TrendingUp,
  Sprout,
  Droplets,
  Wind,
  CheckCircle,
} from "lucide-react";
import { productsApi } from "@/api/endpoints/products";
import { weatherApi } from "@/api/endpoints/weather";
import { marketApi } from "@/api/endpoints/market";
import { qk } from "@/api/queryKeys";
import { PRODUCT_CATEGORIES, categoryToSlug } from "@/lib/categories";
import { formatCurrency } from "@/lib/format";
import { ProductCard } from "@/features/marketplace/ProductCard";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Skeleton } from "@/components/ui/Skeleton";

export function Landing() {
  const productsQuery = useQuery({
    queryKey: qk.products({ size: 8 }),
    queryFn: () => productsApi.catalog({ size: 8 }),
  });

  const weatherQuery = useQuery({
    queryKey: qk.weather(),
    queryFn: () => weatherApi.current(),
  });

  const marketQuery = useQuery({
    queryKey: qk.marketPrices(),
    queryFn: marketApi.prices,
  });

  const featuredProducts = productsQuery.data?.content ?? [];
  const weather = weatherQuery.data;
  const topPrices = marketQuery.data?.slice(0, 5) ?? [];

  return (
    <div className="space-y-16 pb-16">
      {/* ── 1. Hero Section ─────────────────────────────── */}
      <section className="relative overflow-hidden bg-gradient-to-b from-primary-950 via-primary-900 to-primary-900 px-4 py-20 text-center text-white sm:py-28">
        <div className="mx-auto max-w-4xl space-y-6">
          <span className="inline-flex items-center gap-2 rounded-full border border-primary-700/60 bg-primary-800/60 px-4 py-1.5 text-xs font-medium text-primary-200 backdrop-blur-md">
            <Sprout className="size-3.5 text-primary-400" aria-hidden="true" />
            Empowering Indian Agriculture with Technology
          </span>

          <h1 className="font-display text-4xl font-semibold tracking-tight sm:text-6xl lg:text-7xl">
            The Complete Operating System for Modern Agriculture
          </h1>

          <p className="mx-auto max-w-2xl text-lg font-light text-primary-100/90 sm:text-xl">
            Direct farmer marketplace, verified livestock trading, real-time
            APMC mandi prices, AI crop health diagnostics, and smart farm
            management.
          </p>

          <div className="flex flex-col items-center justify-center gap-4 pt-4 sm:flex-row">
            <Link to="/marketplace">
              <Button size="lg" className="w-full text-base sm:w-auto">
                Explore Marketplace{" "}
                <ArrowRight className="ml-2 size-4" aria-hidden="true" />
              </Button>
            </Link>
            <Link to="/register">
              <Button
                variant="outline"
                size="lg"
                className="w-full border-white/20 text-white hover:bg-white/10 sm:w-auto"
              >
                Join as Farmer / Seller
              </Button>
            </Link>
          </div>
        </div>
      </section>

      <div className="mx-auto max-w-[1280px] space-y-16 px-4">
        {/* ── 2. Category Grid ──────────────────────────── */}
        <section className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-semibold text-ink-900">
                Browse Agricultural Supplies
              </h2>
              <p className="mt-1 text-sm text-ink-500">
                Direct procurement from verified manufacturers and certified
                agri-distributors.
              </p>
            </div>
            <Link
              to="/marketplace"
              className="text-sm font-medium text-primary-700 hover:underline"
            >
              View catalog →
            </Link>
          </div>

          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
            {PRODUCT_CATEGORIES.map((cat) => (
              <Link
                key={cat.value}
                to={`/marketplace/${categoryToSlug(cat.value)}`}
                className="group block"
              >
                <Card className="flex flex-col items-center justify-center p-6 text-center transition-all hover:border-primary-500 hover:shadow-sm">
                  <span className="text-sm font-medium text-ink-800 group-hover:text-primary-700">
                    {cat.label}
                  </span>
                </Card>
              </Link>
            ))}
          </div>
        </section>

        {/* ── 3. Featured Products ──────────────────────── */}
        <section className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-semibold text-ink-900">
                Featured Agricultural Inputs
              </h2>
              <p className="mt-1 text-sm text-ink-500">
                Top-rated seeds, organic nutrients, irrigation fittings, and
                farm equipment.
              </p>
            </div>
            <Link
              to="/marketplace"
              className="text-sm font-medium text-primary-700 hover:underline"
            >
              Browse all →
            </Link>
          </div>

          {productsQuery.isLoading && (
            <div className="grid gap-6 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
              {Array.from({ length: 4 }).map((_, i) => (
                <Skeleton key={i} className="h-72 w-full" />
              ))}
            </div>
          )}

          {!productsQuery.isLoading && featuredProducts.length > 0 && (
            <div className="grid gap-6 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
              {featuredProducts.map((p) => (
                <ProductCard key={p.id} product={p} />
              ))}
            </div>
          )}
        </section>

        {/* ── 4 & 5. Weather & Mandi Rates Strip ──────────── */}
        <section className="grid gap-6 lg:grid-cols-2">
          {/* Weather Widget */}
          <Card className="p-6">
            <div className="flex items-center justify-between">
              <h3 className="font-semibold text-ink-900">
                Regional Agri Weather
              </h3>
              <Link
                to="/weather"
                className="text-xs font-medium text-primary-700 hover:underline"
              >
                Full forecast →
              </Link>
            </div>

            {weatherQuery.isLoading && (
              <Skeleton className="mt-4 h-28 w-full" />
            )}

            {weather && (
              <div className="mt-4 space-y-3">
                <div className="flex items-center justify-between rounded-lg bg-surface-sunk p-4">
                  <div>
                    <p className="text-xs text-ink-500">
                      {weather.city}, {weather.state}
                    </p>
                    <p className="numeric text-3xl font-bold text-ink-900">
                      {weather.tempCelsius}°C
                    </p>
                    <p className="text-xs font-medium text-ink-700">
                      {weather.condition}
                    </p>
                  </div>
                  <div className="space-y-1 text-right text-xs text-ink-600">
                    <p className="flex items-center justify-end gap-1">
                      <Droplets
                        className="size-3.5 text-info-600"
                        aria-hidden="true"
                      />
                      Humidity: {weather.humidity}%
                    </p>
                    <p className="flex items-center justify-end gap-1">
                      <Wind
                        className="size-3.5 text-ink-400"
                        aria-hidden="true"
                      />
                      Wind: {weather.windSpeedKmh} km/h
                    </p>
                  </div>
                </div>
                {weather.advisory && (
                  <p className="line-clamp-2 text-xs text-ink-600">
                    <span className="font-semibold text-primary-800">
                      Advisory:
                    </span>{" "}
                    {weather.advisory}
                  </p>
                )}
              </div>
            )}
          </Card>

          {/* Mandi Prices Widget */}
          <Card className="p-6">
            <div className="flex items-center justify-between">
              <h3 className="font-semibold text-ink-900">
                Live APMC Mandi Rates
              </h3>
              <Link
                to="/market-prices"
                className="text-xs font-medium text-primary-700 hover:underline"
              >
                All commodities →
              </Link>
            </div>

            {marketQuery.isLoading && <Skeleton className="mt-4 h-28 w-full" />}

            {topPrices.length > 0 && (
              <div className="mt-4 divide-y divide-border">
                {topPrices.map((price) => (
                  <div
                    key={price.id}
                    className="flex items-center justify-between py-2 text-sm"
                  >
                    <div>
                      <span className="font-medium text-ink-900">
                        {price.commodity}
                      </span>
                      <span className="ml-2 text-xs text-ink-400">
                        ({price.mandi})
                      </span>
                    </div>
                    <div className="text-right">
                      <span className="numeric font-semibold text-ink-900">
                        {formatCurrency(price.modalPrice)}
                      </span>
                      <span className="text-xs text-ink-400"> / qtl</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </Card>
        </section>

        {/* ── 6. Value Propositions ─────────────────────── */}
        <section className="space-y-8 rounded-2xl bg-surface p-8 sm:p-12">
          <div className="text-center">
            <h2 className="text-2xl font-semibold text-ink-900 sm:text-3xl">
              Why Farmers and Sellers Choose AgriVerse
            </h2>
            <p className="mx-auto mt-2 max-w-2xl text-sm text-ink-500">
              Built from the ground up for transparent pricing, direct farmer
              empowerment, and verified agricultural inputs.
            </p>
          </div>

          <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
            <div className="space-y-2 text-center">
              <div className="mx-auto flex size-12 items-center justify-center rounded-xl bg-primary-100 text-primary-700">
                <Truck className="size-6" aria-hidden="true" />
              </div>
              <h3 className="font-semibold text-ink-900">Direct Delivery</h3>
              <p className="text-xs text-ink-500">
                Fast doorstep fulfillment across rural pin codes with dedicated
                delivery fleet partners.
              </p>
            </div>

            <div className="space-y-2 text-center">
              <div className="mx-auto flex size-12 items-center justify-center rounded-xl bg-accent-100 text-accent-700">
                <ShieldCheck className="size-6" aria-hidden="true" />
              </div>
              <h3 className="font-semibold text-ink-900">Certified Quality</h3>
              <p className="text-xs text-ink-500">
                100% genuine inputs, verified seed germination standards, and
                compliant bio-fertilizers.
              </p>
            </div>

            <div className="space-y-2 text-center">
              <div className="mx-auto flex size-12 items-center justify-center rounded-xl bg-info-100 text-info-700">
                <TrendingUp className="size-6" aria-hidden="true" />
              </div>
              <h3 className="font-semibold text-ink-900">Farm Profitability</h3>
              <p className="text-xs text-ink-500">
                Integrated cost tracking, yield analytics, and timely APMC price
                trends to maximize income.
              </p>
            </div>

            <div className="space-y-2 text-center">
              <div className="mx-auto flex size-12 items-center justify-center rounded-xl bg-warm-100 text-warm-700">
                <CheckCircle className="size-6" aria-hidden="true" />
              </div>
              <h3 className="font-semibold text-ink-900">Expert Support</h3>
              <p className="text-xs text-ink-500">
                Instant AI diagnosis, on-call veterinarian booking, and access
                to government welfare schemes.
              </p>
            </div>
          </div>
        </section>

        {/* ── 7. Call To Action ──────────────────────────── */}
        <section className="rounded-2xl bg-gradient-to-r from-primary-900 to-primary-800 p-8 text-center text-white sm:p-12">
          <h2 className="font-display text-3xl font-semibold sm:text-4xl">
            Start Optimizing Your Farm Today
          </h2>
          <p className="mx-auto mt-2 max-w-xl text-sm text-primary-100">
            Join thousands of progressive farmers and agricultural businesses
            across India on AgriVerse.
          </p>
          <div className="mt-6 flex justify-center">
            <Link to="/register">
              <Button size="lg" className="text-base">
                Create Free Account
              </Button>
            </Link>
          </div>
        </section>
      </div>
    </div>
  );
}
