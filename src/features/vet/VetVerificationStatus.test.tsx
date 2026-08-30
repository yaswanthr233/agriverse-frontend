import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { VetVerificationStatus } from "./VetVerificationStatus";
import { useAuthStore } from "@/stores/authStore";

describe("VetVerificationStatus Component", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders PENDING status screen with submitted details and review message", () => {
    useAuthStore.setState({
      status: "authenticated",
      user: {
        userId: 10,
        fullName: "Dr. Ananya Sharma",
        email: "ananya@agriverse.in",
        phone: "9876543210",
        role: "VETERINARIAN",
        isVerified: false,
        verificationStatus: "PENDING",
        avatarUrl: null,
        veterinarianProfile: {
          id: 1,
          userId: 10,
          registrationNumber: "VCI-AP-2024-8842",
          issuingAuthority: "Andhra Pradesh State Veterinary Council",
          state: "Andhra Pradesh",
          qualification: "B.V.Sc & A.H.",
          college: "NTR College of Veterinary Science",
          graduationYear: 2020,
          registrationCertificateUrl: "https://storage.agriverse.in/certificates/vci-8842.pdf",
          verificationStatus: "PENDING",
          createdAt: "2026-08-30T09:00:00Z",
          updatedAt: "2026-08-30T09:00:00Z",
        },
      },
    });

    render(
      <MemoryRouter>
        <VetVerificationStatus />
      </MemoryRouter>
    );

    expect(screen.getByText(/Veterinarian Credential Verification/i)).toBeInTheDocument();
    expect(screen.getByText(/Your credentials have been submitted for verification/i)).toBeInTheDocument();
    expect(screen.getByText("VCI-AP-2024-8842")).toBeInTheDocument();
    expect(screen.getByText("Andhra Pradesh State Veterinary Council")).toBeInTheDocument();
    expect(screen.getByText("B.V.Sc & A.H.")).toBeInTheDocument();
  });

  it("renders VERIFIED status screen with dashboard button", () => {
    useAuthStore.setState({
      status: "authenticated",
      user: {
        userId: 10,
        fullName: "Dr. Ananya Sharma",
        email: "ananya@agriverse.in",
        phone: "9876543210",
        role: "VETERINARIAN",
        isVerified: true,
        verificationStatus: "VERIFIED",
        avatarUrl: null,
        veterinarianProfile: {
          id: 1,
          userId: 10,
          registrationNumber: "VCI-AP-2024-8842",
          issuingAuthority: "Andhra Pradesh State Veterinary Council",
          state: "Andhra Pradesh",
          qualification: "B.V.Sc & A.H.",
          college: "NTR College of Veterinary Science",
          graduationYear: 2020,
          registrationCertificateUrl: "https://storage.agriverse.in/certificates/vci-8842.pdf",
          verificationStatus: "VERIFIED",
          createdAt: "2026-08-30T09:00:00Z",
          updatedAt: "2026-08-30T09:00:00Z",
        },
      },
    });

    render(
      <MemoryRouter>
        <VetVerificationStatus />
      </MemoryRouter>
    );

    expect(screen.getByText(/Your veterinarian account is verified and fully active!/i)).toBeInTheDocument();
    expect(screen.getByText(/Open Veterinary Dashboard/i)).toBeInTheDocument();
  });

  it("renders REJECTED status screen with administrator feedback", () => {
    useAuthStore.setState({
      status: "authenticated",
      user: {
        userId: 10,
        fullName: "Dr. Rejected Doctor",
        email: "rejected@agriverse.in",
        phone: "9876543299",
        role: "VETERINARIAN",
        isVerified: false,
        verificationStatus: "REJECTED",
        avatarUrl: null,
        veterinarianProfile: {
          id: 2,
          userId: 10,
          registrationNumber: "VCI-AP-INVALID",
          issuingAuthority: "Unknown Council",
          state: "Andhra Pradesh",
          qualification: "B.V.Sc",
          college: "Unknown College",
          graduationYear: 2019,
          registrationCertificateUrl: "https://storage.agriverse.in/certificates/fake.pdf",
          verificationStatus: "REJECTED",
          verificationReason: "Certificate is blurry and expired in 2022",
          createdAt: "2026-08-30T09:00:00Z",
          updatedAt: "2026-08-30T09:00:00Z",
        },
      },
    });

    render(
      <MemoryRouter>
        <VetVerificationStatus />
      </MemoryRouter>
    );

    expect(screen.getByText(/Your veterinarian verification was not approved/i)).toBeInTheDocument();
    expect(screen.getByText(/Certificate is blurry and expired in 2022/i)).toBeInTheDocument();
    expect(screen.getByText(/Contact Support/i)).toBeInTheDocument();
  });
});

