import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import toast from "react-hot-toast";
import {
  Clock,
  User,
  Edit2,
  Stethoscope,
} from "lucide-react";
import { vetPortalApi } from "@/api/endpoints/vetPortal";
import { qk } from "@/api/queryKeys";
import type { AppointmentResponse, AppointmentStatus } from "@/api/types";
import { ApiError } from "@/api/client";
import { formatDateTime, formatEnum } from "@/lib/format";
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
      return "primary";
    case "IN_PROGRESS":
      return "warning";
    case "COMPLETED":
      return "success";
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
    onSuccess: () => {
      toast.success("Appointment updated successfully");
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
      <div>
        <h1 className="text-2xl font-semibold text-ink-900">
          Veterinary Appointments
        </h1>
        <p className="mt-1 text-sm text-ink-500">
          Manage consultations, clinical visit requests, diagnostics, and
          prescriptions.
        </p>
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
                ? "bg-primary-600 text-white"
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

      {isError && <ErrorState error={error} onRetry={() => void refetch()} />}

      {!isLoading && !isError && sorted.length === 0 && (
        <EmptyState
          icon={Stethoscope}
          title="No appointments found"
          description="There are no scheduled veterinary appointments matching this filter."
        />
      )}

      {!isLoading && !isError && sorted.length > 0 && (
        <div className="space-y-4">
          {sorted.map((appt) => (
            <Card key={appt.id} className="p-5">
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div className="min-w-0 flex-1 space-y-2">
                  <div className="flex items-center gap-3">
                    <h3 className="font-semibold text-ink-900">
                      {appt.animalDescription || "Livestock Consultation"}
                    </h3>
                    <Badge tone={appointmentStatusTone(appt.status)}>
                      {formatEnum(appt.status)}
                    </Badge>
                  </div>

                  <div className="flex flex-wrap items-center gap-4 text-xs text-ink-500">
                    <span className="flex items-center gap-1">
                      <User className="size-3.5" aria-hidden="true" />
                      <strong>Farmer:</strong> {appt.farmerName} (
                      {appt.farmerEmail})
                    </span>
                    <span className="flex items-center gap-1">
                      <Clock className="size-3.5" aria-hidden="true" />
                      <strong>Scheduled:</strong>{" "}
                      {formatDateTime(appt.scheduledAt)}
                    </span>
                  </div>

                  {appt.notes && (
                    <div className="rounded bg-surface-sunk p-2.5 text-xs text-ink-700">
                      <strong>Farmer Notes:</strong> {appt.notes}
                    </div>
                  )}

                  {appt.vetNotes && (
                    <div className="rounded border border-primary-100 bg-primary-50/50 p-2.5 text-xs text-primary-900">
                      <strong>Clinical Notes & Prescription:</strong>{" "}
                      {appt.vetNotes}
                    </div>
                  )}
                </div>

                <div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => openUpdateModal(appt)}
                  >
                    <Edit2 className="mr-1.5 size-3.5" aria-hidden="true" />
                    Update Status & Notes
                  </Button>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* Update Status & Vet Notes Modal */}
      <Modal
        open={updatingAppt !== null}
        onClose={() => setUpdatingAppt(null)}
        title={`Update Appointment #${updatingAppt?.id}`}
      >
        <div className="space-y-4">
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
