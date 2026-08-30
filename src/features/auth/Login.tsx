import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { authApi } from "@/api/endpoints/auth";
import { ApiError } from "@/api/client";
import { useAuthStore } from "@/stores/authStore";
import { homeRouteFor } from "@/lib/roleRoutes";
import type { Role } from "@/api/types";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";

const schema = z.object({
  email: z.string().min(1, "Email is required").email("Enter a valid email"),
  password: z.string().min(1, "Password is required"),
});
type FormValues = z.infer<typeof schema>;

const ROLE_OPTIONS: { value: Role; label: string }[] = [
  { value: "FARMER", label: "🌾 Farmer" },
  { value: "SELLER", label: "🏪 Seller" },
  { value: "VETERINARIAN", label: "🩺 Veterinary Doctor" },
  { value: "DELIVERY_PARTNER", label: "🚚 Delivery Partner" },
  { value: "ADMIN", label: "🛡️ Admin" },
];

export function Login() {
  const navigate = useNavigate();
  const location = useLocation();
  const setSession = useAuthStore((s) => s.setSession);
  const [selectedRole, setSelectedRole] = useState<Role>("FARMER");
  const [formError, setFormError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({ resolver: zodResolver(schema) });

  async function onSubmit(values: FormValues) {
    setFormError(null);
    try {
      const auth = await authApi.login({
        email: values.email,
        password: values.password,
        role: selectedRole,
      });
      setSession(auth);
      const from = (location.state as { from?: { pathname: string } } | null)
        ?.from?.pathname;
      navigate(from ?? homeRouteFor(auth.role), { replace: true });
    } catch (err) {
      if (err instanceof ApiError && err.errorCode === "EMAIL_VERIFICATION_REQUIRED") {
        navigate("/verify-email", {
          state: {
            email: values.email,
            message:
              "Email verification is required before signing in. A fresh code has been sent to your email.",
          },
          replace: true,
        });
        return;
      }

      if (err instanceof ApiError && err.status === 403) {
        setFormError(err.message);
        return;
      }

      setFormError(
        err instanceof ApiError && err.status === 401
          ? "Incorrect email or password."
          : err instanceof ApiError
            ? err.message
            : "Something went wrong. Please try again."
      );
    }
  }

  return (
    <div>
      <h1 className="text-2xl font-semibold text-ink-900">Welcome back</h1>
      <p className="mt-1 text-sm text-ink-500">
        Sign in to your AgriVerse account.
      </p>

      <form
        onSubmit={handleSubmit(onSubmit)}
        className="mt-6 space-y-4"
        noValidate
      >
        <div>
          <label
            htmlFor="login-role"
            className="block text-sm font-medium text-ink-700"
          >
            Login as
          </label>
          <div className="mt-1">
            <select
              id="login-role"
              value={selectedRole}
              onChange={(e) => setSelectedRole(e.target.value as Role)}
              className="w-full rounded-lg border border-ink-200 bg-white px-3.5 py-2.5 text-sm text-ink-900 shadow-sm focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500/20"
            >
              {ROLE_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          </div>
        </div>

        <Input
          label="Email"
          type="email"
          autoComplete="email"
          placeholder="you@example.com"
          error={errors.email?.message}
          {...register("email")}
        />
        <Input
          label="Password"
          type="password"
          autoComplete="current-password"
          placeholder="••••••••"
          error={errors.password?.message}
          {...register("password")}
        />

        {formError && (
          <p
            role="alert"
            className="rounded-md bg-danger-50 px-3 py-2 text-sm text-danger-700 font-medium"
          >
            {formError}
          </p>
        )}

        <div className="text-right">
          <Link
            to="/forgot-password"
            className="text-sm text-primary-700 hover:underline"
          >
            Forgot password?
          </Link>
        </div>

        <Button
          type="submit"
          size="lg"
          loading={isSubmitting}
          className="w-full"
        >
          Sign in
        </Button>
      </form>

      <p className="mt-6 text-center text-sm text-ink-500">
        Don't have an account?{" "}
        <Link
          to="/register"
          className="font-medium text-primary-700 hover:underline"
        >
          Create one
        </Link>
      </p>
    </div>
  );
}
