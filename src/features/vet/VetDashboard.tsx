import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import {
  Calendar,
  Clock,
  CheckCircle,
  IndianRupee,
  Users,
  ArrowRight,
  ChevronRight,
} from "lucide-react";
import { vetPortalApi } from "@/api/endpoints/vetPortal";
import { qk } from "@/api/queryKeys";
import { formatCurrency, formatDateTime, formatEnum } from "@/lib/format";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Skeleton } from "@/components/ui/Skeleton";
import { ErrorState } from "@/components/feedback/ErrorState";

export function VetDashboard() {
  const {
    data: schedule,
    isLoading: isSchedLoading,
    isError: isSchedError,
    error: schedError,
    refetch: refetchSched,
  } = useQuery({
    queryKey: qk.vetSchedule(),
    queryFn: vetPortalApi.schedule,
  });

  const {
    data: earnings,
    isLoading: isEarnLoading,
    isError: isEarnError,
    error: earnError,
    refetch: refetchEarn,
  } = useQuery({
    queryKey: qk.vetEarnings(),
    queryFn: vetPortalApi.earnings,
  });

  const isLoading = isSchedLoading || isEarnLoading;
  const isError = isSchedError || isEarnError;
  const error = schedError || earnError;

  const appts = schedule ?? [];
  const todayStr = new Date().toDateString();
  const todaysAppts = appts.filter(
    (a) => new Date(a.scheduledAt).toDateString() === todayStr,
  );
  const upcomingAppts = appts.filter(
    (a) => a.status === "CONFIRMED" || a.status === "PENDING",
  );

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-semibold text-ink-900">
          Veterinary Practice Dashboard
        </h1>
        <p className="mt-1 text-sm text-ink-500">
          Overview of scheduled farm visits, pending consultations, and clinical
          earnings.
        </p>
      </div>

      {isLoading && (
        <div className="space-y-6">
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <Skeleton key={i} className="h-28" />
            ))}
          </div>
          <Skeleton className="h-72 w-full" />
        </div>
      )}

      {isError && (
        <ErrorState
          error={error}
          onRetry={() => {
            void refetchSched();
            void refetchEarn();
          }}
        />
      )}

      {!isLoading && !isError && (
        <>
          {/* KPI Cards */}
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <Card className="p-5">
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium text-ink-500">
                  Today's Visits
                </span>
                <Calendar
                  className="size-4 text-primary-600"
                  aria-hidden="true"
                />
              </div>
              <p className="numeric mt-2 text-2xl font-bold text-ink-900">
                {todaysAppts.length}
              </p>
              <p className="mt-1 text-xs text-ink-500">Scheduled for today</p>
            </Card>

            <Card className="p-5">
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium text-ink-500">
                  Upcoming Consults
                </span>
                <Clock
                  className="size-4 text-primary-600"
                  aria-hidden="true"
                />
              </div>
              <p className="numeric mt-2 text-2xl font-bold text-ink-900">
                {upcomingAppts.length}
              </p>
              <p className="mt-1 text-xs text-ink-500">Pending & confirmed</p>
            </Card>

            <Card className="p-5">
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium text-ink-500">
                  Completed Visits
                </span>
                <CheckCircle
                  className="size-4 text-success-600"
                  aria-hidden="true"
                />
              </div>
              <p className="numeric mt-2 text-2xl font-bold text-ink-900">
                {earnings?.completedVisits ?? 0}
              </p>
              <p className="mt-1 text-xs text-success-700">Treated animals</p>
            </Card>

            <Card className="p-5">
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium text-ink-500">
                  This Month Earnings
                </span>
                <IndianRupee
                  className="size-4 text-success-600"
                  aria-hidden="true"
                />
              </div>
              <p className="numeric mt-2 text-2xl font-bold text-ink-900">
                {formatCurrency(earnings?.thisMonthEarnings ?? 0)}
              </p>
              <p className="mt-1 text-xs text-ink-500">
                Total: {formatCurrency(earnings?.totalEarnings ?? 0)}
              </p>
            </Card>
          </div>

          {/* Today's Schedule Panel */}
          <Card className="p-6">
            <div className="flex items-center justify-between border-b border-border pb-4">
              <div>
                <h2 className="text-base font-semibold text-ink-900">
                  Today's Visit Schedule
                </h2>
                <p className="text-xs text-ink-500">
                  Appointments booked for{" "}
                  {new Date().toLocaleDateString(undefined, {
                    weekday: "long",
                    month: "short",
                    day: "numeric",
                    year: "numeric",
                  })}
                </p>
              </div>
              <Link to="/vet/appointments">
                <Button variant="outline" size="sm">
                  View Full Schedule{" "}
                  <ArrowRight className="ml-1.5 size-3.5" aria-hidden="true" />
                </Button>
              </Link>
            </div>

            <div className="mt-4">
              {todaysAppts.length === 0 ? (
                <p className="py-6 text-center text-xs text-ink-400">
                  No appointments scheduled for today. Check upcoming
                  appointments in your full schedule.
                </p>
              ) : (
                <div className="divide-y divide-border">
                  {todaysAppts.map((appt) => (
                    <div
                      key={appt.id}
                      className="flex flex-wrap items-center justify-between gap-4 py-3"
                    >
                      <div className="space-y-0.5">
                        <div className="flex items-center gap-2">
                          <span className="font-semibold text-ink-900">
                            {appt.animalDescription ||
                              "Livestock Consultation"}
                          </span>
                          <Badge tone="neutral">
                            {formatEnum(appt.status)}
                          </Badge>
                        </div>
                        <p className="text-xs text-ink-500">
                          Farmer: {appt.farmerName} · Time:{" "}
                          {formatDateTime(appt.scheduledAt)}
                        </p>
                      </div>

                      <Link to="/vet/appointments">
                        <Button variant="ghost" size="sm">
                          Manage{" "}
                          <ChevronRight
                            className="ml-1 size-4"
                            aria-hidden="true"
                          />
                        </Button>
                      </Link>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </Card>

          {/* Quick Shortcuts */}
          <div className="grid gap-4 sm:grid-cols-2">
            <Link to="/vet/patients">
              <Card className="p-5 transition-colors hover:border-primary-500">
                <div className="flex items-center gap-3">
                  <div className="flex size-10 items-center justify-center rounded-lg bg-primary-100 text-primary-700">
                    <Users className="size-5" aria-hidden="true" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-ink-900">
                      Patient Records
                    </h3>
                    <p className="text-xs text-ink-500">
                      Browse client farmers and animal history
                    </p>
                  </div>
                </div>
              </Card>
            </Link>

            <Link to="/vet/earnings">
              <Card className="p-5 transition-colors hover:border-primary-500">
                <div className="flex items-center gap-3">
                  <div className="flex size-10 items-center justify-center rounded-lg bg-success-100 text-success-700">
                    <IndianRupee className="size-5" aria-hidden="true" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-ink-900">
                      Earnings & Financials
                    </h3>
                    <p className="text-xs text-ink-500">
                      Detailed breakdown and monthly payouts
                    </p>
                  </div>
                </div>
              </Card>
            </Link>
          </div>
        </>
      )}
    </div>
  );
}
