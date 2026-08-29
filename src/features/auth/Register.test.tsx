import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { BrowserRouter } from "react-router-dom";
import { Register } from "./Register";
import { authApi } from "@/api/endpoints/auth";
import * as supabaseLib from "@/lib/supabase";
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
    checkEmail: vi.fn(),
    register: vi.fn(),
  },
}));

vi.mock("@/lib/supabase", () => ({
  sendEmailOtp: vi.fn(),
  verifyEmailOtp: vi.fn(),
}));

describe("Register Component with in-form Email OTP", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    useAuthStore.getState().clearSession();
  });

  it("validates form fields before sending verification OTP", async () => {
    render(
      <BrowserRouter>
        <Register />
      </BrowserRouter>
    );

    const sendBtn = screen.getByRole("button", { name: /send verification code/i });
    fireEvent.click(sendBtn);

    expect(await screen.findByText(/must be at least 2 characters/i)).toBeInTheDocument();
    expect(screen.getByText(/email is required/i)).toBeInTheDocument();
    expect(supabaseLib.sendEmailOtp).not.toHaveBeenCalled();
  });

  it("detects already registered email and shows login message", async () => {
    vi.mocked(authApi.checkEmail).mockResolvedValueOnce({
      exists: true,
      message: "This email is already registered. Please log in.",
    });

    render(
      <BrowserRouter>
        <Register />
      </BrowserRouter>
    );

    fireEvent.change(screen.getByLabelText(/full name/i), { target: { value: "Ramesh Patel" } });
    fireEvent.change(screen.getByLabelText(/email/i), { target: { value: "ramesh@example.com" } });
    fireEvent.change(screen.getByLabelText(/phone/i), { target: { value: "9876543210" } });
    fireEvent.change(screen.getByLabelText(/^password/i), { target: { value: "Password123" } });
    fireEvent.change(screen.getByLabelText(/confirm password/i), { target: { value: "Password123" } });

    const sendBtn = screen.getByRole("button", { name: /send verification code/i });
    fireEvent.click(sendBtn);

    expect(await screen.findByText(/this email is already registered/i)).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /click here to sign in/i })).toBeInTheDocument();
    expect(supabaseLib.sendEmailOtp).not.toHaveBeenCalled();
  });

  it("requests Supabase OTP and dynamically reveals OTP section on success", async () => {
    vi.mocked(authApi.checkEmail).mockResolvedValueOnce({ exists: false });
    vi.mocked(supabaseLib.sendEmailOtp).mockResolvedValueOnce({
      success: true,
      message: "Verification code sent to your email.",
    });

    render(
      <BrowserRouter>
        <Register />
      </BrowserRouter>
    );

    fireEvent.change(screen.getByLabelText(/full name/i), { target: { value: "Ramesh Patel" } });
    fireEvent.change(screen.getByLabelText(/email/i), { target: { value: "ramesh@example.com" } });
    fireEvent.change(screen.getByLabelText(/phone/i), { target: { value: "9876543210" } });
    fireEvent.change(screen.getByLabelText(/^password/i), { target: { value: "Password123" } });
    fireEvent.change(screen.getByLabelText(/confirm password/i), { target: { value: "Password123" } });

    const sendBtn = screen.getByRole("button", { name: /send verification code/i });
    fireEvent.click(sendBtn);

    await waitFor(() => {
      expect(supabaseLib.sendEmailOtp).toHaveBeenCalledWith("ramesh@example.com");
    });

    expect(await screen.findByText(/verification code sent to your email/i)).toBeInTheDocument();
    expect(screen.getByText(/verify email & create account/i)).toBeInTheDocument();
    expect(screen.getAllByLabelText(/verification code digit/i).length).toBe(6);
  });

  it("verifies OTP and logs in user, redirecting to farmer dashboard", async () => {
    vi.mocked(authApi.checkEmail).mockResolvedValueOnce({ exists: false });
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
      city: null,
      state: null,
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
      expect(authApi.register).toHaveBeenCalledWith({
        fullName: "Ramesh Patel",
        email: "ramesh@example.com",
        phone: "9876543210",
        password: "Password123",
        role: "FARMER",
        city: "",
        state: "",
        supabaseUserId: "sb-user-123",
      });
      expect(mockNavigate).toHaveBeenCalledWith("/app/dashboard", { replace: true });
    });
  });
});

