import { api } from "../client";
import type {
  AdminDashboardStats,
  OrderAdminResponse,
  OrderStatus,
  Page,
  ProductAdminResponse,
  ProductCategory,
  Role,
  UserAdminResponse,
} from "../types";

export interface UserQuery {
  role?: Role | null;
  search?: string;
  page?: number;
  size?: number;
}

export interface AdminProductQuery {
  category?: ProductCategory | null;
  active?: boolean | null;
  search?: string;
  page?: number;
  size?: number;
}

export interface AdminOrderQuery {
  status?: OrderStatus | null;
  search?: string;
  page?: number;
  size?: number;
}

export const adminApi = {
  dashboard: () =>
    api.get<AdminDashboardStats>("/api/admin/dashboard").then((r) => r.data),

  users: (q: UserQuery = {}) =>
    api
      .get<Page<UserAdminResponse>>("/api/admin/users", {
        params: {
          role: q.role ?? undefined,
          search: q.search || undefined,
          page: q.page ?? 0,
          size: q.size ?? 20,
        },
      })
      .then((r) => r.data),

  user: (id: number) =>
    api.get<UserAdminResponse>(`/api/admin/users/${id}`).then((r) => r.data),

  setUserActive: (id: number, active: boolean) =>
    api
      .patch<UserAdminResponse>(`/api/admin/users/${id}/active`, null, {
        params: { active },
      })
      .then((r) => r.data),

  deleteUser: (id: number) =>
    api.delete<null>(`/api/admin/users/${id}`).then((r) => r.data),

  restoreUser: (id: number) =>
    api
      .post<UserAdminResponse>(`/api/admin/users/${id}/restore`)
      .then((r) => r.data),

  sellers: () =>
    api.get<UserAdminResponse[]>("/api/admin/sellers").then((r) => r.data),

  products: (q: AdminProductQuery = {}) =>
    api
      .get<Page<ProductAdminResponse>>("/api/admin/products", {
        params: {
          category: q.category ?? undefined,
          active: q.active ?? undefined,
          search: q.search || undefined,
          page: q.page ?? 0,
          size: q.size ?? 20,
        },
      })
      .then((r) => r.data),

  setProductActive: (id: number, active: boolean) =>
    api
      .patch<ProductAdminResponse>(`/api/admin/products/${id}/active`, null, {
        params: { active },
      })
      .then((r) => r.data),

  orders: (q: AdminOrderQuery = {}) =>
    api
      .get<Page<OrderAdminResponse>>("/api/admin/orders", {
        params: {
          status: q.status ?? undefined,
          search: q.search || undefined,
          page: q.page ?? 0,
          size: q.size ?? 20,
        },
      })
      .then((r) => r.data),

  order: (id: number) =>
    api.get<OrderAdminResponse>(`/api/admin/orders/${id}`).then((r) => r.data),
};
