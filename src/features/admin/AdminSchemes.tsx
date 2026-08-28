import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import toast from "react-hot-toast";
import {
  Landmark,
  Plus,
  Star,
  Edit2,
  Trash2,
  ExternalLink,
} from "lucide-react";
import { adminSchemesApi } from "@/api/endpoints/adminSchemes";
import { qk } from "@/api/queryKeys";
import type { GovernmentScheme, SchemeRequest } from "@/api/types";
import { formatDate, formatEnum } from "@/lib/format";
import { cn } from "@/lib/cn";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { Table } from "@/components/ui/Table";
import { Modal } from "@/components/ui/Modal";
import { Skeleton } from "@/components/ui/Skeleton";
import { EmptyState } from "@/components/feedback/EmptyState";
import { ErrorState } from "@/components/feedback/ErrorState";

const ELIGIBILITY_RULES = [
  { value: "ALL_FARMERS", label: "All Farmers" },
  { value: "SMALL_MARGINAL", label: "Small & Marginal Farmers" },
  { value: "CLUSTER_ONLY", label: "Cluster Only" },
];

const schemeSchema = z.object({
  code: z.string().min(2, "Code must be at least 2 characters"),
  name: z.string().min(3, "Name is required"),
  category: z.string().min(2, "Category is required"),
  benefitAmount: z.string().min(1, "Benefit amount is required"),
  eligibilitySummary: z.string().min(5, "Eligibility summary is required"),
  eligibilityRule: z.enum(["ALL_FARMERS", "SMALL_MARGINAL", "CLUSTER_ONLY"]),
  deadline: z.string().min(1, "Deadline date is required"),
  portalUrl: z.string().url("Must be a valid URL").optional().or(z.literal("")),
  ministry: z.string().optional(),
  highlight: z.boolean(),
  description: z.string().optional(),
});

type SchemeFormData = z.infer<typeof schemeSchema>;

