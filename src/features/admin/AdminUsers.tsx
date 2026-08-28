import { useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import toast from "react-hot-toast";
import { Users, Eye, RotateCcw, Trash2, Power } from "lucide-react";
import { adminApi, type UserQuery } from "@/api/endpoints/admin";
import { qk } from "@/api/queryKeys";
import type { Role, UserAdminResponse } from "@/api/types";
import { useDebounce } from "@/hooks/useDebounce";
import { formatDate, formatEnum } from "@/lib/format";
import { cn } from "@/lib/cn";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { Badge } from "@/components/ui/Badge";
import { Table } from "@/components/ui/Table";
import { Pagination } from "@/components/ui/Pagination";
import { Modal } from "@/components/ui/Modal";
import { Skeleton } from "@/components/ui/Skeleton";
import { EmptyState } from "@/components/feedback/EmptyState";
import { ErrorState } from "@/components/feedback/ErrorState";

const ROLE_OPTIONS = [
  { value: "ALL", label: "All Roles" },
  { value: "FARMER", label: "Farmer" },
  { value: "SELLER", label: "Seller" },
  { value: "ADMIN", label: "Admin" },
  { value: "VETERINARIAN", label: "Veterinarian" },
  { value: "DELIVERY_PARTNER", label: "Delivery Partner" },
];

export function AdminUsers() {
  const queryClient = useQueryClient();
  const [searchParams, setSearchParams] = useSearchParams();

  const roleParam = searchParams.get("role") || "ALL";
  const searchParam = searchParams.get("search") || "";
  const pageParam = parseInt(searchParams.get("page") || "0", 10);

  const [searchInput, setSearchInput] = useState(searchParam);
  const [confirmDelete, setConfirmDelete] = useState<UserAdminResponse | null>(
    null,
  );

  const debouncedSearch = useDebounce(searchInput, 400);

  const query: UserQuery = {
    role: roleParam === "ALL" ? null : (roleParam as Role),
    search: debouncedSearch || undefined,
    page: pageParam,
    size: 20,
  };

  const {
    data: pageData,
    isLoading,
    isError,
    error,
    refetch,
  } = useQuery({
    queryKey: qk.adminUsers(query),
    queryFn: () => adminApi.users(query),
  });

  const setActive = useMutation({
    mutationFn: ({ id, active }: { id: number; active: boolean }) =>
      adminApi.setUserActive(id, active),
    onSuccess: (updated) => {
      toast.success(
        `User ${updated.fullName} ${updated.isActive ? "activated" : "deactivated"}`,
      );
      void queryClient.invalidateQueries({ queryKey: ["admin"] });
    },
    onError: () => toast.error("Couldn't update user active state."),
  });

  const deleteUser = useMutation({
    mutationFn: (id: number) => adminApi.deleteUser(id),
    onSuccess: () => {
      toast.success("User account soft-deleted");
      setConfirmDelete(null);
      void queryClient.invalidateQueries({ queryKey: ["admin"] });
    },
    onError: () => toast.error("Couldn't delete user."),
  });

  const restoreUser = useMutation({
    mutationFn: (id: number) => adminApi.restoreUser(id),
    onSuccess: (restored) => {
      toast.success(`User ${restored.fullName} restored successfully`);
      void queryClient.invalidateQueries({ queryKey: ["admin"] });
    },
    onError: () => toast.error("Couldn't restore user."),
  });

  function updateQuery(
    updates: Partial<{ role: string; page: number; search: string }>,
  ) {
    const next = new URLSearchParams(searchParams);
    if (updates.role !== undefined) {
      if (updates.role === "ALL") next.delete("role");
      else next.set("role", updates.role);
      next.set("page", "0");
    }
    if (updates.page !== undefined) {
      next.set("page", updates.page.toString());
    }
    if (updates.search !== undefined) {
      if (!updates.search) next.delete("search");
      else next.set("search", updates.search);
      next.set("page", "0");
    }
    setSearchParams(next);
  }

  const users = pageData?.content ?? [];
  const totalPages = pageData?.totalPages ?? 0;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-ink-900">User Management</h1>
        <p className="mt-1 text-sm text-ink-500">
          Oversee platform accounts, roles, access permissions, and account
          moderation.
        </p>
      </div>

      {/* Filters Row */}
      <div className="flex flex-wrap items-center gap-4">
        <div className="w-full max-w-xs">
          <Input
            placeholder="Search by name or email..."
            value={searchInput}
            onChange={(e) => {
              setSearchInput(e.target.value);
              updateQuery({ search: e.target.value });
            }}
          />
        </div>
        <div className="w-48">
          <Select
            options={ROLE_OPTIONS}
            value={roleParam}
            onChange={(e) => updateQuery({ role: e.target.value })}
          />
        </div>
      </div>

      {isLoading && (
        <div className="space-y-3">
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-16 w-full" />
          <Skeleton className="h-16 w-full" />
          <Skeleton className="h-16 w-full" />
        </div>
      )}

      {isError && <ErrorState error={error} onRetry={() => void refetch()} />}

      {!isLoading && !isError && users.length === 0 && (
        <EmptyState
          icon={Users}
          title="No users found"
          description="No user accounts matched the given search and role filters."
        />
      )}

      {!isLoading && !isError && users.length > 0 && (
        <>
          <Table<UserAdminResponse>
            rows={users}
            rowKey={(u) => u.id}
            columns={[
              {
                key: "user",
                header: "User",
                render: (u) => {
                  const isDeleted = u.deletedAt !== null;
                  return (
                    <div
                      className={cn(
                        "space-y-0.5",
                        isDeleted && "opacity-60",
                      )}
                    >
                      <div className="flex items-center gap-2">
                        <span className="font-medium text-ink-900">
                          {u.fullName}
                        </span>
                        {isDeleted && <Badge tone="danger">Deleted</Badge>}
                      </div>
                      <p className="text-xs text-ink-400">{u.email}</p>
                    </div>
                  );
                },
              },
              {
                key: "role",
                header: "Role",
                render: (u) => (
                  <Badge tone="neutral">{formatEnum(u.role)}</Badge>
                ),
              },
              {
                key: "location",
                header: "City / State",
                render: (u) => (
                  <span className="text-xs text-ink-700">
                    {u.city || u.state
                      ? `${u.city ?? ""}, ${u.state ?? ""}`
                      : "—"}
                  </span>
                ),
              },
              {
                key: "status",
                header: "Status",
                render: (u) => (
                  <Badge tone={u.isActive ? "success" : "neutral"}>
                    {u.isActive ? "Active" : "Inactive"}
                  </Badge>
                ),
              },
              {
                key: "joined",
                header: "Joined",
                render: (u) => (
                  <span className="text-xs text-ink-500">
                    {formatDate(u.createdAt)}
                  </span>
                ),
              },
              {
                key: "actions",
                header: "",
                numeric: true,
                render: (u) => {
                  const isDeleted = u.deletedAt !== null;
                  return (
                    <div className="flex items-center justify-end gap-1.5">
                      <Link to={`/admin/users/${u.id}`}>
                        <Button
                          variant="ghost"
                          size="sm"
                          title="View details"
                        >
                          <Eye
                            className="size-4 text-ink-600"
                            aria-hidden="true"
                          />
                        </Button>
                      </Link>

                      {isDeleted ? (
                        <Button
                          variant="outline"
                          size="sm"
                          loading={restoreUser.isPending}
                          onClick={() => restoreUser.mutate(u.id)}
                        >
                          <RotateCcw
                            className="mr-1 size-3.5"
                            aria-hidden="true"
                          />{" "}
                          Restore
                        </Button>
                      ) : (
                        <>
                          <Button
                            variant="outline"
                            size="sm"
                            loading={
                              setActive.isPending &&
                              setActive.variables?.id === u.id
                            }
                            onClick={() =>
                              setActive.mutate({
                                id: u.id,
                                active: !u.isActive,
                              })
                            }
                          >
                            <Power
                              className="mr-1 size-3.5"
                              aria-hidden="true"
                            />
                            {u.isActive ? "Deactivate" : "Activate"}
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setConfirmDelete(u)}
                            title="Soft delete user"
                          >
                            <Trash2
                              className="size-4 text-danger-600"
                              aria-hidden="true"
                            />
                          </Button>
                        </>
                      )}
                    </div>
                  );
                },
              },
            ]}
            mobileCard={(u) => {
              const isDeleted = u.deletedAt !== null;
              return (
                <div
                  className={cn("space-y-3 p-4", isDeleted && "opacity-60")}
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-medium text-ink-900">
                          {u.fullName}
                        </span>
                        {isDeleted && <Badge tone="danger">Deleted</Badge>}
                      </div>
                      <p className="text-xs text-ink-500">{u.email}</p>
                    </div>
                    <Badge tone="neutral">{formatEnum(u.role)}</Badge>
                  </div>

                  <div className="flex items-center justify-between border-t border-border pt-2 text-xs">
                    <span className="text-ink-500">
                      Joined {formatDate(u.createdAt)}
                    </span>
                    <div className="flex items-center gap-2">
                      <Link to={`/admin/users/${u.id}`}>
                        <Button variant="ghost" size="sm">
                          <Eye className="size-4" aria-hidden="true" />
                        </Button>
                      </Link>
                      {isDeleted ? (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => restoreUser.mutate(u.id)}
                        >
                          Restore
                        </Button>
                      ) : (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() =>
                            setActive.mutate({
                              id: u.id,
                              active: !u.isActive,
                            })
                          }
                        >
                          {u.isActive ? "Deactivate" : "Activate"}
                        </Button>
                      )}
                    </div>
                  </div>
                </div>
              );
            }}
          />

          <Pagination
            page={pageParam}
            totalPages={totalPages}
            onChange={(newPage) => updateQuery({ page: newPage })}
          />
        </>
      )}

      {/* Soft Delete Modal */}
      <Modal
        open={confirmDelete !== null}
        onClose={() => setConfirmDelete(null)}
        title="Confirm Soft Delete"
      >
        <div className="space-y-4">
          <p className="text-sm text-ink-700">
            Are you sure you want to soft-delete the account for{" "}
            <span className="font-semibold text-ink-900">
              {confirmDelete?.fullName}
            </span>{" "}
            ({confirmDelete?.email})? The user will be suspended, and their
            record will remain visible in this console with a Restore option.
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
              loading={deleteUser.isPending}
              onClick={() => {
                if (confirmDelete) deleteUser.mutate(confirmDelete.id);
              }}
            >
              Confirm Delete
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
