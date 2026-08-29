import { useState, useEffect } from "react";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import toast from "react-hot-toast";
import {
  User as UserIcon,
  Mail,
  Phone,
  MapPin,
  Shield,
  Calendar,
  Edit3,
  X,
  Sprout,
  Store,
  Stethoscope,
  Truck,
  ShieldCheck,
  ChevronRight,
} from "lucide-react";
import { userApi, type UpdateProfileRequest } from "@/api/endpoints/user";
import { useAuthStore } from "@/stores/authStore";
import { formatDate, formatEnum } from "@/lib/format";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Skeleton } from "@/components/ui/Skeleton";
import { ImageUploader } from "@/components/ui/ImageUploader";
import { ErrorState } from "@/components/feedback/ErrorState";

const profileSchema = z.object({
  fullName: z.string().min(2, "Full name must be at least 2 characters").max(100),
  phone: z.string().min(10, "Phone number must be at least 10 digits").max(15),
  city: z.string().max(100).optional().or(z.literal("")),
  state: z.string().max(100).optional().or(z.literal("")),
  avatarUrl: z.string().optional().or(z.literal("")),
});

type ProfileFormData = z.infer<typeof profileSchema>;

export function Profile() {
  const queryClient = useQueryClient();
  const authUser = useAuthStore((s) => s.user);
  const setUser = useAuthStore((s) => s.setUser);
  const [isEditing, setIsEditing] = useState(false);

  const {
    data: profile,
    isLoading,
    isError,
    error,
    refetch,
  } = useQuery({
    queryKey: ["user", "me"],
    queryFn: userApi.getMe,
  });

  const {
    register,
    handleSubmit,
    reset,
    control,
    formState: { errors },
  } = useForm<ProfileFormData>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      fullName: "",
      phone: "",
      city: "",
      state: "",
      avatarUrl: "",
    },
  });

  useEffect(() => {
    if (profile) {
      reset({
        fullName: profile.fullName || "",
        phone: profile.phone || "",
        city: profile.city || "",
        state: profile.state || "",
        avatarUrl: profile.avatarUrl || "",
      });
    }
  }, [profile, reset]);

  const updateMutation = useMutation({
    mutationFn: (data: ProfileFormData) => {
      const payload: UpdateProfileRequest = {
        fullName: data.fullName.trim(),
        phone: data.phone.trim(),
        city: data.city?.trim() || null,
        state: data.state?.trim() || null,
        avatarUrl: data.avatarUrl?.trim() || null,
      };
      return userApi.updateProfile(payload);
    },
    onSuccess: (updated) => {
      toast.success("Profile updated successfully.");
      setIsEditing(false);
      void queryClient.invalidateQueries({ queryKey: ["user", "me"] });

      // Sync authStore state
      if (authUser) {
        setUser({
          ...authUser,
          fullName: updated.fullName,
          phone: updated.phone,
          city: updated.city,
          state: updated.state,
          avatarUrl: updated.avatarUrl,
        });
      }
    },
    onError: (err: any) => {
      const msg = err?.response?.data?.message || err?.message || "Couldn't update profile. Please try again.";
      toast.error(msg);
    },
  });

  if (isLoading) {
    return (
      <div className="max-w-4xl space-y-6">
        <Skeleton className="h-44 w-full rounded-xl" />
        <Skeleton className="h-72 w-full rounded-xl" />
      </div>
    );
  }

  if (isError || !profile) {
    return (
      <div className="max-w-4xl">
        <ErrorState error={error} onRetry={() => void refetch()} />
      </div>
    );
  }

  const roleColorTone: Record<string, "success" | "warning" | "neutral" | "danger"> = {
    FARMER: "success",
    SELLER: "warning",
    VETERINARIAN: "neutral",
    DELIVERY_PARTNER: "neutral",
    ADMIN: "danger",
  };

  const currentTone = roleColorTone[profile.role] || "neutral";

  return (
    <div className="max-w-4xl space-y-6">
      {/* Header Banner & Avatar Card */}
      <Card className="overflow-hidden p-6 sm:p-8">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6">
          <div className="flex items-center gap-5">
            <div className="relative flex size-20 sm:size-24 shrink-0 items-center justify-center overflow-hidden rounded-full border-2 border-primary-200 bg-primary-50 shadow-sm">
              {profile.avatarUrl ? (
                <img
                  src={profile.avatarUrl}
                  alt={profile.fullName}
                  className="size-full object-cover"
                />
              ) : (
                <span className="font-display text-2xl sm:text-3xl font-bold text-primary-700">
                  {profile.fullName.charAt(0).toUpperCase()}
                </span>
              )}
            </div>

            <div className="space-y-1.5">
              <div className="flex flex-wrap items-center gap-2">
                <h1 className="text-xl sm:text-2xl font-bold text-ink-900">
                  {profile.fullName}
                </h1>
                <Badge tone={currentTone}>{formatEnum(profile.role)}</Badge>
              </div>
              <p className="text-sm text-ink-500 flex items-center gap-1.5">
                <Mail className="size-3.5 text-ink-400" />
                {profile.email}
              </p>
              <p className="text-xs text-ink-400 flex items-center gap-1.5 pt-0.5">
                <Calendar className="size-3.5 text-ink-400" />
                Member since {formatDate(profile.createdAt)}
              </p>
            </div>
          </div>

          {!isEditing && (
            <Button
              variant="outline"
              size="md"
              onClick={() => setIsEditing(true)}
              className="self-start sm:self-center"
            >
              <Edit3 className="mr-1.5 size-4" aria-hidden="true" />
              Edit Profile
            </Button>
          )}
        </div>
      </Card>

      {/* Main Profile Info / Edit Form */}
      <Card className="p-6 sm:p-8">
        <div className="border-b border-border pb-4 mb-6 flex items-center justify-between">
          <div>
            <h2 className="text-lg font-semibold text-ink-900">
              {isEditing ? "Edit Personal Details" : "Personal Information"}
            </h2>
            <p className="text-xs text-ink-500 mt-0.5">
              {isEditing
                ? "Update your personal and contact details. Role and Email are permanent."
                : "Your account details and contact information."}
            </p>
          </div>
          {isEditing && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                setIsEditing(false);
                reset();
              }}
            >
              <X className="mr-1 size-3.5" /> Cancel
            </Button>
          )}
        </div>

        {isEditing ? (
          /* EDIT FORM */
          <form
            onSubmit={handleSubmit((data) => updateMutation.mutate(data))}
            className="space-y-5"
            noValidate
          >
            {/* Avatar Uploader Component */}
            <Controller
              name="avatarUrl"
              control={control}
              render={({ field }) => (
                <ImageUploader
                  label="Profile Picture"
                  value={field.value}
                  onChange={field.onChange}
                  folder="profiles"
                  hint="Upload a profile picture or provide an image link (JPG, PNG, WebP up to 5 MB)"
                />
              )}
            />

            <div className="grid gap-4 sm:grid-cols-2">
              <Input
                label="Full Name *"
                error={errors.fullName?.message}
                {...register("fullName")}
              />
              <Input
                label="Phone Number *"
                error={errors.phone?.message}
                {...register("phone")}
              />
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <Input
                label="City / Town"
                placeholder="e.g. Anand, Hyderabad"
                error={errors.city?.message}
                {...register("city")}
              />
              <Input
                label="State"
                placeholder="e.g. Gujarat, Telangana"
                error={errors.state?.message}
                {...register("state")}
              />
            </div>

            {/* Read-Only Notice */}
            <div className="grid gap-4 sm:grid-cols-2 pt-2 border-t border-border">
              <div>
                <label className="block text-xs font-medium text-ink-500 mb-1">
                  Email Address (Login ID)
                </label>
                <div className="h-10 px-3 flex items-center rounded-md bg-surface-sunk border border-border text-sm text-ink-600 font-mono">
                  {profile.email}
                </div>
                <p className="text-[11px] text-ink-400 mt-1">
                  Email serves as your unique security identity and cannot be altered.
                </p>
              </div>

              <div>
                <label className="block text-xs font-medium text-ink-500 mb-1">
                  Account Role
                </label>
                <div className="h-10 px-3 flex items-center justify-between rounded-md bg-surface-sunk border border-border text-sm text-ink-700">
                  <span className="font-semibold">{formatEnum(profile.role)}</span>
                  <Badge tone={currentTone}>Permanent</Badge>
                </div>
                <p className="text-[11px] text-ink-400 mt-1">
                  Role is assigned during account onboarding.
                </p>
              </div>
            </div>

            <div className="flex gap-3 pt-4 border-t border-border">
              <Button type="submit" size="lg" loading={updateMutation.isPending}>
                Save Changes
              </Button>
              <Button
                type="button"
                variant="outline"
                size="lg"
                onClick={() => {
                  setIsEditing(false);
                  reset();
                }}
              >
                Cancel
              </Button>
            </div>
          </form>
        ) : (
          /* READ-ONLY DISPLAY */
          <div className="grid gap-6 sm:grid-cols-2">
            <div className="flex items-start gap-3.5">
              <div className="p-2.5 rounded-lg bg-surface-sunk text-ink-600">
                <UserIcon className="size-4" />
              </div>
              <div>
                <span className="text-xs text-ink-400 font-medium">Full Name</span>
                <p className="text-sm font-semibold text-ink-900 mt-0.5">
                  {profile.fullName}
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3.5">
              <div className="p-2.5 rounded-lg bg-surface-sunk text-ink-600">
                <Mail className="size-4" />
              </div>
              <div>
                <span className="text-xs text-ink-400 font-medium">Email Address</span>
                <p className="text-sm font-semibold text-ink-900 mt-0.5">
                  {profile.email}
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3.5">
              <div className="p-2.5 rounded-lg bg-surface-sunk text-ink-600">
                <Phone className="size-4" />
              </div>
              <div>
                <span className="text-xs text-ink-400 font-medium">Phone Number</span>
                <p className="text-sm font-semibold text-ink-900 mt-0.5">
                  {profile.phone}
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3.5">
              <div className="p-2.5 rounded-lg bg-surface-sunk text-ink-600">
                <MapPin className="size-4" />
              </div>
              <div>
                <span className="text-xs text-ink-400 font-medium">Location</span>
                <p className="text-sm font-semibold text-ink-900 mt-0.5">
                  {[profile.city, profile.state].filter(Boolean).join(", ") || "Not specified"}
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3.5">
              <div className="p-2.5 rounded-lg bg-surface-sunk text-ink-600">
                <Shield className="size-4" />
              </div>
              <div>
                <span className="text-xs text-ink-400 font-medium">Role Privilege</span>
                <div className="mt-1">
                  <Badge tone={currentTone}>{formatEnum(profile.role)}</Badge>
                </div>
              </div>
            </div>

            <div className="flex items-start gap-3.5">
              <div className="p-2.5 rounded-lg bg-surface-sunk text-ink-600">
                <ShieldCheck className="size-4" />
              </div>
              <div>
                <span className="text-xs text-ink-400 font-medium">Verification Status</span>
                <div className="mt-1">
                  <Badge tone={profile.isVerified ? "success" : "neutral"}>
                    {profile.isVerified ? "Verified Account" : "Standard Account"}
                  </Badge>
                </div>
              </div>
            </div>
          </div>
        )}
      </Card>

      {/* Role-Specific Workspace Quicklinks */}
      <Card className="p-6">
        <h3 className="text-sm font-semibold text-ink-900 mb-3">
          Role Workspace & Quick Navigation
        </h3>

        {profile.role === "FARMER" && (
          <div className="grid gap-3 sm:grid-cols-3">
            <Link
              to="/app/farm"
              className="flex items-center justify-between p-3.5 rounded-lg border border-border hover:border-primary-500 hover:bg-primary-50/40 transition-colors"
            >
              <div className="flex items-center gap-2.5">
                <Sprout className="size-4 text-primary-600" />
                <span className="text-sm font-medium text-ink-800">Farm Profile</span>
              </div>
              <ChevronRight className="size-4 text-ink-400" />
            </Link>

            <Link
              to="/app/crops"
              className="flex items-center justify-between p-3.5 rounded-lg border border-border hover:border-primary-500 hover:bg-primary-50/40 transition-colors"
            >
              <div className="flex items-center gap-2.5">
                <Sprout className="size-4 text-primary-600" />
                <span className="text-sm font-medium text-ink-800">Crops Manager</span>
              </div>
              <ChevronRight className="size-4 text-ink-400" />
            </Link>

            <Link
              to="/app/expenses"
              className="flex items-center justify-between p-3.5 rounded-lg border border-border hover:border-primary-500 hover:bg-primary-50/40 transition-colors"
            >
              <div className="flex items-center gap-2.5">
                <MapPin className="size-4 text-primary-600" />
                <span className="text-sm font-medium text-ink-800">Farm Expenses</span>
              </div>
              <ChevronRight className="size-4 text-ink-400" />
            </Link>
          </div>
        )}

        {profile.role === "SELLER" && (
          <div className="grid gap-3 sm:grid-cols-3">
            <Link
              to="/seller/products"
              className="flex items-center justify-between p-3.5 rounded-lg border border-border hover:border-primary-500 hover:bg-primary-50/40 transition-colors"
            >
              <div className="flex items-center gap-2.5">
                <Store className="size-4 text-primary-600" />
                <span className="text-sm font-medium text-ink-800">My Products</span>
              </div>
              <ChevronRight className="size-4 text-ink-400" />
            </Link>

            <Link
              to="/seller/orders"
              className="flex items-center justify-between p-3.5 rounded-lg border border-border hover:border-primary-500 hover:bg-primary-50/40 transition-colors"
            >
              <div className="flex items-center gap-2.5">
                <Store className="size-4 text-primary-600" />
                <span className="text-sm font-medium text-ink-800">Store Orders</span>
              </div>
              <ChevronRight className="size-4 text-ink-400" />
            </Link>

            <Link
              to="/seller/revenue"
              className="flex items-center justify-between p-3.5 rounded-lg border border-border hover:border-primary-500 hover:bg-primary-50/40 transition-colors"
            >
              <div className="flex items-center gap-2.5">
                <ShieldCheck className="size-4 text-primary-600" />
                <span className="text-sm font-medium text-ink-800">Revenue Analytics</span>
              </div>
              <ChevronRight className="size-4 text-ink-400" />
            </Link>
          </div>
        )}

        {profile.role === "VETERINARIAN" && (
          <div className="grid gap-3 sm:grid-cols-3">
            <Link
              to="/vet/appointments"
              className="flex items-center justify-between p-3.5 rounded-lg border border-border hover:border-primary-500 hover:bg-primary-50/40 transition-colors"
            >
              <div className="flex items-center gap-2.5">
                <Stethoscope className="size-4 text-primary-600" />
                <span className="text-sm font-medium text-ink-800">Appointments</span>
              </div>
              <ChevronRight className="size-4 text-ink-400" />
            </Link>

            <Link
              to="/vet/patients"
              className="flex items-center justify-between p-3.5 rounded-lg border border-border hover:border-primary-500 hover:bg-primary-50/40 transition-colors"
            >
              <div className="flex items-center gap-2.5">
                <Stethoscope className="size-4 text-primary-600" />
                <span className="text-sm font-medium text-ink-800">Animal Patients</span>
              </div>
              <ChevronRight className="size-4 text-ink-400" />
            </Link>

            <Link
              to="/vet/earnings"
              className="flex items-center justify-between p-3.5 rounded-lg border border-border hover:border-primary-500 hover:bg-primary-50/40 transition-colors"
            >
              <div className="flex items-center gap-2.5">
                <ShieldCheck className="size-4 text-primary-600" />
                <span className="text-sm font-medium text-ink-800">Earnings</span>
              </div>
              <ChevronRight className="size-4 text-ink-400" />
            </Link>
          </div>
        )}

        {profile.role === "DELIVERY_PARTNER" && (
          <div className="grid gap-3 sm:grid-cols-3">
            <Link
              to="/delivery/active"
              className="flex items-center justify-between p-3.5 rounded-lg border border-border hover:border-primary-500 hover:bg-primary-50/40 transition-colors"
            >
              <div className="flex items-center gap-2.5">
                <Truck className="size-4 text-primary-600" />
                <span className="text-sm font-medium text-ink-800">Active Deliveries</span>
              </div>
              <ChevronRight className="size-4 text-ink-400" />
            </Link>

            <Link
              to="/delivery/available"
              className="flex items-center justify-between p-3.5 rounded-lg border border-border hover:border-primary-500 hover:bg-primary-50/40 transition-colors"
            >
              <div className="flex items-center gap-2.5">
                <Truck className="size-4 text-primary-600" />
                <span className="text-sm font-medium text-ink-800">Available Orders</span>
              </div>
              <ChevronRight className="size-4 text-ink-400" />
            </Link>

            <Link
              to="/delivery/earnings"
              className="flex items-center justify-between p-3.5 rounded-lg border border-border hover:border-primary-500 hover:bg-primary-50/40 transition-colors"
            >
              <div className="flex items-center gap-2.5">
                <ShieldCheck className="size-4 text-primary-600" />
                <span className="text-sm font-medium text-ink-800">Delivery Earnings</span>
              </div>
              <ChevronRight className="size-4 text-ink-400" />
            </Link>
          </div>
        )}

        {profile.role === "ADMIN" && (
          <div className="grid gap-3 sm:grid-cols-3">
            <Link
              to="/admin/users"
              className="flex items-center justify-between p-3.5 rounded-lg border border-border hover:border-primary-500 hover:bg-primary-50/40 transition-colors"
            >
              <div className="flex items-center gap-2.5">
                <UserIcon className="size-4 text-primary-600" />
                <span className="text-sm font-medium text-ink-800">User Moderation</span>
              </div>
              <ChevronRight className="size-4 text-ink-400" />
            </Link>

            <Link
              to="/admin/products"
              className="flex items-center justify-between p-3.5 rounded-lg border border-border hover:border-primary-500 hover:bg-primary-50/40 transition-colors"
            >
              <div className="flex items-center gap-2.5">
                <Store className="size-4 text-primary-600" />
                <span className="text-sm font-medium text-ink-800">Market Moderation</span>
              </div>
              <ChevronRight className="size-4 text-ink-400" />
            </Link>

            <Link
              to="/admin/schemes"
              className="flex items-center justify-between p-3.5 rounded-lg border border-border hover:border-primary-500 hover:bg-primary-50/40 transition-colors"
            >
              <div className="flex items-center gap-2.5">
                <ShieldCheck className="size-4 text-primary-600" />
                <span className="text-sm font-medium text-ink-800">Schemes Publisher</span>
              </div>
              <ChevronRight className="size-4 text-ink-400" />
            </Link>
          </div>
        )}
      </Card>
    </div>
  );
}

