import { api } from "../client";
import type { CropRequest, CropResponse } from "../types";

export const cropsApi = {
  mine: () => api.get<CropResponse[]>("/api/crops/my").then((r) => r.data),
  create: (body: CropRequest) =>
    api.post<CropResponse>("/api/crops", body).then((r) => r.data),
  update: (id: number, body: CropRequest) =>
    api.put<CropResponse>(`/api/crops/${id}`, body).then((r) => r.data),
  remove: (id: number) =>
    api.delete<null>(`/api/crops/${id}`).then((r) => r.data),
};
