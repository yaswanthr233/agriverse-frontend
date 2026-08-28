import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import toast from "react-hot-toast";
import {
  Stethoscope,
  Calendar,
  Phone,
  Mail,
  MapPin,
  Clock,
} from "lucide-react";
import { vetsApi } from "@/api/endpoints/vets";
import { qk } from "@/api/queryKeys";
import type { AppointmentRequest, VetDirectoryResponse } from "@/api/types";
import { formatDateTime } from "@/lib/format";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Textarea } from "@/components/ui/Textarea";
import { Modal } from "@/components/ui/Modal";
import { Skeleton } from "@/components/ui/Skeleton";
import { EmptyState } from "@/components/feedback/EmptyState";
import { ErrorState } from "@/components/feedback/ErrorState";

const schema = z.object({
  scheduledAt: z
    .string()
    .min(1, "Date and time are required")
    .refine((val) => new Date(val).getTime() > Date.now(), {
      message: "Appointment must be scheduled in the future",
    }),
  animalDescription: z.string().optional(),
  notes: z.string().optional(),
});
type FormInput = z.input<typeof schema>;
type FormOutput = z.output<typeof schema>;

export function BookVet() {
  const queryClient = useQueryClient();
  const [selectedVet, setSelectedVet] =
    useState<VetDirectoryResponse | null>(null);

  const directoryQuery = useQuery({
    queryKey: qk.vets(),
    queryFn: vetsApi.directory,
  });

  const appointmentsQuery = useQuery({
    queryKey: qk.myAppointments(),
    queryFn: vetsApi.myAppointments,
  });

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<FormInput, unknown, FormOutput>({
    resolver: zodResolver(schema),
  });

  const bookMutation = useMutation({
    mutationFn: (values: FormOutput) => {
      if (!selectedVet) throw new Error("No vet selected");
      const payload: AppointmentRequest = {
        vetId: selectedVet.id,
        scheduledAt: values.scheduledAt,
        animalDescription: values.animalDescription || undefined,
        notes: values.notes || undefined,
      };
      return vetsApi.book(payload);
    },
    onSuccess: () => {
      toast.success("Appointment request booked");
      setSelectedVet(null);
      reset();
      void queryClient.invalidateQueries({ queryKey: qk.myAppointments() });
    },
    onError: () => toast.error("Couldn't book appointment."),
  });

  const vets = directoryQuery.data ?? [];
  const appointments = appointmentsQuery.data ?? [];

  return (
    <div className="space-y-10">
      <div>
        <h1 className="text-2xl font-semibold text-ink-900">
          Veterinary Consultation & Appointments
        </h1>
        <p className="mt-1 text-ink-500">
          Book on-farm and digital consultations with verified veterinary
          specialists.
        </p>
      </div>

      {/* Vet Directory Section */}
      <section className="space-y-4">
        <h2 className="text-lg font-semibold text-ink-900">
          Available Veterinarians
        </h2>

        {directoryQuery.isLoading && (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {Array.from({ length: 3 }).map((_, i) => (
              <Skeleton key={i} className="h-44" />
            ))}
          </div>
        )}

        {directoryQuery.isError && (
          <ErrorState
            error={directoryQuery.error}
            onRetry={() => void directoryQuery.refetch()}
          />
        )}

        {!directoryQuery.isLoading &&
          !directoryQuery.isError &&
          vets.length === 0 && (
            <EmptyState
              icon={Stethoscope}
              title="No veterinarians available"
              description="No veterinary specialists are currently registered in your area."
            />
          )}

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {vets.map((vet) => (
            <Card key={vet.id} className="flex flex-col justify-between p-5">
              <div>
                <div className="flex items-center gap-3">
                  <div className="flex size-10 items-center justify-center rounded-full bg-primary-100 text-primary-700">
                    <Stethoscope className="size-5" aria-hidden="true" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-ink-900">
                      {vet.fullName}
                    </h3>
                    <p className="flex items-center gap-1 text-xs text-ink-500">
                      <MapPin className="size-3" aria-hidden="true" />
                      {vet.city}, {vet.state}
                    </p>
                  </div>
                </div>

                <div className="mt-4 space-y-1 text-xs text-ink-600">
                  {vet.phone && (
                    <p className="flex items-center gap-2">
                      <Phone
                        className="size-3.5 text-ink-400"
                        aria-hidden="true"
                      />
                      <span>{vet.phone}</span>
                    </p>
                  )}
                  {vet.email && (
                    <p className="flex items-center gap-2">
                      <Mail
                        className="size-3.5 text-ink-400"
                        aria-hidden="true"
                      />
                      <span>{vet.email}</span>
                    </p>
                  )}
                </div>
              </div>

              <div className="mt-5 border-t border-border pt-3">
                <Button
                  className="w-full"
                  size="sm"
                  onClick={() => {
                    reset();
                    setSelectedVet(vet);
                  }}
                >
                  <Calendar className="size-4" aria-hidden="true" /> Book
                  appointment
                </Button>
              </div>
            </Card>
          ))}
        </div>
      </section>

      {/* My Appointments Section */}
      <section className="space-y-4">
        <h2 className="text-lg font-semibold text-ink-900">My Appointments</h2>

        {appointmentsQuery.isLoading && (
          <div className="space-y-3">
            {Array.from({ length: 2 }).map((_, i) => (
              <Skeleton key={i} className="h-24 w-full" />
            ))}
          </div>
        )}

        {appointmentsQuery.isError && (
          <ErrorState
            error={appointmentsQuery.error}
            onRetry={() => void appointmentsQuery.refetch()}
          />
        )}

        {!appointmentsQuery.isLoading &&
          !appointmentsQuery.isError &&
          appointments.length === 0 && (
            <Card className="p-8 text-center text-sm text-ink-500">
              You have no booked veterinary appointments.
            </Card>
          )}

        <div className="space-y-3">
          {appointments.map((appt) => (
            <Card
              key={appt.id}
              className="flex flex-wrap items-center justify-between gap-4 p-4"
            >
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="font-semibold text-ink-900">
                    {appt.vetName}
                  </span>
                  <Badge
                    tone={
                      appt.status === "CONFIRMED"
                        ? "success"
                        : appt.status === "CANCELLED"
                          ? "danger"
                          : appt.status === "COMPLETED"
                            ? "neutral"
                            : "warning"
                    }
                  >
                    {appt.status}
                  </Badge>
                </div>
                <p className="flex items-center gap-1.5 text-xs text-ink-500">
                  <Clock className="size-3.5 text-ink-400" aria-hidden="true" />
                  Scheduled for: {formatDateTime(appt.scheduledAt)}
                </p>
                {appt.animalDescription && (
                  <p className="text-xs text-ink-700">
                    Animal: {appt.animalDescription}
                  </p>
                )}
                {appt.vetNotes && (
                  <p className="mt-1 rounded bg-surface-sunk px-2 py-1 text-xs text-ink-600">
                    Vet notes: {appt.vetNotes}
                  </p>
                )}
              </div>

              <div className="text-xs text-ink-400">
                Booked {formatDateTime(appt.createdAt)}
              </div>
            </Card>
          ))}
        </div>
      </section>

      {/* Book Appointment Modal */}
      <Modal
        open={selectedVet !== null}
        onClose={() => setSelectedVet(null)}
        title={
          selectedVet
            ? `Book appointment with ${selectedVet.fullName}`
            : "Book appointment"
        }
      >
        <form
          onSubmit={handleSubmit((v) => bookMutation.mutate(v))}
          className="space-y-4"
          noValidate
        >
          <Input
            label="Date and time"
            type="datetime-local"
            error={errors.scheduledAt?.message}
            {...register("scheduledAt")}
          />
          <Input
            label="Animal description / Tag (optional)"
            placeholder="e.g. 2nd lactation Gir cow, ear tag #402"
            error={errors.animalDescription?.message}
            {...register("animalDescription")}
          />
          <Textarea
            label="Symptoms or consultation notes"
            placeholder="Describe what's wrong or what services you need (vaccination, health check, pregnancy diagnosis)..."
            error={errors.notes?.message}
            {...register("notes")}
          />

          <div className="flex justify-end gap-2 pt-2">
            <Button
              variant="outline"
              type="button"
              onClick={() => setSelectedVet(null)}
            >
              Cancel
            </Button>
            <Button type="submit" loading={bookMutation.isPending}>
              Confirm booking
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
