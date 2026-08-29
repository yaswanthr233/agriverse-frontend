import { api } from "../client";
import type { UserProfileResponse } from "../types";

export interface UpdateProfileRequest {
  fullName?: string;
  phone?: string;
  city?: string | null;
  state?: string | null;
  avatarUrl?: string | null;
}

export interface ChangePasswordRequest {
  currentPassword: string;
  newPassword: string;
}

export const userApi = {
  getMe: () => api.get<UserProfileResponse>("/api/users/me").then((r) => r.data),
  updateProfile: (body: UpdateProfileRequest) =>
    api.put<UserProfileResponse>("/api/users/me", body).then((r) => r.data),
  changePassword: (body: ChangePasswordRequest) =>
    api.put<null>("/api/users/password", body).then((r) => r.data),
};

