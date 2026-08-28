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
};
