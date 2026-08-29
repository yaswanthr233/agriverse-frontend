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
  XCircle,
  CheckCircle2,
  Navigation,
  ExternalLink,
  RotateCw,
  Trash2,
  AlertCircle,
} from "lucide-react";
import { vetsApi } from "@/api/endpoints/vets";
import { qk } from "@/api/queryKeys";
import type { AppointmentRequest, VetDirectoryResponse } from "@/api/types";
import { formatDateTime } from "@/lib/format";
import { getCurrentGpsLocation, getGoogleMapsUrl, type GpsLocationResult } from "@/lib/location";
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
  const [cancellingApptId, setCancellingApptId] = useState<number | null>(null);
  const [cancelReason, setCancelReason] = useState("");

  // Location State
  const [gpsLocation, setGpsLocation] = useState<GpsLocationResult | null>(null);
  const [isLocating, setIsLocating] = useState(false);
  const [locationError, setLocationError] = useState<string | null>(null);
  const [isManualLocation, setIsManualLocation] = useState(false);
  const [manualAddress, setManualAddress] = useState("");

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

  async function handleCaptureLocation() {
    setIsLocating(true);
    setLocationError(null);
    try {
      const loc = await getCurrentGpsLocation();
      setGpsLocation(loc);
      setIsManualLocation(false);
      toast.success("Current farm location captured successfully!");
    } catch (err: any) {
      const msg = err?.message || "Failed to obtain current GPS location.";
      setLocationError(msg);
      toast.error(msg);
    } finally {
      setIsLocating(false);
    }
  }

  function handleClearLocation() {
    setGpsLocation(null);
    setManualAddress("");
    setLocationError(null);
    setIsManualLocation(false);
  }

  const bookMutation = useMutation({
    mutationFn: (values: FormOutput) => {
      if (!selectedVet) throw new Error("No vet selected");

      const hasGps = gpsLocation && gpsLocation.latitude != null && gpsLocation.longitude != null;
      const hasManual = isManualLocation && manualAddress.trim().length > 0;

      const payload: AppointmentRequest = {
        vetId: selectedVet.id,
        scheduledAt: values.scheduledAt,
        animalDescription: values.animalDescription || undefined,
        notes: values.notes || undefined,
        locationLatitude: hasGps ? gpsLocation.latitude : undefined,
        locationLongitude: hasGps ? gpsLocation.longitude : undefined,
        locationAddress: hasGps
          ? gpsLocation.address || undefined
          : hasManual
            ? manualAddress.trim()
            : undefined,
      };

      return vetsApi.book(payload);
    },
    onSuccess: () => {
      toast.success("Appointment request booked successfully");
      setSelectedVet(null);
      handleClearLocation();
      reset();
      void queryClient.invalidateQueries({ queryKey: qk.myAppointments() });
    },
    onError: (err: any) => {
      const msg = err?.response?.data?.message || err?.message || "Couldn't book appointment.";
      toast.error(msg);
    },
  });

  const cancelMutation = useMutation({
    mutationFn: ({ id, reason }: { id: number; reason?: string }) =>
      vetsApi.cancel(id, reason),
    onSuccess: () => {
      toast.success("Appointment cancelled");
      setCancellingApptId(null);
      setCancelReason("");
      void queryClient.invalidateQueries({ queryKey: qk.myAppointments() });
    },
    onError: (err: any) => {
      const msg = err?.response?.data?.message || err?.message || "Couldn't cancel appointment.";
      toast.error(msg);
    },
  });

  const vets = directoryQuery.data ?? [];
  const appointments = appointmentsQuery.data ?? [];

  return (
    <div className="space-y-10">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-ink-900">
          Veterinary Consultation & Appointments
        </h1>
        <p className="mt-1 text-sm text-ink-500">
          Book on-farm and digital consultations with verified veterinary doctors for cattle, livestock, and poultry care.
        </p>
      </div>

      {/* Vet Directory Section */}
      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold text-ink-900">
            Available Verified Veterinarians
          </h2>
          <Badge tone="neutral">{vets.length} Active Specialists</Badge>
        </div>

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
              title="No veterinarians are currently available"
              description="No registered veterinary specialists were found in your region. Check back shortly as new doctors are onboarded."
            />
          )}

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {vets.map((vet) => (
            <Card key={vet.id} className="flex flex-col justify-between p-5 hover:border-primary-400 transition-colors">
              <div>
                <div className="flex items-center gap-3">
                  <div className="flex size-11 items-center justify-center rounded-full bg-primary-100 text-primary-700 font-bold">
                    <Stethoscope className="size-5" aria-hidden="true" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-ink-900 text-base">
                      Dr. {vet.fullName}
                    </h3>
                    <p className="flex items-center gap-1 text-xs text-ink-500 mt-0.5">
                      <MapPin className="size-3 text-primary-600" aria-hidden="true" />
                      {vet.city || "Andhra Pradesh"}, {vet.state || "India"}
                    </p>
                  </div>
                </div>

                <div className="mt-4 space-y-1.5 text-xs text-ink-600 border-t border-border pt-3">
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

              <div className="mt-5 pt-3">
                <Button
                  className="w-full gap-2 shadow-xs"
                  size="sm"
                  onClick={() => {
                    reset();
                    handleClearLocation();
                    setSelectedVet(vet);
                  }}
                >
                  <Calendar className="size-4" aria-hidden="true" /> Book Consultation
                </Button>
              </div>
            </Card>
          ))}
        </div>
      </section>

      {/* My Appointments Section */}
      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold text-ink-900">My Consultation History</h2>
          <Badge tone="neutral">{appointments.length} Total</Badge>
        </div>

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
              You have no booked veterinary appointments. Select a doctor above to request a consultation.
            </Card>
          )}

        <div className="space-y-3">
          {appointments.map((appt) => {
            const mapsUrl = appt.googleMapsUrl || getGoogleMapsUrl(appt.locationLatitude, appt.locationLongitude);
            return (
              <Card
                key={appt.id}
                className="flex flex-wrap items-center justify-between gap-4 p-5"
              >
                <div className="space-y-1.5 flex-1 min-w-[240px]">
                  <div className="flex items-center gap-2.5">
                    <span className="font-bold text-ink-900">
                      Dr. {appt.vetName}
                    </span>
                    <Badge
                      tone={
                        appt.status === "CONFIRMED"
                          ? "success"
                          : appt.status === "CANCELLED"
                            ? "danger"
                            : appt.status === "COMPLETED"
                              ? "primary"
                              : "warning"
                      }
                    >
                      {appt.status}
                    </Badge>
                  </div>
                  <p className="flex items-center gap-1.5 text-xs text-ink-500">
                    <Clock className="size-3.5 text-ink-400" aria-hidden="true" />
                    Scheduled for: <strong className="text-ink-700">{formatDateTime(appt.scheduledAt)}</strong>
                  </p>
                  {appt.animalDescription && (
                    <p className="text-xs text-ink-700">
                      <span className="font-semibold text-ink-500">Animal / Case:</span> {appt.animalDescription}
                    </p>
                  )}

                  {/* Visit Location Info */}
                  <div className="rounded-lg bg-surface-sunk p-2.5 text-xs text-ink-700 space-y-1 mt-1">
                    <div className="flex items-center justify-between">
                      <span className="font-semibold text-ink-800 flex items-center gap-1">
                        <MapPin className="size-3.5 text-primary-600" /> Visit Location:
                      </span>
                      {mapsUrl && (
                        <a
                          href={mapsUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-primary-700 hover:text-primary-800 font-medium inline-flex items-center gap-1 text-[11px]"
                        >
                          View on Map <ExternalLink className="size-3" />
                        </a>
                      )}
                    </div>
                    <p className="text-ink-600 text-[11px]">
                      {appt.locationAddress
                        ? appt.locationAddress
                        : appt.locationLatitude != null && appt.locationLongitude != null
                          ? `GPS Coordinates: ${appt.locationLatitude.toFixed(5)}, ${appt.locationLongitude.toFixed(5)}`
                          : "Location not specified for this visit."}
                    </p>
                  </div>

                  {appt.notes && (
                    <p className="text-xs text-ink-600">
                      <span className="font-semibold text-ink-500">My Note:</span> {appt.notes}
                    </p>
                  )}
                  {appt.vetNotes && (
                    <p className="mt-1 rounded border border-primary-100 bg-primary-50/60 px-3 py-1.5 text-xs text-primary-900">
                      <strong>Doctor's Prescription / Note:</strong> {appt.vetNotes}
                    </p>
                  )}
                </div>

                <div className="flex items-center gap-3">
                  {appt.status === "PENDING" && (
                    <Button
                      variant="outline"
                      size="sm"
                      className="text-danger-700 border-danger-200 hover:bg-danger-50 text-xs"
                      onClick={() => setCancellingApptId(appt.id)}
                    >
                      <XCircle className="size-3.5 mr-1" /> Cancel
                    </Button>
                  )}
                  <span className="text-xs text-ink-400">
                    Ref #{appt.id}
                  </span>
                </div>
              </Card>
            );
          })}
        </div>
      </section>

      {/* Book Appointment Modal */}
      <Modal
        open={selectedVet !== null}
        onClose={() => {
          setSelectedVet(null);
          handleClearLocation();
        }}
        title={
          selectedVet
            ? `Book Consultation with Dr. ${selectedVet.fullName}`
            : "Book Consultation"
        }
      >
        <form
          onSubmit={handleSubmit((v) => bookMutation.mutate(v))}
          className="space-y-4"
          noValidate
        >
          <Input
            label="Date and Time"
            type="datetime-local"
            error={errors.scheduledAt?.message}
            {...register("scheduledAt")}
          />
          <Input
            label="Animal Description / Tag"
            placeholder="e.g. 2nd lactation Gir cow, ear tag #402 / 50 Broiler chickens"
            error={errors.animalDescription?.message}
            {...register("animalDescription")}
          />
          <Textarea
            label="Symptoms or Reason for Consultation"
            placeholder="Describe symptoms, vaccination needs, or breeding advice requested..."
            error={errors.notes?.message}
            {...register("notes")}
          />

          {/* Visit Location Section */}
          <div className="rounded-lg border border-border bg-surface-sunk p-3.5 space-y-2.5">
            <div className="flex items-center justify-between">
              <label className="block text-xs font-semibold uppercase tracking-wider text-ink-700">
                Farm / Visit Location
              </label>
              <button
                type="button"
                className="text-[11px] text-primary-700 hover:underline"
                onClick={() => setIsManualLocation(!isManualLocation)}
              >
                {isManualLocation ? "Use GPS Location" : "Enter Manually"}
              </button>
            </div>
            <p className="text-xs text-ink-500">
              Share your exact location so the veterinarian can navigate directly to your farm.
            </p>

            {!isManualLocation ? (
              <div className="space-y-2">
                {!gpsLocation ? (
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="w-full gap-2 border-primary-300 text-primary-700 hover:bg-primary-50"
                    loading={isLocating}
                    onClick={handleCaptureLocation}
                  >
                    <Navigation className="size-4 text-primary-600" />
                    {isLocating ? "Getting your location..." : "Use Current Location (GPS)"}
                  </Button>
                ) : (
                  <div className="rounded-md border border-success-200 bg-success-50/60 p-3 text-xs space-y-1.5">
                    <div className="flex items-center justify-between text-success-900 font-semibold">
                      <span className="flex items-center gap-1.5">
                        <CheckCircle2 className="size-4 text-success-600" /> Current Location Detected
                      </span>
                      <div className="flex items-center gap-1">
                        <button
                          type="button"
                          onClick={handleCaptureLocation}
                          disabled={isLocating}
                          className="text-primary-700 hover:text-primary-800 p-1"
                          title="Update Location"
                        >
                          <RotateCw className="size-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={handleClearLocation}
                          className="text-danger-600 hover:text-danger-700 p-1"
                          title="Clear Location"
                        >
                          <Trash2 className="size-3.5" />
                        </button>
                      </div>
                    </div>
                    <div className="text-[11px] text-ink-700 space-y-0.5">
                      <p><strong>GPS:</strong> {gpsLocation.latitude.toFixed(6)}, {gpsLocation.longitude.toFixed(6)}</p>
                      {gpsLocation.address && (
                        <p><strong>Address:</strong> {gpsLocation.address}</p>
                      )}
                    </div>
                  </div>
                )}

                {locationError && (
                  <p className="text-xs text-danger-600 flex items-center gap-1">
                    <AlertCircle className="size-3.5" /> {locationError}
                  </p>
                )}
              </div>
            ) : (
              <div className="space-y-2">
                <Textarea
                  label="Manual Farm Address / Landmark"
                  placeholder="Enter farm address, landmark, village, or taluk..."
                  value={manualAddress}
                  onChange={(e) => setManualAddress(e.target.value)}
                  rows={2}
                />
              </div>
            )}
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <Button
              variant="outline"
              type="button"
              onClick={() => {
                setSelectedVet(null);
                handleClearLocation();
              }}
            >
              Cancel
            </Button>
            <Button type="submit" loading={bookMutation.isPending}>
              Confirm Booking
            </Button>
          </div>
        </form>
      </Modal>

      {/* Farmer Cancel Modal */}
      <Modal
        open={cancellingApptId !== null}
        onClose={() => setCancellingApptId(null)}
        title="Cancel Appointment Request"
      >
        <div className="space-y-4">
          <p className="text-sm text-ink-600">
            Are you sure you want to cancel this veterinary appointment? The doctor will be notified.
          </p>
          <Input
            label="Reason for cancellation (optional)"
            placeholder="e.g. Animal recovered, schedule conflict..."
            value={cancelReason}
            onChange={(e) => setCancelReason(e.target.value)}
          />
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="outline" onClick={() => setCancellingApptId(null)}>
              Keep Appointment
            </Button>
            <Button
              variant="primary"
              className="bg-danger-600 hover:bg-danger-700 text-white"
              loading={cancelMutation.isPending}
              onClick={() => {
                if (cancellingApptId) {
                  cancelMutation.mutate({ id: cancellingApptId, reason: cancelReason });
                }
              }}
            >
              Confirm Cancellation
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
