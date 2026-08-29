import { api } from "../client";

export interface UserPreferencesResponse {
  language: "en" | "te" | "hi";
  notificationsEnabled: boolean;
  orderNotifications: boolean;
  marketNotifications: boolean;
  weatherNotifications: boolean;
  aiNotifications: boolean;
  updatedAt: string;
}

export interface UpdatePreferencesRequest {
  language?: "en" | "te" | "hi";
  notificationsEnabled?: boolean;
  orderNotifications?: boolean;
  marketNotifications?: boolean;
  weatherNotifications?: boolean;
  aiNotifications?: boolean;
}

export const settingsApi = {
  get: () => api.get<UserPreferencesResponse>("/api/settings").then((r) => r.data),
  update: (body: UpdatePreferencesRequest) =>
    api.put<UserPreferencesResponse>("/api/settings", body).then((r) => r.data),
};

