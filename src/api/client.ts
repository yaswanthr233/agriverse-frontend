import axios, {
  AxiosError, type AxiosInstance, type InternalAxiosRequestConfig,
} from "axios";
import type { ApiResponse, AuthResponse, FieldValidationError } from "./types";
import { tokenStorage } from "@/lib/tokenStorage";
import { useAuthStore } from "@/stores/authStore";

export class ApiError extends Error {
  status: number;
  errorCode?: string;
  errors?: FieldValidationError[];

  constructor(
    message: string, status: number,
    errorCode?: string, errors?: FieldValidationError[],
  ) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.errorCode = errorCode;
    this.errors = errors;
  }
}

/** Normalises anything axios throws into an ApiError. Exported for testing. */
export function toApiError(error: unknown): ApiError {
  const err = error as AxiosError<ApiResponse<unknown>>;

  if (err.response) {
    const body = err.response.data;
    return new ApiError(
      body?.message || "Something went wrong. Please try again.",
      err.response.status,
      body?.errorCode,
      body?.errors,
    );
  }
  if (err.request) {
    return new ApiError(
      "Couldn't connect to the server. Check your connection and try again.", 0,
    );
  }
  return new ApiError("Something went wrong. Please try again.", 0);
}

const BASE_URL = import.meta.env.VITE_API_BASE_URL ?? "http://localhost:8080";

export const api: AxiosInstance = axios.create({
  baseURL: BASE_URL,
  headers: { "Content-Type": "application/json" },
  timeout: 30_000,
});

/* ── Request: attach the bearer token ───────────────────── */
api.interceptors.request.use((config: InternalAxiosRequestConfig) => {
  const token = tokenStorage.getAccess();
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

/* ── Response: unwrap the envelope, handle 401 refresh ──── */
let refreshing: Promise<string | null> | null = null;

/** Endpoints that must never trigger a refresh attempt — refreshing them loops. */
const NO_REFRESH = ["/auth/login", "/auth/refresh", "/auth/register"];

async function refreshAccessToken(): Promise<string | null> {
  const refreshToken = tokenStorage.getRefresh();
  if (!refreshToken) return null;

  try {
    // A bare axios call — using `api` here would recurse through this interceptor.
    const res = await axios.post<ApiResponse<AuthResponse>>(
      `${BASE_URL}/auth/refresh`, { refreshToken },
      { headers: { "Content-Type": "application/json" } },
    );
    const data = res.data.data;
    if (!data) return null;
    useAuthStore.getState().setSession(data);   // rotation: store the NEW refresh token
    return data.accessToken;
  } catch {
    return null;
  }
}

api.interceptors.response.use(
  // Unwrap ApiResponse<T> so callers receive T directly.
  (response) => {
    const body = response.data as ApiResponse<unknown> | undefined;
    if (body && typeof body === "object" && "success" in body && "data" in body) {
      response.data = body.data;
    }
    return response;
  },

  async (error: AxiosError) => {
    const config = error.config as InternalAxiosRequestConfig & { _retried?: boolean };
    const status = error.response?.status;
    const url = config?.url ?? "";

    const refreshable =
      status === 401 && config && !config._retried && !NO_REFRESH.some((p) => url.includes(p));

    if (refreshable) {
      config._retried = true;
      refreshing ??= refreshAccessToken().finally(() => { refreshing = null; });
      const newToken = await refreshing;

      if (newToken) {
        config.headers.Authorization = `Bearer ${newToken}`;
        return api(config);
      }
      useAuthStore.getState().clearSession();
      if (!window.location.pathname.startsWith("/login")) {
        window.location.href = "/login";
      }
    }

    // 403 is a ROLE problem, not a session problem. Never refresh, never log out.
    return Promise.reject(toApiError(error));
  },
);
