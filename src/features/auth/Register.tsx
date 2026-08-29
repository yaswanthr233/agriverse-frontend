import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Link, useNavigate } from "react-router-dom";
import { authApi } from "@/api/endpoints/auth";
import { ApiError } from "@/api/client";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";

// ADMIN is deliberately absent — nobody self-registers as an administrator.
const SELECTABLE_ROLES = [
  { value: "FARMER", label: "Farmer" },
  { value: "SELLER", label: "Seller" },
  { value: "VETERINARIAN", label: "Veterinarian" },
] as const;

const schema = z
  .object({
    fullName: z
      .string()
      .min(2, "Must be at least 2 characters")
      .max(100, "Must be under 100 characters"),
    email: z.string().min(1, "Email is required").email("Enter a valid email"),
    phone: z.string().min(1, "Phone number is required"),
    password: z.string().min(8, "Password must be at least 8 characters"),
    confirmPassword: z.string(),
    role: z.enum(["FARMER", "SELLER", "VETERINARIAN"]),
    city: z.string().optional(),
    state: z.string().optional(),
  })
  .refine((v) => v.password === v.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  });

type FormValues = z.infer<typeof schema>;

export function Register() {
  const navigate = useNavigate();
  const [formError, setFormError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { role: "FARMER" },
  });

  async function onSubmit(values: FormValues) {
    setFormError(null);
    try {
      const { confirmPassword: _ignored, ...payload } = values;
      const res = await authApi.register(payload);
      // Registration creates an unverified user and triggers email verification OTP.
      // Redirect straight to verification screen with email prefilled.
      navigate("/verify-email", {
        state: { email: values.email, message: res.message },
        replace: true,
      });
    } catch (err) {
      if (err instanceof ApiError && err.errors?.length) {
        // Map backend field errors onto the form rather than showing a toast.
        err.errors.forEach((e) =>
          setError(e.field as keyof FormValues, { message: e.message }),
        );
        return;
      }
      setFormError(
        err instanceof ApiError ? err.message : "Something went wrong.",
      );
    }
  }

  return (
    <div>
      <h1 className="text-2xl font-semibold text-ink-900">
        Create your account
      </h1>
      <p className="mt-1 text-sm text-ink-500">Join AgriVerse in a minute.</p>

      <form
        onSubmit={handleSubmit(onSubmit)}
        className="mt-6 space-y-4"
        noValidate
      >
        <Input
          label="Full name"
          error={errors.fullName?.message}
          {...register("fullName")}
        />
        <Input
          label="Email"
          type="email"
          autoComplete="email"
          error={errors.email?.message}
          {...register("email")}
        />
        <Input
          label="Phone"
          type="tel"
          autoComplete="tel"
          error={errors.phone?.message}
          {...register("phone")}
        />

        <div className="space-y-1.5">
          <label
            htmlFor="role"
            className="block text-sm font-medium text-ink-700"
          >
            I am a
          </label>
          <select
            id="role"
            className="h-10 w-full rounded-md border border-border bg-surface px-3 text-sm text-ink-900"
            {...register("role")}
          >
            {SELECTABLE_ROLES.map((r) => (
              <option key={r.value} value={r.value}>
                {r.label}
              </option>
            ))}
          </select>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <Input label="City (optional)" {...register("city")} />
          <Input label="State (optional)" {...register("state")} />
        </div>

        <Input
          label="Password"
          type="password"
          autoComplete="new-password"
          hint="At least 8 characters"
          error={errors.password?.message}
          {...register("password")}
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
          Create account
        </Button>
      </form>

      <p className="mt-6 text-center text-sm text-ink-500">
        Already have an account?{" "}
        <Link
          to="/login"
          className="font-medium text-primary-700 hover:underline"
        >
          Sign in
        </Link>
      </p>
    </div>
  );
}
