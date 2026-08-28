import type { Role } from "@/api/types";

const HOME: Record<Role, string> = {
  FARMER: "/app/dashboard",
  SELLER: "/seller/dashboard",
  ADMIN: "/admin/dashboard",
  VETERINARIAN: "/vet/dashboard",
  DELIVERY_PARTNER: "/delivery/dashboard",
};

export function homeRouteFor(role: Role | undefined | null): string {
  return role ? HOME[role] : "/";
}
