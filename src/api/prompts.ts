import { apiFetch } from "./client";
import type {
  ApiPromptDetails,
  ApiPromptDraft,
  ApiPromptList,
  ApiPromptName,
  ApiPromptVersion,
  UpsertPromptDraftRequest,
} from "./types";

/*
 * REST-клиент для /admin/prompts/*.
 * Имя промпта — query-параметр (?name=system|classification|refusal),
 * не путь, — в соответствии с backend OpenAPI.
 */

function nameQuery(name: ApiPromptName): string {
  return `?name=${encodeURIComponent(name)}`;
}

export function listPrompts(): Promise<ApiPromptList> {
  return apiFetch<ApiPromptList>("/admin/prompts");
}

export function getPrompt(name: ApiPromptName): Promise<ApiPromptDetails> {
  return apiFetch<ApiPromptDetails>(`/admin/prompts/details${nameQuery(name)}`);
}

export function upsertPromptDraft(
  name: ApiPromptName,
  content: string,
): Promise<ApiPromptDraft> {
  const body: UpsertPromptDraftRequest = { content };
  return apiFetch<ApiPromptDraft>(`/admin/prompts/draft${nameQuery(name)}`, {
    method: "PUT",
    body: JSON.stringify(body),
  });
}

export function deletePromptDraft(name: ApiPromptName): Promise<void> {
  return apiFetch<void>(`/admin/prompts/draft${nameQuery(name)}`, { method: "DELETE" });
}

export function publishPrompt(name: ApiPromptName): Promise<ApiPromptVersion> {
  return apiFetch<ApiPromptVersion>(`/admin/prompts/publish${nameQuery(name)}`, {
    method: "POST",
  });
}

export function rollbackPrompt(
  name: ApiPromptName,
  version: number,
): Promise<ApiPromptVersion> {
  return apiFetch<ApiPromptVersion>(
    `/admin/prompts/rollback${nameQuery(name)}&version=${version}`,
    { method: "POST" },
  );
}
