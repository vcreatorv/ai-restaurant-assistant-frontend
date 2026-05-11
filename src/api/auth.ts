import { apiFetch, setCSRF } from "./client";
import type { SessionInfo } from "./types";

export async function getSession(): Promise<SessionInfo> {
  const s = await apiFetch<SessionInfo>("/auth/session");
  setCSRF(s.csrf);
  return s;
}

export async function login(email: string, password: string): Promise<SessionInfo> {
  const s = await apiFetch<SessionInfo>("/auth/login", {
    method: "POST",
    body: JSON.stringify({ email, password }),
  });
  setCSRF(s.csrf);
  return s;
}

export async function register(email: string, password: string): Promise<SessionInfo> {
  const s = await apiFetch<SessionInfo>("/auth/register", {
    method: "POST",
    body: JSON.stringify({ email, password }),
  });
  setCSRF(s.csrf);
  return s;
}

export async function logout(): Promise<void> {
  await apiFetch<void>("/auth/logout", { method: "POST" });
}
