import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import toast from "react-hot-toast";
import { Landmark, ExternalLink, Sparkles, CheckCircle2 } from "lucide-react";
import { schemesApi } from "@/api/endpoints/schemes";
import { qk } from "@/api/queryKeys";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Tabs } from "@/components/ui/Tabs";
import { Skeleton } from "@/components/ui/Skeleton";
import { EmptyState } from "@/components/feedback/EmptyState";
import { ErrorState } from "@/components/feedback/ErrorState";

export function Schemes() {
  const queryClient = useQueryClient();
  const [selectedCategory, setSelectedCategory] = useState("ALL");

  const {
    data: schemes,
    isLoading,
    isError,
    error,
    refetch,
  } = useQuery({
    queryKey: qk.schemes(),
    queryFn: schemesApi.list,
  });

  const applyMutation = useMutation({
    mutationFn: schemesApi.apply,
    onSuccess: () => {
      toast.success("Application submitted successfully");
      void queryClient.invalidateQueries({ queryKey: qk.schemes() });
    },
    onError: () => toast.error("Couldn't submit application."),
  });

  const categories = Array.from(
    new Set(schemes?.map((s) => s.category).filter(Boolean) ?? []),
  );

  const tabs = [
    { id: "ALL", label: "All Schemes" },
    ...categories.map((c) => ({ id: c, label: c })),
  ];

  const filteredSchemes =
    schemes?.filter(
      (s) => selectedCategory === "ALL" || s.category === selectedCategory,
    ) ?? [];

  const featured = schemes?.filter((s) => s.highlight) ?? [];

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-semibold text-ink-900">
          Government Schemes & Subsidies
        </h1>
        <p className="mt-1 text-ink-500">
          Access central and state agricultural support, financial subsidies,
          and welfare initiatives.
        </p>
      </div>

      {isLoading && (
        <div className="space-y-6">
          <div className="grid gap-4 sm:grid-cols-2">
            <Skeleton className="h-48" />
            <Skeleton className="h-48" />
          </div>
          <Skeleton className="h-10 w-80" />
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {Array.from({ length: 3 }).map((_, i) => (
              <Skeleton key={i} className="h-64" />
            ))}
          </div>
        </div>
      )}

      {isError && <ErrorState error={error} onRetry={() => void refetch()} />}

      {!isLoading && !isError && schemes?.length === 0 && (
        <EmptyState
          icon={Landmark}
          title="No government schemes available"
          description="New schemes and subsidy notifications will appear here once announced."
        />
      )}

      {/* Highlighted / Featured Section */}
      {!isLoading &&
        !isError &&
        featured.length > 0 &&
        selectedCategory === "ALL" && (
          <div className="space-y-4">
            <div className="flex items-center gap-2 text-sm font-semibold text-accent-700">
              <Sparkles className="size-4" aria-hidden="true" />
              <span>Featured National Schemes</span>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              {featured.map((scheme) => (
                <Card
                  key={scheme.id}
                  className="relative flex flex-col justify-between border-accent-200 bg-accent-50/20 p-5"
                >
                  <div>
                    <div className="flex items-start justify-between gap-2">
                      <Badge tone="warning">{scheme.category}</Badge>
                      <span className="text-xs text-ink-400">
                        Code: {scheme.code}
                      </span>
                    </div>

                    <h3 className="mt-2 text-lg font-semibold text-ink-900">
                      {scheme.name}
                    </h3>
                    <p className="text-xs text-ink-500">{scheme.ministry}</p>
                    <p className="mt-3 text-sm text-ink-700">
                      {scheme.description}
                    </p>

                    <dl className="mt-4 space-y-1.5 border-t border-border pt-3 text-xs">
                      <div className="flex justify-between">
                        <dt className="text-ink-500">
                          Financial Aid / Benefit
                        </dt>
                        <dd className="font-semibold text-primary-700">
                          {scheme.amount}
                        </dd>
                      </div>
                      <div className="flex justify-between">
                        <dt className="text-ink-500">Eligibility</dt>
                        <dd className="text-ink-900">{scheme.eligibility}</dd>
                      </div>
                      {scheme.deadline && (
                        <div className="flex justify-between">
                          <dt className="text-ink-500">Application Deadline</dt>
                          <dd className="text-ink-900">{scheme.deadline}</dd>
                        </div>
                      )}
                    </dl>
                  </div>

                  <div className="mt-5 border-t border-border pt-4">
                    {scheme.status === null ? (
                      <div className="flex items-center justify-between gap-3">
                        {scheme.portalUrl && (
                          <a
                            href={scheme.portalUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1 text-xs text-primary-700 hover:underline"
                          >
                            Official Portal{" "}
                            <ExternalLink
                              className="size-3"
                              aria-hidden="true"
                            />
                          </a>
                        )}
                        <Button
                          size="sm"
                          loading={applyMutation.isPending}
                          onClick={() => applyMutation.mutate(scheme.id)}
                        >
                          Apply Now
                        </Button>
                      </div>
                    ) : (
                      <div className="space-y-2">
                        <div className="flex items-center justify-between text-xs">
                          <span className="font-medium text-primary-800">
                            Status: {scheme.status}
                          </span>
                          <span className="text-ink-500">
                            {scheme.progress ?? 0}%
                          </span>
                        </div>
                        <div className="h-2 w-full overflow-hidden rounded-full bg-surface-sunk">
                          <div
                            className="h-full bg-primary-600 transition-all duration-300"
                            style={{ width: `${scheme.progress ?? 0}%` }}
                          />
                        </div>
                        {scheme.currentStep && (
                          <p className="flex items-center gap-1 text-[11px] text-ink-500">
                            <CheckCircle2
                              className="size-3 text-primary-600"
                              aria-hidden="true"
                            />
                            Step: {scheme.currentStep}
                          </p>
                        )}
                      </div>
                    )}
                  </div>
                </Card>
              ))}
            </div>
          </div>
        )}

      {/* Category Tabs & Scheme Cards Grid */}
      {!isLoading && !isError && schemes && schemes.length > 0 && (
        <div className="space-y-6">
          {tabs.length > 1 && (
            <Tabs
              tabs={tabs}
              active={selectedCategory}
              onChange={setSelectedCategory}
            />
          )}

          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {filteredSchemes.map((scheme) => (
              <Card
                key={scheme.id}
                className="flex flex-col justify-between p-5"
              >
                <div>
                  <div className="flex items-start justify-between gap-2">
                    <Badge tone="neutral">{scheme.category}</Badge>
                    <span className="text-xs text-ink-400">{scheme.code}</span>
                  </div>

                  <h3 className="mt-2 text-base font-semibold text-ink-900">
                    {scheme.name}
                  </h3>
                  <p className="text-xs text-ink-500">{scheme.ministry}</p>
                  <p className="mt-3 line-clamp-3 text-sm text-ink-700">
                    {scheme.description}
                  </p>

                  <dl className="mt-4 space-y-1 border-t border-border pt-3 text-xs">
                    <div className="flex justify-between">
                      <dt className="text-ink-500">Benefit</dt>
                      <dd className="font-semibold text-primary-700">
                        {scheme.amount}
                      </dd>
                    </div>
                    <div className="flex justify-between">
                      <dt className="text-ink-500">Eligibility</dt>
                      <dd
                        className="truncate text-ink-900"
                        title={scheme.eligibility}
                      >
                        {scheme.eligibility}
                      </dd>
                    </div>
                    {scheme.deadline && (
                      <div className="flex justify-between">
                        <dt className="text-ink-500">Deadline</dt>
                        <dd className="text-ink-900">{scheme.deadline}</dd>
                      </div>
                    )}
                  </dl>
                </div>

                <div className="mt-5 border-t border-border pt-4">
                  {scheme.status === null ? (
                    <div className="flex items-center justify-between gap-3">
                      {scheme.portalUrl && (
                        <a
                          href={scheme.portalUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1 text-xs text-ink-500 hover:text-primary-700"
                        >
                          Gov Portal{" "}
                          <ExternalLink
                            className="size-3"
                            aria-hidden="true"
                          />
                        </a>
                      )}
                      <Button
                        size="sm"
                        variant="outline"
                        loading={applyMutation.isPending}
                        onClick={() => applyMutation.mutate(scheme.id)}
                      >
                        Apply
                      </Button>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      <div className="flex items-center justify-between text-xs">
                        <span className="font-medium text-primary-700">
                          {scheme.status}
                        </span>
                        <span className="text-ink-500">
                          {scheme.progress ?? 0}%
                        </span>
                      </div>
                      <div className="h-1.5 w-full overflow-hidden rounded-full bg-surface-sunk">
                        <div
                          className="h-full bg-primary-600"
                          style={{ width: `${scheme.progress ?? 0}%` }}
                        />
                      </div>
                      {scheme.currentStep && (
                        <p className="truncate text-[11px] text-ink-500">
                          {scheme.currentStep}
                        </p>
                      )}
                    </div>
                  )}
                </div>
              </Card>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
