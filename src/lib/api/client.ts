// IntelliFeed360 API client for the web dashboards.
//
// Dashboards authenticate with a Django session cookie, not bearer tokens:
// the browser sends the cookie automatically (`credentials: "include"`), and
// every write carries an `X-CSRFToken` header from GET /auth/csrf.
//
// Base URL:
// - Dev: "/api/v1", which the Vite dev server proxies to the backend so the
//   cookie is first-party (see vite.config.ts).
// - Deployed: VITE_API_BASE_URL. It must be on the same site as the dashboard
//   (e.g. api.<domain> beside agents.<domain>), because the session cookie is
//   SameSite=Lax and browsers don't send it to another site.

const API_BASE_URL: string =
  import.meta.env.VITE_API_BASE_URL || (import.meta.env.DEV ? "/api/v1" : "");

const UNSAFE_METHODS = new Set(["POST", "PUT", "PATCH", "DELETE"]);

export class ApiError extends Error {
  status: number;
  /** Backend machine code, e.g. "invalid_credentials", "client_not_allowed". */
  code: string | null;
  body: unknown;
  constructor(status: number, message: string, code: string | null, body?: unknown) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.code = code;
    this.body = body;
  }
}

interface RequestOptions extends Omit<RequestInit, "body"> {
  body?: unknown;
}

// --- CSRF ---------------------------------------------------------------
// Django rotates the CSRF token on login and logout, so the cached token is
// dropped then (`resetCsrfToken`) and fetched again on the next write.

let csrfToken: string | null = null;
let csrfInFlight: Promise<string> | null = null;

export function resetCsrfToken(): void {
  csrfToken = null;
}

async function getCsrfToken(): Promise<string> {
  if (csrfToken) return csrfToken;
  if (!csrfInFlight) {
    csrfInFlight = (async () => {
      try {
        const data = await request<{ csrf_token?: string }>("/auth/csrf", { method: "GET" }, false);
        if (!data?.csrf_token)
          throw new ApiError(500, "The server didn't return a security token.", "csrf_missing");
        csrfToken = data.csrf_token;
        return csrfToken;
      } finally {
        csrfInFlight = null;
      }
    })();
  }
  return csrfInFlight;
}

// --- Response envelope --------------------------------------------------
// The backend has used two shapes: flat `{ message, ...fields }` (current
// repo) and `{ status, message, data, errors, code }` (deployed staging).
// `unwrap` returns the payload for either.

type Envelope = {
  status?: string;
  message?: string;
  data?: unknown;
  code?: string;
  errors?: unknown;
};

function unwrap<T>(body: unknown): T {
  if (body && typeof body === "object" && "data" in body && "status" in body) {
    return (body as Envelope).data as T;
  }
  return body as T;
}

function errorFrom(status: number, body: unknown): ApiError {
  const env = (body && typeof body === "object" ? body : {}) as Envelope & { detail?: string };
  const message = env.message || env.detail || `Request failed with status ${status}`;
  return new ApiError(status, message, env.code ?? null, body);
}

async function request<T>(path: string, options: RequestOptions, withCsrf: boolean): Promise<T> {
  const { body, headers, method = "GET", ...rest } = options;
  const finalHeaders = new Headers(headers);
  finalHeaders.set("Accept", "application/json");
  if (body !== undefined && !finalHeaders.has("Content-Type")) {
    finalHeaders.set("Content-Type", "application/json");
  }
  if (withCsrf && UNSAFE_METHODS.has(method.toUpperCase())) {
    finalHeaders.set("X-CSRFToken", await getCsrfToken());
  }

  let res: Response;
  try {
    res = await fetch(`${API_BASE_URL}${path}`, {
      ...rest,
      method,
      headers: finalHeaders,
      credentials: "include",
      body: body !== undefined ? JSON.stringify(body) : undefined,
    });
  } catch {
    throw new ApiError(
      0,
      "Can't reach the server. Check your connection and try again.",
      "network",
    );
  }

  const text = res.status === 204 ? "" : await res.text();
  let parsed: unknown = null;
  if (text) {
    try {
      parsed = JSON.parse(text);
    } catch {
      parsed = null;
    }
  }
  if (!res.ok) throw errorFrom(res.status, parsed);
  return unwrap<T>(parsed);
}

export async function apiFetch<T = unknown>(
  path: string,
  options: RequestOptions = {},
): Promise<T> {
  try {
    return await request<T>(path, options, true);
  } catch (err) {
    // A stale CSRF token (rotated server-side) fails with 403; refresh once.
    if (err instanceof ApiError && err.status === 403 && /csrf/i.test(err.message) && csrfToken) {
      resetCsrfToken();
      return request<T>(path, options, true);
    }
    throw err;
  }
}

export const api = {
  get: <T = unknown>(path: string, options?: RequestOptions) =>
    apiFetch<T>(path, { ...options, method: "GET" }),
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

// --- Pagination ----------------------------------------------------------
// List endpoints use DRF's envelope: { count, next, previous, results }.

export interface Page<T> {
  count: number;
  next: string | null;
  previous: string | null;
  results: T[];
}

export function unwrapPage<T>(payload: Page<T> | T[]): T[] {
  if (
    payload &&
    typeof payload === "object" &&
    "results" in payload &&
    Array.isArray(payload.results)
  ) {
    return payload.results;
  }
  return payload as T[];
}
