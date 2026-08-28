import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import toast from "react-hot-toast";
import { Store, Power } from "lucide-react";
import { adminApi } from "@/api/endpoints/admin";
import { qk } from "@/api/queryKeys";
import type { UserAdminResponse } from "@/api/types";
import { formatDate } from "@/lib/format";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Table } from "@/components/ui/Table";
import { Skeleton } from "@/components/ui/Skeleton";
import { EmptyState } from "@/components/feedback/EmptyState";
import { ErrorState } from "@/components/feedback/ErrorState";

export function AdminSellers() {
  const queryClient = useQueryClient();

  const {
    data: sellers,
    isLoading,
    isError,
    error,
    refetch,
  } = useQuery({
    queryKey: qk.adminSellers(),
    queryFn: adminApi.sellers,
  });

  const setActive = useMutation({
    mutationFn: ({ id, active }: { id: number; active: boolean }) =>
      adminApi.setUserActive(id, active),
    onSuccess: (updated) => {
      toast.success(
        `Seller ${updated.fullName} ${updated.isActive ? "activated" : "deactivated"}`,
      );
      void queryClient.invalidateQueries({ queryKey: qk.adminSellers() });
      void queryClient.invalidateQueries({ queryKey: qk.adminDashboard() });
    },
    onError: () => toast.error("Couldn't update seller status."),
  });

  const sellerList = sellers ?? [];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-ink-900">
          Seller Accounts
        </h1>
        <p className="mt-1 text-sm text-ink-500">
          Directory of registered vendor accounts selling seeds, equipment, and
          inputs on AgriVerse.
        </p>
      </div>

      {isLoading && (
        <div className="space-y-3">
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-16 w-full" />
          <Skeleton className="h-16 w-full" />
        </div>
      )}

      {isError && <ErrorState error={error} onRetry={() => void refetch()} />}

      {!isLoading && !isError && sellerList.length === 0 && (
        <EmptyState
          icon={Store}
          title="No sellers registered"
          description="There are currently no seller accounts registered in the platform."
        />
      )}

      {!isLoading && !isError && sellerList.length > 0 && (
        <Table<UserAdminResponse>
          rows={sellerList}
          rowKey={(s) => s.id}
          columns={[
            {
              key: "seller",
              header: "Seller",
              render: (s) => (
                <div className="space-y-0.5">
                  <span className="font-medium text-ink-900">{s.fullName}</span>
                  <p className="text-xs text-ink-400">{s.email}</p>
                </div>
              ),
            },
            {
              key: "contact",
              header: "Phone",
              render: (s) => (
                <span className="text-xs text-ink-700">{s.phone || "—"}</span>
              ),
            },
            {
              key: "location",
              header: "Location",
              render: (s) => (
                <span className="text-xs text-ink-700">
                  {s.city || s.state
                    ? `${s.city ?? ""}, ${s.state ?? ""}`
                    : "—"}
                </span>
              ),
            },
            {
              key: "status",
              header: "Status",
              render: (s) => (
                <Badge tone={s.isActive ? "success" : "neutral"}>
                  {s.isActive ? "Active" : "Inactive"}
                </Badge>
              ),
            },
            {
              key: "joined",
              header: "Registered",
              render: (s) => (
                <span className="text-xs text-ink-500">
                  {formatDate(s.createdAt)}
                </span>
              ),
            },
            {
              key: "actions",
              header: "",
              numeric: true,
              render: (s) => (
                <Button
                  variant="outline"
                  size="sm"
                  loading={
                    setActive.isPending && setActive.variables?.id === s.id
                  }
                  onClick={() =>
                    setActive.mutate({ id: s.id, active: !s.isActive })
                  }
                >
                  <Power className="mr-1.5 size-3.5" aria-hidden="true" />
                  {s.isActive ? "Deactivate" : "Activate"}
                </Button>
              ),
            },
          ]}
          mobileCard={(s) => (
            <div className="space-y-3 p-4">
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="font-medium text-ink-900">{s.fullName}</h3>
                  <p className="text-xs text-ink-500">{s.email}</p>
                  {s.phone && (
                    <p className="mt-0.5 text-xs text-ink-400">{s.phone}</p>
                  )}
                </div>
                <Badge tone={s.isActive ? "success" : "neutral"}>
                  {s.isActive ? "Active" : "Inactive"}
                </Badge>
              </div>

              <div className="flex items-center justify-between border-t border-border pt-2 text-xs">
                <span className="text-ink-500">
                  Joined {formatDate(s.createdAt)}
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  loading={
                    setActive.isPending && setActive.variables?.id === s.id
                  }
                  onClick={() =>
                    setActive.mutate({ id: s.id, active: !s.isActive })
                  }
                >
                  {s.isActive ? "Deactivate" : "Activate"}
                </Button>
              </div>
            </div>
          )}
        />
      )}
    </div>
  );
}
