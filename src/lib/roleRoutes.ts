import type { Role, VetVerificationStatus } from "@/api/types";

const HOME: Record<Role, string> = {
  FARMER: "/app/dashboard",
  SELLER: "/seller/dashboard",
  ADMIN: "/admin/dashboard",
  VETERINARIAN: "/vet/dashboard",
  DELIVERY_PARTNER: "/delivery/dashboard",
};

export function homeRouteFor(
  role: Role | undefined | null,
  verificationStatus?: VetVerificationStatus | string | null
): string {
  if (!role) return "/";

  if (role === "VETERINARIAN") {
    if (verificationStatus && verificationStatus !== "VERIFIED") {
      return "/vet/verification-status";
    }
  }

  return HOME[role] || "/";
}
