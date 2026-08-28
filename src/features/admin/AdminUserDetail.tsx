import { useState } from "react";
import { Link, useParams } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import toast from "react-hot-toast";
import {
  ChevronLeft,
  Mail,
  Phone,
  MapPin,
  Calendar,
  ShieldCheck,
  Power,
  RotateCcw,
  Trash2,
} from "lucide-react";
import { adminApi } from "@/api/endpoints/admin";
import { qk } from "@/api/queryKeys";
import { formatDateTime, formatEnum } from "@/lib/format";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Modal } from "@/components/ui/Modal";
import { Skeleton } from "@/components/ui/Skeleton";
import { ErrorState } from "@/components/feedback/ErrorState";

export function AdminUserDetail() {
  const { id } = useParams();
  const userId = Number(id);
  const queryClient = useQueryClient();
  const [confirmDelete, setConfirmDelete] = useState(false);

  const {
    data: user,
    isLoading,
    isError,
    error,
    refetch,
  } = useQuery({
    queryKey: qk.adminUser(userId),
    queryFn: () => adminApi.user(userId),
    enabled: Number.isFinite(userId),
  });

  const setActive = useMutation({
    mutationFn: (active: boolean) => adminApi.setUserActive(userId, active),
    onSuccess: (updated) => {
      toast.success(
        `User account ${updated.isActive ? "activated" : "deactivated"}`,
      );
      void queryClient.invalidateQueries({ queryKey: ["admin"] });
    },
    onError: () => toast.error("Couldn't update user status."),
  });

  const deleteUser = useMutation({
    mutationFn: () => adminApi.deleteUser(userId),
    onSuccess: () => {
      toast.success("User account soft-deleted");
      setConfirmDelete(false);
      void queryClient.invalidateQueries({ queryKey: ["admin"] });
    },
    onError: () => toast.error("Couldn't delete user."),
  });

  const restoreUser = useMutation({
    mutationFn: () => adminApi.restoreUser(userId),
    onSuccess: () => {
      toast.success("User account restored successfully");
      void queryClient.invalidateQueries({ queryKey: ["admin"] });
    },
    onError: () => toast.error("Couldn't restore user."),
  });

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-40" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  if (isError || !user) {
    return <ErrorState error={error} onRetry={() => void refetch()} />;
  }

  const isDeleted = user.deletedAt !== null;

  return (
    <div className="max-w-3xl space-y-6">
      <Link
        to="/admin/users"
        className="inline-flex items-center gap-1 text-sm font-medium text-primary-700 hover:underline"
      >
        <ChevronLeft className="size-4" aria-hidden="true" /> Back to users
      </Link>

      <Card className="space-y-6 p-6">
        {/* Header Profile Info */}
        <div className="flex flex-wrap items-start justify-between gap-4 border-b border-border pb-6">
          <div className="flex items-center gap-4">
            <div className="flex size-14 items-center justify-center rounded-full bg-primary-100 text-xl font-bold text-primary-700">
              {user.fullName.charAt(0).toUpperCase()}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl font-semibold text-ink-900">
                  {user.fullName}
                </h1>
                {isDeleted && <Badge tone="danger">Deleted</Badge>}
                <Badge tone={user.isActive ? "success" : "neutral"}>
                  {user.isActive ? "Active" : "Inactive"}
                </Badge>
              </div>
              <p className="text-sm text-ink-500">
                User ID #{user.id} · {formatEnum(user.role)}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {isDeleted ? (
              <Button
                variant="outline"
                size="sm"
                loading={restoreUser.isPending}
                onClick={() => restoreUser.mutate()}
              >
                <RotateCcw className="mr-1.5 size-4" aria-hidden="true" />{" "}
                Restore Account
              </Button>
            ) : (
              <>
                <Button
                  variant="outline"
                  size="sm"
                  loading={setActive.isPending}
                  onClick={() => setActive.mutate(!user.isActive)}
                >
                  <Power className="mr-1.5 size-4" aria-hidden="true" />
                  {user.isActive ? "Deactivate" : "Activate"}
                </Button>
                <Button
                  variant="danger"
                  size="sm"
                  onClick={() => setConfirmDelete(true)}
                >
                  <Trash2 className="mr-1.5 size-4" aria-hidden="true" /> Soft
                  Delete
                </Button>
              </>
            )}
          </div>
        </div>

        {/* Detailed Fields */}
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="flex items-center gap-3 rounded-md bg-surface-sunk p-3 text-sm">
            <Mail className="size-4 text-ink-400" aria-hidden="true" />
            <div>
              <span className="text-xs text-ink-400">Email Address</span>
              <p className="font-medium text-ink-900">{user.email}</p>
            </div>
          </div>

          <div className="flex items-center gap-3 rounded-md bg-surface-sunk p-3 text-sm">
            <Phone className="size-4 text-ink-400" aria-hidden="true" />
            <div>
              <span className="text-xs text-ink-400">Phone Number</span>
              <p className="font-medium text-ink-900">{user.phone || "—"}</p>
            </div>
          </div>

          <div className="flex items-center gap-3 rounded-md bg-surface-sunk p-3 text-sm">
            <MapPin className="size-4 text-ink-400" aria-hidden="true" />
            <div>
              <span className="text-xs text-ink-400">Location</span>
              <p className="font-medium text-ink-900">
                {user.city || user.state
                  ? `${user.city ?? ""}, ${user.state ?? ""}`
                  : "Not specified"}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3 rounded-md bg-surface-sunk p-3 text-sm">
            <ShieldCheck className="size-4 text-ink-400" aria-hidden="true" />
            <div>
              <span className="text-xs text-ink-400">Verification Status</span>
              <p className="font-medium text-ink-900">
                {user.isVerified ? "Verified Account" : "Unverified"}
              </p>
            </div>
          </div>
        </div>

        {/* Timestamps */}
        <div className="border-t border-border pt-4 text-xs text-ink-500 space-y-1">
          <p className="flex items-center gap-1.5">
            <Calendar className="size-3.5" aria-hidden="true" />
            Account created on {formatDateTime(user.createdAt)}
          </p>
          <p>Last modified: {formatDateTime(user.updatedAt)}</p>
          {user.deletedAt && (
            <p className="font-medium text-danger-700">
              Deleted on {formatDateTime(user.deletedAt)}
            </p>
          )}
        </div>
      </Card>

      {/* Soft Delete Modal */}
      <Modal
        open={confirmDelete}
        onClose={() => setConfirmDelete(false)}
        title="Soft Delete User Account"
      >
        <div className="space-y-4">
          <p className="text-sm text-ink-700">
            Are you sure you want to soft-delete the account for{" "}
            <strong>{user.fullName}</strong>? The user will immediately be
            prevented from logging in.
          </p>
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setConfirmDelete(false)}>
              Cancel
            </Button>
            <Button
              variant="danger"
              loading={deleteUser.isPending}
              onClick={() => deleteUser.mutate()}
            >
              Confirm Soft Delete
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
