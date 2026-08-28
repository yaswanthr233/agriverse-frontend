import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  Users,
  ChevronDown,
  ChevronUp,
  Search,
  Clock,
  History,
} from "lucide-react";
import { vetPortalApi } from "@/api/endpoints/vetPortal";
import { qk } from "@/api/queryKeys";
import { derivePatients } from "./derivePatients";
import { formatDate, formatDateTime, formatEnum } from "@/lib/format";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Input } from "@/components/ui/Input";
import { Skeleton } from "@/components/ui/Skeleton";
import { EmptyState } from "@/components/feedback/EmptyState";
import { ErrorState } from "@/components/feedback/ErrorState";

export function VetPatients() {
  const [search, setSearch] = useState("");
  const [expandedFarmer, setExpandedFarmer] = useState<string | null>(null);

  const {
    data: appointments,
    isLoading,
    isError,
    error,
    refetch,
  } = useQuery({
    queryKey: qk.vetSchedule(),
    queryFn: vetPortalApi.schedule,
  });

  const patients = appointments ? derivePatients(appointments) : [];

  const filtered = patients.filter(
    (p) =>
      p.farmerName.toLowerCase().includes(search.toLowerCase()) ||
      p.farmerEmail.toLowerCase().includes(search.toLowerCase()),
  );

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-ink-900">
          Patient Directory & Farm Animal Records
        </h1>
        <p className="mt-1 text-sm text-ink-500">
          Derived history of client farms, animals treated, and consultation
          frequencies.
        </p>
      </div>

      <div className="max-w-md">
        <Input
          placeholder="Search by farmer name or email..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      {isLoading && (
        <div className="space-y-3">
          <Skeleton className="h-20 w-full" />
          <Skeleton className="h-20 w-full" />
          <Skeleton className="h-20 w-full" />
        </div>
      )}

      {isError && <ErrorState error={error} onRetry={() => void refetch()} />}

      {!isLoading && !isError && patients.length === 0 && (
        <EmptyState
          icon={Users}
          title="No patients recorded yet"
          description="Farmers who book veterinary consultations will automatically appear in your patient directory."
        />
      )}

      {!isLoading &&
        !isError &&
        patients.length > 0 &&
        filtered.length === 0 && (
          <EmptyState
            icon={Search}
            title="No matching farmers found"
            description="No farmer or patient profile matches your search."
          />
        )}

      {!isLoading && !isError && filtered.length > 0 && (
        <div className="space-y-4">
          {filtered.map((patient) => {
            const isExpanded = expandedFarmer === patient.farmerEmail;
            return (
              <Card key={patient.farmerEmail} className="overflow-hidden p-5">
                <div className="flex flex-wrap items-center justify-between gap-4">
                  <div className="min-w-0 flex-1 space-y-1">
                    <div className="flex items-center gap-3">
                      <h3 className="font-semibold text-ink-900">
                        {patient.farmerName}
                      </h3>
                      <Badge tone="primary">
                        {patient.visitCount} consultation
                        {patient.visitCount === 1 ? "" : "s"}
                      </Badge>
                    </div>
                    <p className="text-xs text-ink-400">
                      {patient.farmerEmail}
                    </p>

                    <div className="flex flex-wrap items-center gap-1.5 pt-1">
                      <span className="mr-1 text-xs text-ink-500">
                        Animals:
                      </span>
                      {patient.animals.length > 0 ? (
                        patient.animals.map((a, i) => (
                          <Badge key={i} tone="neutral">
                            {a}
                          </Badge>
                        ))
                      ) : (
                        <span className="text-xs text-ink-400">
                          Not specified
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-4">
                    <div className="text-right text-xs text-ink-500">
                      <span>Last Consultation</span>
                      <p className="font-medium text-ink-900">
                        {formatDate(patient.lastVisit)}
                      </p>
                    </div>

                    <button
                      type="button"
                      onClick={() =>
                        setExpandedFarmer(
                          isExpanded ? null : patient.farmerEmail,
                        )
                      }
                      className="flex items-center gap-1 rounded-md border border-border bg-surface px-3 py-1.5 text-xs font-medium text-ink-700 hover:bg-surface-sunk"
                    >
                      {isExpanded ? (
                        <>
                          Hide History{" "}
                          <ChevronUp className="size-3.5" aria-hidden="true" />
                        </>
                      ) : (
                        <>
                          View History ({patient.appointments.length}){" "}
                          <ChevronDown
                            className="size-3.5"
                            aria-hidden="true"
                          />
                        </>
                      )}
                    </button>
                  </div>
                </div>

                {/* Expanded Appointment History */}
                {isExpanded && (
                  <div className="mt-4 space-y-3 border-t border-border pt-4">
                    <h4 className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-ink-500">
                      <History className="size-3.5" aria-hidden="true" /> Past
                      Consultations & Case Notes
                    </h4>

                    <div className="divide-y divide-border rounded-md border border-border bg-surface-sunk">
                      {patient.appointments.map((appt) => (
                        <div key={appt.id} className="space-y-1.5 p-3 text-xs">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <span className="font-semibold text-ink-900">
                                {appt.animalDescription ||
                                  "Livestock Consultation"}
                              </span>
                              <Badge tone="neutral">
                                {formatEnum(appt.status)}
                              </Badge>
                            </div>
                            <span className="flex items-center gap-1 text-ink-400">
                              <Clock className="size-3" aria-hidden="true" />
                              {formatDateTime(appt.scheduledAt)}
                            </span>
                          </div>

                          {appt.notes && (
                            <p className="text-ink-600">
                              <strong>Farmer note:</strong> {appt.notes}
                            </p>
                          )}
                          {appt.vetNotes && (
                            <p className="text-primary-800">
                              <strong>Prescription / Vet note:</strong>{" "}
                              {appt.vetNotes}
                            </p>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
