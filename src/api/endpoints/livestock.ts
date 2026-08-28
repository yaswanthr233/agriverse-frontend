import { api } from "../client";
import type { LivestockRequest, LivestockResponse, Page } from "../types";

export const livestockApi = {
  marketplace: (page = 0, size = 12) =>
    api
      .get<Page<LivestockResponse>>("/api/livestock/marketplace", {
        params: { page, size },
      })
      .then((r) => r.data),

  byId: (id: number) =>
    api.get<LivestockResponse>(`/api/livestock/${id}`).then((r) => r.data),

  mine: () =>
    api.get<LivestockResponse[]>("/api/livestock/my").then((r) => r.data),

  create: (body: LivestockRequest) =>
    api.post<LivestockResponse>("/api/livestock", body).then((r) => r.data),

  update: (id: number, body: LivestockRequest) =>
    api
      .put<LivestockResponse>(`/api/livestock/${id}`, body)
      .then((r) => r.data),

  remove: (id: number) =>
    api.delete<null>(`/api/livestock/${id}`).then((r) => r.data),
};
