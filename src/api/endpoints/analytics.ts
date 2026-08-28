import { api } from "../client";
import type { FarmerAnalyticsResponse } from "../types";

export const analyticsApi = {
  farmer: () =>
    api
      .get<FarmerAnalyticsResponse>("/api/farmer/analytics")
      .then((r) => r.data),
};
