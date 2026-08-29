import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import toast from "react-hot-toast";
import { Wheat, Plus, Trash2, Edit2 } from "lucide-react";
import { cropsApi } from "@/api/endpoints/crops";
import { qk } from "@/api/queryKeys";
import type { CropRequest, CropResponse, CropStatus } from "@/api/types";
import { formatDate } from "@/lib/format";
import { Card } from "@/components/ui/Card";
import { Badge, type Tone } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { Textarea } from "@/components/ui/Textarea";
import { Modal } from "@/components/ui/Modal";
import { Skeleton } from "@/components/ui/Skeleton";
import { EmptyState } from "@/components/feedback/EmptyState";
import { ErrorState } from "@/components/feedback/ErrorState";

const CROP_STATUS_OPTIONS: { value: CropStatus; label: string }[] = [
  { value: "PLANNED", label: "Planned" },
  { value: "GROWING", label: "Growing" },
  { value: "READY_TO_HARVEST", label: "Ready to Harvest" },
  { value: "HARVESTED", label: "Harvested" },
  { value: "FAILED", label: "Failed" },
];

const STATUS_TONES: Record<CropStatus, Tone> = {
  PLANNED: "neutral",
  GROWING: "info",
  READY_TO_HARVEST: "warning",
  HARVESTED: "success",
  FAILED: "danger",
};

const schema = z.object({
  cropName: z.string().min(1, "Crop name is required"),
  variety: z.string().optional(),
  fieldAreaAcres: z.coerce
    .number()
    .positive("Area must be positive")
    .optional(),
  sowingDate: z.string().optional(),
  expectedHarvestDate: z.string().optional(),
  status: z
    .enum(["PLANNED", "GROWING", "READY_TO_HARVEST", "HARVESTED", "FAILED"])
    .optional(),
  expectedYieldKg: z.coerce.number().positive().optional(),
  notes: z.string().optional(),
});
type FormInput = z.input<typeof schema>;
type FormOutput = z.output<typeof schema>;

