import { useSearchParams, Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { Beef, ImageOff } from "lucide-react";
import { livestockApi } from "@/api/endpoints/livestock";
import { qk } from "@/api/queryKeys";
import { formatCurrency } from "@/lib/format";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Pagination } from "@/components/ui/Pagination";
import { Skeleton } from "@/components/ui/Skeleton";
import { EmptyState } from "@/components/feedback/EmptyState";
import { ErrorState } from "@/components/feedback/ErrorState";

export function LivestockMarketplace() {
  const [params, setParams] = useSearchParams();
  const page = Math.max(0, Number(params.get("page") ?? "0"));

  const { data, isLoading, isError, error, refetch } = useQuery({
    queryKey: qk.livestockMarket(page),
    queryFn: () => livestockApi.marketplace(page),
  });

  const animals = data?.content ?? [];
  const totalPages = data?.totalPages ?? 1;

  function onPageChange(newPage: number) {
    setParams({ page: String(newPage) });
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-ink-900">
          Livestock Marketplace
        </h1>
        <p className="mt-1 text-ink-500">
          Browse verified dairy cattle, breeding stock and farm animals
          available from local farmers.
        </p>
      </div>

      {isLoading && (
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-72 w-full" />
          ))}
        </div>
      )}

      {isError && <ErrorState error={error} onRetry={() => void refetch()} />}

      {!isLoading && !isError && animals.length === 0 && (
        <EmptyState
          icon={Beef}
          title="No livestock currently listed for sale"
          description="Farmers have not listed any animals at this time. Check back soon."
        />
      )}

      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {animals.map((animal) => (
          <Link
            key={animal.id}
            to={`/livestock/${animal.id}`}
            className="group block"
          >
            <Card className="flex h-full flex-col justify-between overflow-hidden transition-shadow hover:shadow-md">
              <div>
                <div className="flex aspect-[4/3] items-center justify-center overflow-hidden bg-surface-sunk">
                  {animal.imageUrl ? (
                    <img
                      src={animal.imageUrl}
                      alt={animal.name}
                      className="size-full object-cover transition-transform duration-300 group-hover:scale-105"
                    />
                  ) : (
                    <ImageOff
                      className="size-10 text-ink-400"
                      aria-hidden="true"
                    />
                  )}
                </div>

                <div className="p-5">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <h2 className="text-lg font-semibold text-ink-900 group-hover:text-primary-700">
                        {animal.name}
                      </h2>
                      <p className="text-sm text-ink-500">{animal.breed}</p>
                    </div>
                    {animal.price && (
                      <span className="numeric text-lg font-semibold text-primary-700">
                        {formatCurrency(animal.price)}
                      </span>
                    )}
                  </div>

                  <div className="mt-3 flex flex-wrap gap-1.5">
                    {animal.vaccinated && (
                      <Badge tone="success">Vaccinated</Badge>
                    )}
                    {animal.certified && <Badge tone="info">Certified</Badge>}
                    {animal.healthStatus && (
                      <Badge tone="neutral">{animal.healthStatus}</Badge>
                    )}
                  </div>

                  <dl className="mt-4 space-y-1 text-xs text-ink-600">
                    {animal.location && (
                      <div className="flex justify-between">
                        <dt className="text-ink-400">Location</dt>
                        <dd className="font-medium text-ink-900">
                          {animal.location}
                        </dd>
                      </div>
                    )}
                    {animal.age && (
                      <div className="flex justify-between">
                        <dt className="text-ink-400">Age</dt>
                        <dd className="text-ink-900">{animal.age}</dd>
                      </div>
                    )}
                    {animal.milkYield && (
                      <div className="flex justify-between">
                        <dt className="text-ink-400">Milk Yield</dt>
                        <dd className="text-ink-900">{animal.milkYield}</dd>
                      </div>
                    )}
                  </dl>
                </div>
              </div>

              <div className="border-t border-border bg-surface-sunk/40 px-5 py-3 text-xs text-ink-500">
                Seller:{" "}
                <span className="font-medium text-ink-700">
                  {animal.farmerName}
                </span>
              </div>
            </Card>
          </Link>
        ))}
      </div>

      {totalPages > 1 && (
        <div className="mt-8 flex justify-center">
          <Pagination
            page={page}
            totalPages={totalPages}
            onChange={onPageChange}
          />
        </div>
      )}
    </div>
  );
}
