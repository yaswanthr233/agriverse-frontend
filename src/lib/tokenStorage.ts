const ACCESS_KEY = "agriverse.accessToken";
const REFRESH_KEY = "agriverse.refreshToken";

/**
 * The ONLY module that touches localStorage for tokens.
 * Tradeoff: localStorage is XSS-exposed. Accepted because access tokens
 * live 15 minutes and this keeps the build simple.
 */
export const tokenStorage = {
  getAccess: (): string | null => localStorage.getItem(ACCESS_KEY),
  getRefresh: (): string | null => localStorage.getItem(REFRESH_KEY),
  set(access: string, refresh: string): void {
    localStorage.setItem(ACCESS_KEY, access);
    localStorage.setItem(REFRESH_KEY, refresh);
  },
  clear(): void {
    localStorage.removeItem(ACCESS_KEY);
    localStorage.removeItem(REFRESH_KEY);
  },
};
