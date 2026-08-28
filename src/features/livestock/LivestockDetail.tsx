import { useParams, Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import {
  ChevronLeft,
  ImageOff,
  Mail,
  ShieldCheck,
  MapPin,
  User,
} from "lucide-react";
import { livestockApi } from "@/api/endpoints/livestock";
import { qk } from "@/api/queryKeys";
import { formatCurrency } from "@/lib/format";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Skeleton } from "@/components/ui/Skeleton";
import { ErrorState } from "@/components/feedback/ErrorState";

export function LivestockDetail() {
  const { id } = useParams();
  const animalId = Number(id);

  const {
    data: animal,
    isLoading,
    isError,
    error,
    refetch,
  } = useQuery({
    queryKey: qk.livestockItem(animalId),
    queryFn: () => livestockApi.byId(animalId),
    enabled: Number.isFinite(animalId),
  });

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-6 w-32" />
        <div className="grid gap-8 lg:grid-cols-2">
          <Skeleton className="h-96 w-full" />
          <Skeleton className="h-96 w-full" />
        </div>
      </div>
    );
  }

  if (isError || !animal) {
    return <ErrorState error={error} onRetry={() => void refetch()} />;
  }

  return (
    <div className="space-y-6">
      <Link
        to="/livestock"
        className="inline-flex items-center gap-1 text-sm text-ink-500 hover:text-ink-900"
      >
        <ChevronLeft className="size-4" aria-hidden="true" /> Back to livestock
        marketplace
      </Link>

      <div className="grid gap-8 lg:grid-cols-2">
        {/* Animal Image */}
        <div className="flex aspect-4/3 items-center justify-center overflow-hidden rounded-xl bg-surface-sunk shadow-sm">
          {animal.imageUrl ? (
            <img
              src={animal.imageUrl}
              alt={animal.name}
              className="size-full object-cover"
            />
          ) : (
            <ImageOff className="size-16 text-ink-400" aria-hidden="true" />
          )}
        </div>

        {/* Animal Info */}
        <div className="space-y-6">
          <div>
            <div className="flex flex-wrap items-center gap-3">
              <h1 className="text-3xl font-bold text-ink-900">{animal.name}</h1>
              {animal.forSale && <Badge tone="warning">Listed for Sale</Badge>}
            </div>
            <p className="mt-1 text-lg text-ink-600">{animal.breed}</p>

            {animal.price && (
              <p className="numeric mt-4 text-3xl font-bold text-primary-700">
                {formatCurrency(animal.price)}
              </p>
            )}
          </div>

          <div className="flex flex-wrap gap-2">
            {animal.vaccinated && (
              <Badge tone="success" className="px-3 py-1 text-xs">
                <ShieldCheck className="mr-1 size-3.5" aria-hidden="true" />{" "}
                Vaccinated
              </Badge>
            )}
            {animal.certified && (
              <Badge tone="info" className="px-3 py-1 text-xs">
                Certified Breed
              </Badge>
            )}
            {animal.healthStatus && (
              <Badge tone="neutral" className="px-3 py-1 text-xs">
                Status: {animal.healthStatus}
              </Badge>
            )}
          </div>

          <Card className="p-5">
            <h2 className="font-semibold text-ink-900">
              Animal specifications
            </h2>
            <dl className="mt-4 grid grid-cols-2 gap-4 text-sm">
              {animal.age && (
                <div>
                  <dt className="text-xs text-ink-400">Age</dt>
                  <dd className="mt-0.5 font-medium text-ink-900">
                    {animal.age}
                  </dd>
                </div>
              )}
              {animal.weightKg && (
                <div>
                  <dt className="text-xs text-ink-400">Weight</dt>
                  <dd className="numeric mt-0.5 font-medium text-ink-900">
                    {animal.weightKg} kg
                  </dd>
                </div>
              )}
              {animal.milkYield && (
                <div>
                  <dt className="text-xs text-ink-400">Milk Yield</dt>
                  <dd className="mt-0.5 font-medium text-ink-900">
                    {animal.milkYield}
                  </dd>
                </div>
              )}
              {animal.location && (
                <div>
                  <dt className="text-xs text-ink-400">Location</dt>
                  <dd className="mt-0.5 flex items-center gap-1 font-medium text-ink-900">
                    <MapPin
                      className="size-3.5 text-ink-500"
                      aria-hidden="true"
                    />
                    {animal.location}
                  </dd>
                </div>
              )}
            </dl>

            {animal.notes && (
              <div className="mt-4 border-t border-border pt-4">
                <p className="text-xs text-ink-400">Notes & History</p>
                <p className="mt-1 text-sm text-ink-700">{animal.notes}</p>
              </div>
            )}
          </Card>

          {/* Seller / Direct Contact Info */}
          <Card className="border-primary-200 bg-primary-50/40 p-5">
            <h2 className="flex items-center gap-2 font-semibold text-primary-900">
              <User className="size-4 text-primary-700" aria-hidden="true" />
              Contact Farmer / Seller
            </h2>
            <p className="mt-1 text-xs text-ink-600">
              Livestock sales are arranged directly between the buyer and
              farmer.
            </p>

            <div className="mt-4 space-y-2 text-sm">
              <p className="font-medium text-ink-900">{animal.farmerName}</p>
              {animal.farmerEmail && (
                <p className="flex items-center gap-2 text-ink-700">
                  <Mail
                    className="size-4 text-primary-700"
                    aria-hidden="true"
                  />
                  <a
                    href={`mailto:${animal.farmerEmail}`}
                    className="hover:underline"
                  >
                    {animal.farmerEmail}
                  </a>
                </p>
              )}
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
