import { apiFetch } from "./client";
import type { ApiAdminActionList, ListActionsParams } from "./types";

/** REST-клиент админского аудит-лога (`/admin/actions`, `/admin/orders/{id}/actions`). */

function buildQuery(params: Record<string, string | number | undefined>): string {
  const parts: string[] = [];
  for (const [k, v] of Object.entries(params)) {
    if (v === undefined || v === "") continue;
    parts.push(`${encodeURIComponent(k)}=${encodeURIComponent(String(v))}`);
  }
  return parts.length === 0 ? "" : `?${parts.join("&")}`;
}

export function listActions(params: ListActionsParams = {}): Promise<ApiAdminActionList> {
  return apiFetch<ApiAdminActionList>(`/admin/actions${buildQuery(params)}`);
}

export function listOrderActions(
  orderId: string,
  params: { limit?: number; offset?: number } = {},
): Promise<ApiAdminActionList> {
  return apiFetch<ApiAdminActionList>(
    `/admin/orders/${encodeURIComponent(orderId)}/actions${buildQuery(params)}`,
  );
}
