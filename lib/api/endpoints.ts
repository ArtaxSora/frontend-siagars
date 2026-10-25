/**
 * Fungsi endpoint bertipe. Jangan menebak endpoint/field: ikuti kontrak
 * (lib/contracts/types.ts) dan OpenAPI backend.
 */
import { apiRequest } from "@/lib/api/client";
import type {
  CompareMeta,
  CsrfResult,
  DetailMeta,
  Hospital,
  HospitalBed,
  HospitalService,
  ListMeta,
  LoginResult,
  Operator,
  Referral,
  ReferralStatus,
  ServiceMaster,
  ServiceStatus,
  TrackingResult,
} from "@/lib/contracts/types";
import { buildApiQueryString, type HospitalQuery } from "@/lib/hospitals/query";

/* ---------------- Publik ---------------- */

export function listHospitals(query: HospitalQuery, signal?: AbortSignal) {
  return apiRequest<Hospital[], ListMeta>(
    `/hospitals?${buildApiQueryString(query)}`,
    { signal },
  );
}

export function getHospital(id: string, signal?: AbortSignal) {
  return apiRequest<Hospital, DetailMeta>(
    `/hospitals/${encodeURIComponent(id)}`,
    { signal },
  );
}

/** 2–3 UUID unik; tanpa parameter lain. Satu ID tak ada -> 404 seluruhnya. */
export function compareHospitals(ids: string[], signal?: AbortSignal) {
  return apiRequest<Hospital[], CompareMeta>(
    `/hospitals/compare?ids=${encodeURIComponent(ids.join(","))}`,
    { signal },
  );
}

export function listServices(signal?: AbortSignal) {
  return apiRequest<ServiceMaster[]>("/services", { signal });
}

/** Kode dikirim lewat BODY (POST), tidak pernah lewat URL/query. */
export function lookupReferral(trackingCode: string, signal?: AbortSignal) {
  return apiRequest<TrackingResult>("/referrals/lookup", {
    method: "POST",
    body: { tracking_code: trackingCode },
    signal,
  });
}

/* ---------------- Auth operator ---------------- */

/** Respons login membawa csrf_token; pemanggil menyimpannya via setCsrfToken. */
export function login(email: string, password: string) {
  return apiRequest<LoginResult>("/auth/login", {
    method: "POST",
    body: { email, password },
  });
}

export function getMe(signal?: AbortSignal) {
  return apiRequest<Operator>("/auth/me", { signal });
}

export function getCsrf(signal?: AbortSignal) {
  return apiRequest<CsrfResult>("/auth/csrf", { signal });
}

export function logout() {
  return apiRequest<{ logged_out: boolean }>("/auth/logout", {
    method: "POST",
    csrf: true,
  });
}

/* ---------------- Admin (operator) ---------------- */

export function listAdminReferrals(signal?: AbortSignal) {
  return apiRequest<Referral[]>("/admin/referrals", { signal });
}

export function patchReferralStatus(
  id: string,
  body: { status: ReferralStatus; public_note: string; version: number },
) {
  return apiRequest<Referral>(
    `/admin/referrals/${encodeURIComponent(id)}/status`,
    { method: "PATCH", body, csrf: true },
  );
}

export function patchHospitalService(
  hospitalId: string,
  slug: string,
  body: { status: ServiceStatus; version: number },
) {
  return apiRequest<HospitalService>(
    `/admin/hospitals/${encodeURIComponent(hospitalId)}/services/${encodeURIComponent(slug)}`,
    { method: "PATCH", body, csrf: true },
  );
}

/** total & available wajib hadir, masing-masing boleh null (belum diketahui). */
export function patchHospitalBeds(
  hospitalId: string,
  category: string,
  body: { total: number | null; available: number | null; version: number },
) {
  return apiRequest<HospitalBed>(
    `/admin/hospitals/${encodeURIComponent(hospitalId)}/beds/${encodeURIComponent(category)}`,
    { method: "PATCH", body, csrf: true },
  );
}
