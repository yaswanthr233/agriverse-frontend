import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import toast from "react-hot-toast";
import {
  Clock,
  User,
  Edit2,
  Stethoscope,
  Check,
  X,
  Play,
  CheckCheck,
  Phone,
  Mail,
  MapPin,
  ExternalLink,
  Navigation,
} from "lucide-react";
import { vetPortalApi } from "@/api/endpoints/vetPortal";
import { qk } from "@/api/queryKeys";
import type { AppointmentResponse, AppointmentStatus } from "@/api/types";
import { ApiError } from "@/api/client";
import { formatDateTime, formatEnum } from "@/lib/format";
import { getGoogleMapsUrl } from "@/lib/location";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Select } from "@/components/ui/Select";
import { Modal } from "@/components/ui/Modal";
import { Skeleton } from "@/components/ui/Skeleton";
import { EmptyState } from "@/components/feedback/EmptyState";
import { ErrorState } from "@/components/feedback/ErrorState";

const STATUS_OPTIONS = [
  { value: "PENDING", label: "Pending" },
  { value: "CONFIRMED", label: "Confirmed" },
  { value: "IN_PROGRESS", label: "In Progress" },
  { value: "COMPLETED", label: "Completed" },
  { value: "CANCELLED", label: "Cancelled" },
];

function appointmentStatusTone(
  status: string,
): "neutral" | "primary" | "success" | "danger" | "warning" {
  switch (status) {
    case "CONFIRMED":
      return "success";
    case "IN_PROGRESS":
      return "warning";
    case "COMPLETED":
      return "primary";
    case "CANCELLED":
      return "danger";
    default:
      return "neutral";
  }
}

