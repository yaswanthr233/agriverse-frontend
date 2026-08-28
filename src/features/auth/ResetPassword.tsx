import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useLocation, useNavigate, Navigate } from "react-router-dom";
import toast from "react-hot-toast";
import { authApi } from "@/api/endpoints/auth";
import { ApiError } from "@/api/client";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";

const schema = z
  .object({
    newPassword: z
      .string()
      .min(8, "Must be at least 8 characters")
      .max(72, "Must be under 72 characters"),
    confirmPassword: z.string(),
  })
  .refine((v) => v.newPassword === v.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  });

type FormValues = z.infer<typeof schema>;

export function ResetPassword() {
  const navigate = useNavigate();
  const location = useLocation();
  const state = location.state as { email?: string; otp?: string } | null;
  const [formError, setFormError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({ resolver: zodResolver(schema) });

  if (!state?.email || !state?.otp)
    return <Navigate to="/forgot-password" replace />;

  async function onSubmit(values: FormValues) {
    setFormError(null);
    try {
      await authApi.resetPassword(
        state!.email!,
        state!.otp!,
        values.newPassword,
      );
      toast.success("Password reset. Please sign in.");
      navigate("/login", { replace: true });
    } catch (err) {
      setFormError(
        err instanceof ApiError ? err.message : "Something went wrong.",
      );
    }
  }

  return (
    <div>
      <h1 className="text-2xl font-semibold text-ink-900">
        Set a new password
      </h1>
      <p className="mt-1 text-sm text-ink-500">
        Choose a password you haven't used before.
      </p>

      <form
        onSubmit={handleSubmit(onSubmit)}
        className="mt-6 space-y-4"
        noValidate
      >
        <Input
          label="New password"
          type="password"
          autoComplete="new-password"
          hint="8–72 characters"
          error={errors.newPassword?.message}
          {...register("newPassword")}
        />
        <Input
          label="Confirm password"
          type="password"
          autoComplete="new-password"
          error={errors.confirmPassword?.message}
          {...register("confirmPassword")}
        />

        {formError && (
          <p
            role="alert"
            className="rounded-md bg-danger-50 px-3 py-2 text-sm text-danger-700"
          >
            {formError}
          </p>
        )}

        <Button
          type="submit"
          size="lg"
          loading={isSubmitting}
          className="w-full"
        >
          Reset password
        </Button>
      </form>
    </div>
  );
}
