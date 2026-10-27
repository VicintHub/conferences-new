import { apiFetch } from "@/lib/api";
import type { Order, ProductDetail, ShopList } from "./types";

const BASE = "/api/backend";
const call = <T>(path: string, init?: RequestInit) => apiFetch<T>(path, { base: BASE, ...init });

export const fetchProducts = () => call<ShopList>("/shop/products");
export const fetchProduct = (slug: string) => call<{ data: ProductDetail }>(`/shop/products/${slug}`);

export type CheckoutInput = {
  items: { variant_id: number; qty: number }[];
  customer: { name: string; email: string; phone?: string };
  method: string;
};
export const checkout = (input: CheckoutInput) =>
  call<{ data: Order; meta: { payment_url: string; access_token: string } }>("/shop/checkout", {
    method: "POST",
    body: JSON.stringify(input),
  });

const orderPath = (code: string, k?: string | null, action = "") =>
  `/shop/orders/${code}${action}${k ? `?k=${encodeURIComponent(k)}` : ""}`;
export const fetchOrder = (code: string, k?: string | null) => call<{ data: Order }>(orderPath(code, k));
export const verifyOrder = (code: string, k?: string | null) => call<{ data: Order }>(orderPath(code, k, "/verify"), { method: "POST" });
export const attachOrder = (code: string, k?: string | null) => call<{ data: Order }>(orderPath(code, k, "/attach"), { method: "POST" });
export const fetchMyOrders = () => call<{ data: Order[] }>("/me/orders");

export const completeMockPayment = (reference: string, outcome: "success" | "failed" | "abandoned") =>
  call<{ data: { outcome: string } }>(`/shop/payments/mock/${encodeURIComponent(reference)}/complete`, {
    method: "POST",
    body: JSON.stringify({ outcome }),
  });
