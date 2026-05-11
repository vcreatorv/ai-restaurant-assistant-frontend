import { apiFetch } from "./client";
import type { ApiOrder, ApiOrderList, CreateOrderRequest } from "./types";

export async function createOrder(req: CreateOrderRequest): Promise<ApiOrder> {
  return apiFetch<ApiOrder>("/orders", {
    method: "POST",
    body: JSON.stringify(req),
  });
}

export async function listOrders(params?: { limit?: number; offset?: number }): Promise<ApiOrderList> {
  const sp = new URLSearchParams();
  if (params?.limit != null) sp.set("limit", String(params.limit));
  if (params?.offset != null) sp.set("offset", String(params.offset));
  const qs = sp.toString();
  return apiFetch<ApiOrderList>(`/orders${qs ? `?${qs}` : ""}`);
}

export async function getOrder(id: string): Promise<ApiOrder> {
  return apiFetch<ApiOrder>(`/orders/${id}`);
}
