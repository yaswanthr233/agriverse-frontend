import { api } from "../client";
import type { GovernmentScheme, SchemeRequest } from "../types";

export const adminSchemesApi = {
  // Returns the raw entity, NOT GovernmentSchemeResponse.
  list: () =>
    api.get<GovernmentScheme[]>("/api/admin/schemes").then((r) => r.data),

  create: (body: SchemeRequest) =>
    api.post<GovernmentScheme>("/api/admin/schemes", body).then((r) => r.data),

  update: (id: number, body: SchemeRequest) =>
    api
      .put<GovernmentScheme>(`/api/admin/schemes/${id}`, body)
      .then((r) => r.data),

  remove: (id: number) =>
    api.delete<null>(`/api/admin/schemes/${id}`).then((r) => r.data),

  setHighlight: (id: number, highlight: boolean) =>
    api
      .patch<GovernmentScheme>(
        `/api/admin/schemes/${id}/highlight`,
        null,
        { params: { highlight } },
      )
      .then((r) => r.data),
};
