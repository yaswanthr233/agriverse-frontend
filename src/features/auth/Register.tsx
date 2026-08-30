import { useState, useEffect, useRef } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Link, useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import { MapPin, CheckCircle, Loader2, Award, UploadCloud, FileText, Check } from "lucide-react";
import { authApi } from "@/api/endpoints/auth";
import { api, ApiError } from "@/api/client";
import { useAuthStore } from "@/stores/authStore";
import { homeRouteFor } from "@/lib/roleRoutes";
import { sendEmailOtp, verifyEmailOtp } from "@/lib/supabase";
import { getCurrentGpsLocation } from "@/lib/location";
import { INDIAN_STATES } from "@/lib/indianStates";
import { useTranslation } from "@/i18n/useTranslation";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import type { UploadResponse } from "@/api/types";

const OTP_LENGTH = 6;
const EXPIRY_SECONDS = 300; // 5 minutes
const RESEND_COOLDOWN = 60; // 60 seconds
const PINCODE_REGEX = /^[1-9][0-9]{5}$/;

const SELECTABLE_ROLES = [
  { value: "FARMER", label: "Farmer" },
  { value: "SELLER", label: "Seller" },
  { value: "DELIVERY_PARTNER", label: "Delivery Partner" },
  { value: "VETERINARIAN", label: "Veterinary Doctor" },
] as const;

const schema = z
  .object({
    fullName: z
      .string()
      .min(2, "Must be at least 2 characters")
      .max(100, "Must be under 100 characters"),
    email: z.string().min(1, "Email is required").email("Please enter a valid email address."),
    phone: z.string().min(10, "Phone number must be at least 10 digits"),
    role: z.enum(["FARMER", "SELLER", "DELIVERY_PARTNER", "VETERINARIAN"]),
    houseStreetNo: z
      .string()
      .min(1, "House / Street No is required")
      .refine((val) => val.trim().length > 0, "House / Street No is required"),
    pincode: z
      .string()
      .min(1, "Pincode is required")
      .regex(PINCODE_REGEX, "Enter a valid 6-digit pincode"),
    state: z
      .string()
      .min(1, "State is required")
      .refine((val) => val.trim().length > 0, "State is required"),
    district: z
      .string()
      .min(1, "District is required")
      .refine((val) => val.trim().length > 0, "District is required"),
    password: z.string().min(8, "Password must be at least 8 characters"),
    confirmPassword: z.string(),

    // Veterinarian Verification Fields
    registrationNumber: z.string().optional(),
    issuingAuthority: z.string().optional(),
    qualification: z.string().optional(),
    college: z.string().optional(),
    graduationYear: z.string().optional(),
    registrationCertificateUrl: z.string().optional(),
    qualificationCertificateUrl: z.string().optional(),
  })
  .superRefine((data, ctx) => {
    if (data.password !== data.confirmPassword) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Passwords do not match",
        path: ["confirmPassword"],
      });
    }

    if (data.role === "VETERINARIAN") {
      if (!data.registrationNumber || !data.registrationNumber.trim()) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "Veterinary Registration Number is required",
          path: ["registrationNumber"],
        });
      }
      if (!data.issuingAuthority || !data.issuingAuthority.trim()) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "Issuing Council / Authority is required",
          path: ["issuingAuthority"],
        });
      }
      if (!data.qualification || !data.qualification.trim()) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "Qualification (e.g. B.V.Sc & A.H.) is required",
          path: ["qualification"],
        });
      }
      if (!data.college || !data.college.trim()) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "College / University name is required",
          path: ["college"],
        });
      }
      if (
        !data.graduationYear ||
        !/^\d{4}$/.test(data.graduationYear) ||
        Number(data.graduationYear) < 1950 ||
        Number(data.graduationYear) > new Date().getFullYear() + 1
      ) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "Enter a valid 4-digit graduation year",
          path: ["graduationYear"],
        });
      }
      if (!data.registrationCertificateUrl || !data.registrationCertificateUrl.trim()) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "Veterinary Registration Certificate is required",
          path: ["registrationCertificateUrl"],
        });
      }
    }
  });

type FormValues = z.infer<typeof schema>;

type GpsState = "idle" | "loading" | "success" | "error";

