import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import toast from "react-hot-toast";
import {
  Award,
  CheckCircle,
  XCircle,
  Eye,
  FileText,
  ExternalLink,
  Search,
  RefreshCw,
} from "lucide-react";
import { adminApi } from "@/api/endpoints/admin";
import { qk } from "@/api/queryKeys";
import type { AdminVetListItem, VerifyVetRequest, RejectVetRequest } from "@/api/types";
import { useDebounce } from "@/hooks/useDebounce";
import { formatDate } from "@/lib/format";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Badge } from "@/components/ui/Badge";
import { Modal } from "@/components/ui/Modal";
import { Skeleton } from "@/components/ui/Skeleton";
import { EmptyState } from "@/components/feedback/EmptyState";
import { ErrorState } from "@/components/feedback/ErrorState";

const REJECTION_PRESETS = [
  "Registration certificate is illegible or unclear",
  "Registration number not found in State / VCI records",
  "Veterinary registration has expired",
  "Qualification / degree does not meet clinical practice requirements",
  "Information mismatch between application and uploaded certificate",
  "Other (Specify below)",
];

export function AdminVetVerification() {
  const queryClient = useQueryClient();

  const [statusFilter, setStatusFilter] = useState<string>("PENDING");
  const [searchInput, setSearchInput] = useState<string>("");
  const debouncedSearch = useDebounce(searchInput, 300);

  // Selected applications for Modals
  const [inspectVet, setInspectVet] = useState<AdminVetListItem | null>(null);
  const [verifyTarget, setVerifyTarget] = useState<AdminVetListItem | null>(null);
  const [rejectTarget, setRejectTarget] = useState<AdminVetListItem | null>(null);

  // Verification Form State
  const [verifyMethod, setVerifyMethod] = useState<"MANUAL" | "OFFICIAL_REGISTRY">("MANUAL");
  const [registryName, setRegistryName] = useState<string>("Veterinary Council of India");
  const [registryRef, setRegistryRef] = useState<string>("");

  // Rejection Form State
  const [selectedPreset, setSelectedPreset] = useState<string>(REJECTION_PRESETS[0]);
  const [customReason, setCustomReason] = useState<string>("");

  const {
    data: pageData,
    isLoading,
    isError,
    error,
    refetch,
  } = useQuery({
    queryKey: ["admin", "veterinarians", statusFilter, debouncedSearch],
    queryFn: () => adminApi.veterinarians(statusFilter === "ALL" ? undefined : statusFilter, debouncedSearch),
  });

  const verifyMutation = useMutation({
    mutationFn: ({ id, data }: { id: number; data: VerifyVetRequest }) =>
      adminApi.verifyVeterinarian(id, data),
    onSuccess: (updated) => {
      toast.success(`Dr. ${updated.fullName} verified successfully!`);
      queryClient.invalidateQueries({ queryKey: ["admin", "veterinarians"] });
      queryClient.invalidateQueries({ queryKey: qk.adminDashboard() });
      setVerifyTarget(null);
      if (inspectVet?.id === updated.id) setInspectVet(null);
    },
    onError: (err: unknown) => {
      const msg = err instanceof Error ? err.message : "Failed to verify veterinarian";
      toast.error(msg);
    },
  });

  const rejectMutation = useMutation({
    mutationFn: ({ id, data }: { id: number; data: RejectVetRequest }) =>
      adminApi.rejectVeterinarian(id, data),
    onSuccess: (updated) => {
      toast.success(`Application for Dr. ${updated.fullName} rejected.`);
      queryClient.invalidateQueries({ queryKey: ["admin", "veterinarians"] });
      queryClient.invalidateQueries({ queryKey: qk.adminDashboard() });
      setRejectTarget(null);
      if (inspectVet?.id === updated.id) setInspectVet(null);
    },
    onError: (err: unknown) => {
      const msg = err instanceof Error ? err.message : "Failed to reject application";
      toast.error(msg);
    },
  });

  const handleConfirmVerify = () => {
    if (!verifyTarget) return;
    verifyMutation.mutate({
      id: verifyTarget.id,
      data: {
        verificationMethod: verifyMethod,
        registryName: verifyMethod === "OFFICIAL_REGISTRY" ? registryName : undefined,
        registryReference: verifyMethod === "OFFICIAL_REGISTRY" ? registryRef : undefined,
      },
    });
  };

  const handleConfirmReject = () => {
    if (!rejectTarget) return;
    const finalReason =
      selectedPreset === "Other (Specify below)"
        ? customReason.trim()
        : customReason.trim()
        ? `${selectedPreset}: ${customReason.trim()}`
        : selectedPreset;

    if (!finalReason) {
      toast.error("Please provide a rejection reason.");
      return;
    }

    rejectMutation.mutate({
      id: rejectTarget.id,
      data: { reason: finalReason },
    });
  };

  const applications = pageData?.content ?? [];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-ink-900">
            Veterinarian Credential Verification
          </h1>
          <p className="mt-1 text-sm text-ink-500">
            Review veterinary licenses, council registrations, and academic certificates before granting clinical permissions.
          </p>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={() => void refetch()}
          className="gap-2 self-start sm:self-auto"
        >
          <RefreshCw className="size-4" />
          Refresh List
        </Button>
      </div>

      {/* Filter Tabs & Search Bar */}
      <Card className="p-4">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div className="flex flex-wrap gap-2">
            {[
              { id: "PENDING", label: "Pending Review" },
              { id: "VERIFIED", label: "Verified Doctors" },
              { id: "REJECTED", label: "Rejected" },
              { id: "ALL", label: "All Applicants" },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setStatusFilter(tab.id)}
                className={`rounded-lg px-3.5 py-1.5 text-xs font-semibold transition-colors ${
                  statusFilter === tab.id
                    ? "bg-primary-600 text-white shadow-xs"
                    : "bg-surface-sunk/60 text-ink-600 hover:bg-surface-sunk hover:text-ink-900"
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          <div className="relative w-full md:w-72">
            <Search className="absolute left-3 top-2.5 size-4 text-ink-400" />
            <Input
              placeholder="Search name, reg no, email..."
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              className="pl-9 text-xs"
            />
          </div>
        </div>
      </Card>

      {/* Main Content Area */}
      {isLoading && (
        <Card className="p-6">
          <div className="space-y-4">
            {Array.from({ length: 5 }).map((_, i) => (
              <Skeleton key={i} className="h-16 w-full" />
            ))}
          </div>
        </Card>
      )}

      {isError && <ErrorState error={error} onRetry={() => void refetch()} />}

      {!isLoading && !isError && applications.length === 0 && (
        <EmptyState
          icon={Award}
          title={`No ${statusFilter.toLowerCase()} applications found`}
          description={
            debouncedSearch
              ? `No applicants matched "${debouncedSearch}".`
              : `There are currently no veterinarian applications in the ${statusFilter} state.`
          }
        />
      )}

      {!isLoading && !isError && applications.length > 0 && (
        <Card className="overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-ink-100 bg-surface-sunk/40 text-left text-xs font-semibold uppercase tracking-wider text-ink-500">
                  <th className="py-3.5 pl-4 pr-3">Doctor / Applicant</th>
                  <th className="px-3 py-3.5">Registration No</th>
                  <th className="px-3 py-3.5">Authority & State</th>
                  <th className="px-3 py-3.5">Qualification</th>
                  <th className="px-3 py-3.5">Documents</th>
                  <th className="px-3 py-3.5">Status</th>
                  <th className="py-3.5 pl-3 pr-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-ink-100 text-sm">
                {applications.map((vet) => (
                  <tr key={vet.id} className="hover:bg-surface-sunk/20 transition-colors">
                    <td className="py-4 pl-4 pr-3">
                      <div className="font-semibold text-ink-900">{vet.fullName}</div>
                      <div className="text-xs text-ink-500">{vet.email}</div>
                      <div className="text-xs text-ink-400">{vet.phone}</div>
                    </td>
                    <td className="px-3 py-4">
                      <span className="font-mono text-xs font-bold text-ink-900">
                        {vet.registrationNumber}
                      </span>
                    </td>
                    <td className="px-3 py-4">
                      <div className="text-xs font-medium text-ink-800">{vet.issuingAuthority}</div>
                      <div className="text-xs text-ink-500">{vet.state || "India"}</div>
                    </td>
                    <td className="px-3 py-4">
                      <div className="text-xs font-semibold text-ink-800">{vet.qualification}</div>
                      <div className="text-xs text-ink-500">
                        {vet.college} {vet.graduationYear ? `(${vet.graduationYear})` : ""}
                      </div>
                    </td>
                    <td className="px-3 py-4">
                      <div className="flex items-center gap-2">
                        {vet.registrationCertificateUrl ? (
                          <a
                            href={vet.registrationCertificateUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1 rounded bg-primary-50 px-2 py-1 text-xs font-semibold text-primary-800 hover:bg-primary-100"
                          >
                            <FileText className="size-3" />
                            Reg Cert
                            <ExternalLink className="size-2.5" />
                          </a>
                        ) : (
                          <span className="text-xs text-ink-400">None</span>
                        )}
                      </div>
                    </td>
                    <td className="px-3 py-4">
                      <Badge
                        tone={
                          vet.verificationStatus === "VERIFIED"
                            ? "success"
                            : vet.verificationStatus === "REJECTED"
                            ? "danger"
                            : "warning"
                        }
                      >
                        {vet.verificationStatus}
                      </Badge>
                    </td>
                    <td className="py-4 pl-3 pr-4 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setInspectVet(vet)}
                          title="View Full Application"
                          className="gap-1 text-ink-700 hover:bg-ink-100"
                        >
                          <Eye className="size-3.5" />
                          View
                        </Button>

                        {vet.verificationStatus !== "VERIFIED" && (
                          <Button
                            variant="primary"
                            size="sm"
                            onClick={() => setVerifyTarget(vet)}
                            className="gap-1 bg-emerald-600 hover:bg-emerald-700 text-white"
                          >
                            <CheckCircle className="size-3.5" />
                            Verify
                          </Button>
                        )}

                        {vet.verificationStatus !== "REJECTED" && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setRejectTarget(vet)}
                            className="gap-1 border-rose-200 text-rose-700 hover:bg-rose-50"
                          >
                            <XCircle className="size-3.5" />
                            Reject
                          </Button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      {/* ── MODAL 1: Full Application Details / Inspection ── */}
      {inspectVet && (
        <Modal
          open={!!inspectVet}
          onClose={() => setInspectVet(null)}
          title={`Veterinarian Application: ${inspectVet.fullName}`}
        >
          <div className="space-y-6">
            <div className="flex items-center justify-between rounded-xl bg-surface-sunk/50 p-4">
              <div className="flex items-center gap-3">
                <div className="rounded-full bg-primary-100 p-2 text-primary-700">
                  <Award className="size-6" />
                </div>
                <div>
                  <h3 className="font-semibold text-ink-900">{inspectVet.fullName}</h3>
                  <p className="text-xs text-ink-500">
                    Application submitted {formatDate(inspectVet.createdAt)}
                  </p>
                </div>
              </div>
              <Badge
                tone={
                  inspectVet.verificationStatus === "VERIFIED"
                    ? "success"
                    : inspectVet.verificationStatus === "REJECTED"
                    ? "danger"
                    : "warning"
                }
              >
                {inspectVet.verificationStatus}
              </Badge>
            </div>

            {inspectVet.verificationStatus === "REJECTED" && inspectVet.verificationReason && (
              <div className="rounded-lg border border-rose-200 bg-rose-50 p-3.5 text-xs text-rose-800">
                <strong>Rejection Reason:</strong> {inspectVet.verificationReason}
              </div>
            )}

            {inspectVet.verificationStatus === "VERIFIED" && inspectVet.verifiedBy && (
              <div className="rounded-lg border border-emerald-200 bg-emerald-50 p-3 text-xs text-emerald-800">
                <strong>Verified by Admin:</strong> {inspectVet.verifiedBy.fullName} on{" "}
                {formatDate(inspectVet.verifiedAt)}
              </div>
            )}

            {/* Detailed Grid */}
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div className="space-y-1">
                <span className="text-xs text-ink-500 font-medium">Veterinary Reg Number</span>
                <p className="font-mono text-sm font-bold text-ink-900">
                  {inspectVet.registrationNumber}
                </p>
              </div>

              <div className="space-y-1">
                <span className="text-xs text-ink-500 font-medium">Issuing Authority</span>
                <p className="text-sm font-semibold text-ink-900">
                  {inspectVet.issuingAuthority}
                </p>
              </div>

              <div className="space-y-1">
                <span className="text-xs text-ink-500 font-medium">Degree / Qualification</span>
                <p className="text-sm font-semibold text-ink-900">{inspectVet.qualification}</p>
              </div>

              <div className="space-y-1">
                <span className="text-xs text-ink-500 font-medium">College & Year</span>
                <p className="text-sm text-ink-800">
                  {inspectVet.college} ({inspectVet.graduationYear || "N/A"})
                </p>
              </div>

              <div className="space-y-1">
                <span className="text-xs text-ink-500 font-medium">Contact Details</span>
                <p className="text-sm text-ink-800">{inspectVet.email}</p>
                <p className="text-xs text-ink-600">{inspectVet.phone}</p>
              </div>

              <div className="space-y-1">
                <span className="text-xs text-ink-500 font-medium">Practice Location</span>
                <p className="text-sm text-ink-800">
                  {[inspectVet.houseStreetNo, inspectVet.district, inspectVet.state, inspectVet.pincode]
                    .filter(Boolean)
                    .join(", ") || "Location not provided"}
                </p>
              </div>
            </div>

            {/* Document Inspection Buttons */}
            <div className="border-t border-ink-100 pt-4">
              <h4 className="text-xs font-semibold uppercase tracking-wider text-ink-600 mb-3">
                Uploaded Verification Credentials
              </h4>
              <div className="flex flex-wrap gap-3">
                {inspectVet.registrationCertificateUrl ? (
                  <a
                    href={inspectVet.registrationCertificateUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 rounded-lg border border-primary-300 bg-primary-50 px-4 py-2.5 text-xs font-semibold text-primary-900 hover:bg-primary-100"
                  >
                    <FileText className="size-4" />
                    Open Registration Certificate
                    <ExternalLink className="size-3.5" />
                  </a>
                ) : (
                  <span className="text-xs text-ink-400">No registration certificate</span>
                )}

                {inspectVet.qualificationCertificateUrl && (
                  <a
                    href={inspectVet.qualificationCertificateUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 rounded-lg border border-ink-300 bg-ink-50 px-4 py-2.5 text-xs font-semibold text-ink-900 hover:bg-ink-100"
                  >
                    <FileText className="size-4" />
                    Open Degree Certificate
                    <ExternalLink className="size-3.5" />
                  </a>
                )}
              </div>
            </div>

            {/* Quick Actions in Detail Modal */}
            <div className="flex items-center justify-end gap-3 border-t border-ink-100 pt-4">
              <Button variant="outline" onClick={() => setInspectVet(null)}>
                Close
              </Button>
              {inspectVet.verificationStatus !== "REJECTED" && (
                <Button
                  variant="outline"
                  className="border-rose-300 text-rose-700 hover:bg-rose-50"
                  onClick={() => {
                    const target = inspectVet;
                    setInspectVet(null);
                    setRejectTarget(target);
                  }}
                >
                  Reject Application
                </Button>
              )}
              {inspectVet.verificationStatus !== "VERIFIED" && (
                <Button
                  variant="primary"
                  className="bg-emerald-600 hover:bg-emerald-700 text-white"
                  onClick={() => {
                    const target = inspectVet;
                    setInspectVet(null);
                    setVerifyTarget(target);
                  }}
                >
                  Verify Credentials
                </Button>
              )}
            </div>
          </div>
        </Modal>
      )}

      {/* ── MODAL 2: Verify Credentials Confirmation ── */}
      {verifyTarget && (
        <Modal
          open={!!verifyTarget}
          onClose={() => setVerifyTarget(null)}
          title="Verify Veterinarian Credentials"
        >
          <div className="space-y-4">
            <p className="text-sm text-ink-600">
              Confirm that you have reviewed the submitted documents and verified that{" "}
              <strong>{verifyTarget.fullName}</strong> holds a valid veterinary registration (
              <span className="font-mono font-semibold">{verifyTarget.registrationNumber}</span>).
            </p>

            <div className="space-y-3 rounded-lg border border-border bg-surface-sunk/40 p-3.5">
              <label className="block text-xs font-semibold text-ink-800">
                Verification Method
              </label>
              <div className="flex gap-4">
                <label className="flex items-center gap-2 text-xs font-medium text-ink-700 cursor-pointer">
                  <input
                    type="radio"
                    name="method"
                    value="MANUAL"
                    checked={verifyMethod === "MANUAL"}
                    onChange={() => setVerifyMethod("MANUAL")}
                  />
                  Manual Certificate Inspection
                </label>
                <label className="flex items-center gap-2 text-xs font-medium text-ink-700 cursor-pointer">
                  <input
                    type="radio"
                    name="method"
                    value="OFFICIAL_REGISTRY"
                    checked={verifyMethod === "OFFICIAL_REGISTRY"}
                    onChange={() => setVerifyMethod("OFFICIAL_REGISTRY")}
                  />
                  Official Council Registry Check
                </label>
              </div>

              {verifyMethod === "OFFICIAL_REGISTRY" && (
                <div className="space-y-2 pt-2">
                  <Input
                    label="Council / Registry Name"
                    value={registryName}
                    onChange={(e) => setRegistryName(e.target.value)}
                    className="text-xs"
                  />
                  <Input
                    label="Registry Reference / Roll Number"
                    placeholder="e.g. VCI-REG-98742"
                    value={registryRef}
                    onChange={(e) => setRegistryRef(e.target.value)}
                    className="text-xs"
                  />
                </div>
              )}
            </div>

            <div className="flex items-center justify-end gap-3 pt-3">
              <Button
                variant="outline"
                onClick={() => setVerifyTarget(null)}
                disabled={verifyMutation.isPending}
              >
                Cancel
              </Button>
              <Button
                variant="primary"
                onClick={handleConfirmVerify}
                loading={verifyMutation.isPending}
                className="bg-emerald-600 hover:bg-emerald-700 text-white gap-2"
              >
                <CheckCircle className="size-4" />
                Approve & Verify Doctor
              </Button>
            </div>
          </div>
        </Modal>
      )}

      {/* ── MODAL 3: Reject Application with Reason ── */}
      {rejectTarget && (
        <Modal
          open={!!rejectTarget}
          onClose={() => setRejectTarget(null)}
          title="Reject Veterinarian Application"
        >
          <div className="space-y-4">
            <p className="text-sm text-ink-600">
              Please specify the reason for rejecting the application for{" "}
              <strong>{rejectTarget.fullName}</strong>. This reason will be displayed to the applicant.
            </p>

            <div className="space-y-2">
              <label className="block text-xs font-semibold text-ink-800">
                Select Rejection Reason *
              </label>
              <select
                value={selectedPreset}
                onChange={(e) => setSelectedPreset(e.target.value)}
                className="w-full rounded-md border border-border bg-surface px-3 py-2 text-xs text-ink-900 focus:border-primary-500 focus:outline-hidden"
              >
                {REJECTION_PRESETS.map((p) => (
                  <option key={p} value={p}>
                    {p}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-1.5">
              <label className="block text-xs font-semibold text-ink-800">
                Additional Feedback / Notes
              </label>
              <textarea
                rows={3}
                placeholder="Provide specific details regarding missing stamps, expired dates, or illegible text..."
                value={customReason}
                onChange={(e) => setCustomReason(e.target.value)}
                className="w-full rounded-md border border-border bg-surface p-2.5 text-xs text-ink-900 focus:border-primary-500 focus:outline-hidden"
              />
            </div>

            <div className="flex items-center justify-end gap-3 pt-3">
              <Button
                variant="outline"
                onClick={() => setRejectTarget(null)}
                disabled={rejectMutation.isPending}
              >
                Cancel
              </Button>
              <Button
                variant="danger"
                onClick={handleConfirmReject}
                loading={rejectMutation.isPending}
                className="gap-2"
              >
                <XCircle className="size-4" />
                Confirm Rejection
              </Button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}

