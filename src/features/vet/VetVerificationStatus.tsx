import { useState } from "react";
import { Link } from "react-router-dom";
import {
  Clock,
  CheckCircle2,
  AlertCircle,
  FileText,
  ShieldCheck,
  RefreshCw,
  ArrowRight,
  ExternalLink,
  Phone,
  Mail,
  Building2,
  GraduationCap,
  Award,
} from "lucide-react";
import { useAuthStore } from "@/stores/authStore";
import { authApi } from "@/api/endpoints/auth";
import { tokenStorage } from "@/lib/tokenStorage";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import toast from "react-hot-toast";

export function VetVerificationStatus() {
  const user = useAuthStore((s) => s.user);
  const setSession = useAuthStore((s) => s.setSession);

  const [isRefreshing, setIsRefreshing] = useState(false);

  const vetProfile = user?.veterinarianProfile;
  const status = user?.verificationStatus || vetProfile?.verificationStatus || (user?.isVerified ? "VERIFIED" : "PENDING");

  async function handleRefreshStatus() {
    setIsRefreshing(true);
    try {
      const profile = await authApi.me();
      const access = tokenStorage.getAccess();
      const refresh = tokenStorage.getRefresh();

      if (access && refresh) {
        setSession({
          accessToken: access,
          refreshToken: refresh,
          tokenType: "Bearer",
          expiresIn: 900,
          refreshExpiresIn: 604800,
          userId: profile.id,
          fullName: profile.fullName,
          email: profile.email,
          phone: profile.phone,
          role: profile.role,
          houseStreetNo: profile.houseStreetNo,
          pincode: profile.pincode,
          district: profile.district,
          state: profile.state,
          city: profile.city,
          latitude: profile.latitude,
          longitude: profile.longitude,
          isVerified: profile.isVerified,
          verificationStatus: profile.verificationStatus,
          veterinarianProfile: profile.veterinarianProfile,
          avatarUrl: profile.avatarUrl,
        });
      }
      if (profile.verificationStatus === "VERIFIED" || profile.isVerified) {
        toast.success("Congratulations! Your credentials have been verified.");
      } else {
        toast("Status updated: " + (profile.verificationStatus || "PENDING"));
      }
    } catch {
      toast.error("Could not refresh status. Please check your connection.");
    } finally {
      setIsRefreshing(false);
    }
  }

  return (
    <div className="mx-auto max-w-3xl space-y-6 py-4">
      {/* Header Banner */}
      <div className="flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-ink-900">
            Veterinarian Credential Verification
          </h1>
          <p className="mt-1 text-sm text-ink-500">
            Official regulatory compliance and verification status for veterinary practice.
          </p>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={handleRefreshStatus}
          loading={isRefreshing}
          className="gap-2"
        >
          <RefreshCw className={`size-4 ${isRefreshing ? "animate-spin" : ""}`} />
          Refresh Status
        </Button>
      </div>

      {/* Main Status Hero Card */}
      {status === "PENDING" && (
        <Card className="border-amber-200 bg-amber-50/50 p-6">
          <div className="flex items-start gap-4">
            <div className="rounded-full bg-amber-100 p-3 text-amber-600">
              <Clock className="size-8" />
            </div>
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <Badge tone="warning">
                  Under Administrator Review
                </Badge>
                <span className="text-xs text-amber-700">Verification in progress</span>
              </div>
              <h2 className="text-xl font-semibold text-ink-900">
                Your credentials have been submitted for verification
              </h2>
              <p className="text-sm leading-relaxed text-ink-600">
                To safeguard animal welfare and comply with veterinary regulations, all veterinary doctors must be verified by an administrator before consultation bookings, patient charts, and schedule management are enabled.
              </p>
              <div className="pt-2">
                <div className="rounded-md bg-white p-3 border border-amber-200 text-xs text-ink-600 flex items-center gap-2">
                  <ShieldCheck className="size-4 text-emerald-600 shrink-0" />
                  <span>
                    Typical review turnaround time: <strong>24 to 48 hours</strong>. Once verified, your status will update automatically.
                  </span>
                </div>
              </div>
            </div>
          </div>
        </Card>
      )}

      {status === "VERIFIED" && (
        <Card className="border-emerald-200 bg-emerald-50/50 p-6">
          <div className="flex items-start gap-4">
            <div className="rounded-full bg-emerald-100 p-3 text-emerald-600">
              <CheckCircle2 className="size-8" />
            </div>
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <Badge tone="success">
                  Verified Veterinary Practitioner
                </Badge>
                <span className="text-xs text-emerald-700">Active License</span>
              </div>
              <h2 className="text-xl font-semibold text-ink-900">
                Your veterinarian account is verified and fully active!
              </h2>
              <p className="text-sm leading-relaxed text-ink-600">
                Your submitted credentials and council registration have been verified by the administrator. Farmers can now view your profile in the veterinary consultation directory.
              </p>
              <div className="pt-3">
                <Link to="/vet/dashboard">
                  <Button variant="primary" className="gap-2">
                    Open Veterinary Dashboard
                    <ArrowRight className="size-4" />
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        </Card>
      )}

      {status === "REJECTED" && (
        <Card className="border-rose-200 bg-rose-50/50 p-6">
          <div className="flex items-start gap-4">
            <div className="rounded-full bg-rose-100 p-3 text-rose-600">
              <AlertCircle className="size-8" />
            </div>
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <Badge tone="danger">
                  Verification Rejected
                </Badge>
                <span className="text-xs text-rose-700">Action Required</span>
              </div>
              <h2 className="text-xl font-semibold text-ink-900">
                Your veterinarian verification was not approved
              </h2>
              <p className="text-sm leading-relaxed text-ink-600">
                The administrator was unable to verify your credentials with the provided information.
              </p>

              {vetProfile?.verificationReason && (
                <div className="mt-3 rounded-lg border border-rose-200 bg-white p-4">
                  <h3 className="text-xs font-semibold uppercase tracking-wider text-rose-800">
                    Administrator Feedback / Rejection Reason:
                  </h3>
                  <p className="mt-1 text-sm font-medium text-rose-900">
                    &ldquo;{vetProfile.verificationReason}&rdquo;
                  </p>
                </div>
              )}

              <div className="flex items-center gap-3 pt-3">
                <a href="mailto:support@agriverse.in" className="inline-block">
                  <Button variant="outline" size="sm" className="gap-2">
                    <Mail className="size-4" />
                    Contact Support
                  </Button>
                </a>
              </div>
            </div>
          </div>
        </Card>
      )}

      {/* Submitted Professional Details Card */}
      <Card className="p-6">
        <div className="flex items-center justify-between border-b border-ink-100 pb-4">
          <div>
            <h2 className="text-base font-semibold text-ink-900">
              Submitted Professional Profile
            </h2>
            <p className="text-xs text-ink-500">
              Credentials provided during registration for review
            </p>
          </div>
          <Badge
            tone={
              status === "VERIFIED"
                ? "success"
                : status === "REJECTED"
                ? "danger"
                : "warning"
            }
          >
            {status}
          </Badge>
        </div>

        <div className="mt-6 grid grid-cols-1 gap-6 sm:grid-cols-2">
          {/* Registration Number */}
          <div className="flex items-start gap-3">
            <div className="rounded-lg bg-ink-50 p-2 text-ink-700">
              <Award className="size-5" />
            </div>
            <div>
              <span className="block text-xs font-medium text-ink-500">
                Veterinary Council Reg Number
              </span>
              <span className="text-sm font-semibold text-ink-900">
                {vetProfile?.registrationNumber || "Pending Submission"}
              </span>
            </div>
          </div>

          {/* Issuing Authority */}
          <div className="flex items-start gap-3">
            <div className="rounded-lg bg-ink-50 p-2 text-ink-700">
              <Building2 className="size-5" />
            </div>
            <div>
              <span className="block text-xs font-medium text-ink-500">
                Issuing Veterinary Authority
              </span>
              <span className="text-sm font-semibold text-ink-900">
                {vetProfile?.issuingAuthority || "State Veterinary Council"}
              </span>
            </div>
          </div>

          {/* Qualification */}
          <div className="flex items-start gap-3">
            <div className="rounded-lg bg-ink-50 p-2 text-ink-700">
              <GraduationCap className="size-5" />
            </div>
            <div>
              <span className="block text-xs font-medium text-ink-500">
                Degree / Qualification
              </span>
              <span className="text-sm font-semibold text-ink-900">
                {vetProfile?.qualification || "B.V.Sc & A.H."}
              </span>
            </div>
          </div>

          {/* College & Grad Year */}
          <div className="flex items-start gap-3">
            <div className="rounded-lg bg-ink-50 p-2 text-ink-700">
              <Building2 className="size-5" />
            </div>
            <div>
              <span className="block text-xs font-medium text-ink-500">
                College / University
              </span>
              <span className="text-sm font-semibold text-ink-900">
                {vetProfile?.college || "Veterinary University"}
                {vetProfile?.graduationYear ? ` (Graduated ${vetProfile.graduationYear})` : ""}
              </span>
            </div>
          </div>

          {/* Contact Details */}
          <div className="flex items-start gap-3">
            <div className="rounded-lg bg-ink-50 p-2 text-ink-700">
              <Mail className="size-5" />
            </div>
            <div>
              <span className="block text-xs font-medium text-ink-500">
                Registered Contact
              </span>
              <span className="text-sm font-semibold text-ink-900">
                {user?.fullName} ({user?.email})
              </span>
              <span className="block text-xs text-ink-500">{user?.phone}</span>
            </div>
          </div>

          {/* Address */}
          <div className="flex items-start gap-3">
            <div className="rounded-lg bg-ink-50 p-2 text-ink-700">
              <Phone className="size-5" />
            </div>
            <div>
              <span className="block text-xs font-medium text-ink-500">
                Practice Location
              </span>
              <span className="text-sm font-semibold text-ink-900">
                {[user?.houseStreetNo, user?.district, user?.state, user?.pincode]
                  .filter(Boolean)
                  .join(", ") || "Registered Clinic Location"}
              </span>
            </div>
          </div>
        </div>

        {/* Certificate Document Links */}
        <div className="mt-6 border-t border-ink-100 pt-4">
          <h3 className="text-xs font-semibold uppercase tracking-wider text-ink-500">
            Uploaded Verification Documents
          </h3>
          <div className="mt-3 flex flex-wrap gap-3">
            {vetProfile?.registrationCertificateUrl ? (
              <a
                href={vetProfile.registrationCertificateUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 rounded-lg border border-primary-200 bg-primary-50 px-3 py-2 text-xs font-medium text-primary-800 hover:bg-primary-100"
              >
                <FileText className="size-4" />
                Registration Certificate
                <ExternalLink className="size-3" />
              </a>
            ) : (
              <span className="text-xs text-ink-400">No certificate document uploaded</span>
            )}

            {vetProfile?.qualificationCertificateUrl && (
              <a
                href={vetProfile.qualificationCertificateUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 rounded-lg border border-ink-200 bg-ink-50 px-3 py-2 text-xs font-medium text-ink-800 hover:bg-ink-100"
              >
                <FileText className="size-4" />
                Degree / Qualification Certificate
                <ExternalLink className="size-3" />
              </a>
            )}
          </div>
        </div>
      </Card>
    </div>
  );
}