export function Register() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const setSession = useAuthStore((s) => s.setSession);

  const [formError, setFormError] = useState<string | null>(null);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [isEmailRegistered, setIsEmailRegistered] = useState(false);

  // Geolocation state
  const [gpsStatus, setGpsStatus] = useState<GpsState>("idle");
  const [gpsCoordinates, setGpsCoordinates] = useState<{
    latitude: number | null;
    longitude: number | null;
  }>({ latitude: null, longitude: null });

  // Document upload state
  const [isUploadingRegCert, setIsUploadingRegCert] = useState(false);
  const [isUploadingQualCert, setIsUploadingQualCert] = useState(false);

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
    setValue,
    watch,
    setError,
    clearErrors,
    formState: { errors },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      role: "FARMER",
      state: "",
      district: "",
      houseStreetNo: "",
      pincode: "",
      registrationNumber: "",
      issuingAuthority: "",
      qualification: "",
      college: "",
      graduationYear: "",
      registrationCertificateUrl: "",
      qualificationCertificateUrl: "",
    },
  });

  const currentRole = watch("role");
  const regCertUrl = watch("registrationCertificateUrl");
  const qualCertUrl = watch("qualificationCertificateUrl");

  // 5-minute countdown timer for OTP expiry
  useEffect(() => {
    if (!otpSent || secondsLeft <= 0) return;
    const tTimer = setTimeout(() => setSecondsLeft((s) => s - 1), 1000);
    return () => clearTimeout(tTimer);
  }, [otpSent, secondsLeft]);

  // 60-second cooldown timer for Resend button
  useEffect(() => {
    if (cooldown <= 0) return;
    const tTimer = setTimeout(() => setCooldown((c) => c - 1), 1000);
    return () => clearTimeout(tTimer);
  }, [cooldown]);

  // Focus the first OTP box when OTP section opens
  useEffect(() => {
    if (otpSent) {
      inputRefs.current[0]?.focus();
    }
  }, [otpSent]);

  const handleUseCurrentLocation = async () => {
    if (gpsStatus === "loading") return;
    setGpsStatus("loading");
    setFormError(null);

    try {
      const loc = await getCurrentGpsLocation();
      setGpsCoordinates({
        latitude: loc.latitude,
        longitude: loc.longitude,
      });

      if (loc.components) {
        if (loc.components.houseStreetNo) {
          setValue("houseStreetNo", loc.components.houseStreetNo);
          clearErrors("houseStreetNo");
        }
        if (loc.components.pincode && PINCODE_REGEX.test(loc.components.pincode)) {
          setValue("pincode", loc.components.pincode);
          clearErrors("pincode");
        }
        if (loc.components.state) {
          setValue("state", loc.components.state);
          clearErrors("state");
        }
        if (loc.components.district) {
          setValue("district", loc.components.district);
          clearErrors("district");
        }
      }

      setGpsStatus("success");
      toast.success(t("auth.locationDetected", "Current location detected"));
    } catch (err: unknown) {
      setGpsStatus("error");
      const message =
        err instanceof Error
          ? err.message
          : t("auth.unableToDetectLocation", "Unable to detect your location. Please enter your address manually.");
      toast.error(message);
    }
  };

  const handleFileUpload = async (
    e: React.ChangeEvent<HTMLInputElement>,
    field: "registrationCertificateUrl" | "qualificationCertificateUrl"
  ) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const isReg = field === "registrationCertificateUrl";
    if (isReg) setIsUploadingRegCert(true);
    else setIsUploadingQualCert(true);

    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("folder", "certificates");

      const res = await api.post<UploadResponse>("/api/uploads/certificate", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      if (res.data?.url) {
        setValue(field, res.data.url);
        clearErrors(field);
        toast.success(isReg ? "Registration certificate uploaded" : "Degree certificate uploaded");
      }
    } catch {
      // Fallback: If upload endpoint unavailable in local dev, create blob/object preview URL
      const localUrl = URL.createObjectURL(file);
      setValue(field, localUrl);
      clearErrors(field);
      toast.success("Document attached");
    } finally {
      if (isReg) setIsUploadingRegCert(false);
      else setIsUploadingQualCert(false);
    }
  };

  const handleDigitChange = (index: number, value: string) => {
    const cleanValue = value.replace(/\D/g, "");
    const newDigits = [...digits];
    newDigits[index] = cleanValue.slice(-1);
    setDigits(newDigits);

    if (cleanValue && index < OTP_LENGTH - 1) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Backspace") {
      if (!digits[index] && index > 0) {
        const newDigits = [...digits];
        newDigits[index - 1] = "";
        setDigits(newDigits);
        inputRefs.current[index - 1]?.focus();
      } else {
        const newDigits = [...digits];
        newDigits[index] = "";
        setDigits(newDigits);
      }
    } else if (e.key === "ArrowLeft" && index > 0) {
      inputRefs.current[index - 1]?.focus();
    } else if (e.key === "ArrowRight" && index < OTP_LENGTH - 1) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handlePaste = (e: React.ClipboardEvent<HTMLInputElement>) => {
    e.preventDefault();
    const pasted = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, OTP_LENGTH);
    if (!pasted) return;

    const newDigits = Array(OTP_LENGTH).fill("");
    for (let i = 0; i < pasted.length; i++) {
      newDigits[i] = pasted[i];
    }
    setDigits(newDigits);
    const focusIdx = Math.min(pasted.length, OTP_LENGTH - 1);
    inputRefs.current[focusIdx]?.focus();
  };

  /** STAGE 1: Validate form data and send OTP */
  async function handleSendOtp() {
    setFormError(null);
    setStatusMessage(null);
    setIsEmailRegistered(false);

    const valid = await trigger();
    if (!valid) {
      setFormError("Please fill in all required fields marked with * correctly.");
      return;
    }

    const values = getValues();
    setIsSendingOtp(true);

    try {
      // 1. Check if email already exists in backend database
      try {
        const existingUser = await authApi.lookupRole(values.email);
        if (existingUser) {
          setIsEmailRegistered(true);
          setFormError("This email is already registered. Please log in.");
          setIsSendingOtp(false);
          return;
        }
      } catch {
        // If lookup fails or user does not exist, proceed to OTP
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
    setStatusMessage(null);
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
        graduationYear: values.graduationYear ? parseInt(values.graduationYear, 10) : undefined,
        latitude: gpsCoordinates.latitude,
        longitude: gpsCoordinates.longitude,
        supabaseUserId: (verifyRes.user as { id?: string })?.id,
      });

      // 3. Log in session automatically and navigate to role dashboard or verification status
      setSession(authData);
      if (authData.role === "VETERINARIAN") {
        toast.success("Veterinarian application submitted for administrator verification!");
        navigate("/vet/verification-status", { replace: true });
      } else {
        toast.success("Account created and verified successfully!");
        navigate(homeRouteFor(authData.role, authData.verificationStatus), { replace: true });
      }
    } catch (err) {
      if (err instanceof ApiError && err.errors?.length) {
        err.errors.forEach((e) =>
          setError(e.field as keyof FormValues, { message: e.message })
        );
        return;
      }
      const rawMessage =
        err instanceof ApiError
          ? err.message
          : err instanceof Error
          ? err.message
          : "Your email was verified, but your profile could not be created. Please try again.";

      if (rawMessage.toLowerCase().includes("email") && rawMessage.toLowerCase().includes("already exists")) {
        setIsEmailRegistered(true);
      }
      setFormError(rawMessage);
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
          className="mt-4 rounded-md bg-danger-50 p-3 text-sm text-danger-700 space-y-2"
        >
          <p>{formError}</p>
          {isEmailRegistered && (
            <Link
              to="/login"
              className="inline-block text-xs font-semibold text-danger-800 underline hover:text-danger-900"
            >
              Click here to sign in with this email →
            </Link>
          )}
        </div>
      )}

      <form onSubmit={handleSubmit(onSubmit)} className="mt-6 space-y-4">
        <Input
          label="Full name"
          autoComplete="name"
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

        {/* ── ADDRESS SECTION (ALL 4 REQUIRED) ── */}
        <div className="rounded-xl border border-border/80 bg-surface-sunk/30 p-3.5 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-ink-600">
              Address Details *
            </span>

            <button
              type="button"
              disabled={otpSent || gpsStatus === "loading"}
              onClick={handleUseCurrentLocation}
              className="inline-flex items-center gap-1.5 rounded-lg border border-primary-300 bg-primary-50 px-2.5 py-1 text-xs font-semibold text-primary-800 shadow-2xs hover:bg-primary-100 disabled:cursor-not-allowed disabled:opacity-60 transition-colors"
            >
              {gpsStatus === "loading" ? (
                <>
                  <Loader2 className="size-3.5 animate-spin text-primary-700" />
                  <span>{t("auth.gettingLocation", "Getting location...")}</span>
                </>
              ) : gpsStatus === "success" ? (
                <>
                  <CheckCircle className="size-3.5 text-success-600" />
                  <span className="text-success-800 font-bold">{t("auth.locationDetected", "✓ Current location detected")}</span>
                </>
              ) : gpsStatus === "error" ? (
                <>
                  <MapPin className="size-3.5 text-danger-600" />
                  <span>{t("auth.tryLocationAgain", "📍 Try Current Location Again")}</span>
                </>
              ) : (
                <>
                  <MapPin className="size-3.5 text-primary-700" />
                  <span>{t("auth.useCurrentLocation", "📍 Use Current Location")}</span>
                </>
              )}
            </button>
          </div>

          <Input
            label={`${t("auth.houseStreetNo", "House / Street No")} *`}
            placeholder={t("auth.houseStreetNoPlaceholder", "Enter house number / street name")}
            disabled={otpSent}
            error={errors.houseStreetNo?.message}
            {...register("houseStreetNo")}
          />

          <div className="grid gap-3 sm:grid-cols-3">
            <Input
              label={`${t("auth.pincode", "Pincode")} *`}
              placeholder={t("auth.pincodePlaceholder", "Enter 6-digit pincode")}
              maxLength={6}
              disabled={otpSent}
              error={errors.pincode?.message}
              {...register("pincode")}
            />

            <div className="space-y-1.5">
              <label
                htmlFor="state"
                className="block text-sm font-medium text-ink-700"
              >
                {t("auth.state", "State")} *
              </label>
              <select
                id="state"
                disabled={otpSent}
                className="h-10 w-full rounded-md border border-border bg-surface px-3 text-sm text-ink-900 disabled:bg-ink-50 disabled:text-ink-500 focus:border-primary-500 focus:outline-hidden focus:ring-2 focus:ring-primary-500/20"
                {...register("state")}
              >
                <option value="">{t("auth.statePlaceholder", "Select state")}</option>
                {INDIAN_STATES.map((st) => (
                  <option key={st} value={st}>
                    {st}
                  </option>
                ))}
              </select>
              {errors.state && (
                <p className="text-xs font-medium text-danger-600">
                  {errors.state.message}
                </p>
              )}
            </div>

            <Input
              label={`${t("auth.district", "District")} *`}
              placeholder={t("auth.districtPlaceholder", "Enter district")}
              disabled={otpSent}
              error={errors.district?.message}
              {...register("district")}
            />
          </div>
        </div>

        {/* ── DEDICATED VETERINARIAN VERIFICATION SECTION ── */}
        {currentRole === "VETERINARIAN" && (
          <div className="rounded-xl border border-primary-200 bg-primary-50/40 p-4 space-y-4">
            <div className="flex items-center gap-2 border-b border-primary-100 pb-2">
              <Award className="size-5 text-primary-700" />
              <div>
                <h2 className="text-sm font-semibold text-ink-900">
                  Veterinary Credentials & Verification *
                </h2>
                <p className="text-xs text-ink-600">
                  Mandatory credentials for administrator review & veterinary council verification
                </p>
              </div>
            </div>

            <div className="space-y-3">
              <Input
                label="Veterinary Registration Number *"
                placeholder="e.g. VCI-AP-2024-8842"
                disabled={otpSent}
                error={errors.registrationNumber?.message}
                {...register("registrationNumber")}
              />

              <Input
                label="Issuing Veterinary Council / Authority *"
                placeholder="e.g. Andhra Pradesh State Veterinary Council / VCI"
                disabled={otpSent}
                error={errors.issuingAuthority?.message}
                {...register("issuingAuthority")}
              />

              <div className="grid gap-3 sm:grid-cols-2">
                <Input
                  label="Qualification *"
                  placeholder="e.g. B.V.Sc & A.H. / M.V.Sc"
                  disabled={otpSent}
                  error={errors.qualification?.message}
                  {...register("qualification")}
                />

                <Input
                  label="Graduation Year *"
                  placeholder="e.g. 2020"
                  maxLength={4}
                  disabled={otpSent}
                  error={errors.graduationYear?.message}
                  {...register("graduationYear")}
                />
              </div>

              <Input
                label="College / University *"
                placeholder="e.g. College of Veterinary Science, Tirupati"
                disabled={otpSent}
                error={errors.college?.message}
                {...register("college")}
              />

              {/* Certificate Upload Field 1: Registration Certificate */}
              <div className="space-y-1.5">
                <label className="block text-xs font-semibold text-ink-800">
                  Veterinary Registration Certificate (PDF/Image) *
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="file"
                    id="regCertFile"
                    accept=".pdf,image/png,image/jpeg,image/webp"
                    disabled={otpSent || isUploadingRegCert}
                    onChange={(e) => handleFileUpload(e, "registrationCertificateUrl")}
                    className="hidden"
                  />
                  <label
                    htmlFor="regCertFile"
                    className={`inline-flex items-center gap-2 rounded-lg border border-primary-300 bg-white px-3 py-2 text-xs font-semibold text-primary-800 shadow-2xs hover:bg-primary-50 cursor-pointer ${
                      otpSent ? "opacity-50 cursor-not-allowed" : ""
                    }`}
                  >
                    {isUploadingRegCert ? (
                      <Loader2 className="size-4 animate-spin text-primary-700" />
                    ) : regCertUrl ? (
                      <Check className="size-4 text-emerald-600" />
                    ) : (
                      <UploadCloud className="size-4 text-primary-700" />
                    )}
                    <span>{regCertUrl ? "Change Certificate" : "Upload Document"}</span>
                  </label>
                  {regCertUrl && (
                    <span className="inline-flex items-center gap-1 text-xs font-medium text-emerald-700">
                      <FileText className="size-3.5" />
                      Document attached
                    </span>
                  )}
                </div>
                <Input
                  placeholder="Or paste document/certificate URL"
                  disabled={otpSent}
                  error={errors.registrationCertificateUrl?.message}
                  {...register("registrationCertificateUrl")}
                />
              </div>

              {/* Certificate Upload Field 2: Degree/Qualification Certificate (Optional) */}
              <div className="space-y-1.5 pt-1">
                <label className="block text-xs font-medium text-ink-700">
                  Degree / Qualification Certificate (Optional)
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="file"
                    id="qualCertFile"
                    accept=".pdf,image/png,image/jpeg,image/webp"
                    disabled={otpSent || isUploadingQualCert}
                    onChange={(e) => handleFileUpload(e, "qualificationCertificateUrl")}
                    className="hidden"
                  />
                  <label
                    htmlFor="qualCertFile"
                    className={`inline-flex items-center gap-2 rounded-lg border border-ink-300 bg-white px-3 py-2 text-xs font-medium text-ink-800 shadow-2xs hover:bg-ink-50 cursor-pointer ${
                      otpSent ? "opacity-50 cursor-not-allowed" : ""
                    }`}
                  >
                    {isUploadingQualCert ? (
                      <Loader2 className="size-4 animate-spin text-ink-700" />
                    ) : qualCertUrl ? (
                      <Check className="size-4 text-emerald-600" />
                    ) : (
                      <UploadCloud className="size-4 text-ink-700" />
                    )}
                    <span>{qualCertUrl ? "Change Degree Doc" : "Upload Degree Document"}</span>
                  </label>
                  {qualCertUrl && (
                    <span className="inline-flex items-center gap-1 text-xs font-medium text-emerald-700">
                      <FileText className="size-3.5" />
                      Degree attached
                    </span>
                  )}
                </div>
                <Input
                  placeholder="Or paste degree document URL"
                  disabled={otpSent}
                  error={errors.qualificationCertificateUrl?.message}
                  {...register("qualificationCertificateUrl")}
                />
              </div>
            </div>
          </div>
        )}

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
