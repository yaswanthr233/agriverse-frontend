import { api } from "../client";
import type {
  AuthResponse,
  LoginRequest,
  OtpResponse,
  RegisterRequest,
  RegisterResponse,
  UserProfileResponse,
  VerifyEmailRequest,
  ResendVerificationResponse,
} from "../types";

export const authApi = {
  lookupRole: (email: string) =>
    api.post<{ role: string; roleName: string } | null>("/auth/lookup-role", { email }).then((r) => r.data),

  login: (body: LoginRequest) =>
    api.post<AuthResponse>("/auth/login", body).then((r) => r.data),

  register: (body: RegisterRequest) =>
    api.post<RegisterResponse>("/auth/register", body).then((r) => r.data),

  verifyEmail: (body: VerifyEmailRequest) =>
    api.post<{ success: boolean; message: string }>("/auth/verify-email", body).then((r) => r.data),

  resendVerification: (email: string) =>
    api.post<ResendVerificationResponse>("/auth/resend-verification", { email }).then((r) => r.data),

  me: () => api.get<UserProfileResponse>("/auth/me").then((r) => r.data),

  logout: (refreshToken: string) =>
    api.post<null>("/auth/logout", { refreshToken }).then((r) => r.data),

  forgotPassword: (email: string) =>
    api.post<null>("/auth/forgot-password", { email }).then((r) => r.data),

  verifyOtp: (email: string, otp: string) =>
    api.post<OtpResponse>("/auth/verify-otp", { email, otp }).then((r) => r.data),

  resetPassword: (email: string, otp: string, newPassword: string) =>
    api.post<null>("/auth/reset-password", { email, otp, newPassword }).then((r) => r.data),

  resendOtp: (email: string) =>
    api.post<null>("/auth/resend-otp", { email }).then((r) => r.data),
};
