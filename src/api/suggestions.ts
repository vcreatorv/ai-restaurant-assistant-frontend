import { apiFetch } from "./client";
import type {
  ApiChatSuggestionList,
  ApiAdminChatSuggestion,
  ApiAdminChatSuggestionList,
  CreateChatSuggestionRequest,
  PatchChatSuggestionRequest,
} from "./types";

// ─── Public ────────────────────────────────────────────────────────────────

/** Получить активные подсказки для рендера чипов в чате. */
export function listChatSuggestions(): Promise<ApiChatSuggestionList> {
  return apiFetch<ApiChatSuggestionList>("/chat/suggestions");
}

/**
 * Зарегистрировать клик по подсказке. Best-effort: ошибки игнорируются,
 * чтобы не блокировать ввод сообщения.
 */
export async function trackSuggestionClick(id: number): Promise<void> {
  try {
    await apiFetch<void>(`/chat/suggestions/${id}/click`, { method: "POST" });
  } catch {
    // аналитика не критична
  }
}

// ─── Admin ─────────────────────────────────────────────────────────────────

export function adminListChatSuggestions(): Promise<ApiAdminChatSuggestionList> {
  return apiFetch<ApiAdminChatSuggestionList>("/admin/suggestions");
}

export function adminCreateChatSuggestion(
  req: CreateChatSuggestionRequest,
): Promise<ApiAdminChatSuggestion> {
  return apiFetch<ApiAdminChatSuggestion>("/admin/suggestions", {
    method: "POST",
    body: JSON.stringify(req),
  });
}

export function adminUpdateChatSuggestion(
  id: number,
  req: PatchChatSuggestionRequest,
): Promise<ApiAdminChatSuggestion> {
  return apiFetch<ApiAdminChatSuggestion>(`/admin/suggestions/${id}`, {
    method: "PATCH",
    body: JSON.stringify(req),
  });
}

export function adminDeleteChatSuggestion(id: number): Promise<void> {
  return apiFetch<void>(`/admin/suggestions/${id}`, { method: "DELETE" });
}
