import type { ApiErrorBody } from "./types";

let csrfToken = "";

export function setCSRF(token: string) {
  csrfToken = token;
}

export const BASE = (import.meta.env.VITE_API_URL as string | undefined) ?? "/api/v1";

export function getCSRF(): string {
  return csrfToken;
}

export class ApiError extends Error {
  constructor(
    public readonly status: number,
    public readonly code: string,
    message: string,
  ) {
    super(message);
    this.name = "ApiError";
  }
}

export async function apiFetch<T>(path: string, options: RequestInit = {}): Promise<T> {
  const method = (options.method ?? "GET").toUpperCase();
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...(options.headers as Record<string, string> | undefined),
  };
  if (method !== "GET" && csrfToken) {
    headers["X-CSRF-Token"] = csrfToken;
  }

  const res = await fetch(`${BASE}${path}`, {
    ...options,
    credentials: "include",
    headers,
  });

  if (res.status === 204) return undefined as T;

  const body = await res.json().catch(() => null);
  if (!res.ok) {
    const err = (body as { error?: ApiErrorBody } | null)?.error;
    throw new ApiError(res.status, err?.code ?? "unknown", err?.message ?? "Request failed");
  }
  return body as T;
}
