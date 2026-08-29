import { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  TrendingUp,
  TrendingDown,
  Minus,
  Search,
  BarChart3,
  MapPin,
  Sparkles,
  ArrowUpRight,
  Filter,
} from "lucide-react";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  Cell,
} from "recharts";
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

const QUICK_COMMODITIES = [
  "ALL",
  "Tomato",
  "Rice",
  "Chilli",
  "Cotton",
  "Maize",
  "Banana",
  "Wheat",
  "Turmeric",
  "Onion",
];

export function MarketPrices() {
  const [search, setSearch] = useState("");
  const [selectedCommodity, setSelectedCommodity] = useState("ALL");
  const [selectedMandi, setSelectedMandi] = useState("ALL");
  const [showChart, setShowChart] = useState(true);

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

  const allMandis = useMemo(() => {
    if (!prices) return [];
    const set = new Set(prices.map((p) => p.mandi));
    return Array.from(set).sort();
  }, [prices]);

  const filteredPrices = useMemo(() => {
    return (
      prices?.filter((p) => {
        const q = search.toLowerCase();
        const matchesSearch =
          !q ||
          p.commodity.toLowerCase().includes(q) ||
          p.mandi.toLowerCase().includes(q);

        const matchesCommodity =
          selectedCommodity === "ALL" ||
          p.commodity.toLowerCase().includes(selectedCommodity.toLowerCase());

        const matchesMandi =
          selectedMandi === "ALL" || p.mandi === selectedMandi;

        return matchesSearch && matchesCommodity && matchesMandi;
      }) ?? []
    );
  }, [prices, search, selectedCommodity, selectedMandi]);

  // Chart data for comparing prices across mandis for the filtered commodities
  const chartData = useMemo(() => {
    return filteredPrices.slice(0, 10).map((p) => ({
      name: `${p.commodity} (${p.mandi.split(" ")[0]})`,
      modalPrice: p.modalPrice,
      minPrice: p.minPrice,
      maxPrice: p.maxPrice,
      commodity: p.commodity,
      mandi: p.mandi,
    }));
  }, [filteredPrices]);

  // Highest gainer and top market
  const topGainer = useMemo(() => {
    if (!prices || prices.length === 0) return null;
    return [...prices].sort(
      (a, b) => (b.changePercent ?? 0) - (a.changePercent ?? 0)
    )[0];
  }, [prices]);

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
    {
      key: "mandi",
      header: "Mandi / Market",
      render: (p) => (
        <div className="flex items-center gap-1.5 text-ink-700">
          <MapPin className="size-3.5 text-primary-600" aria-hidden="true" />
          <span>{p.mandi}</span>
        </div>
      ),
    },
    {
      key: "modalPrice",
      header: "Modal Price (₹)",
      numeric: true,
      render: (p) => (
        <span className="font-bold text-ink-900">
          {formatCurrency(p.modalPrice)}{" "}
          <span className="text-xs font-normal text-ink-500">/ qtl</span>
        </span>
      ),
    },
    {
      key: "range",
      header: "Min / Max (₹)",
      numeric: true,
      render: (p) => (
        <span className="text-xs text-ink-500">
          {formatCurrency(p.minPrice)} – {formatCurrency(p.maxPrice)}
        </span>
      ),
    },
    {
      key: "trend",
      header: "Daily Trend",
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
              className={`text-xs font-semibold ${
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
      header: "Last Updated",
      render: (p) => (
        <span className="text-xs text-ink-500">{formatDate(p.priceDate)}</span>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      {/* Header & Page Title */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold tracking-tight text-ink-900">
              Agricultural Market Prices (Mandi Bhav)
            </h1>
            <Badge tone="success" className="gap-1">
              <Sparkles className="size-3" /> Live Discovery
            </Badge>
          </div>
          <p className="mt-1 text-sm text-ink-500">
            Real-time APMC mandi modal rates, price comparison, and daily commodity movements across India.
          </p>
        </div>

        {/* Top Summary Banner */}
        {topGainer && (
          <div className="flex items-center gap-3 rounded-lg border border-primary-100 bg-primary-50/70 px-4 py-2 text-xs">
            <TrendingUp className="size-4 text-primary-600" />
            <div>
              <span className="font-semibold text-primary-900">Top Gainer Today:</span>{" "}
              <span className="font-medium text-ink-800">
                {topGainer.commodity} ({topGainer.mandi}) at {formatCurrency(topGainer.modalPrice)}/qtl
              </span>{" "}
              <span className="font-bold text-success-700">+{topGainer.changePercent}%</span>
            </div>
          </div>
        )}
      </div>

      {/* Commodity Quick Filter Pills */}
      <div className="flex flex-wrap items-center gap-2 border-y border-border py-3">
        <span className="text-xs font-semibold text-ink-500 uppercase tracking-wider mr-1">
          Crops:
        </span>
        {QUICK_COMMODITIES.map((c) => (
          <button
            key={c}
            onClick={() => setSelectedCommodity(c)}
            className={`rounded-full px-3 py-1 text-xs font-medium transition-colors ${
              selectedCommodity === c
                ? "bg-primary-600 text-white shadow-xs"
                : "bg-surface-sunk text-ink-700 hover:bg-surface-elevated hover:text-ink-900"
            }`}
          >
            {c === "ALL" ? "All Crops" : c}
          </button>
        ))}
      </div>

      {/* Search & Mandi Filter Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-3 flex-1 min-w-[280px]">
          <div className="relative flex-1 min-w-[200px] max-w-md">
            <Input
              placeholder="Search by crop, commodity, or mandi…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>

          <div className="flex items-center gap-2">
            <Filter className="size-4 text-ink-400" />
            <select
              value={selectedMandi}
              onChange={(e) => setSelectedMandi(e.target.value)}
              className="rounded-md border border-border bg-surface px-3 py-2 text-sm text-ink-800 shadow-xs focus:border-primary-500 focus:outline-none"
            >
              <option value="ALL">All Mandis & Markets</option>
              {allMandis.map((m) => (
                <option key={m} value={m}>
                  {m}
                </option>
              ))}
            </select>
          </div>
        </div>

        <button
          onClick={() => setShowChart(!showChart)}
          className="flex items-center gap-1.5 text-xs font-medium text-primary-700 hover:underline"
        >
          <BarChart3 className="size-4" />
          {showChart ? "Hide Price Chart" : "Show Price Chart"}
        </button>
      </div>

      {/* Interactive Price Comparison Chart */}
      {showChart && chartData.length > 0 && (
        <Card className="p-5">
          <div className="mb-4 flex items-center justify-between">
            <div>
              <h2 className="text-sm font-semibold text-ink-900">
                Comparative Mandi Modal Prices (₹ per Quintal)
              </h2>
              <p className="text-xs text-ink-500">
                Visual benchmark of wholesale prices across agricultural markets
              </p>
            </div>
            <span className="text-xs text-ink-400">Modal Price benchmark</span>
          </div>

          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={chartData}
                margin={{ top: 10, right: 20, left: 10, bottom: 25 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" vertical={false} />
                <XAxis
                  dataKey="name"
                  tick={{ fontSize: 11, fill: "#4b5563" }}
                  interval={0}
                  angle={-15}
                  textAnchor="end"
                />
                <YAxis
                  tick={{ fontSize: 11, fill: "#4b5563" }}
                  tickFormatter={(val) => `₹${val}`}
                />
                <Tooltip
                  formatter={(val: unknown) => [
                    typeof val === "number" ? formatCurrency(val) : String(val ?? ""),
                    "Modal Price",
                  ]}
                  labelFormatter={(label) => `Commodity: ${label}`}
                  contentStyle={{
                    backgroundColor: "#ffffff",
                    borderColor: "#e5e7eb",
                    borderRadius: "8px",
                    boxShadow: "0 4px 6px -1px rgb(0 0 0 / 0.1)",
                    fontSize: "12px",
                  }}
                />
                <Bar dataKey="modalPrice" radius={[4, 4, 0, 0]}>
                  {chartData.map((entry, index) => (
                    <Cell
                      key={`cell-${index}`}
                      fill={index % 2 === 0 ? "#16a34a" : "#22c55e"}
                    />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>
      )}

      {/* Loading, Error & Empty States */}
      {isLoading && <Skeleton className="h-96 w-full" />}
      {isError && <ErrorState error={error} onRetry={() => void refetch()} />}

      {!isLoading && !isError && filteredPrices.length === 0 && (
        <EmptyState
          icon={Search}
          title="No matching mandi prices found"
          description={
            search || selectedCommodity !== "ALL" || selectedMandi !== "ALL"
              ? "Try resetting filters or searching for another agricultural commodity."
              : "Daily mandi rates will appear here once published."
          }
        />
      )}

      {/* Data Table */}
      {!isLoading && !isError && filteredPrices.length > 0 && (
        <Table
          columns={columns}
          rows={filteredPrices}
          rowKey={(p) => p.id}
          mobileCard={(p) => (
            <Card className="space-y-2.5 p-4">
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="font-semibold text-ink-900">{p.commodity}</h3>
                  <p className="flex items-center gap-1 text-xs text-ink-500 mt-0.5">
                    <MapPin className="size-3 text-primary-600" /> {p.mandi}
                  </p>
                </div>
                {p.stale && <Badge tone="warning">Outdated</Badge>}
              </div>

              <div className="flex items-baseline justify-between border-t border-border pt-2">
                <div>
                  <span className="numeric text-lg font-bold text-ink-900">
                    {formatCurrency(p.modalPrice)}{" "}
                    <span className="text-xs font-normal text-ink-500">/ qtl</span>
                  </span>
                  <p className="text-[11px] text-ink-400">
                    Range: {formatCurrency(p.minPrice)} – {formatCurrency(p.maxPrice)}
                  </p>
                </div>
                <div className="text-right">
                  <span className="text-xs font-semibold text-success-700">
                    {p.changePercent ? `${p.changePercent > 0 ? "+" : ""}${p.changePercent}%` : p.trend}
                  </span>
                  <p className="text-[11px] text-ink-400">{formatDate(p.priceDate)}</p>
                </div>
              </div>
            </Card>
          )}
        />
      )}
    </div>
  );
}
