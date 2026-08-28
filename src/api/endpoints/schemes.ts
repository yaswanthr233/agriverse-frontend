import { api } from "../client";
import type { GovernmentSchemeResponse } from "../types";

export const schemesApi = {
  list: () =>
    api.get<GovernmentSchemeResponse[]>("/api/schemes").then((r) => r.data),
  apply: (schemeId: number) =>
    api
      .post<GovernmentSchemeResponse>(`/api/schemes/${schemeId}/apply`)
      .then((r) => r.data),
};
