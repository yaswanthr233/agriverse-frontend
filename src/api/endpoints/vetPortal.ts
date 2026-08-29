import { api } from "../client";
import type {
  AppointmentResponse,
  AppointmentStatus,
  VetEarningsResponse,
} from "../types";

export const vetPortalApi = {
  schedule: () =>
    api.get<AppointmentResponse[]>("/api/appointments/vet").then((r) => r.data),

  earnings: () =>
    api
      .get<VetEarningsResponse>("/api/appointments/vet/earnings")
      .then((r) => r.data),

  updateStatus: (id: number, status: AppointmentStatus, vetNotes?: string) =>
    api
      .patch<AppointmentResponse>(`/api/appointments/${id}/status`, {
        status,
        vetNotes: vetNotes || undefined,
      })
      .then((r) => r.data),
};
