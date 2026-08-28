import { useEffect, useState } from "react";
import { useParams, useSearchParams, Navigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { PackageSearch, SearchX } from "lucide-react";
import { productsApi } from "@/api/endpoints/products";
import { qk } from "@/api/queryKeys";
import { PRODUCT_CATEGORIES, parseCategory } from "@/lib/categories";
import { useCartStore } from "@/stores/cartStore";
import { ProductCard } from "./ProductCard";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Skeleton } from "@/components/ui/Skeleton";
import { Pagination } from "@/components/ui/Pagination";
import { EmptyState } from "@/components/feedback/EmptyState";
import { ErrorState } from "@/components/feedback/ErrorState";
import { cn } from "@/lib/cn";

export function ProductCatalog() {
  const { category: categorySlug } = useParams();
  const [searchParams, setSearchParams] = useSearchParams();

  // A category in the URL path wins; otherwise use ?category=
  const pathCategory = categorySlug ? parseCategory(categorySlug) : null;
  const queryCategory = parseCategory(
    searchParams.get("category") ?? undefined,
  );
  const category = pathCategory ?? queryCategory;

  const [searchInput, setSearchInput] = useState(
    searchParams.get("search") ?? "",
  );
  const search = searchParams.get("search") ?? "";
  const page = Number(searchParams.get("page") ?? 0);

  // Debounce 400ms — the backend's search scans the whole table (see 03-BACKEND-ISSUES.md §2).
  useEffect(() => {
    const t = setTimeout(() => {
      if (searchInput === search) return;
      const next = new URLSearchParams(searchParams);
      if (searchInput) {
        next.set("search", searchInput);
      } else {
        next.delete("search");
      }
      next.set("page", "0");
      setSearchParams(next, { replace: true });
    }, 400);
    return () => clearTimeout(t);
  }, [searchInput, search, searchParams, setSearchParams]);

  const query = { category, search, page, size: 12 };
  const { data, isLoading, isError, error, refetch } = useQuery({
    queryKey: qk.products(query),
    queryFn: () => productsApi.catalog(query),
  });

  const addItem = useCartStore((s) => s.addItem);

  // An unknown slug like /marketplace/plants is a 404, not an empty grid.
  if (categorySlug && !pathCategory)
    return <Navigate to="/marketplace" replace />;

  function setParam(key: string, value: string | null) {
    const next = new URLSearchParams(searchParams);
    if (value) {
      next.set(key, value);
    } else {
      next.delete(key);
    }
    if (key !== "page") next.set("page", "0");
    setSearchParams(next);
  }

  const hasFilters = Boolean(category || search);

  return (
    <div className="mx-auto max-w-[1280px] px-4 py-8">
      <h1 className="text-2xl font-semibold text-ink-900">Marketplace</h1>
      <p className="mt-1 text-ink-500">Seeds, fertilizers, tools and more.</p>

      <div className="mt-6 max-w-md">
        <Input
          label="Search products"
          placeholder="Try 'paddy seeds'"
          value={searchInput}
          onChange={(e) => setSearchInput(e.target.value)}
        />
      </div>

      <div className="mt-4 flex flex-wrap gap-2">
        <button
          onClick={() => setParam("category", null)}
          className={cn(
            "rounded-full border px-3 py-1.5 text-sm transition-colors",
            !category
              ? "border-primary-600 bg-primary-50 text-primary-700"
              : "border-border text-ink-700 hover:bg-surface-sunk",
          )}
        >
          All
        </button>
        {PRODUCT_CATEGORIES.map((c) => (
          <button
            key={c.value}
            onClick={() => setParam("category", c.value)}
            className={cn(
              "rounded-full border px-3 py-1.5 text-sm transition-colors",
              category === c.value
                ? "border-primary-600 bg-primary-50 text-primary-700"
                : "border-border text-ink-700 hover:bg-surface-sunk",
            )}
          >
            {c.label}
          </button>
        ))}
      </div>

      <div className="mt-8">
        {isLoading && (
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {Array.from({ length: 12 }).map((_, i) => (
              <Card key={i} className="overflow-hidden">
                <Skeleton className="aspect-[4/3] rounded-none" />
                <div className="space-y-2 p-4">
                  <Skeleton className="h-4 w-20" />
                  <Skeleton className="h-5 w-full" />
                  <Skeleton className="h-6 w-24" />
                </div>
              </Card>
            ))}
          </div>
        )}

        {isError && <ErrorState error={error} onRetry={() => void refetch()} />}

        {!isLoading && !isError && data?.empty && (
          hasFilters ? (
            <EmptyState
              icon={SearchX}
              title="No products match your filters"
              description="Try a different category or search term."
              action={
                <Button
                  variant="outline"
                  onClick={() => setSearchParams(new URLSearchParams())}
                >
                  Clear filters
                </Button>
              }
            />
          ) : (
            <EmptyState
              icon={PackageSearch}
              title="No products available yet"
              description="Sellers haven't listed anything here. Check back soon."
            />
          )
        )}

        {!isLoading && !isError && data && !data.empty && (
          <>
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {data.content.map((p) => (
                <ProductCard key={p.id} product={p} onAddToCart={addItem} />
              ))}
            </div>
            <Pagination
              page={data.number}
              totalPages={data.totalPages}
              onChange={(p) => setParam("page", String(p))}
            />
          </>
        )}
      </div>
    </div>
  );
}
