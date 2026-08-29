import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { MemoryRouter, Routes, Route } from "react-router-dom";
import { VerifyEmail } from "./VerifyEmail";
import { authApi } from "@/api/endpoints/auth";

vi.mock("@/api/endpoints/auth", () => ({
  authApi: {
    verifyEmail: vi.fn(),
    resendVerification: vi.fn(),
  },
}));

describe("VerifyEmail Component Suite", () => {
  it("renders 6 digit input boxes and prefilled email", () => {
    render(
      <MemoryRouter initialEntries={[{ pathname: "/verify-email", state: { email: "farmer@agriverse.in" } }]}>
        <Routes>
          <Route path="/verify-email" element={<VerifyEmail />} />
        </Routes>
      </MemoryRouter>
    );

    expect(screen.getByText(/Verify your email/i)).toBeInTheDocument();
    expect(screen.getByText(/farmer@agriverse.in/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Digit 1/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Digit 6/i)).toBeInTheDocument();
  });

  it("handles numeric entry and auto-advances inputs", () => {
    render(
      <MemoryRouter initialEntries={[{ pathname: "/verify-email", state: { email: "farmer@agriverse.in" } }]}>
        <Routes>
          <Route path="/verify-email" element={<VerifyEmail />} />
        </Routes>
      </MemoryRouter>
    );

    const digit1 = screen.getByLabelText(/Digit 1/i);
    fireEvent.change(digit1, { target: { value: "5" } });
    expect(digit1).toHaveValue("5");
  });

  it("submits verification code and navigates on success", async () => {
    vi.mocked(authApi.verifyEmail).mockResolvedValue({ success: true, message: "Verified" });

    render(
      <MemoryRouter initialEntries={[{ pathname: "/verify-email", state: { email: "farmer@agriverse.in" } }]}>
        <Routes>
          <Route path="/verify-email" element={<VerifyEmail />} />
          <Route path="/login" element={<div>Login Screen</div>} />
        </Routes>
      </MemoryRouter>
    );

    for (let i = 1; i <= 6; i++) {
      fireEvent.change(screen.getByLabelText(new RegExp(`Digit ${i}`, "i")), {
        target: { value: String(i) },
      });
    }

    const submitBtn = screen.getByRole("button", { name: /Verify & Continue/i });
    expect(submitBtn).not.toBeDisabled();
    fireEvent.click(submitBtn);

    await waitFor(() => {
      expect(authApi.verifyEmail).toHaveBeenCalledWith({
        email: "farmer@agriverse.in",
        otp: "123456",
      });
    });
  });
});
