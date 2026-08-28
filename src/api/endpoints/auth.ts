import { api } from "../client";
import type {
  AuthResponse,
  LoginRequest,
  OtpResponse,
  RegisterRequest,
  UserProfileResponse,
} from "../types";

export const authApi = {
  login: (body: LoginRequest) =>
    api.post<AuthResponse>("/auth/login", body).then((r) => r.data),

  register: (body: RegisterRequest) =>
    api.post<AuthResponse>("/auth/register", body).then((r) => r.data),

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
