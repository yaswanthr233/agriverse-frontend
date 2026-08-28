import { useEffect, useState } from "react";
import { useLocation, useNavigate, Navigate } from "react-router-dom";
import { authApi } from "@/api/endpoints/auth";
import { ApiError } from "@/api/client";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";

export function VerifyOtp() {
  const navigate = useNavigate();
  const location = useLocation();
  const email = (location.state as { email?: string } | null)?.email;

  const [otp, setOtp] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [secondsLeft, setSecondsLeft] = useState(600);

  useEffect(() => {
    if (secondsLeft <= 0) return;
    const t = setTimeout(() => setSecondsLeft((s) => s - 1), 1000);
    return () => clearTimeout(t);
  }, [secondsLeft]);

  // Reached directly without going through /forgot-password.
  if (!email) return <Navigate to="/forgot-password" replace />;

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      const res = await authApi.verifyOtp(email!, otp);
      if (!res.verified) {
        setError("That code isn't valid. Check it and try again.");
        return;
      }
      navigate("/reset-password", { state: { email, otp } });
    } catch (err) {
      setError(
        err instanceof ApiError ? err.message : "Something went wrong.",
      );
    } finally {
      setSubmitting(false);
    }
  }

  const mm = String(Math.floor(secondsLeft / 60)).padStart(2, "0");
  const ss = String(secondsLeft % 60).padStart(2, "0");

  return (
    <div>
      <h1 className="text-2xl font-semibold text-ink-900">Enter your code</h1>
      <p className="mt-1 text-sm text-ink-500">
        We sent a 6-digit code to {email}.
      </p>

      <form onSubmit={onSubmit} className="mt-6 space-y-4">
        <Input
          label="Verification code"
          inputMode="numeric"
          maxLength={6}
          placeholder="000000"
          value={otp}
          onChange={(e) => setOtp(e.target.value)}
          error={error ?? undefined}
        />
        <p className="text-sm text-ink-500">
          {secondsLeft > 0
            ? `Code expires in ${mm}:${ss}`
            : "Your code has expired."}
        </p>
        <Button
          type="submit"
          size="lg"
          loading={submitting}
          disabled={otp.length < 4}
          className="w-full"
        >
          Verify code
        </Button>
      </form>

      <button
        onClick={() => {
          void authApi.resendOtp(email!);
          setSecondsLeft(600);
          setError(null);
        }}
        className="mt-4 w-full text-center text-sm text-primary-700 hover:underline"
      >
        Resend code
      </button>
    </div>
  );
}
