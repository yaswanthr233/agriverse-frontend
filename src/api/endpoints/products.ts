import { api } from "../client";
import type {
  Page,
  ProductCategory,
  ProductRequest,
  ProductResponse,
} from "../types";

export interface ProductQuery {
  category?: ProductCategory | null;
  search?: string;
  page?: number;
  size?: number;
}

export const productsApi = {
  catalog: (q: ProductQuery = {}) =>
    api
      .get<Page<ProductResponse>>("/api/products", {
        params: {
          category: q.category ?? undefined,
          search: q.search || undefined,
          page: q.page ?? 0,
          size: q.size ?? 12,
        },
      })
      .then((r) => r.data),

  byId: (id: number) =>
    api.get<ProductResponse>(`/api/products/${id}`).then((r) => r.data),

  mine: () =>
    api.get<ProductResponse[]>("/api/products/my").then((r) => r.data),

  create: (body: ProductRequest) =>
    api.post<ProductResponse>("/api/products", body).then((r) => r.data),

  update: (id: number, body: ProductRequest) =>
    api.put<ProductResponse>(`/api/products/${id}`, body).then((r) => r.data),

  remove: (id: number) =>
    api.delete<null>(`/api/products/${id}`).then((r) => r.data),
};
