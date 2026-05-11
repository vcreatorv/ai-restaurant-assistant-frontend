import { apiFetch } from "./client";
import type { ApiProfile, PatchProfileRequest } from "./types";

export async function getProfile(): Promise<ApiProfile> {
  return apiFetch<ApiProfile>("/profile");
}

export async function patchProfile(patch: PatchProfileRequest): Promise<ApiProfile> {
  return apiFetch<ApiProfile>("/profile", {
    method: "PATCH",
    body: JSON.stringify(patch),
  });
}