export function CropManagement() {
  const queryClient = useQueryClient();
  const [modalOpen, setModalOpen] = useState(false);
  const [editingCrop, setEditingCrop] = useState<CropResponse | null>(null);
  const [deletingId, setDeletingId] = useState<number | null>(null);

  const {
    data: crops,
    isLoading,
    isError,
    error,
    refetch,
  } = useQuery({
    queryKey: qk.myCrops(),
    queryFn: cropsApi.mine,
  });

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<FormInput, unknown, FormOutput>({
    resolver: zodResolver(schema),
  });

  function openCreate() {
    setEditingCrop(null);
    reset({
      cropName: "",
      variety: "",
      fieldAreaAcres: undefined,
      sowingDate: "",
      expectedHarvestDate: "",
      status: "PLANNED",
      expectedYieldKg: undefined,
      notes: "",
    });
    setModalOpen(true);
  }

  function openEdit(crop: CropResponse) {
    setEditingCrop(crop);
    reset({
      cropName: crop.cropName,
      variety: crop.variety ?? "",
      fieldAreaAcres: crop.fieldAreaAcres ?? undefined,
      sowingDate: crop.sowingDate ? crop.sowingDate.split("T")[0] : "",
      expectedHarvestDate: crop.expectedHarvestDate
        ? crop.expectedHarvestDate.split("T")[0]
        : "",
      status: crop.status ?? "PLANNED",
      expectedYieldKg: crop.expectedYieldKg ?? undefined,
      notes: crop.notes ?? "",
    });
    setModalOpen(true);
  }

  const saveMutation = useMutation({
    mutationFn: (values: FormOutput) => {
      const payload: CropRequest = {
        ...values,
        fieldAreaAcres: values.fieldAreaAcres || undefined,
        expectedYieldKg: values.expectedYieldKg || undefined,
      };
      return editingCrop
        ? cropsApi.update(editingCrop.id, payload)
        : cropsApi.create(payload);
    },
    onSuccess: () => {
      toast.success(editingCrop ? "Crop updated successfully." : "Crop added successfully.");
      setModalOpen(false);
      void queryClient.invalidateQueries({ queryKey: qk.myCrops() });
      void queryClient.invalidateQueries({ queryKey: qk.farmerAnalytics() });
    },
    onError: () => toast.error("Couldn't save crop. Please try again."),
  });

  const deleteMutation = useMutation({
    mutationFn: cropsApi.remove,
    onSuccess: () => {
      toast.success("Crop deleted successfully.");
      setDeletingId(null);
      void queryClient.invalidateQueries({ queryKey: qk.myCrops() });
      void queryClient.invalidateQueries({ queryKey: qk.farmerAnalytics() });
    },
    onError: () => toast.error("Couldn't delete crop. Please try again."),
  });

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-ink-900">
            Crop management
          </h1>
          <p className="mt-1 text-ink-500">
            Track current sowings, growth status and expected harvests.
          </p>
        </div>
        <Button onClick={openCreate}>
          <Plus className="size-4" aria-hidden="true" /> Add crop
        </Button>
      </div>

      <div className="mt-6">
        {isLoading && (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {Array.from({ length: 3 }).map((_, i) => (
              <Skeleton key={i} className="h-48 w-full" />
            ))}
          </div>
        )}

        {isError && <ErrorState error={error} onRetry={() => void refetch()} />}

        {!isLoading && !isError && crops?.length === 0 && (
          <EmptyState
            icon={Wheat}
            title="No crops recorded yet"
            description="Add your crops to track growth, schedule harvests and analyze yields."
            action={<Button onClick={openCreate}>Add your first crop</Button>}
          />
        )}

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {crops?.map((crop) => {
            const status = crop.status ?? "PLANNED";
            return (
              <Card
                key={crop.id}
                className="flex flex-col justify-between p-5"
              >
                <div>
                  <div className="flex items-start justify-between gap-2">
                    <h2 className="text-lg font-semibold text-ink-900">
                      {crop.cropName}
                    </h2>
                    <Badge tone={STATUS_TONES[status]}>
                      {CROP_STATUS_OPTIONS.find((s) => s.value === status)
                        ?.label ?? status}
                    </Badge>
                  </div>
                  {crop.variety && (
                    <p className="mt-1 text-sm text-ink-500">
                      Variety: {crop.variety}
                    </p>
                  )}

                  <dl className="mt-4 space-y-1 text-sm">
                    {crop.fieldAreaAcres && (
                      <div className="flex justify-between">
                        <dt className="text-ink-500">Field area</dt>
                        <dd className="numeric text-ink-900">
                          {crop.fieldAreaAcres} acres
                        </dd>
                      </div>
                    )}
                    {crop.sowingDate && (
                      <div className="flex justify-between">
                        <dt className="text-ink-500">Sown on</dt>
                        <dd className="text-ink-900">
                          {formatDate(crop.sowingDate)}
                        </dd>
                      </div>
                    )}
                    {crop.expectedHarvestDate && (
                      <div className="flex justify-between">
                        <dt className="text-ink-500">Expected harvest</dt>
                        <dd className="text-ink-900">
                          {formatDate(crop.expectedHarvestDate)}
                        </dd>
                      </div>
                    )}
                    {crop.expectedYieldKg && (
                      <div className="flex justify-between">
                        <dt className="text-ink-500">Expected yield</dt>
                        <dd className="numeric text-ink-900">
                          {crop.expectedYieldKg} kg
                        </dd>
                      </div>
                    )}
                  </dl>

                  {crop.notes && (
                    <p className="mt-3 border-t border-border pt-3 text-xs text-ink-600">
                      {crop.notes}
                    </p>
                  )}
                </div>

                <div className="mt-5 flex justify-end gap-2 border-t border-border pt-3">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => openEdit(crop)}
                  >
                    <Edit2 className="size-4" aria-hidden="true" /> Edit
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-danger-700 hover:bg-danger-50"
                    onClick={() => setDeletingId(crop.id)}
                  >
                    <Trash2 className="size-4" aria-hidden="true" /> Delete
                  </Button>
                </div>
              </Card>
            );
          })}
        </div>
      </div>

      {/* Create / Edit Modal */}
      <Modal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editingCrop ? "Edit crop" : "Add crop"}
      >
        <form
          onSubmit={handleSubmit((v) => saveMutation.mutate(v))}
          className="space-y-4"
          noValidate
        >
          <Input
            label="Crop name"
            error={errors.cropName?.message}
            {...register("cropName")}
          />
          <Input
            label="Variety (optional)"
            placeholder="e.g. Sona Masoori"
            {...register("variety")}
          />

          <div className="grid gap-4 sm:grid-cols-2">
            <Input
              label="Field area (acres)"
              type="number"
              step="0.1"
              error={errors.fieldAreaAcres?.message}
              {...register("fieldAreaAcres")}
            />
            <Select
              label="Status"
              options={CROP_STATUS_OPTIONS}
              error={errors.status?.message}
              {...register("status")}
            />
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <Input
              label="Sowing date"
              type="date"
              {...register("sowingDate")}
            />
            <Input
              label="Expected harvest date"
              type="date"
              {...register("expectedHarvestDate")}
            />
          </div>

          <Input
            label="Expected yield (kg)"
            type="number"
            error={errors.expectedYieldKg?.message}
            {...register("expectedYieldKg")}
          />

          <Textarea
            label="Notes (optional)"
            placeholder="Fertilizer applied, water schedule, etc."
            {...register("notes")}
          />

          <div className="flex justify-end gap-2 pt-2">
            <Button
              variant="outline"
              type="button"
              onClick={() => setModalOpen(false)}
            >
              Cancel
            </Button>
            <Button type="submit" loading={saveMutation.isPending}>
              {editingCrop ? "Save changes" : "Add crop"}
            </Button>
          </div>
        </form>
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal
        open={deletingId !== null}
        onClose={() => setDeletingId(null)}
        title="Delete this crop?"
        footer={
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setDeletingId(null)}>
              Keep
            </Button>
            <Button
              variant="danger"
              loading={deleteMutation.isPending}
              onClick={() => deletingId && deleteMutation.mutate(deletingId)}
            >
              Yes, delete
            </Button>
          </div>
        }
      >
        <p className="text-sm text-ink-700">
          This record will be permanently deleted from your farm records.
        </p>
      </Modal>
    </div>
  );
}
