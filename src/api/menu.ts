import { apiFetch } from "./client";
import type { ApiCategoryList, ApiDishList } from "./types";

export async function listCategories(): Promise<ApiCategoryList> {
  return apiFetch<ApiCategoryList>("/categories");
}

export async function listDishes(params?: {
  category_id?: number;
  available?: boolean;
  q?: string;
  limit?: number;
  offset?: number;
}): Promise<ApiDishList> {
  const sp = new URLSearchParams();
  if (params?.category_id != null) sp.set("category_id", String(params.category_id));
  if (params?.available != null) sp.set("available", String(params.available));
  if (params?.q) sp.set("q", params.q);
  if (params?.limit != null) sp.set("limit", String(params.limit));
  if (params?.offset != null) sp.set("offset", String(params.offset));
  const qs = sp.toString();
  return apiFetch<ApiDishList>(`/menu${qs ? `?${qs}` : ""}`);
}
