import { useState, useEffect, useRef } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Link, useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import { authApi } from "@/api/endpoints/auth";
import { ApiError } from "@/api/client";
import { useAuthStore } from "@/stores/authStore";
import { homeRouteFor } from "@/lib/roleRoutes";
import { sendEmailOtp, verifyEmailOtp } from "@/lib/supabase";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";

const OTP_LENGTH = 6;
const EXPIRY_SECONDS = 300; // 5 minutes
const RESEND_COOLDOWN = 60; // 60 seconds

// Delivery partners and Admins are provisioned by administration
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
    email: z.string().min(1, "Email is required").email("Please enter a valid email address."),
    phone: z.string().min(10, "Phone number must be at least 10 digits"),
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
  const setSession = useAuthStore((s) => s.setSession);

  const [formError, setFormError] = useState<string | null>(null);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [isEmailRegistered, setIsEmailRegistered] = useState(false);

  // OTP workflow states
  const [otpSent, setOtpSent] = useState(false);
  const [digits, setDigits] = useState<string[]>(Array(OTP_LENGTH).fill(""));
  const [isSendingOtp, setIsSendingOtp] = useState(false);
  const [isResending, setIsResending] = useState(false);
  const [isVerifying, setIsVerifying] = useState(false);
  const [secondsLeft, setSecondsLeft] = useState(EXPIRY_SECONDS);
  const [cooldown, setCooldown] = useState(0);

  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  const {
    register,
    handleSubmit,
    trigger,
    getValues,
    setError,
    formState: { errors },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { role: "FARMER" },
  });

  // 5-minute countdown timer for OTP expiry
  useEffect(() => {
    if (!otpSent || secondsLeft <= 0) return;
    const t = setTimeout(() => setSecondsLeft((s) => s - 1), 1000);
    return () => clearTimeout(t);
  }, [otpSent, secondsLeft]);

  // 60-second cooldown timer for Resend button
  useEffect(() => {
    if (cooldown <= 0) return;
    const t = setTimeout(() => setCooldown((c) => c - 1), 1000);
    return () => clearTimeout(t);
  }, [cooldown]);

  // Focus the first OTP box when OTP section opens
  useEffect(() => {
    if (otpSent) {
      inputRefs.current[0]?.focus();
    }
  }, [otpSent]);

  const handleDigitChange = (index: number, value: string) => {
    const cleanValue = value.replace(/\D/g, "");
    if (!cleanValue) {
      const next = [...digits];
      next[index] = "";
      setDigits(next);
      return;
    }

    const next = [...digits];
    next[index] = cleanValue[cleanValue.length - 1];
    setDigits(next);
    setFormError(null);

    // Auto-advance to next box
    if (index < OTP_LENGTH - 1) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Backspace") {
      if (!digits[index] && index > 0) {
        inputRefs.current[index - 1]?.focus();
      }
    } else if (e.key === "ArrowLeft" && index > 0) {
      inputRefs.current[index - 1]?.focus();
    } else if (e.key === "ArrowRight" && index < OTP_LENGTH - 1) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handlePaste = (e: React.ClipboardEvent<HTMLInputElement>) => {
    e.preventDefault();
    const pastedData = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, OTP_LENGTH);
    if (!pastedData) return;

    const next = [...digits];
    for (let i = 0; i < pastedData.length; i++) {
      next[i] = pastedData[i];
    }
    setDigits(next);
    setFormError(null);

    const nextFocusIndex = Math.min(pastedData.length, OTP_LENGTH - 1);
    inputRefs.current[nextFocusIndex]?.focus();
  };

  /** STAGE 1: Validate form, check email existence, and request Supabase OTP */
  async function handleSendOtp() {
    setFormError(null);
    setStatusMessage(null);
    setIsEmailRegistered(false);

    const isValid = await trigger();
    if (!isValid) return;

    const values = getValues();
    setIsSendingOtp(true);

    try {
      // 1. Check if email already registered in AgriVerse
      const check = await authApi.checkEmail(values.email);
      if (check.exists) {
        setIsEmailRegistered(true);
        setFormError("This email is already registered. Please log in.");
        setIsSendingOtp(false);
        return;
      }

      // 2. Request OTP via Supabase Auth
      const otpRes = await sendEmailOtp(values.email);
      if (!otpRes.success) {
        setFormError(otpRes.error || "Unable to send verification code. Please try again.");
        setIsSendingOtp(false);
        return;
      }

      // 3. Reveal OTP input section in the same form
      setOtpSent(true);
      setStatusMessage("Verification code sent to your email.");
      setSecondsLeft(EXPIRY_SECONDS);
      setCooldown(RESEND_COOLDOWN);
      setDigits(Array(OTP_LENGTH).fill(""));
    } catch (err) {
      setFormError(err instanceof Error ? err.message : "Something went wrong. Please try again.");
    } finally {
      setIsSendingOtp(false);
    }
  }

  /** RESEND OTP */
  async function handleResendOtp() {
    if (cooldown > 0 || isResending) return;
    setFormError(null);
    setStatusMessage(null);
    setIsResending(true);

    const email = getValues("email");
    try {
      const otpRes = await sendEmailOtp(email);
      if (!otpRes.success) {
        setFormError(otpRes.error || "Failed to resend verification code.");
      } else {
        setStatusMessage("Verification code sent to your email.");
        setSecondsLeft(EXPIRY_SECONDS);
        setCooldown(RESEND_COOLDOWN);
        setDigits(Array(OTP_LENGTH).fill(""));
        inputRefs.current[0]?.focus();
      }
    } catch (err) {
      setFormError(err instanceof Error ? err.message : "Unable to connect to the server. Please try again.");
    } finally {
      setIsResending(false);
    }
  }

  /** STAGE 2: Verify OTP with Supabase, then create application account/profile */
  async function onSubmit(values: FormValues) {
    if (!otpSent) {
      await handleSendOtp();
      return;
    }

    const otpCode = digits.join("");
    if (otpCode.length !== OTP_LENGTH) {
      setFormError("Please enter the complete 6-digit verification code.");
      return;
    }

    if (secondsLeft <= 0) {
      setFormError("This verification code has expired. Please request a new code.");
      return;
    }

    setFormError(null);
    setIsVerifying(true);

    try {
      // 1. Verify OTP with Supabase Auth
      const verifyRes = await verifyEmailOtp(values.email, otpCode);
      if (!verifyRes.success) {
        setFormError(verifyRes.error || "Invalid verification code. Please check the code and try again.");
        setIsVerifying(false);
        return;
      }

      // 2. Create/update application profile in Supabase PostgreSQL via backend
      const { confirmPassword: _ignored, ...payload } = values;
      const authData = await authApi.register({
        ...payload,
        supabaseUserId: (verifyRes.user as { id?: string })?.id,
      });

      // 3. Log in session automatically and navigate to role dashboard
      setSession(authData);
      toast.success("Account created and verified successfully!");
      navigate(homeRouteFor(authData.role), { replace: true });
    } catch (err) {
      if (err instanceof ApiError && err.errors?.length) {
        err.errors.forEach((e) =>
          setError(e.field as keyof FormValues, { message: e.message })
        );
        return;
      }
      setFormError(
        err instanceof ApiError
          ? err.message
          : "Something went wrong creating your profile. Please try again."
      );
    } finally {
      setIsVerifying(false);
    }
  }

  const emailValue = getValues("email");
  const mm = String(Math.floor(secondsLeft / 60)).padStart(2, "0");
  const ss = String(secondsLeft % 60).padStart(2, "0");

  return (
    <div>
      <h1 className="text-2xl font-semibold text-ink-900">
        Create your account
      </h1>
      <p className="mt-1 text-sm text-ink-500">Join AgriVerse in a minute.</p>

      {statusMessage && (
        <p
          role="status"
          className="mt-4 rounded-md bg-primary-50 px-3 py-2 text-sm text-primary-800"
        >
          {statusMessage}
        </p>
      )}

      {formError && (
        <div
          role="alert"
          className="mt-4 rounded-md bg-danger-50 px-3 py-2 text-sm text-danger-700 space-y-1"
        >
          <p>{formError}</p>
          {isEmailRegistered && (
            <Link
              to="/login"
              className="inline-block font-semibold text-primary-700 hover:underline"
            >
              Click here to Sign In →
            </Link>
          )}
        </div>
      )}

      <form
        onSubmit={handleSubmit(onSubmit)}
        className="mt-6 space-y-4"
        noValidate
      >
        <Input
          label="Full name"
          disabled={otpSent}
          error={errors.fullName?.message}
          {...register("fullName")}
        />

        <div className="space-y-1.5">
          <Input
            label="Email"
            type="email"
            autoComplete="email"
            disabled={otpSent}
            error={errors.email?.message}
            {...register("email")}
          />
        </div>

        {/* ── DYNAMIC EMAIL OTP VERIFICATION SECTION ── */}
        {otpSent && (
          <div className="rounded-xl border border-primary-100 bg-primary-50/50 p-4 space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-medium text-ink-600">Verification code</p>
                <p className="text-xs text-ink-500">
                  Sent to: <span className="font-semibold text-ink-900">{emailValue}</span>
                </p>
              </div>
              <button
                type="button"
                onClick={() => {
                  setOtpSent(false);
                  setFormError(null);
                  setStatusMessage(null);
                }}
                className="text-xs font-medium text-primary-700 hover:underline"
              >
                Change email
              </button>
            </div>

            <div className="flex items-center justify-between gap-2">
              {digits.map((digit, idx) => (
                <input
                  key={idx}
                  ref={(el) => {
                    inputRefs.current[idx] = el;
                  }}
                  type="text"
                  inputMode="numeric"
                  pattern="[0-9]*"
                  maxLength={1}
                  value={digit}
                  onChange={(e) => handleDigitChange(idx, e.target.value)}
                  onKeyDown={(e) => handleKeyDown(idx, e)}
                  onPaste={idx === 0 ? handlePaste : undefined}
                  className="h-11 w-11 rounded-lg border border-border bg-surface text-center text-lg font-bold text-ink-900 shadow-xs focus:border-primary-500 focus:outline-hidden focus:ring-2 focus:ring-primary-500/20"
                  aria-label={`Verification code digit ${idx + 1}`}
                />
              ))}
            </div>

            <div className="flex items-center justify-between text-xs text-ink-500 pt-1">
              <span>
                {secondsLeft > 0 ? (
                  <>Expires in <span className="font-mono font-medium text-ink-800">{mm}:{ss}</span></>
                ) : (
                  <span className="text-danger-600 font-medium">Code expired</span>
                )}
              </span>
              <button
                type="button"
                onClick={handleResendOtp}
                disabled={cooldown > 0 || isResending}
                className="font-medium text-primary-700 hover:underline disabled:cursor-not-allowed disabled:text-ink-400"
              >
                {cooldown > 0
                  ? `Resend code in ${cooldown}s`
                  : isResending
                    ? "Sending..."
                    : "Resend Code"}
              </button>
            </div>
          </div>
        )}

        <Input
          label="Phone"
          type="tel"
          autoComplete="tel"
          disabled={otpSent}
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
            disabled={otpSent}
            className="h-10 w-full rounded-md border border-border bg-surface px-3 text-sm text-ink-900 disabled:bg-ink-50 disabled:text-ink-500"
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
          <Input label="City (optional)" disabled={otpSent} {...register("city")} />
          <Input label="State (optional)" disabled={otpSent} {...register("state")} />
        </div>

        <Input
          label="Password"
          type="password"
          autoComplete="new-password"
          disabled={otpSent}
          hint="At least 8 characters"
          error={errors.password?.message}
          {...register("password")}
        />
        <Input
          label="Confirm password"
          type="password"
          autoComplete="new-password"
          disabled={otpSent}
          error={errors.confirmPassword?.message}
          {...register("confirmPassword")}
        />

        {!otpSent ? (
          <Button
            type="button"
            size="lg"
            onClick={handleSendOtp}
            loading={isSendingOtp}
            className="w-full"
          >
            Send Verification Code
          </Button>
        ) : (
          <Button
            type="submit"
            size="lg"
            loading={isVerifying}
            className="w-full"
          >
            Verify Email & Create Account
          </Button>
        )}
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
