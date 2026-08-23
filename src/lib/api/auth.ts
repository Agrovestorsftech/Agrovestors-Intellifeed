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

// Login. CONFIRMED against the live server (2026-08-23), straight from the
// Django view source (apps.accounts.views.OTPSendView, seen in a debug
// traceback): `OTPSendSerializer` has exactly two fields — `phone`
// (required, PhoneNumberField) and `purpose` (registration/login/
// phone_change, defaults to login). There is NO `email` field on this
// endpoint; anything sent under that key is silently dropped by DRF, not
// validated, not used. Do not add it back without new evidence.
//
// Also confirmed from the same source: this environment has
// `SHOW_RANDOM_OTP = True`, so a successful send response includes the
// actual code — `{"otp_code": "...", "is_test_user": true}` — no SMS or
// email needed to test. `sendOtp` surfaces that in its return value when
// present so the UI (or a caller testing manually) can read it directly.
interface OtpSendPayload {
  phone: string;
  purpose?: "registration" | "login" | "phone_change";
}

interface OtpVerifyPayload {
  phone: string;
  otp: string;
}

interface OtpSendResponse {
  otp_code?: string;
  is_test_user?: boolean;
}

// ASSUMED response shape — confirm against live server.
interface OtpVerifyResponse extends AuthTokens {
  user: IntellifeedUser;
}

export async function sendOtp(phone: string): Promise<OtpSendResponse | void> {
  const payload: OtpSendPayload = { phone };
  return api.post<OtpSendResponse | void>("/auth/otp/send", payload, { skipAuth: true });
}

export async function verifyOtp(phone: string, otp: string): Promise<OtpVerifyResponse> {
  const payload: OtpVerifyPayload = { phone, otp };
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