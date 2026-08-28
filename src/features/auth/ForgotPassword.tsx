import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Link, useNavigate } from "react-router-dom";
import { authApi } from "@/api/endpoints/auth";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";

const schema = z.object({
  email: z.string().min(1, "Email is required").email("Enter a valid email"),
});
type FormValues = z.infer<typeof schema>;

export function ForgotPassword() {
  const navigate = useNavigate();
  const [sent, setSent] = useState(false);

  const {
    register,
    handleSubmit,
    getValues,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({ resolver: zodResolver(schema) });

  async function onSubmit(values: FormValues) {
    // Always succeeds server-side, even for unknown emails (anti-enumeration).
    await authApi.forgotPassword(values.email).catch(() => undefined);
    setSent(true);
  }

  if (sent) {
    return (
      <div className="text-center">
        <h1 className="text-2xl font-semibold text-ink-900">Check your email</h1>
        <p className="mt-2 text-sm text-ink-500">
          If an account exists for <strong>{getValues("email")}</strong>, we've
          sent a 6-digit code. It expires in 10 minutes.
        </p>
        <Button
          className="mt-6 w-full"
          onClick={() =>
            navigate("/verify-otp", { state: { email: getValues("email") } })
          }
        >
          Enter code
        </Button>
      </div>
    );
  }

  return (
    <div>
      <h1 className="text-2xl font-semibold text-ink-900">
        Forgot your password?
      </h1>
      <p className="mt-1 text-sm text-ink-500">
        Enter your email and we'll send you a reset code.
      </p>

      <form
        onSubmit={handleSubmit(onSubmit)}
        className="mt-6 space-y-4"
        noValidate
      >
        <Input
          label="Email"
          type="email"
          autoComplete="email"
          error={errors.email?.message}
          {...register("email")}
        />
        <Button
          type="submit"
          size="lg"
          loading={isSubmitting}
          className="w-full"
        >
          Send reset code
        </Button>
      </form>

      <p className="mt-6 text-center text-sm">
        <Link to="/login" className="text-primary-700 hover:underline">
          Back to sign in
        </Link>
      </p>
    </div>
  );
}
