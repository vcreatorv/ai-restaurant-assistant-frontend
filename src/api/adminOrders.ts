import { apiFetch } from "./client";
import type {
  AdminListOrdersParams,
  ApiOrder,
  ApiOrderList,
  UpdateOrderStatusRequest,
} from "./types";

function buildQuery(p: Record<string, string | number | undefined>): string {
  const sp = new URLSearchParams();
  for (const [k, v] of Object.entries(p)) {
    if (v === undefined || v === "") continue;
    sp.set(k, String(v));
  }
  const qs = sp.toString();
  return qs ? `?${qs}` : "";
}

export function adminListOrders(params: AdminListOrdersParams = {}): Promise<ApiOrderList> {
  return apiFetch<ApiOrderList>(`/admin/orders${buildQuery(params)}`);
}

export function adminGetOrder(id: string): Promise<ApiOrder> {
  return apiFetch<ApiOrder>(`/admin/orders/${encodeURIComponent(id)}`);
}

export function adminUpdateOrderStatus(
  id: string,
  req: UpdateOrderStatusRequest,
): Promise<ApiOrder> {
  return apiFetch<ApiOrder>(`/admin/orders/${encodeURIComponent(id)}/status`, {
    method: "PATCH",
    body: JSON.stringify(req),
  });
}