export function VetAppointments() {
  const queryClient = useQueryClient();
  const [statusFilter, setStatusFilter] = useState<string>("ALL");
  const [updatingAppt, setUpdatingAppt] = useState<AppointmentResponse | null>(
    null,
  );
  const [nextStatus, setNextStatus] = useState<AppointmentStatus>("CONFIRMED");
  const [vetNotesInput, setVetNotesInput] = useState<string>("");

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

  useEffect(() => {
    if (isError && error) {
      console.error("Failed to load veterinarian appointments", error);
    }
  }, [isError, error]);

  const updateMutation = useMutation({
    mutationFn: ({
      id,
      status,
      vetNotes,
    }: {
      id: number;
      status: AppointmentStatus;
      vetNotes?: string;
    }) => vetPortalApi.updateStatus(id, status, vetNotes),
    onSuccess: (updated) => {
      toast.success(`Appointment #${updated.id} marked as ${updated.status}`);
      setUpdatingAppt(null);
      void queryClient.invalidateQueries({ queryKey: qk.vetSchedule() });
      void queryClient.invalidateQueries({ queryKey: qk.vetEarnings() });
    },
    onError: (err) => {
      toast.error(
        err instanceof ApiError ? err.message : "Couldn't update appointment.",
      );
    },
  });

  function openUpdateModal(appt: AppointmentResponse) {
    setUpdatingAppt(appt);
    setNextStatus((appt.status as AppointmentStatus) || "CONFIRMED");
    setVetNotesInput(appt.vetNotes || "");
  }

  const apptList = appointments ?? [];
  const filtered =
    statusFilter === "ALL"
      ? apptList
      : apptList.filter((a) => a.status === statusFilter);

  // Sort ascending by scheduledAt (upcoming first)
  const sorted = [...filtered].sort(
    (a, b) =>
      new Date(a.scheduledAt).getTime() - new Date(b.scheduledAt).getTime(),
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-ink-900">
            Veterinary Consultation Schedule
          </h1>
          <p className="mt-1 text-sm text-ink-500">
            Review incoming consultation requests, verify farmer visit locations, and prescribe treatments.
          </p>
        </div>
        {!isLoading && !isError && (
          <Badge tone="neutral">{apptList.length} Total Visits</Badge>
        )}
      </div>

      {/* Filter Tabs */}
      <div className="flex flex-wrap gap-2 border-b border-border pb-3">
        {["ALL", ...STATUS_OPTIONS.map((s) => s.value)].map((tab) => (
          <button
            key={tab}
            type="button"
            onClick={() => setStatusFilter(tab)}
            className={`rounded-full px-3.5 py-1.5 text-xs font-medium transition-colors ${
              statusFilter === tab
                ? "bg-primary-600 text-white shadow-xs"
                : "bg-surface-sunk text-ink-700 hover:bg-surface-raised"
            }`}
          >
            {tab === "ALL" ? "All Visits" : formatEnum(tab)}
          </button>
        ))}
      </div>

      {isLoading && (
        <div className="space-y-4">
          <Skeleton className="h-32 w-full" />
          <Skeleton className="h-32 w-full" />
          <Skeleton className="h-32 w-full" />
        </div>
      )}

      {isError && (
        <ErrorState
          error={error}
          title="Unable to load appointments"
          description="Failed to load your veterinary consultation schedule. Please try again."
          onRetry={() => {
            console.error("Retrying appointments fetch...");
            void refetch();
          }}
        />
      )}

      {!isLoading && !isError && sorted.length === 0 && (
        <EmptyState
          icon={Stethoscope}
          title="No appointments found"
          description="There are no scheduled veterinary appointments matching this filter."
        />
      )}

      {!isLoading && !isError && sorted.length > 0 && (
        <div className="space-y-4">
          {sorted.map((appt) => {
            const mapsUrl = appt.googleMapsUrl || getGoogleMapsUrl(appt.locationLatitude, appt.locationLongitude);
            return (
              <Card key={appt.id} className="p-5 hover:border-primary-300 transition-colors">
                <div className="flex flex-wrap items-start justify-between gap-4">
                  <div className="min-w-0 flex-1 space-y-2.5">
                    <div className="flex items-center gap-3">
                      <h3 className="font-semibold text-ink-900 text-base">
                        {appt.animalDescription || "Livestock Consultation"}
                      </h3>
                      <Badge tone={appointmentStatusTone(appt.status)}>
                        {formatEnum(appt.status)}
                      </Badge>
                      <span className="text-xs text-ink-400 font-mono">
                        #{appt.id}
                      </span>
                    </div>

                    <div className="flex flex-wrap items-center gap-4 text-xs text-ink-600">
                      <span className="flex items-center gap-1.5">
                        <User className="size-3.5 text-primary-600" aria-hidden="true" />
                        <strong>Farmer:</strong> {appt.farmerName}
                      </span>
                      {appt.farmerEmail && (
                        <span className="flex items-center gap-1 text-ink-500">
                          <Mail className="size-3 text-ink-400" />
                          {appt.farmerEmail}
                        </span>
                      )}
                      {appt.farmerPhone && (
                        <span className="flex items-center gap-1 text-ink-500">
                          <Phone className="size-3 text-ink-400" />
                          {appt.farmerPhone}
                        </span>
                      )}
                      <span className="flex items-center gap-1.5">
                        <Clock className="size-3.5 text-ink-400" aria-hidden="true" />
                        <strong>Scheduled:</strong>{" "}
                        {formatDateTime(appt.scheduledAt)}
                      </span>
                    </div>

                    {/* Visit Location Card Section */}
                    <div className="rounded-lg border border-border/80 bg-surface-sunk p-3 text-xs space-y-1.5">
                      <div className="flex items-center justify-between">
                        <span className="font-semibold text-ink-800 flex items-center gap-1.5">
                          <MapPin className="size-3.5 text-primary-600" /> Farm / Visit Location:
                        </span>
                        {mapsUrl && (
                          <a
                            href={mapsUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1 font-semibold text-primary-700 hover:text-primary-800 text-[11px] bg-white border border-primary-200 px-2 py-0.5 rounded shadow-2xs"
                          >
                            <Navigation className="size-3 text-primary-600" /> Open in Google Maps
                            <ExternalLink className="size-2.5" />
                          </a>
                        )}
                      </div>

                      {appt.locationAddress ? (
                        <p className="text-ink-700 text-xs">
                          {appt.locationAddress}
                        </p>
                      ) : appt.locationLatitude != null && appt.locationLongitude != null ? (
                        <p className="text-ink-600 text-[11px] font-mono">
                          Latitude: {appt.locationLatitude.toFixed(6)}, Longitude: {appt.locationLongitude.toFixed(6)}
                        </p>
                      ) : (
                        <p className="text-ink-400 text-xs italic">
                          Location not available for this appointment.
                        </p>
                      )}

                      {appt.locationLatitude != null && appt.locationLongitude != null && appt.locationAddress && (
                        <p className="text-[10px] text-ink-400 font-mono">
                          Coordinates: {appt.locationLatitude.toFixed(5)}, {appt.locationLongitude.toFixed(5)}
                        </p>
                      )}
                    </div>

                    {appt.notes && (
                      <div className="rounded-lg bg-surface-sunk p-3 text-xs text-ink-700">
                        <strong>Farmer Case Notes:</strong> {appt.notes}
                      </div>
                    )}

                    {appt.vetNotes && (
                      <div className="rounded-lg border border-primary-100 bg-primary-50/60 p-3 text-xs text-primary-900">
                        <strong>Clinical Notes & Prescription:</strong>{" "}
                        {appt.vetNotes}
                      </div>
                    )}
                  </div>

                  <div className="flex flex-wrap items-center gap-2">
                    {/* Quick Action Buttons */}
                    {appt.status === "PENDING" && (
                      <>
                        <Button
                          size="sm"
                          className="bg-success-600 hover:bg-success-700 text-white gap-1 text-xs"
                          loading={updateMutation.isPending}
                          onClick={() =>
                            updateMutation.mutate({
                              id: appt.id,
                              status: "CONFIRMED",
                            })
                          }
                        >
                          <Check className="size-3.5" /> Accept
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          className="text-danger-700 border-danger-200 hover:bg-danger-50 text-xs gap-1"
                          onClick={() => openUpdateModal(appt)}
                        >
                          <X className="size-3.5" /> Decline
                        </Button>
                      </>
                    )}

                    {appt.status === "CONFIRMED" && (
                      <Button
                        size="sm"
                        variant="outline"
                        className="text-primary-700 border-primary-300 hover:bg-primary-50 text-xs gap-1"
                        loading={updateMutation.isPending}
                        onClick={() =>
                          updateMutation.mutate({
                            id: appt.id,
                            status: "IN_PROGRESS",
                          })
                        }
                      >
                        <Play className="size-3.5" /> Start Visit
                      </Button>
                    )}

                    {appt.status === "IN_PROGRESS" && (
                      <Button
                        size="sm"
                        className="bg-primary-600 hover:bg-primary-700 text-white gap-1 text-xs"
                        onClick={() => openUpdateModal(appt)}
                      >
                        <CheckCheck className="size-3.5" /> Complete Visit
                      </Button>
                    )}

                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-xs"
                      onClick={() => openUpdateModal(appt)}
                    >
                      <Edit2 className="mr-1.5 size-3.5" aria-hidden="true" />
                      Edit Notes
                    </Button>
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      )}

      {/* Update Status & Vet Notes Modal */}
      <Modal
        open={updatingAppt !== null}
        onClose={() => setUpdatingAppt(null)}
        title={`Update Appointment #${updatingAppt?.id}`}
      >
        <div className="space-y-4">
          {/* Visit Location in Update Modal */}
          {updatingAppt && (updatingAppt.locationAddress || (updatingAppt.locationLatitude != null && updatingAppt.locationLongitude != null)) && (
            <div className="rounded-lg border border-border bg-surface-sunk p-3 text-xs space-y-1">
              <div className="flex items-center justify-between">
                <span className="font-semibold text-ink-800 flex items-center gap-1">
                  <MapPin className="size-3.5 text-primary-600" /> Farm Location:
                </span>
                {(updatingAppt.googleMapsUrl || getGoogleMapsUrl(updatingAppt.locationLatitude, updatingAppt.locationLongitude)) && (
                  <a
                    href={updatingAppt.googleMapsUrl || getGoogleMapsUrl(updatingAppt.locationLatitude, updatingAppt.locationLongitude) || "#"}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-primary-700 hover:underline flex items-center gap-1"
                  >
                    Open in Google Maps <ExternalLink className="size-3" />
                  </a>
                )}
              </div>
              <p className="text-ink-600">
                {updatingAppt.locationAddress || `Lat: ${updatingAppt.locationLatitude}, Long: ${updatingAppt.locationLongitude}`}
              </p>
            </div>
          )}

          <Select
            label="Appointment Status"
            options={STATUS_OPTIONS}
            value={nextStatus}
            onChange={(e) =>
              setNextStatus(e.target.value as AppointmentStatus)
            }
          />

          <div className="space-y-1.5">
            <label className="block text-sm font-medium text-ink-700">
              Clinical Observations / Prescription Notes
            </label>
            <textarea
              className="w-full rounded-md border border-border bg-surface p-2.5 text-sm text-ink-900 focus:border-primary-500 focus:outline-none"
              rows={4}
              placeholder="Record diagnostic findings, treatment prescribed, dosage, and follow-up advice..."
              value={vetNotesInput}
              onChange={(e) => setVetNotesInput(e.target.value)}
            />
          </div>

          <div className="flex justify-end gap-2 border-t border-border pt-4">
            <Button
              variant="outline"
              onClick={() => setUpdatingAppt(null)}
            >
              Cancel
            </Button>
            <Button
              loading={updateMutation.isPending}
              onClick={() => {
                if (updatingAppt) {
                  updateMutation.mutate({
                    id: updatingAppt.id,
                    status: nextStatus,
                    vetNotes: vetNotesInput,
                  });
                }
              }}
            >
              Save Changes
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
