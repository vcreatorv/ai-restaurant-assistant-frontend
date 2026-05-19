import { ApiError, BASE, apiFetch, getCSRF } from "./client";
import type {
  ApiCategory,
  ApiDebugSearchResponse,
  ApiDish,
  ApiDishEmbeddingPreview,
  ApiDishesReindexResult,
  ApiErrorBody,
  ApiPairingTagList,
  ApiTag,
  ApiTagList,
  CreateCategoryRequest,
  CreateDishRequest,
  CreateTagRequest,
  DebugSearchRequest,
  PatchCategoryRequest,
  PatchDishRequest,
  PatchTagRequest,
  ReindexAllDishesRequest,
} from "./types";

/* ===== Categories ===== */

export function adminCreateCategory(req: CreateCategoryRequest): Promise<ApiCategory> {
  return apiFetch<ApiCategory>("/admin/categories", {
    method: "POST",
    body: JSON.stringify(req),
  });
}

export function adminUpdateCategory(id: number, req: PatchCategoryRequest): Promise<ApiCategory> {
  return apiFetch<ApiCategory>(`/admin/categories/${id}`, {
    method: "PATCH",
    body: JSON.stringify(req),
  });
}

export function adminDeleteCategory(id: number): Promise<void> {
  return apiFetch<void>(`/admin/categories/${id}`, { method: "DELETE" });
}

/* ===== Tags ===== */

export function adminListTags(): Promise<ApiTagList> {
  return apiFetch<ApiTagList>("/admin/tags");
}

export function adminCreateTag(req: CreateTagRequest): Promise<ApiTag> {
  return apiFetch<ApiTag>("/admin/tags", {
    method: "POST",
    body: JSON.stringify(req),
  });
}

export function adminUpdateTag(id: number, req: PatchTagRequest): Promise<ApiTag> {
  return apiFetch<ApiTag>(`/admin/tags/${id}`, {
    method: "PATCH",
    body: JSON.stringify(req),
  });
}

export function adminDeleteTag(id: number): Promise<void> {
  return apiFetch<void>(`/admin/tags/${id}`, { method: "DELETE" });
}

/* ===== Dishes ===== */

export function adminCreateDish(req: CreateDishRequest): Promise<ApiDish> {
  return apiFetch<ApiDish>("/admin/menu", {
    method: "POST",
    body: JSON.stringify(req),
  });
}

export function adminUpdateDish(id: number, req: PatchDishRequest): Promise<ApiDish> {
  return apiFetch<ApiDish>(`/admin/menu/${id}`, {
    method: "PATCH",
    body: JSON.stringify(req),
  });
}

export function adminDeleteDish(id: number): Promise<void> {
  return apiFetch<void>(`/admin/menu/${id}`, { method: "DELETE" });
}

/**
 * Загрузка картинки блюда: multipart/form-data, поле `file`.
 * Backend: image/jpeg|png|webp, ≤ 5 MiB. Возвращает обновлённый Dish с image_url.
 */
export async function adminUploadDishImage(id: number, file: File): Promise<ApiDish> {
  const fd = new FormData();
  fd.append("file", file);

  const headers: Record<string, string> = {};
  const csrf = getCSRF();
  if (csrf) headers["X-CSRF-Token"] = csrf;

  const res = await fetch(`${BASE}/admin/menu/${id}/image`, {
    method: "POST",
    credentials: "include",
    headers,
    body: fd,
  });
  const body = await res.json().catch(() => null);
  if (!res.ok) {
    const err = (body as { error?: ApiErrorBody } | null)?.error;
    throw new ApiError(res.status, err?.code ?? "upload_failed", err?.message ?? "Upload failed");
  }
  return body as ApiDish;
}

/* ===== Pairing tags vocabulary (admin) ===== */

/** GET /admin/pairing-tags — все pairing-теги (включая is_active=false). */
export function adminListPairingTags(): Promise<ApiPairingTagList> {
  return apiFetch<ApiPairingTagList>("/admin/pairing-tags");
}

/* ===== Embed debug (admin) ===== */

/**
 * POST /admin/embed/search — голый vector-search по произвольному тексту.
 * Без classifier/rerank/diversify/companion-логики — «как retrieval видит запрос».
 */
export function adminDebugSearchByQuery(req: DebugSearchRequest): Promise<ApiDebugSearchResponse> {
  return apiFetch<ApiDebugSearchResponse>("/admin/embed/search", {
    method: "POST",
    body: JSON.stringify(req),
  });
}

/**
 * GET /admin/menu/{id}/embed-preview — финальный embed-текст блюда + top-N ближайших.
 * neighbors ≤ 0 → дефолт 10.
 */
export function adminPreviewDishEmbedding(
  id: number,
  neighbors?: number,
): Promise<ApiDishEmbeddingPreview> {
  const qs = neighbors && neighbors > 0 ? `?neighbors=${neighbors}` : "";
  return apiFetch<ApiDishEmbeddingPreview>(`/admin/menu/${id}/embed-preview${qs}`);
}

/* ===== Reindex (admin) ===== */

/** POST /admin/menu/{id}/reindex — форсированный реиндекс одного блюда. */
export function adminReindexDish(id: number): Promise<void> {
  return apiFetch<void>(`/admin/menu/${id}/reindex`, { method: "POST" });
}

/** POST /admin/menu/reindex — массовый реиндекс. include_unavailable по умолчанию false. */
export function adminReindexAllDishes(
  req?: ReindexAllDishesRequest,
): Promise<ApiDishesReindexResult> {
  return apiFetch<ApiDishesReindexResult>("/admin/menu/reindex", {
    method: "POST",
    body: JSON.stringify(req ?? {}),
  });
}
