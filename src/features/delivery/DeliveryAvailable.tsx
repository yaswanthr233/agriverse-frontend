import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import toast from "react-hot-toast";
import { PackageCheck, MapPin, Phone } from "lucide-react";
import { deliveryApi } from "@/api/endpoints/deliveryPortal";
import { qk } from "@/api/queryKeys";
import { ApiError } from "@/api/client";
import { formatCurrency, formatDateTime } from "@/lib/format";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Skeleton } from "@/components/ui/Skeleton";
import { EmptyState } from "@/components/feedback/EmptyState";
import { ErrorState } from "@/components/feedback/ErrorState";

export function DeliveryAvailable() {
  const queryClient = useQueryClient();
  const [raceMessage, setRaceMessage] = useState<string | null>(null);

  const { data, isLoading, isError, error, refetch } = useQuery({
    queryKey: qk.deliveryAvailable(),
    queryFn: deliveryApi.available,
  });

  const claim = useMutation({
    mutationFn: deliveryApi.claim,
    onSuccess: () => {
      toast.success("Order claimed — it's now out for delivery");
      setRaceMessage(null);
      void queryClient.invalidateQueries({ queryKey: qk.deliveryAvailable() });
      void queryClient.invalidateQueries({ queryKey: qk.deliveryPipeline() });
    },
    onError: (err) => {
      // Another partner claimed it first — the backend returns 400 INVALID_STATUS.
      // This is a race, not a failure. Explain it and refresh the list.
      if (err instanceof ApiError && err.errorCode === "INVALID_STATUS") {
        setRaceMessage(
          "That order was just claimed by someone else. The list has been refreshed.",
        );
        void queryClient.invalidateQueries({
          queryKey: qk.deliveryAvailable(),
        });
        return;
      }
      toast.error(
        err instanceof ApiError ? err.message : "Couldn't claim that order.",
      );
    },
  });

  if (isLoading) {
    return (
      <div className="space-y-3">
        {Array.from({ length: 3 }).map((_, i) => (
          <Skeleton key={i} className="h-36 w-full" />
        ))}
      </div>
    );
  }

  if (isError) {
    return (
      <ErrorState
        error={error}
        title="Couldn't load available orders."
        onRetry={() => void refetch()}
      />
    );
  }

  return (
    <div>
      <h1 className="text-2xl font-semibold text-ink-900">Available orders</h1>
      <p className="mt-1 text-ink-500">
        Shipped orders waiting for a delivery partner.
      </p>

      {raceMessage && (
        <p
          role="status"
          className="mt-4 rounded-md bg-warning-50 px-3 py-2 text-sm text-warning-700"
        >
          {raceMessage}
        </p>
      )}

      <div className="mt-6">
        {data && data.length === 0 ? (
          <EmptyState
            icon={PackageCheck}
            title="No orders are currently available"
            description="When sellers ship orders, they'll appear here to claim."
          />
        ) : (
          <div className="space-y-3">
            {data?.map((order) => (
              <Card key={order.id} className="p-5">
                <div className="flex flex-wrap items-start justify-between gap-4">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-3">
                      <span className="numeric font-semibold text-ink-900">
                        #{order.id}
                      </span>
                      <span className="text-sm text-ink-500">
                        {order.itemCount} item
                        {order.itemCount === 1 ? "" : "s"}
                      </span>
                    </div>

                    <p className="mt-3 flex items-start gap-2 text-sm text-ink-700">
                      <MapPin
                        className="mt-0.5 size-4 shrink-0 text-ink-400"
                        aria-hidden="true"
                      />
                      {order.deliveryAddress}
                    </p>

                    <p className="mt-2 flex items-center gap-2 text-sm text-ink-700">
                      <Phone
                        className="size-4 shrink-0 text-ink-400"
                        aria-hidden="true"
                      />
                      {order.buyerName} ·{" "}
                      <a
                        href={`tel:${order.buyerPhone}`}
                        className="text-primary-700 hover:underline"
                      >
                        {order.buyerPhone}
                      </a>
                    </p>

                    <p className="mt-2 text-xs text-ink-500">
                      Placed {formatDateTime(order.createdAt)}
                    </p>
                  </div>

                  <div className="text-right">
                    {/* totalAmount is a STRING on DeliveryOrderBrief — parse before formatting. */}
                    <p className="numeric text-lg font-semibold text-ink-900">
                      {formatCurrency(Number(order.totalAmount))}
                    </p>
                    <Button
                      className="mt-3"
                      loading={claim.isPending && claim.variables === order.id}
                      onClick={() => claim.mutate(order.id)}
                    >
                      Claim order
                    </Button>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
