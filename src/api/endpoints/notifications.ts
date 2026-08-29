import { api } from "../client";

export interface NotificationItem {
  id: string;
  type: "order" | "livestock" | "vet" | "scheme" | "weather" | "market" | "ai";
  title: string;
  message: string;
  read: boolean;
  createdAt: string;
  link?: string;
  icon?: string;
  priority?: "high" | "normal" | "low";
}

export interface UnreadCountResponse {
  unreadCount: number;
}

export const notificationsApi = {
  list: () => api.get<NotificationItem[]>("/api/notifications").then((r) => r.data),
  unreadCount: () =>
    api.get<UnreadCountResponse>("/api/notifications/unread-count").then((r) => r.data),
  markAsRead: (id: string) =>
    api.patch<null>(`/api/notifications/${encodeURIComponent(id)}/read`).then((r) => r.data),
  markAllAsRead: () =>
    api.patch<{ markedCount: number }>("/api/notifications/read-all").then((r) => r.data),
  dismiss: (id: string) =>
    api.delete<null>(`/api/notifications/${encodeURIComponent(id)}`).then((r) => r.data),
  clearAll: () => api.delete<null>("/api/notifications").then((r) => r.data),
};

