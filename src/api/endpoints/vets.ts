import { api } from "../client";
import type {
  AppointmentRequest,
  AppointmentResponse,
  VetDirectoryResponse,
} from "../types";

export const vetsApi = {
  directory: () =>
    api.get<VetDirectoryResponse[]>("/api/vets").then((r) => r.data),
  book: (body: AppointmentRequest) =>
    api
      .post<AppointmentResponse>("/api/appointments", body)
      .then((r) => r.data),
  myAppointments: () =>
    api.get<AppointmentResponse[]>("/api/appointments/my").then((r) => r.data),
  cancel: (id: number, reason?: string) =>
    api
      .post<AppointmentResponse>(`/api/appointments/${id}/cancel`, { reason })
      .then((r) => r.data),
};
