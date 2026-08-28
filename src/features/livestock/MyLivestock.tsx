import { useState } from "react";
import { useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import toast from "react-hot-toast";
import { Beef, Plus, Trash2, Edit2, ImageOff } from "lucide-react";
import { livestockApi } from "@/api/endpoints/livestock";
import { qk } from "@/api/queryKeys";
import type { LivestockRequest, LivestockResponse } from "@/api/types";
import { formatCurrency } from "@/lib/format";
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
  name: z.string().min(1, "Animal name is required"),
  breed: z.string().min(1, "Breed is required"),
  age: z.string().optional(),
  weightKg: z.coerce.number().positive().optional(),
  healthStatus: z.string().optional(),
  milkYield: z.string().optional(),
  vaccinated: z.boolean().optional(),
  certified: z.boolean().optional(),
  forSale: z.boolean().optional(),
  price: z.coerce.number().positive().optional(),
  location: z.string().optional(),
  imageUrl: z.string().url("Enter a valid URL").optional().or(z.literal("")),
  notes: z.string().optional(),
});
type FormInput = z.input<typeof schema>;
type FormOutput = z.output<typeof schema>;

export function MyLivestock() {
  const queryClient = useQueryClient();
  const [modalOpen, setModalOpen] = useState(false);
  const [editingAnimal, setEditingAnimal] =
    useState<LivestockResponse | null>(null);
  const [deletingId, setDeletingId] = useState<number | null>(null);

  const {
    data: animals,
    isLoading,
    isError,
    error,
    refetch,
  } = useQuery({
    queryKey: qk.myLivestock(),
    queryFn: livestockApi.mine,
  });

  const {
    register,
    handleSubmit,
    reset,
    control,
    formState: { errors },
  } = useForm<FormInput, unknown, FormOutput>({
    resolver: zodResolver(schema),
  });

  const watchForSale = useWatch({ control, name: "forSale" });

  function openCreate() {
    setEditingAnimal(null);
    reset({
      name: "",
      breed: "",
      age: "",
      weightKg: undefined,
      healthStatus: "Healthy",
      milkYield: "",
      vaccinated: false,
      certified: false,
      forSale: false,
      price: undefined,
      location: "",
      imageUrl: "",
      notes: "",
    });
    setModalOpen(true);
  }

  function openEdit(animal: LivestockResponse) {
    setEditingAnimal(animal);
    reset({
      name: animal.name,
      breed: animal.breed,
      age: animal.age ?? "",
      weightKg: animal.weightKg ?? undefined,
      healthStatus: animal.healthStatus ?? "Healthy",
      milkYield: animal.milkYield ?? "",
      vaccinated: animal.vaccinated ?? false,
      certified: animal.certified ?? false,
      forSale: animal.forSale ?? false,
      price: animal.price ?? undefined,
      location: animal.location ?? "",
      imageUrl: animal.imageUrl ?? "",
      notes: animal.notes ?? "",
    });
    setModalOpen(true);
  }

  const saveMutation = useMutation({
    mutationFn: (values: FormOutput) => {
      const payload: LivestockRequest = {
        ...values,
        weightKg: values.weightKg || undefined,
        price: values.price || undefined,
        imageUrl: values.imageUrl || undefined,
      };
      return editingAnimal
        ? livestockApi.update(editingAnimal.id, payload)
        : livestockApi.create(payload);
    },
    onSuccess: () => {
      toast.success(editingAnimal ? "Animal updated" : "Animal added");
      setModalOpen(false);
      void queryClient.invalidateQueries({ queryKey: qk.myLivestock() });
      void queryClient.invalidateQueries({ queryKey: ["livestock", "market"] });
    },
    onError: () => toast.error("Couldn't save animal."),
  });

  const deleteMutation = useMutation({
    mutationFn: livestockApi.remove,
    onSuccess: () => {
      toast.success("Animal removed");
      setDeletingId(null);
      void queryClient.invalidateQueries({ queryKey: qk.myLivestock() });
      void queryClient.invalidateQueries({ queryKey: ["livestock", "market"] });
    },
    onError: () => toast.error("Couldn't delete animal."),
  });

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-ink-900">
            Livestock management
          </h1>
          <p className="mt-1 text-ink-500">
            Manage your herd, track health records and list animals for sale.
          </p>
        </div>
        <Button onClick={openCreate}>
          <Plus className="size-4" aria-hidden="true" /> Add animal
        </Button>
      </div>

      <div className="mt-6">
        {isLoading && (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {Array.from({ length: 3 }).map((_, i) => (
              <Skeleton key={i} className="h-56 w-full" />
            ))}
          </div>
        )}

        {isError && <ErrorState error={error} onRetry={() => void refetch()} />}

        {!isLoading && !isError && animals?.length === 0 && (
          <EmptyState
            icon={Beef}
            title="No animals recorded yet"
            description="Add cattle, poultry or other livestock to track vaccinations and health."
            action={<Button onClick={openCreate}>Add your first animal</Button>}
          />
        )}

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {animals?.map((animal) => (
            <Card
              key={animal.id}
              className="flex flex-col justify-between overflow-hidden"
            >
              <div>
                <div className="flex aspect-video items-center justify-center bg-surface-sunk">
                  {animal.imageUrl ? (
                    <img
                      src={animal.imageUrl}
                      alt={animal.name}
                      className="size-full object-cover"
                    />
                  ) : (
                    <ImageOff
                      className="size-8 text-ink-400"
                      aria-hidden="true"
                    />
                  )}
                </div>

                <div className="p-5">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <h2 className="text-lg font-semibold text-ink-900">
                        {animal.name}
                      </h2>
                      <p className="text-sm text-ink-500">{animal.breed}</p>
                    </div>
                    {animal.forSale && (
                      <Badge tone="warning">Listed for sale</Badge>
                    )}
                  </div>

                  <div className="mt-3 flex flex-wrap gap-1.5">
                    {animal.healthStatus && (
                      <Badge tone="neutral">{animal.healthStatus}</Badge>
                    )}
                    {animal.vaccinated && (
                      <Badge tone="success">Vaccinated</Badge>
                    )}
                    {animal.certified && <Badge tone="info">Certified</Badge>}
                  </div>

                  <dl className="mt-4 space-y-1 text-sm">
                    {animal.age && (
                      <div className="flex justify-between">
                        <dt className="text-ink-500">Age</dt>
                        <dd className="text-ink-900">{animal.age}</dd>
                      </div>
                    )}
                    {animal.weightKg && (
                      <div className="flex justify-between">
                        <dt className="text-ink-500">Weight</dt>
                        <dd className="numeric text-ink-900">
                          {animal.weightKg} kg
                        </dd>
                      </div>
                    )}
                    {animal.milkYield && (
                      <div className="flex justify-between">
                        <dt className="text-ink-500">Milk yield</dt>
                        <dd className="text-ink-900">{animal.milkYield}</dd>
                      </div>
                    )}
                    {animal.forSale && animal.price && (
                      <div className="flex justify-between">
                        <dt className="text-ink-500">Asking price</dt>
                        <dd className="numeric font-semibold text-primary-700">
                          {formatCurrency(animal.price)}
                        </dd>
                      </div>
                    )}
                  </dl>

                  {animal.notes && (
                    <p className="mt-3 border-t border-border pt-3 text-xs text-ink-600">
                      {animal.notes}
                    </p>
                  )}
                </div>
              </div>

              <div className="flex justify-end gap-2 border-t border-border p-3">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => openEdit(animal)}
                >
                  <Edit2 className="size-4" aria-hidden="true" /> Edit
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-danger-700 hover:bg-danger-50"
                  onClick={() => setDeletingId(animal.id)}
                >
                  <Trash2 className="size-4" aria-hidden="true" /> Delete
                </Button>
              </div>
            </Card>
          ))}
        </div>
      </div>

      {/* Create / Edit Modal */}
      <Modal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editingAnimal ? "Edit animal" : "Add animal"}
      >
        <form
          onSubmit={handleSubmit((v) => saveMutation.mutate(v))}
          className="space-y-4"
          noValidate
        >
          <div className="grid gap-4 sm:grid-cols-2">
            <Input
              label="Name / Tag"
              placeholder="e.g. Ganga"
              error={errors.name?.message}
              {...register("name")}
            />
            <Input
              label="Breed"
              placeholder="e.g. Gir Cow"
              error={errors.breed?.message}
              {...register("breed")}
            />
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <Input
              label="Age"
              placeholder="e.g. 3 years"
              {...register("age")}
            />
            <Input
              label="Weight (kg)"
              type="number"
              error={errors.weightKg?.message}
              {...register("weightKg")}
            />
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <Input
              label="Health status"
              placeholder="e.g. Healthy"
              {...register("healthStatus")}
            />
            <Input
              label="Milk yield (optional)"
              placeholder="e.g. 12L / day"
              {...register("milkYield")}
            />
          </div>

          <div className="flex flex-wrap gap-4 border-y border-border py-3">
            <label className="flex items-center gap-2 text-sm text-ink-700">
              <input
                type="checkbox"
                className="size-4 rounded border-border"
                {...register("vaccinated")}
              />
              Vaccinated
            </label>
            <label className="flex items-center gap-2 text-sm text-ink-700">
              <input
                type="checkbox"
                className="size-4 rounded border-border"
                {...register("certified")}
              />
              Certified
            </label>
            <label className="flex items-center gap-2 text-sm text-ink-700">
              <input
                type="checkbox"
                className="size-4 rounded border-border"
                {...register("forSale")}
              />
              List for sale
            </label>
          </div>

          {watchForSale && (
            <div className="space-y-4 rounded-md bg-accent-50/50 p-3">
              <p className="text-xs text-ink-600 font-medium">
                ⚠️ This animal will be visible on the public livestock
                marketplace.
              </p>
              <div className="grid gap-4 sm:grid-cols-2">
                <Input
                  label="Asking price (₹)"
                  type="number"
                  error={errors.price?.message}
                  {...register("price")}
                />
                <Input
                  label="Location"
                  placeholder="e.g. Mandya, Karnataka"
                  {...register("location")}
                />
              </div>
            </div>
          )}

          <Input
            label="Photo URL (optional)"
            placeholder="https://…"
            error={errors.imageUrl?.message}
            {...register("imageUrl")}
          />
          <Textarea
            label="Notes (optional)"
            placeholder="Diet, pedigree, medical history, etc."
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
              {editingAnimal ? "Save changes" : "Add animal"}
            </Button>
          </div>
        </form>
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal
        open={deletingId !== null}
        onClose={() => setDeletingId(null)}
        title="Remove this animal?"
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
              Yes, remove
            </Button>
          </div>
        }
      >
        <p className="text-sm text-ink-700">
          This record will be permanently deleted from your herd.
        </p>
      </Modal>
    </div>
  );
}
