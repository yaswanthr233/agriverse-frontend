import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { BrowserRouter } from "react-router-dom";
import { Register } from "./Register";
import { authApi } from "@/api/endpoints/auth";
import * as supabaseLib from "@/lib/supabase";
import * as locationLib from "@/lib/location";
import { useAuthStore } from "@/stores/authStore";

const mockNavigate = vi.fn();
vi.mock("react-router-dom", async () => {
  const actual = await vi.importActual("react-router-dom");
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  };
});

vi.mock("@/api/endpoints/auth", () => ({
  authApi: {
    lookupRole: vi.fn(),
    register: vi.fn(),
  },
}));

vi.mock("@/lib/supabase", () => ({
  sendEmailOtp: vi.fn(),
  verifyEmailOtp: vi.fn(),
}));

vi.mock("@/lib/location", async () => {
  const actual = await vi.importActual("@/lib/location");
  return {
    ...actual,
    getCurrentGpsLocation: vi.fn(),
  };
});

describe("Register Component with 4 Required Address Fields & Geolocation", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    useAuthStore.getState().clearSession();
  });

  it("validates that all 4 address fields are strictly mandatory before submission", async () => {
    render(
      <BrowserRouter>
        <Register />
      </BrowserRouter>
    );

    const sendBtn = screen.getByRole("button", { name: /send verification code/i });
    fireEvent.click(sendBtn);

    expect(await screen.findByText(/house \/ street no is required/i)).toBeInTheDocument();
    expect(screen.getByText(/pincode is required/i)).toBeInTheDocument();
    expect(screen.getByText(/state is required/i)).toBeInTheDocument();
    expect(screen.getByText(/district is required/i)).toBeInTheDocument();
    expect(supabaseLib.sendEmailOtp).not.toHaveBeenCalled();
  });

  it("rejects invalid 6-digit Indian pincode formats (letters, wrong lengths)", async () => {
    render(
      <BrowserRouter>
        <Register />
      </BrowserRouter>
    );

    fireEvent.change(screen.getByLabelText(/pincode/i), { target: { value: "123" } });
    fireEvent.click(screen.getByRole("button", { name: /send verification code/i }));

    expect(await screen.findByText(/enter a valid 6-digit pincode/i)).toBeInTheDocument();
  });

  it("populates address fields automatically when Use Current Location succeeds", async () => {
    vi.mocked(locationLib.getCurrentGpsLocation).mockResolvedValueOnce({
      latitude: 16.5062,
      longitude: 80.648,
      accuracy: 10,
      address: "12-45, MG Road, Vijayawada, NTR, Andhra Pradesh, 520001",
      components: {
        houseStreetNo: "12-45, MG Road",
        pincode: "520001",
        state: "Andhra Pradesh",
        district: "NTR",
        city: "Vijayawada",
      },
    });

    render(
      <BrowserRouter>
        <Register />
      </BrowserRouter>
    );

    const locBtn = screen.getByRole("button", { name: /use current location/i });
    fireEvent.click(locBtn);

    await waitFor(() => {
      expect(screen.getByLabelText(/house \/ street no/i)).toHaveValue("12-45, MG Road");
      expect(screen.getByLabelText(/pincode/i)).toHaveValue("520001");
      expect(screen.getByLabelText(/state/i)).toHaveValue("Andhra Pradesh");
      expect(screen.getByLabelText(/district/i)).toHaveValue("NTR");
    });

    expect(await screen.findByText(/current location detected/i)).toBeInTheDocument();
  });

  it("shows veterinarian-specific credential fields when role is Veterinary Doctor", async () => {
    render(
      <BrowserRouter>
        <Register />
      </BrowserRouter>
    );

    expect(screen.queryByLabelText(/veterinary registration number/i)).not.toBeInTheDocument();

    // Select Veterinary Doctor
    fireEvent.change(screen.getByLabelText(/i am a/i), { target: { value: "VETERINARIAN" } });

    expect(await screen.findByLabelText(/veterinary registration number/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/issuing veterinary council \/ authority/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/qualification/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/college \/ university/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/graduation year/i)).toBeInTheDocument();
  });

  it("completes full registration with 4 required address fields and redirects to role dashboard", async () => {
    vi.mocked(authApi.lookupRole).mockResolvedValueOnce(null);
    vi.mocked(supabaseLib.sendEmailOtp).mockResolvedValueOnce({ success: true });
    vi.mocked(supabaseLib.verifyEmailOtp).mockResolvedValueOnce({
      success: true,
      user: { id: "sb-user-123", email: "ramesh@example.com" },
    });
    vi.mocked(authApi.register).mockResolvedValueOnce({
      accessToken: "agri-access-token",
      refreshToken: "agri-refresh-token",
      tokenType: "Bearer",
      expiresIn: 900,
      refreshExpiresIn: 604800,
      userId: 50,
      fullName: "Ramesh Patel",
      email: "ramesh@example.com",
      phone: "9876543210",
      role: "FARMER",
      houseStreetNo: "12-45, Farm Road",
      pincode: "520001",
      state: "Andhra Pradesh",
      district: "NTR",
      city: null,
      isVerified: true,
      avatarUrl: null,
    });

    render(
      <BrowserRouter>
        <Register />
      </BrowserRouter>
    );

    // Fill form
    fireEvent.change(screen.getByLabelText(/full name/i), { target: { value: "Ramesh Patel" } });
    fireEvent.change(screen.getByLabelText(/email/i), { target: { value: "ramesh@example.com" } });
    fireEvent.change(screen.getByLabelText(/phone/i), { target: { value: "9876543210" } });
    fireEvent.change(screen.getByLabelText(/house \/ street no/i), { target: { value: "12-45, Farm Road" } });
    fireEvent.change(screen.getByLabelText(/pincode/i), { target: { value: "520001" } });
    fireEvent.change(screen.getByLabelText(/state/i), { target: { value: "Andhra Pradesh" } });
    fireEvent.change(screen.getByLabelText(/district/i), { target: { value: "NTR" } });
    fireEvent.change(screen.getByLabelText(/^password/i), { target: { value: "Password123" } });
    fireEvent.change(screen.getByLabelText(/confirm password/i), { target: { value: "Password123" } });

    // Request OTP
    fireEvent.click(screen.getByRole("button", { name: /send verification code/i }));

    await waitFor(() => {
      expect(screen.getByText(/verify email & create account/i)).toBeInTheDocument();
    });

    // Enter 6 OTP digits
    const inputs = screen.getAllByLabelText(/verification code digit/i);
    ["1", "2", "3", "4", "5", "6"].forEach((d, idx) => {
      fireEvent.change(inputs[idx], { target: { value: d } });
    });

    // Verify & Register
    fireEvent.click(screen.getByRole("button", { name: /verify email & create account/i }));

    await waitFor(() => {
      expect(supabaseLib.verifyEmailOtp).toHaveBeenCalledWith("ramesh@example.com", "123456");
      expect(authApi.register).toHaveBeenCalledWith(
        expect.objectContaining({
          fullName: "Ramesh Patel",
          email: "ramesh@example.com",
          phone: "9876543210",
          password: "Password123",
          role: "FARMER",
          houseStreetNo: "12-45, Farm Road",
          pincode: "520001",
          state: "Andhra Pradesh",
          district: "NTR",
          supabaseUserId: "sb-user-123",
        })
      );
      expect(mockNavigate).toHaveBeenCalledWith("/app/dashboard", { replace: true });
    });
  });
});
