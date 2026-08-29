import { useEffect, useRef, useState } from "react";
import { useLocation, useNavigate, Navigate, Link } from "react-router-dom";
import { authApi } from "@/api/endpoints/auth";
import { ApiError } from "@/api/client";
import { Button } from "@/components/ui/Button";

const OTP_LENGTH = 6;
const EXPIRY_SECONDS = 300; // 5 minutes
const RESEND_COOLDOWN = 60; // 60 seconds

export function VerifyEmail() {
  const navigate = useNavigate();
  const location = useLocation();
  const state = location.state as { email?: string; message?: string } | null;
  const email = state?.email;

  const [digits, setDigits] = useState<string[]>(Array(OTP_LENGTH).fill(""));
  const [error, setError] = useState<string | null>(null);
  const [infoMessage, setInfoMessage] = useState<string | null>(state?.message || null);
  const [submitting, setSubmitting] = useState(false);
  const [resending, setResending] = useState(false);
  const [secondsLeft, setSecondsLeft] = useState(EXPIRY_SECONDS);
  const [cooldown, setCooldown] = useState(0);

  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  // 5-minute countdown timer for OTP expiry
  useEffect(() => {
    if (secondsLeft <= 0) return;
    const t = setTimeout(() => setSecondsLeft((s) => s - 1), 1000);
    return () => clearTimeout(t);
  }, [secondsLeft]);

  // 60-second cooldown timer for Resend button
  useEffect(() => {
    if (cooldown <= 0) return;
    const t = setTimeout(() => setCooldown((c) => c - 1), 1000);
    return () => clearTimeout(t);
  }, [cooldown]);

  // Initial focus on first input box
  useEffect(() => {
    inputRefs.current[0]?.focus();
  }, []);

  if (!email) {
    return <Navigate to="/register" replace />;
  }

  const handleDigitChange = (index: number, value: string) => {
    // Only accept numeric characters
    const cleanValue = value.replace(/\D/g, "");
    if (!cleanValue) {
      const next = [...digits];
      next[index] = "";
      setDigits(next);
      return;
    }

    const next = [...digits];
    // Handle typing single digit
    next[index] = cleanValue[cleanValue.length - 1];
    setDigits(next);
    setError(null);

    // Auto-advance to next input
    if (index < OTP_LENGTH - 1) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Backspace") {
      if (!digits[index] && index > 0) {
        // Move to previous input on backspace if current is empty
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
    setError(null);

    const nextFocusIndex = Math.min(pastedData.length, OTP_LENGTH - 1);
    inputRefs.current[nextFocusIndex]?.focus();
  };

  const otpCode = digits.join("");
  const isComplete = otpCode.length === OTP_LENGTH;

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!isComplete) return;

    setError(null);
    setInfoMessage(null);
    setSubmitting(true);

    try {
      await authApi.verifyEmail({ email: email!, otp: otpCode });
      navigate("/login", {
        state: { message: "Email verified successfully! Please sign in to access your dashboard." },
        replace: true,
      });
    } catch (err) {
      setError(
        err instanceof ApiError ? err.message : "Invalid or expired verification code."
      );
    } finally {
      setSubmitting(false);
    }
  }

  async function onResend() {
    if (cooldown > 0 || resending) return;
    setError(null);
    setResending(true);

    try {
      const res = await authApi.resendVerification(email!);
      setInfoMessage(res.message);
      setSecondsLeft(EXPIRY_SECONDS);
      setCooldown(RESEND_COOLDOWN);
      setDigits(Array(OTP_LENGTH).fill(""));
      inputRefs.current[0]?.focus();
    } catch (err) {
      setError(
        err instanceof ApiError ? err.message : "Failed to resend verification code."
      );
    } finally {
      setResending(false);
    }
  }

  const mm = String(Math.floor(secondsLeft / 60)).padStart(2, "0");
  const ss = String(secondsLeft % 60).padStart(2, "0");

  return (
    <div>
      <h1 className="text-2xl font-semibold text-ink-900">Verify your email</h1>
      <p className="mt-1 text-sm text-ink-500">
        We sent a 6-digit verification code to <span className="font-semibold text-ink-900">{email}</span>.
      </p>

      {infoMessage && (
        <p
          role="status"
          className="mt-4 rounded-md bg-primary-50 px-3 py-2 text-sm text-primary-800"
        >
          {infoMessage}
        </p>
      )}

      <form onSubmit={onSubmit} className="mt-6 space-y-5">
        <div className="space-y-2">
          <label className="block text-sm font-medium text-ink-700">
            6-Digit Verification Code
          </label>
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
                className="h-12 w-12 rounded-lg border border-border bg-surface text-center text-xl font-bold text-ink-900 shadow-xs focus:border-primary-500 focus:outline-hidden focus:ring-2 focus:ring-primary-500/20"
                aria-label={`Digit ${idx + 1}`}
              />
            ))}
          </div>
        </div>

        <div className="flex items-center justify-between text-xs text-ink-500">
          <span>
            {secondsLeft > 0 ? (
              <>Expires in <span className="font-mono font-medium text-ink-800">{mm}:{ss}</span></>
            ) : (
              <span className="text-danger-600 font-medium">Code expired</span>
            )}
          </span>
          <button
            type="button"
            onClick={onResend}
            disabled={cooldown > 0 || resending}
            className="font-medium text-primary-700 hover:underline disabled:cursor-not-allowed disabled:text-ink-400"
          >
            {cooldown > 0 ? `Resend in ${cooldown}s` : resending ? "Sending..." : "Resend Code"}
          </button>
        </div>

        {error && (
          <p
            role="alert"
            className="rounded-md bg-danger-50 px-3 py-2 text-sm text-danger-700"
          >
            {error}
          </p>
        )}

        <Button
          type="submit"
          size="lg"
          loading={submitting}
          disabled={!isComplete || secondsLeft <= 0}
          className="w-full"
        >
          Verify & Continue
        </Button>
      </form>

      <p className="mt-6 text-center text-sm text-ink-500">
        Wrong email?{" "}
        <Link
          to="/register"
          className="font-medium text-primary-700 hover:underline"
        >
          Change address
        </Link>
      </p>
    </div>
  );
}
