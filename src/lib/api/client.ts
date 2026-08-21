// IntelliFeed360 API client.
//
// Replaces direct Supabase table access. All data now flows through the
// Django REST backend at IntelliFeed360_API. See MIGRATION_PLAN.md for the
// full endpoint map and phase checklist.

const API_BASE_URL =
  (typeof import.meta !== "undefined" && import.meta.env?.VITE_API_BASE_URL) ||
  (typeof process !== "undefined" && process.env?.VITE_API_BASE_URL) ||
  "https://api-testing-intellifeed360.onrender.com/api/v1";

const ACCESS_TOKEN_KEY = "if360_access_token";
const REFRESH_TOKEN_KEY = "if360_refresh_token";

function hasWindow(): boolean {
  return typeof window !== "undefined";
}

// --- Token storage -----------------------------------------------------
// Kept in localStorage (mirrors the previous Supabase auth storage choice).
// SSR-safe: no-ops on the server, hydrated on the client.

export const tokenStore = {
  getAccess(): string | null {
    if (!hasWindow()) return null;
    return window.localStorage.getItem(ACCESS_TOKEN_KEY);
  },
  getRefresh(): string | null {
    if (!hasWindow()) return null;
    return window.localStorage.getItem(REFRESH_TOKEN_KEY);
  },
  set(access: string, refresh: string): void {
    if (!hasWindow()) return;
    window.localStorage.setItem(ACCESS_TOKEN_KEY, access);
    window.localStorage.setItem(REFRESH_TOKEN_KEY, refresh);
  },
  setAccess(access: string): void {
    if (!hasWindow()) return;
    window.localStorage.setItem(ACCESS_TOKEN_KEY, access);
  },
  clear(): void {
    if (!hasWindow()) return;
    window.localStorage.removeItem(ACCESS_TOKEN_KEY);
    window.localStorage.removeItem(REFRESH_TOKEN_KEY);
  },
};

export class ApiError extends Error {
  status: number;
  body: unknown;
  constructor(status: number, message: string, body?: unknown) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.body = body;
  }
}

interface RequestOptions extends Omit<RequestInit, "body"> {
  body?: unknown;
  // Skip attaching Authorization header (only used for otp/send, otp/verify, token/refresh)
  skipAuth?: boolean;
  // Skip the auto-refresh-and-retry-on-401 behavior (used by the refresh call itself)
  skipRefresh?: boolean;
}

let refreshInFlight: Promise<boolean> | null = null;

async function refreshAccessToken(): Promise<boolean> {
  const refresh = tokenStore.getRefresh();
  if (!refresh) return false;

  // De-dupe concurrent 401s during the same refresh.
  if (!refreshInFlight) {
    refreshInFlight = (async () => {
      try {
        const res = await fetch(`${API_BASE_URL}/auth/token/refresh`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ refresh }),
        });
        if (!res.ok) {
          tokenStore.clear();
          return false;
        }
        const data = await res.json().catch(() => null);
        // NOTE: field name assumed as `access` per standard SimpleJWT convention.
        // Confirm against the live server response and adjust if different.
        if (data?.access) {
          tokenStore.setAccess(data.access);
          return true;
        }
        tokenStore.clear();
        return false;
      } catch {
        tokenStore.clear();
        return false;
      } finally {
        refreshInFlight = null;
      }
    })();
  }
  return refreshInFlight;
}

export async function apiFetch<T = unknown>(path: string, options: RequestOptions = {}): Promise<T> {
  const { body, skipAuth, skipRefresh, headers, ...rest } = options;

  const doFetch = async (): Promise<Response> => {
    const finalHeaders = new Headers(headers);
    if (body !== undefined && !finalHeaders.has("Content-Type")) {
      finalHeaders.set("Content-Type", "application/json");
    }
    if (!skipAuth) {
      const access = tokenStore.getAccess();
      if (access) finalHeaders.set("Authorization", `Bearer ${access}`);
    }
    return fetch(`${API_BASE_URL}${path}`, {
      ...rest,
      headers: finalHeaders,
      body: body !== undefined ? JSON.stringify(body) : undefined,
    });
  };

  let res = await doFetch();

  if (res.status === 401 && !skipAuth && !skipRefresh) {
    const refreshed = await refreshAccessToken();
    if (refreshed) {
      res = await doFetch();
    }
  }

  if (!res.ok) {
    let parsedBody: unknown = null;
    try {
      parsedBody = await res.json();
    } catch {
      // no JSON body
    }
    const message =
      (parsedBody as { detail?: string; message?: string } | null)?.detail ??
      (parsedBody as { detail?: string; message?: string } | null)?.message ??
      `Request failed with status ${res.status}`;
    throw new ApiError(res.status, message, parsedBody);
  }

  if (res.status === 204) return undefined as T;

  return (await res.json()) as T;
}

export const api = {
  get: <T = unknown>(path: string, options?: RequestOptions) => apiFetch<T>(path, { ...options, method: "GET" }),
  post: <T = unknown>(path: string, body?: unknown, options?: RequestOptions) =>
    apiFetch<T>(path, { ...options, method: "POST", body }),
  put: <T = unknown>(path: string, body?: unknown, options?: RequestOptions) =>
    apiFetch<T>(path, { ...options, method: "PUT", body }),
  patch: <T = unknown>(path: string, body?: unknown, options?: RequestOptions) =>
    apiFetch<T>(path, { ...options, method: "PATCH", body }),
  delete: <T = unknown>(path: string, options?: RequestOptions) =>
    apiFetch<T>(path, { ...options, method: "DELETE" }),
};

export { API_BASE_URL };
