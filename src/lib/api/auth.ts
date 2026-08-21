// Auth calls against IntelliFeed360's /auth/* endpoints.
//
// NOTE ON UNCERTAIN FIELD NAMES:
// The uploaded OpenAPI spec documents `/auth/otp/send` and `/auth/otp/verify`
// with `200: No response body` and no request schema — this is almost always
// a sign the spec generator (drf-spectacular) didn't pick up a custom
// serializer, not that these endpoints truly take/return nothing. The shapes
// below follow the most common Django/SimpleJWT + phone-OTP convention. If
// the live server disagrees, only this file and the two payload/response
// types below should need updating — everything downstream (AuthContext,
// UI) consumes the `IntellifeedUser` / `AuthTokens` types, not raw fetch calls.

import { api } from "./client";

export type Role430 = "farmer" | "agent" | "nutritionist" | "admin" | "investor";

export interface IntellifeedUser {
  id: string;
  phone: string;
  email: string | null;
  first_name: string;
  last_name: string;
  role: Role430;
  status: "active" | "suspended" | "deactivated";
  avatar_url: string | null;
}

export interface AuthTokens {
  access: string;
  refresh: string;
}

interface OtpSendPayload {
  phone: string;
}

interface OtpVerifyPayload {
  phone: string;
  otp: string;
}

// ASSUMED response shape — confirm against live server.
interface OtpVerifyResponse extends AuthTokens {
  user: IntellifeedUser;
}

export async function sendOtp(phone: string): Promise<void> {
  await api.post<void>("/auth/otp/send", { phone } satisfies OtpSendPayload, { skipAuth: true });
}

export async function verifyOtp(phone: string, otp: string): Promise<OtpVerifyResponse> {
  return api.post<OtpVerifyResponse>("/auth/otp/verify", { phone, otp } satisfies OtpVerifyPayload, {
    skipAuth: true,
  });
}

export async function fetchMe(): Promise<IntellifeedUser> {
  return api.get<IntellifeedUser>("/auth/me");
}

export async function logout(): Promise<void> {
  try {
    await api.post<void>("/auth/logout");
  } catch {
    // Best-effort — token gets cleared client-side regardless.
  }
}
