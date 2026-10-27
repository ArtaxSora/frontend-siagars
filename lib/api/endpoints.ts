/**
 * Fungsi endpoint bertipe. Jangan menebak endpoint/field: ikuti kontrak
 * (lib/contracts/types.ts) dan OpenAPI backend.
 */
import { apiRequest } from "@/lib/api/client";
import type {
  AdminReferral,
  BpjsCheckRequest,
  BpjsCheckResult,
  CompareMeta,
  CountMeta,
  CsrfResult,
  Dataset,
  DetailMeta,
  HealthResult,
  Hospital,
  HospitalBed,
  HospitalMarker,
  HospitalService,
  ListMeta,
  LoginResult,
  MarkerMeta,
  Operator,
  Province,
  ReadyResult,
  Recommendation,
  RecommendationMeta,
  Referral,
  ReferralStatus,
  ServiceMaster,
  ServiceStatus,
  SuggestMeta,
  Suggestion,
  TrackingResult,
} from "@/lib/contracts/types";
import { buildApiQueryString, type HospitalQuery } from "@/lib/hospitals/query";
import {
  buildRecommendationApiQuery,
  type WizardState,
} from "@/lib/recommendations/wizard";
import { bboxParam, type BBox } from "@/lib/geo/bbox";

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

/** Autocomplete nama RS; q wajib (1–100), limit maks 20. */
export function suggestHospitals(
  q: string,
  dataset: Dataset,
  limit: number,
  signal?: AbortSignal,
) {
  const params = new URLSearchParams({ q, dataset, limit: String(limit) });
  return apiRequest<Suggestion[], SuggestMeta>(
    `/hospitals/suggest?${params.toString()}`,
    { signal },
  );
}

/**
 * 2–3 ID unik, masing-masing UUID atau external_id; tanpa parameter lain.
 * Satu ID tak ada -> 404 seluruhnya; dua ID untuk RS yang sama -> 422.
 */
export function compareHospitals(ids: string[], signal?: AbortSignal) {
  return apiRequest<Hospital[], CompareMeta>(
    `/hospitals/compare?ids=${encodeURIComponent(ids.join(","))}`,
    { signal },
  );
}

/**
 * Rekomendasi ber-skor (kontrak §4). Butuh ≥ 1 layanan dan lokasi
 * (lat+lng atau kode wilayah); tanpa itu server membalas 422.
 */
export function getRecommendations(state: WizardState, signal?: AbortSignal) {
  return apiRequest<Recommendation[], RecommendationMeta>(
    `/recommendations?${buildRecommendationApiQuery(state)}`,
    { signal },
  );
}

/** Marker ringan di dalam bbox (maks 500, `meta.truncated`; kontrak §7). */
export function listMarkers(
  bbox: BBox,
  opts: { services: string[]; bpjs: boolean; dataset: Dataset },
  signal?: AbortSignal,
) {
  const params = new URLSearchParams({ bbox: bboxParam(bbox) });
  if (opts.services.length > 0) params.set("services", opts.services.join(","));
  if (opts.bpjs) params.set("bpjs", "true");
  params.set("dataset", opts.dataset);
  return apiRequest<HospitalMarker[], MarkerMeta>(
    `/hospitals/markers?${params.toString()}`,
    { signal },
  );
}

export function listServices(signal?: AbortSignal) {
  return apiRequest<ServiceMaster[]>("/services", { signal });
}

/** Provinsi beserta kota/kabupaten; panggil sekali, `code` dipakai apa adanya. */
export function listRegions(signal?: AbortSignal) {
  return apiRequest<Province[], CountMeta>("/regions", { signal });
}

/** Kode dikirim lewat BODY (POST), tidak pernah lewat URL/query. */
export function lookupReferral(trackingCode: string, signal?: AbortSignal) {
  return apiRequest<TrackingResult>("/referrals/lookup", {
    method: "POST",
    body: { tracking_code: trackingCode },
    signal,
  });
}

/**
 * Cek kepesertaan BPJS (SIMULASI). NIK, nama, dan tanggal lahir hanya lewat
 * BODY POST; tidak pernah di URL/query, storage, atau log.
 */
export function checkBpjs(body: BpjsCheckRequest, signal?: AbortSignal) {
  return apiRequest<BpjsCheckResult>("/bpjs/check", {
    method: "POST",
    body,
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
  return apiRequest<AdminReferral[]>("/admin/referrals", { signal });
}

/** RS dalam scope operator (urut sesuai server). */
export function listAdminHospitals(signal?: AbortSignal) {
  return apiRequest<Hospital[], CountMeta & DetailMeta>("/admin/hospitals", {
    signal,
  });
}

/** Detail RS dalam scope operator; sumber `version` terbaru sebelum PATCH. */
export function getAdminHospital(id: string, signal?: AbortSignal) {
  return apiRequest<Hospital, DetailMeta>(
    `/admin/hospitals/${encodeURIComponent(id)}`,
    { signal },
  );
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

/* ---------------- Sistem ---------------- */

export function getHealth(signal?: AbortSignal) {
  return apiRequest<HealthResult>("/health", { signal });
}

export function getReady(signal?: AbortSignal) {
  return apiRequest<ReadyResult>("/ready", { signal });
}