export function AdminSchemes() {
  const queryClient = useQueryClient();
  const [editingScheme, setEditingScheme] = useState<GovernmentScheme | null>(
    null,
  );
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState<GovernmentScheme | null>(
    null,
  );

  const {
    data: schemes,
    isLoading,
    isError,
    error,
    refetch,
  } = useQuery({
    queryKey: qk.adminSchemes(),
    queryFn: adminSchemesApi.list,
  });

  const {
    register,
    handleSubmit,
    reset,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<SchemeFormData>({
    resolver: zodResolver(schemeSchema),
    defaultValues: {
      code: "",
      name: "",
      category: "",
      benefitAmount: "",
      eligibilitySummary: "",
      eligibilityRule: "ALL_FARMERS",
      deadline: "",
      portalUrl: "",
      ministry: "",
      highlight: false,
      description: "",
    },
  });

  const createMutation = useMutation({
    mutationFn: (data: SchemeRequest) => adminSchemesApi.create(data),
    onSuccess: (newScheme) => {
      toast.success(`Scheme "${newScheme.code}" created successfully`);
      setIsCreateOpen(false);
      reset();
      void queryClient.invalidateQueries({ queryKey: qk.adminSchemes() });
      void queryClient.invalidateQueries({ queryKey: qk.schemes() });
    },
    onError: (err: any) => {
      const msg = err?.response?.data?.message || err?.message || "";
      if (
        msg.toLowerCase().includes("code") ||
        msg.toLowerCase().includes("duplicate") ||
        msg.toLowerCase().includes("exists")
      ) {
        setError("code", {
          message: "A scheme with this code already exists.",
        });
      } else {
        toast.error("Failed to create scheme. Please check your inputs.");
      }
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: number; data: SchemeRequest }) =>
      adminSchemesApi.update(id, data),
    onSuccess: (updated) => {
      toast.success(`Scheme "${updated.code}" updated successfully`);
      setEditingScheme(null);
      reset();
      void queryClient.invalidateQueries({ queryKey: qk.adminSchemes() });
      void queryClient.invalidateQueries({ queryKey: qk.schemes() });
    },
    onError: (err: any) => {
      const msg = err?.response?.data?.message || err?.message || "";
      if (
        msg.toLowerCase().includes("code") ||
        msg.toLowerCase().includes("duplicate") ||
        msg.toLowerCase().includes("exists")
      ) {
        setError("code", {
          message: "A scheme with this code already exists.",
        });
      } else {
        toast.error("Failed to update scheme.");
      }
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: number) => adminSchemesApi.remove(id),
    onSuccess: () => {
      toast.success("Scheme deleted successfully");
      setConfirmDelete(null);
      void queryClient.invalidateQueries({ queryKey: qk.adminSchemes() });
      void queryClient.invalidateQueries({ queryKey: qk.schemes() });
    },
    onError: () => toast.error("Couldn't delete scheme."),
  });

  const toggleHighlight = useMutation({
    mutationFn: ({ id, highlight }: { id: number; highlight: boolean }) =>
      adminSchemesApi.setHighlight(id, highlight),
    onSuccess: (updated) => {
      toast.success(
        `Scheme "${updated.code}" is now ${updated.highlight ? "featured" : "unfeatured"}`,
      );
      void queryClient.invalidateQueries({ queryKey: qk.adminSchemes() });
      void queryClient.invalidateQueries({ queryKey: qk.schemes() });
    },
    onError: () => toast.error("Couldn't update scheme highlight."),
  });

  function openCreate() {
    reset({
      code: "",
      name: "",
      category: "",
      benefitAmount: "",
      eligibilitySummary: "",
      eligibilityRule: "ALL_FARMERS",
      deadline: "",
      portalUrl: "",
      ministry: "",
      highlight: false,
      description: "",
    });
    setIsCreateOpen(true);
  }

  function openEdit(scheme: GovernmentScheme) {
    setEditingScheme(scheme);
    reset({
      code: scheme.code,
      name: scheme.name,
      category: scheme.category,
      benefitAmount: scheme.benefitAmount,
      eligibilitySummary: scheme.eligibilitySummary,
      eligibilityRule: scheme.eligibilityRule,
      deadline: scheme.deadline.slice(0, 10),
      portalUrl: scheme.portalUrl || "",
      ministry: scheme.ministry || "",
      highlight: scheme.highlight,
      description: scheme.description || "",
    });
  }

  function onSubmit(data: SchemeFormData) {
    const payload: SchemeRequest = {
      ...data,
      portalUrl: data.portalUrl || undefined,
      ministry: data.ministry || undefined,
      description: data.description || undefined,
    };
    if (editingScheme) {
      updateMutation.mutate({ id: editingScheme.id, data: payload });
    } else {
      createMutation.mutate(payload);
    }
  }

  const schemeList = schemes ?? [];

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-ink-900">
            Government Scheme Management
          </h1>
          <p className="mt-1 text-sm text-ink-500">
            Publish, edit eligibility rules, benefit amounts, and official
            portals for DBT subsidies.
          </p>
        </div>
        <Button onClick={openCreate}>
          <Plus className="mr-1.5 size-4" aria-hidden="true" /> Add New Scheme
        </Button>
      </div>

      {isLoading && (
        <div className="space-y-3">
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-16 w-full" />
          <Skeleton className="h-16 w-full" />
        </div>
      )}

      {isError && <ErrorState error={error} onRetry={() => void refetch()} />}

      {!isLoading && !isError && schemeList.length === 0 && (
        <EmptyState
          icon={Landmark}
          title="No government schemes published"
          description="Click 'Add New Scheme' to introduce your first central or state DBT subsidy programme."
          action={<Button onClick={openCreate}>Create Scheme</Button>}
        />
      )}

      {!isLoading && !isError && schemeList.length > 0 && (
        <Table<GovernmentScheme>
          rows={schemeList}
          rowKey={(s) => s.id}
          columns={[
            {
              key: "star",
              header: "",
              render: (s) => (
                <button
                  type="button"
                  onClick={() =>
                    toggleHighlight.mutate({
                      id: s.id,
                      highlight: !s.highlight,
                    })
                  }
                  title={s.highlight ? "Unfeature scheme" : "Feature scheme"}
                  className="rounded p-1 text-ink-400 hover:text-accent-500 focus:outline-none"
                >
                  <Star
                    className={cn(
                      "size-4",
                      s.highlight
                        ? "fill-accent-500 text-accent-500"
                        : "text-ink-300",
                    )}
                    aria-hidden="true"
                  />
                </button>
              ),
            },
            {
              key: "code",
              header: "Code",
              render: (s) => (
                <span className="font-mono text-xs font-semibold text-primary-700">
                  {s.code}
                </span>
              ),
            },
            {
              key: "name",
              header: "Scheme Name",
              render: (s) => (
                <div className="max-w-xs space-y-0.5">
                  <p className="line-clamp-1 font-medium text-ink-900">
                    {s.name}
                  </p>
                  <p className="line-clamp-1 text-xs text-ink-400">
                    {s.ministry || s.category}
                  </p>
                </div>
              ),
            },
            {
              key: "benefit",
              header: "Benefit",
              render: (s) => (
                <span className="text-xs font-semibold text-success-700">
                  {s.benefitAmount}
                </span>
              ),
            },
            {
              key: "rule",
              header: "Eligibility Rule",
              render: (s) => (
                <Badge tone="neutral">{formatEnum(s.eligibilityRule)}</Badge>
              ),
            },
            {
              key: "deadline",
              header: "Deadline",
              render: (s) => (
                <span className="text-xs text-ink-500">
                  {formatDate(s.deadline)}
                </span>
              ),
            },
            {
              key: "actions",
              header: "",
              numeric: true,
              render: (s) => (
                <div className="flex items-center justify-end gap-1">
                  {s.portalUrl && (
                    <a
                      href={s.portalUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex size-8 items-center justify-center rounded-md text-ink-600 hover:bg-surface-sunk"
                      title="Open portal"
                    >
                      <ExternalLink className="size-4" aria-hidden="true" />
                    </a>
                  )}
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => openEdit(s)}
                    title="Edit scheme"
                  >
                    <Edit2
                      className="size-4 text-ink-600"
                      aria-hidden="true"
                    />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setConfirmDelete(s)}
                    title="Delete scheme"
                  >
                    <Trash2
                      className="size-4 text-danger-600"
                      aria-hidden="true"
                    />
                  </Button>
                </div>
              ),
            },
          ]}
          mobileCard={(s) => (
            <div className="space-y-3 p-4">
              <div className="flex items-start justify-between">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-xs font-semibold text-primary-700">
                      {s.code}
                    </span>
                    <Badge tone="neutral">
                      {formatEnum(s.eligibilityRule)}
                    </Badge>
                  </div>
                  <h3 className="mt-1 font-medium text-ink-900">{s.name}</h3>
                  <p className="mt-0.5 text-xs font-semibold text-success-700">
                    {s.benefitAmount}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() =>
                    toggleHighlight.mutate({
                      id: s.id,
                      highlight: !s.highlight,
                    })
                  }
                >
                  <Star
                    className={cn(
                      "size-5",
                      s.highlight
                        ? "fill-accent-500 text-accent-500"
                        : "text-ink-300",
                    )}
                  />
                </button>
              </div>

              <div className="flex items-center justify-between border-t border-border pt-2 text-xs">
                <span className="text-ink-500">
                  Deadline: {formatDate(s.deadline)}
                </span>
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => openEdit(s)}
                  >
                    Edit
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setConfirmDelete(s)}
                  >
                    <Trash2 className="size-4 text-danger-600" />
                  </Button>
                </div>
              </div>
            </div>
          )}
        />
      )}

      {/* Create / Edit Modal */}
      <Modal
        open={isCreateOpen || editingScheme !== null}
        onClose={() => {
          setIsCreateOpen(false);
          setEditingScheme(null);
        }}
        title={
          editingScheme
            ? `Edit Scheme: ${editingScheme.code}`
            : "Publish New Government Scheme"
        }
      >
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <Input
              label="Scheme Code *"
              placeholder="e.g. PM-KISAN, PMFBY"
              error={errors.code?.message}
              {...register("code")}
            />
            <Input
              label="Category *"
              placeholder="e.g. Direct Income, Crop Insurance"
              error={errors.category?.message}
              {...register("category")}
            />
          </div>

          <Input
            label="Scheme Title / Full Name *"
            placeholder="e.g. Pradhan Mantri Kisan Samman Nidhi"
            error={errors.name?.message}
            {...register("name")}
          />

          <div className="grid gap-4 sm:grid-cols-2">
            <Input
              label="Benefit Amount / Subsidy Value *"
              placeholder="e.g. ₹6,000 / year in 3 installments"
              error={errors.benefitAmount?.message}
              {...register("benefitAmount")}
            />
            <Select
              label="Eligibility Rule Target *"
              options={ELIGIBILITY_RULES}
              error={errors.eligibilityRule?.message}
              {...register("eligibilityRule")}
            />
          </div>

          <Input
            label="Eligibility Criteria Summary *"
            placeholder="e.g. Small & marginal farmers owning up to 2 hectares cultivable land"
            error={errors.eligibilitySummary?.message}
            {...register("eligibilitySummary")}
          />

          <div className="grid gap-4 sm:grid-cols-2">
            <Input
              label="Application Deadline *"
              type="date"
              error={errors.deadline?.message}
              {...register("deadline")}
            />
            <Input
              label="Ministry / Sponsoring Body"
              placeholder="e.g. Ministry of Agriculture & Farmers Welfare"
              error={errors.ministry?.message}
              {...register("ministry")}
            />
          </div>

          <Input
            label="Official Portal URL"
            type="url"
            placeholder="https://pmkisan.gov.in"
            error={errors.portalUrl?.message}
            {...register("portalUrl")}
          />

          <div className="space-y-1.5">
            <label className="block text-sm font-medium text-ink-700">
              Detailed Description
            </label>
            <textarea
              className="w-full rounded-md border border-border bg-surface p-2.5 text-sm text-ink-900 focus:border-primary-500 focus:outline-none"
              rows={3}
              placeholder="Comprehensive scheme summary, documents required, application steps..."
              {...register("description")}
            />
          </div>

          <div className="flex items-center gap-2 pt-2">
            <input
              type="checkbox"
              id="highlightScheme"
              className="size-4 rounded border-border text-primary-600 focus:ring-primary-500"
              {...register("highlight")}
            />
            <label
              htmlFor="highlightScheme"
              className="text-sm font-medium text-ink-800"
            >
              Feature as Highlighted Scheme on Farmer Portal
            </label>
          </div>

          <div className="flex justify-end gap-2 border-t border-border pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                setIsCreateOpen(false);
                setEditingScheme(null);
              }}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              loading={
                isSubmitting ||
                createMutation.isPending ||
                updateMutation.isPending
              }
            >
              {editingScheme ? "Save Changes" : "Create Scheme"}
            </Button>
          </div>
        </form>
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal
        open={confirmDelete !== null}
        onClose={() => setConfirmDelete(null)}
        title="Confirm Scheme Deletion"
      >
        <div className="space-y-4">
          <p className="text-sm text-ink-700">
            Are you sure you want to permanently delete scheme{" "}
            <strong>{confirmDelete?.code}</strong> ({confirmDelete?.name})?
            Farmers will no longer be able to see or apply for this scheme.
          </p>
          <div className="flex justify-end gap-2">
            <Button
              variant="outline"
              onClick={() => setConfirmDelete(null)}
            >
              Cancel
            </Button>
            <Button
              variant="danger"
              loading={deleteMutation.isPending}
              onClick={() => {
                if (confirmDelete) deleteMutation.mutate(confirmDelete.id);
              }}
            >
              Delete Scheme
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
