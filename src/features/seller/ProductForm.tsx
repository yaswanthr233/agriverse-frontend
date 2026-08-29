import { useEffect } from "react";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useNavigate, useParams } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import toast from "react-hot-toast";
import { productsApi } from "@/api/endpoints/products";
import { qk } from "@/api/queryKeys";
import { PRODUCT_CATEGORIES } from "@/lib/categories";
import { ApiError } from "@/api/client";
import type { ProductRequest } from "@/api/types";
import { Card } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { Textarea } from "@/components/ui/Textarea";
import { Button } from "@/components/ui/Button";
import { Skeleton } from "@/components/ui/Skeleton";
import { ImageUploader } from "@/components/ui/ImageUploader";

const schema = z.object({
  name: z.string().min(1, "Product name is required"),
  description: z.string().optional(),
  price: z.coerce.number().min(0.01, "Price must be greater than zero"),
  category: z.enum([
    "SEEDS",
    "FERTILIZERS",
    "PESTICIDES",
    "TOOLS_EQUIPMENT",
    "IRRIGATION",
    "ANIMAL_FEED",
    "ORGANIC",
    "MACHINERY",
    "OTHER",
  ]),
  stock: z.coerce.number().int().min(0, "Stock cannot be negative"),
  unit: z.string().min(1, "Unit is required"),
  imageUrl: z
    .string()
    .url("Enter a valid image URL")
    .optional()
    .or(z.literal("")),
  brand: z.string().optional(),
  isActive: z.boolean(),
});
type FormInput = z.input<typeof schema>;
type FormOutput = z.output<typeof schema>;

export function ProductForm() {
  const { id } = useParams();
  const isEdit = Boolean(id);
  const productId = Number(id);
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const { data: existing, isLoading } = useQuery({
    queryKey: qk.product(productId),
    queryFn: () => productsApi.byId(productId),
    enabled: isEdit && Number.isFinite(productId),
  });

  const {
    register,
    handleSubmit,
    reset,
    setError,
    control,
    formState: { errors },
  } = useForm<FormInput, unknown, FormOutput>({
    resolver: zodResolver(schema),
    defaultValues: {
      category: "SEEDS",
      stock: 0,
      unit: "piece",
      isActive: true,
      imageUrl: "",
    },
  });

  useEffect(() => {
    if (existing) {
      reset({
        name: existing.name,
        description: existing.description ?? "",
        price: existing.price,
        category: existing.category,
        stock: existing.stock,
        unit: existing.unit,
        imageUrl: existing.imageUrl ?? "",
        brand: existing.brand ?? "",
        isActive: existing.isActive,
      });
    }
  }, [existing, reset]);

  const save = useMutation({
    mutationFn: (body: FormOutput) => {
      const payload: ProductRequest = {
        name: body.name,
        description: body.description || undefined,
        price: body.price,
        category: body.category,
        stock: body.stock,
        unit: body.unit,
        imageUrl: body.imageUrl || undefined,
        brand: body.brand || undefined,
        isActive: body.isActive,
      };
      return isEdit
        ? productsApi.update(productId, payload)
        : productsApi.create(payload);
    },
    onSuccess: () => {
      toast.success(isEdit ? "Product updated" : "Product created");
      void queryClient.invalidateQueries({ queryKey: qk.myProducts() });
      navigate("/seller/products");
    },
    onError: (err) => {
      if (err instanceof ApiError && err.errors?.length) {
        err.errors.forEach((e) =>
          setError(e.field as keyof FormInput, { message: e.message }),
        );
        return;
      }
      toast.error(
        err instanceof ApiError ? err.message : "Couldn't save the product.",
      );
    },
  });

  if (isEdit && isLoading) return <Skeleton className="h-96 w-full" />;

  return (
    <div className="max-w-2xl">
      <h1 className="text-2xl font-semibold text-ink-900">
        {isEdit ? "Edit product" : "Add a product"}
      </h1>

      <Card className="mt-6 p-6">
        <form
          onSubmit={handleSubmit((v) => save.mutate(v))}
          className="space-y-5"
          noValidate
        >
          <Input
            label="Product name"
            error={errors.name?.message}
            {...register("name")}
          />

          <Textarea
            label="Description"
            error={errors.description?.message}
            {...register("description")}
          />

          <div className="grid gap-4 sm:grid-cols-2">
            <Input
              label="Price (₹)"
              type="number"
              step="0.01"
              error={errors.price?.message}
              {...register("price")}
            />
            <Select
              label="Category"
              options={PRODUCT_CATEGORIES}
              error={errors.category?.message}
              {...register("category")}
            />
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <Input
              label="Stock"
              type="number"
              error={errors.stock?.message}
              {...register("stock")}
            />
            <Input
              label="Unit"
              placeholder="kg, piece, litre"
              error={errors.unit?.message}
              {...register("unit")}
            />
          </div>

          <Input label="Brand (optional)" {...register("brand")} />

          {/* Reusable Image Uploader Component (Upload Image OR Image URL) */}
          <Controller
            name="imageUrl"
            control={control}
            render={({ field }) => (
              <ImageUploader
                label="Product Image"
                value={field.value}
                onChange={field.onChange}
                error={errors.imageUrl?.message}
                folder="products"
                hint="Upload a product photo or provide an image link (JPG, PNG, WebP up to 5 MB)"
              />
            )}
          />

          <label className="flex items-center gap-2 text-sm text-ink-700 pt-2">
            <input
              type="checkbox"
              className="size-4 rounded border-border"
              {...register("isActive")}
            />
            Listing is active and visible to buyers
          </label>

          <div className="flex gap-2 pt-2">
            <Button type="submit" size="lg" loading={save.isPending}>
              {isEdit ? "Save changes" : "Create product"}
            </Button>
            <Button
              type="button"
              variant="outline"
              size="lg"
              onClick={() => navigate("/seller/products")}
            >
              Cancel
            </Button>
          </div>
        </form>
      </Card>
    </div>
  );
}
