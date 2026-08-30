import { useEffect } from "react";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import toast from "react-hot-toast";
import { farmApi } from "@/api/endpoints/farm";
import { qk } from "@/api/queryKeys";
import { ApiError } from "@/api/client";
import { Card } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { Skeleton } from "@/components/ui/Skeleton";
import { ImageUploader } from "@/components/ui/ImageUploader";
import { ErrorState } from "@/components/feedback/ErrorState";

const schema = z.object({
  farmName: z.string().min(1, "Farm name is required"),
  village: z.string().optional(),
  district: z.string().min(1, "District is required"),
  state: z.string().min(1, "State is required"),
  totalAreaAcres: z.coerce
    .number()
    .positive("Area must be greater than zero")
    .optional(),
  primaryActivity: z.string().optional(),
  soilType: z.string().optional(),
  hasIrrigation: z.boolean().optional(),
  imageUrl: z.string().url("Enter a valid URL").optional().or(z.literal("")),
});
type FormInput = z.input<typeof schema>;
type FormOutput = z.output<typeof schema>;

import { useAuthStore } from "@/stores/authStore";

export function FarmProfile() {
  const queryClient = useQueryClient();
  const user = useAuthStore((s) => s.user);

  const {
    data: farm,
    isLoading,
    isError,
    error,
    refetch,
  } = useQuery({
    queryKey: qk.myFarm(),
    queryFn: farmApi.mine,
    retry: false,
  });

  const {
    register,
    handleSubmit,
    reset,
    control,
    formState: { errors },
  } = useForm<FormInput, unknown, FormOutput>({
    resolver: zodResolver(schema),
    defaultValues: {
      farmName: "",
      village: "",
      district: "",
      state: "",
      primaryActivity: "",
      soilType: "",
      hasIrrigation: false,
      imageUrl: "",
    },
  });

  useEffect(() => {
    if (isError && error) {
      console.error("MY FARM QUERY ERROR", error);
      console.error("MY FARM USER", user);
      console.error("MY FARM DATA", farm);
    }
  }, [isError, error, user, farm]);

  useEffect(() => {
    if (farm) {
      reset({
        farmName: farm.farmName || "",
        village: farm.village || "",
        district: farm.district || "",
        state: farm.state || "",
        totalAreaAcres: farm.totalAreaAcres ?? undefined,
        primaryActivity: farm.primaryActivity || "",
        soilType: farm.soilType || "",
        hasIrrigation: Boolean(farm.hasIrrigation),
        imageUrl: farm.imageUrl || "",
      });
    }
  }, [farm, reset]);

  const save = useMutation({
    mutationFn: farmApi.save,
    onSuccess: () => {
      toast.success("Farm profile saved successfully");
      void queryClient.invalidateQueries({ queryKey: qk.myFarm() });
      void queryClient.invalidateQueries({ queryKey: qk.farmerAnalytics() });
    },
    onError: (err) =>
      toast.error(
        err instanceof ApiError ? err.message : "Couldn't save your farm.",
      ),
  });

  if (isLoading) return <Skeleton className="h-96 w-full" />;

  if (isError && error instanceof ApiError && error.status !== 404) {
    return (
      <ErrorState
        error={error}
        title="Couldn't load farm profile."
        onRetry={() => void refetch()}
      />
    );
  }

  return (
    <div className="max-w-2xl">
      <h1 className="text-2xl font-semibold text-ink-900">
        {farm ? "Your farm" : "Create your farm profile"}
      </h1>
      <p className="mt-1 text-ink-500">
        {farm
          ? "Keep your farm details and specifications up to date."
          : "Set up your farm profile to unlock crops, expenses, and analytics."}
      </p>

      <Card className="mt-6 p-6">
        <form
          onSubmit={handleSubmit((v) => save.mutate(v))}
          className="space-y-4"
          noValidate
        >
          <Input
            label="Farm name"
            error={errors.farmName?.message}
            {...register("farmName")}
          />

          <div className="grid gap-4 sm:grid-cols-2">
            <Input label="Village (optional)" {...register("village")} />
            <Input
              label="District"
              error={errors.district?.message}
              {...register("district")}
            />
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <Input
              label="State"
              error={errors.state?.message}
              {...register("state")}
            />
            <Input
              label="Total area (acres)"
              type="number"
              step="0.1"
              error={errors.totalAreaAcres?.message}
              {...register("totalAreaAcres")}
            />
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <Input
              label="Primary activity (optional)"
              placeholder="e.g. Paddy cultivation"
              {...register("primaryActivity")}
            />
            <Input
              label="Soil type (optional)"
              placeholder="e.g. Black cotton soil"
              {...register("soilType")}
            />
          </div>

          <label className="flex items-center gap-2 text-sm text-ink-700">
            <input
              type="checkbox"
              className="size-4 rounded border-border"
              {...register("hasIrrigation")}
            />
            This farm has irrigation
          </label>

          <Controller
            name="imageUrl"
            control={control}
            render={({ field }) => (
              <ImageUploader
                label="Farm Image (optional)"
                value={field.value}
                onChange={field.onChange}
                error={errors.imageUrl?.message}
                folder="farms"
                hint="Upload a farm photo or provide an image link (JPG, PNG, WebP up to 5 MB)"
              />
            )}
          />

          <Button type="submit" size="lg" loading={save.isPending}>
            {farm ? "Save changes" : "Create farm profile"}
          </Button>
        </form>
      </Card>
    </div>
  );
}
