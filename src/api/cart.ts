import { apiFetch } from "./client";
import type { ApiCart, ApiCartItem, AddCartItemRequest, PatchCartItemRequest } from "./types";

export async function getCart(): Promise<ApiCart> {
  return apiFetch<ApiCart>("/cart");
}

export async function addCartItem(req: AddCartItemRequest): Promise<ApiCartItem> {
  return apiFetch<ApiCartItem>("/cart/items", {
    method: "POST",
    body: JSON.stringify(req),
  });
}

export async function patchCartItem(dish_id: number, req: PatchCartItemRequest): Promise<ApiCartItem> {
  return apiFetch<ApiCartItem>(`/cart/items/${dish_id}`, {
    method: "PATCH",
    body: JSON.stringify(req),
  });
}

export async function removeCartItem(dish_id: number): Promise<void> {
  return apiFetch<void>(`/cart/items/${dish_id}`, { method: "DELETE" });
}

export async function clearCartApi(): Promise<void> {
  return apiFetch<void>("/cart", { method: "DELETE" });
}
