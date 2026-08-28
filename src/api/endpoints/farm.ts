import { api } from "../client";
import type { FarmRequest, FarmResponse } from "../types";

export const farmApi = {
  mine: () => api.get<FarmResponse>("/api/farms/my").then((r) => r.data),
  // POST is an UPSERT — create or update. There is one farm per farmer.
  save: (body: FarmRequest) =>
    api.post<FarmResponse>("/api/farms", body).then((r) => r.data),
};
