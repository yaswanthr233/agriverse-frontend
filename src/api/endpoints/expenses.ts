import { api } from "../client";
import type { ExpenseRequest, ExpenseResponse } from "../types";

// NOTE: there is no update endpoint. Create and delete only.
export const expensesApi = {
  mine: (month?: number, year?: number) =>
    api
      .get<ExpenseResponse[]>("/api/expenses/my", { params: { month, year } })
      .then((r) => r.data),
  create: (body: ExpenseRequest) =>
    api.post<ExpenseResponse>("/api/expenses", body).then((r) => r.data),
  remove: (id: number) =>
    api.delete<null>(`/api/expenses/${id}`).then((r) => r.data),
};
