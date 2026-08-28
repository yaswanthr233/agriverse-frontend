import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { TrendingUp, TrendingDown, Minus, Search } from "lucide-react";
import { marketApi } from "@/api/endpoints/market";
import { qk } from "@/api/queryKeys";
import type { MarketPriceResponse } from "@/api/types";
import { formatCurrency, formatDate } from "@/lib/format";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Input } from "@/components/ui/Input";
import { Table, type Column } from "@/components/ui/Table";
import { Skeleton } from "@/components/ui/Skeleton";
import { EmptyState } from "@/components/feedback/EmptyState";
import { ErrorState } from "@/components/feedback/ErrorState";

export function MarketPrices() {
  const [search, setSearch] = useState("");

  const {
    data: prices,
    isLoading,
    isError,
    error,
    refetch,
  } = useQuery({
    queryKey: qk.marketPrices(),
    queryFn: marketApi.prices,
  });

  const filteredPrices =
    prices?.filter((p) => {
      const q = search.toLowerCase();
      return (
        p.commodity.toLowerCase().includes(q) ||
        p.mandi.toLowerCase().includes(q)
      );
    }) ?? [];

  const columns: Column<MarketPriceResponse>[] = [
    {
      key: "commodity",
      header: "Commodity",
      render: (p) => (
        <div>
          <span className="font-semibold text-ink-900">{p.commodity}</span>
          {p.stale && (
            <Badge tone="warning" className="ml-2 text-[10px]">
              May be outdated
            </Badge>
          )}
        </div>
      ),
    },
    { key: "mandi", header: "Mandi / Market", render: (p) => p.mandi },
    {
      key: "modalPrice",
      header: "Modal Price",
      numeric: true,
      render: (p) => (
        <span className="font-semibold text-ink-900">
          {formatCurrency(p.modalPrice)} / qtl
        </span>
      ),
    },
    {
      key: "range",
      header: "Min / Max",
      numeric: true,
      render: (p) => (
        <span className="text-xs text-ink-500">
          {formatCurrency(p.minPrice)} – {formatCurrency(p.maxPrice)}
        </span>
      ),
    },
    {
      key: "trend",
      header: "Trend",
      render: (p) => {
        const isUp =
          p.trend?.toUpperCase() === "UP" || (p.changePercent ?? 0) > 0;
        const isDown =
          p.trend?.toUpperCase() === "DOWN" || (p.changePercent ?? 0) < 0;
        return (
          <div className="flex items-center gap-1">
            {isUp && (
              <TrendingUp
                className="size-4 text-success-600"
                aria-hidden="true"
              />
            )}
            {isDown && (
              <TrendingDown
                className="size-4 text-danger-600"
                aria-hidden="true"
              />
            )}
            {!isUp && !isDown && (
              <Minus className="size-4 text-ink-400" aria-hidden="true" />
            )}
            <span
              className={`text-xs font-medium ${
                isUp
                  ? "text-success-700"
                  : isDown
                    ? "text-danger-700"
                    : "text-ink-500"
              }`}
            >
              {p.changePercent
                ? `${p.changePercent > 0 ? "+" : ""}${p.changePercent}%`
                : p.trend || "Steady"}
            </span>
          </div>
        );
      },
    },
    {
      key: "priceDate",
      header: "Date",
      render: (p) => formatDate(p.priceDate),
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-ink-900">
            Agricultural Market Prices (Mandi Bhav)
          </h1>
          <p className="mt-1 text-ink-500">
            Real-time daily mandi rates and commodity price movements across
            APMCs.
          </p>
        </div>

        <div className="w-72">
          <Input
            placeholder="Search commodity or mandi…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
      </div>

      {isLoading && <Skeleton className="h-96 w-full" />}
      {isError && <ErrorState error={error} onRetry={() => void refetch()} />}

      {!isLoading && !isError && filteredPrices.length === 0 && (
        <EmptyState
          icon={Search}
          title={
            search ? "No matching mandi prices" : "No market prices available"
          }
          description={
            search
              ? `No prices found matching "${search}". Try searching for another commodity or mandi.`
              : "Daily mandi rates will appear here once published."
          }
        />
      )}

      {!isLoading && !isError && filteredPrices.length > 0 && (
        <Table
          columns={columns}
          rows={filteredPrices}
          rowKey={(p) => p.id}
          mobileCard={(p) => (
            <Card className="space-y-2 p-4">
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="font-semibold text-ink-900">{p.commodity}</h3>
                  <p className="text-xs text-ink-500">{p.mandi}</p>
                </div>
                {p.stale && <Badge tone="warning">Outdated</Badge>}
              </div>

              <div className="flex items-baseline justify-between border-t border-border pt-2">
                <span className="numeric text-lg font-semibold text-ink-900">
                  {formatCurrency(p.modalPrice)}{" "}
                  <span className="text-xs font-normal text-ink-500">/ qtl</span>
                </span>
                <span className="text-xs text-ink-500">
                  {formatDate(p.priceDate)}
                </span>
              </div>
            </Card>
          )}
        />
      )}
    </div>
  );
}
