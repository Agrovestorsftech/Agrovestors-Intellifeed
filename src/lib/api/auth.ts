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

// Login accepts either a phone number or an email — auto-detected by shape
// (LoginCard.tsx decides which and passes it through). Since neither field
// name is documented in the spec, we send BOTH `phone` and `email` keys
// (whichever one is empty is sent as null) so the request works regardless
// of which one the backend actually reads. If the backend rejects unknown
// keys outright, drop the unused one once confirmed.
interface OtpSendPayload {
  phone: string | null;
  email: string | null;
}

interface OtpVerifyPayload {
  phone: string | null;
  email: string | null;
  otp: string;
}

// ASSUMED response shape — confirm against live server.
interface OtpVerifyResponse extends AuthTokens {
  user: IntellifeedUser;
}

function isEmail(identifier: string): boolean {
  return identifier.includes("@");
}

function toIdentifierPayload(identifier: string): { phone: string | null; email: string | null } {
  const trimmed = identifier.trim();
  return isEmail(trimmed) ? { phone: null, email: trimmed } : { phone: trimmed, email: null };
}

export async function sendOtp(identifier: string): Promise<void> {
  const payload: OtpSendPayload = toIdentifierPayload(identifier);
  await api.post<void>("/auth/otp/send", payload, { skipAuth: true });
}

export async function verifyOtp(identifier: string, otp: string): Promise<OtpVerifyResponse> {
  const payload: OtpVerifyPayload = { ...toIdentifierPayload(identifier), otp };
  return api.post<OtpVerifyResponse>("/auth/otp/verify", payload, { skipAuth: true });
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

// Farmer self-registration. This is the ONLY self-signup endpoint that
// exists in the API spec, and — like otp/send and otp/verify — its request
// body isn't documented (drf-spectacular gap). Fields below are a best
// guess built from the User + FarmerProfile schemas (phone/email/name live
// on User, preferred_language lives on FarmerProfile). CONFIRM against the
// live server and fix here if wrong — nowhere else needs to change.
//
// `role` is added for TESTING ONLY: /farmers/register is still the only
// registration endpoint that exists, so it's the only door available for
// creating agent/nutritionist/admin/investor test accounts too. Whether the
// backend actually honors a `role` override on this endpoint (vs. silently
// ignoring it and always creating a farmer) is UNCONFIRMED — check the
// created user's role via /auth/me after registering to verify.
export interface FarmerRegisterPayload {
  phone: string;
  email?: string;
  first_name: string;
  last_name: string;
  preferred_language?: string;
  role?: Role430;
}

export async function registerFarmer(payload: FarmerRegisterPayload): Promise<void> {
  await api.post<void>("/farmers/register", payload, { skipAuth: true });
}