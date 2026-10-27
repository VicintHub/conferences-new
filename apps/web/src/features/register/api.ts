import { apiFetch } from "@/lib/api";
import type { RegistrationResult } from "./schema";

export type Capacity = { data: { onsite: { taken: number; limit: number; full: boolean } } };
type Sent = { resend_after: number };

export const fetchCapacity = () => apiFetch<Capacity>("/capacity");

/** Creates the pending registration and emails the code + link. Same response whether or not the email is known. */
export const startRegistration = (payload: unknown) => apiFetch<Sent>("/registrations", { method: "POST", body: JSON.stringify(payload) });

/** Sign-in and "resend". Always succeeds, never reveals whether the email is registered. */
export const requestEmailCode = (email: string) => apiFetch<Sent>("/auth/otp", { method: "POST", body: JSON.stringify({ email }) });

// The next two go through Next route handlers, which store the Sanctum token in an httpOnly cookie.
export const verifyCode = (email: string, code: string) =>
  apiFetch<RegistrationResult>("/api/auth/verify", { method: "POST", body: JSON.stringify({ email, code }), base: "" });

export const verifyLink = (email: string, token: string) =>
  apiFetch<RegistrationResult>("/api/auth/verify-link", { method: "POST", body: JSON.stringify({ email, token }), base: "" });
