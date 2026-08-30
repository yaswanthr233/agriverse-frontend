import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { AdminVetVerification } from "./AdminVetVerification";
import { adminApi } from "@/api/endpoints/admin";
import type { AdminVetListItem } from "@/api/types";

vi.mock("@/api/endpoints/admin", () => ({
  adminApi: {
    veterinarians: vi.fn(),
    verifyVeterinarian: vi.fn(),
    rejectVeterinarian: vi.fn(),
  },
}));

function createWrapper() {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
    },
  });
  return ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );
}

const mockApplications: AdminVetListItem[] = [
  {
    id: 1,
    userId: 10,
    fullName: "Dr. Ananya Sharma",
    email: "ananya@agriverse.in",
    phone: "9876543210",
    role: "VETERINARIAN",
    houseStreetNo: "12, Vet Nagar",
    district: "Krishna",
    state: "Andhra Pradesh",
    pincode: "520002",
    city: "Vijayawada",
    isActive: true,
    isVerified: false,
    verificationStatus: "PENDING",
    registrationNumber: "VCI-AP-2024-8842",
    issuingAuthority: "Andhra Pradesh State Veterinary Council",
    qualification: "B.V.Sc & A.H.",
    college: "NTR College of Veterinary Science",
    graduationYear: 2020,
    registrationCertificateUrl: "https://storage.agriverse.in/certificates/vci-8842.pdf",
    verificationReason: null,
    verificationMethod: "MANUAL",
    registryName: null,
    registryReference: null,
    registryCheckedAt: null,
    verifiedBy: null,
    verifiedAt: null,
    createdAt: "2026-08-30T09:00:00Z",
    updatedAt: "2026-08-30T09:00:00Z",
  },
];

describe("AdminVetVerification Component", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders pending veterinarian applications in table", async () => {
    vi.mocked(adminApi.veterinarians).mockResolvedValue({
      content: mockApplications,
      totalElements: 1,
      totalPages: 1,
      number: 0,
      size: 50,
      first: true,
      last: true,
      empty: false,
    });

    render(<AdminVetVerification />, { wrapper: createWrapper() });

    expect(screen.getByText(/Veterinarian Credential Verification/i)).toBeInTheDocument();
    await waitFor(() => {
      expect(screen.getByText("Dr. Ananya Sharma")).toBeInTheDocument();
      expect(screen.getByText("VCI-AP-2024-8842")).toBeInTheDocument();
      expect(screen.getByText("Andhra Pradesh State Veterinary Council")).toBeInTheDocument();
    });
  });

  it("opens verification modal when clicking Verify button", async () => {
    vi.mocked(adminApi.veterinarians).mockResolvedValue({
      content: mockApplications,
      totalElements: 1,
      totalPages: 1,
      number: 0,
      size: 50,
      first: true,
      last: true,
      empty: false,
    });

    render(<AdminVetVerification />, { wrapper: createWrapper() });

    await waitFor(() => {
      expect(screen.getByText("Dr. Ananya Sharma")).toBeInTheDocument();
    });

    const verifyBtn = screen.getByRole("button", { name: /verify/i });
    fireEvent.click(verifyBtn);

    expect(screen.getByText(/Verify Veterinarian Credentials/i)).toBeInTheDocument();
    expect(screen.getByText(/Approve & Verify Doctor/i)).toBeInTheDocument();
  });
});

