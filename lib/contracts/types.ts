/**
 * DTO kontrak API SiagaRS (/api/v1) — snake_case, timestamp RFC3339 UTC,
 * ID = UUID lowercase.
 *
 * Mengikuti API 0.4.0 (`new/03_KONTRAK_API_v1.md` §1–§5, §7). Sumber kontrak
 * resmi tetap `openapi.yaml` backend versi yang sama
 * (https://siagars-backend.vercel.app/docs). Bila berbeda, OpenAPI menang —
 * jangan mengubah enum sepihak.
 *
 * Berkas ini sengaja bebas `enum` dan impor non-type agar dapat dijalankan
 * langsung oleh `node --experimental-strip-types` pada unit test.
 */

export const SERVICE_STATUSES = [
  "available",
  "limited",
  "unavailable",
  "unknown",
] as const;
export type ServiceStatus = (typeof SERVICE_STATUSES)[number];

export const DATA_ORIGINS = [
  "curated",
  "simulation",
  "satusehat_sandbox",
  "satusehat_production",
] as const;
export type DataOrigin = (typeof DATA_ORIGINS)[number];

export const FRESHNESS_LEVELS = ["fresh", "aging", "stale", "unknown"] as const;
export type Freshness = (typeof FRESHNESS_LEVELS)[number];

export const BED_CATEGORIES = ["icu", "nicu", "picu", "general"] as const;
export type BedCategory = (typeof BED_CATEGORIES)[number];

export const REFERRAL_STATUSES = [
  "submitted",
  "verified",
  "searching",
  "confirmed",
  "completed",
  "rejected",
] as const;
export type ReferralStatus = (typeof REFERRAL_STATUSES)[number];

export const DATASETS = ["real", "simulation", "all"] as const;
export type Dataset = (typeof DATASETS)[number];

export const DATA_QUALITY_LABELS = ["baik", "cukup", "terbatas"] as const;
export type DataQualityLabel = (typeof DATA_QUALITY_LABELS)[number];

/**
 * Skor kualitas DATA (bukan kualitas layanan RS), dihitung server (kontrak §5).
 * FE menampilkan apa adanya; tidak pernah menghitung ulang.
 */
export interface DataQuality {
  /** 0–100. */
  score: number;
  label: DataQualityLabel;
  /** Proporsi item kunci yang diketahui, 0..1. */
  completeness: number;
  /** Kesegaran terburuk dari layanan/bed yang ada. */
  freshness: Freshness;
  /** Origin mayoritas layanan/bed; bila kosong, origin RS. */
  primary_origin: DataOrigin;
}

/**
 * Atribut sumber, melekat langsung (datar) pada Hospital, HospitalService,
 * dan HospitalBed. Atribut-atribut ini TIDAK sama satu sama lain.
 */
export interface Provenance {
  data_origin: DataOrigin;
  /** Tautan sumber; bisa null. Hanya render sebagai tautan bila http(s). */
  source_url: string | null;
  /** Kapan sumber terakhir memperbarui nilai ini. */
  source_updated_at: string | null;
  /** Kapan sistem menyinkronkan (BUKAN bukti fakta masih baru). */
  synced_at: string | null;
  /** Verifikasi manusia; null = belum ada yang direkam. */
  verified_at: string | null;
  /** Dihitung server dari source_updated_at; bukan bukti verifikasi. */
  freshness: Freshness;
}

export interface HospitalService extends Provenance {
  slug: string;
  name: string;
  status: ServiceStatus;
  /** Untuk kontrol konkurensi pada PATCH operator. */
  version: number;
}

export interface HospitalBed extends Provenance {
  category: BedCategory;
  /** null = belum diketahui. */
  total: number | null;
  /** null = belum diketahui. 0 = diketahui dan sedang nol. */
  available: number | null;
  version: number;
}

/** Kode dari sumber (mis. kelas RS SATUSEHAT). name null sampai disinkron ulang. */
export interface Coded {
  code: string;
  name: string | null;
}

/**
 * Ringkasan baca-saja (v0.2) untuk badge & filter. Data tidak ada =
 * unknown/null, tidak pernah 0/false. Bukan klaim kualitas klinis.
 */
export interface FacilitySummary {
  icu: ServiceStatus;
  nicu: ServiceStatus;
  picu: ServiceStatus;
  rawat_inap: ServiceStatus;
  bpjs: boolean | null;
  /** Dari kategori bed `general`. */
  inpatient_beds: {
    total: number | null;
    available: number | null;
    freshness: Freshness;
  };
  last_source_updated_at: string | null;
  /**
   * Asal angka di ringkasan (0.2.1). "simulation" = data contoh (dummy),
   * juga pada RS nyata; wajib berlabel. null = tidak ada data sama sekali.
   */
  data_origin: DataOrigin | null;
}

/** Provenance pada Hospital berlaku untuk record RS (termasuk BPJS). */
export interface Hospital extends Provenance {
  id: string;
  /** Kode sumber (SATUSEHAT); null untuk simulasi. Boleh dipakai di detail & compare. */
  external_id: string | null;
  source_namespace: string | null;
  name: string;
  address: string | null;
  city_code: string;
  city_name: string;
  province_code: string;
  province_name: string;
  /** latitude & longitude selalu sama-sama terisi atau sama-sama null. */
  latitude: number | null;
  longitude: number | null;
  phone: string | null;
  /** null = BPJS belum diketahui (bukan "tidak menerima"). */
  bpjs: boolean | null;
  /** Asal nilai `bpjs` (0.2.1); null bila bpjs null. "simulation" = data contoh. */
  bpjs_data_origin: DataOrigin | null;
  bpjs_source_url: string | null;
  bpjs_source_updated_at: string | null;
  /** Jarak garis lurus (Haversine), BUKAN waktu tempuh. */
  distance_km: number | null;
  facility_class: Coded | null;
  facility_subtype: Coded | null;
  /** null = belum diketahui. */
  operational: boolean | null;
  facility_summary: FacilitySummary;
  /** API 0.4.0 (BE-11). */
  data_quality: DataQuality;
  services: HospitalService[];
  beds: HospitalBed[];
}

export interface ServiceMaster {
  slug: string;
  name: string;
  category: string;
}

/**
 * Sejak API 0.3.1 kode wilayah memakai format Kemendagri tanpa titik
 * ("31", "3171"); kode bertitik ditolak 422. Tetap dipakai apa adanya.
 */
export interface Region {
  code: string;
  name: string;
}

export interface Province extends Region {
  cities: Region[];
}

/** Hasil ringkas autocomplete; detail diambil lewat `id`. */
export interface Suggestion {
  id: string;
  external_id: string | null;
  name: string;
  city_name: string;
  data_origin: DataOrigin;
}

/* ---------------- Envelope ---------------- */

export interface DetailMeta {
  as_of: string;
}

export interface ListMeta extends DetailMeta {
  page: number;
  limit: number;
  total: number;
  total_pages: number;
  data_scope: "pilot";
  dataset?: Dataset;
}

export interface CompareMeta extends DetailMeta {
  count: number;
}

export interface CountMeta {
  count: number;
}

export interface SuggestMeta extends CountMeta {
  dataset: Dataset;
}

export interface ApiSuccess<T, M = unknown> {
  data: T;
  meta?: M;
}

/** Rincian galat per field (format error seragam, API 0.3.1). */
export interface ApiErrorDetail {
  field: string;
  issue: string;
}

export interface ApiErrorBody {
  error: { code: string; message: string; details?: ApiErrorDetail[] };
  request_id: string;
}

/* ---------------- Rujukan ---------------- */

export interface TrackingHistory {
  from_status: ReferralStatus | null;
  to_status: ReferralStatus;
  public_note: string;
  created_at: string;
}

export interface TrackingResult {
  public_status: ReferralStatus;
  public_note: string;
  next_step: string;
  destination: Hospital | null;
  updated_at: string;
  history: TrackingHistory[];
}

export interface Referral {
  id: string;
  owner_hospital_id: string;
  destination_hospital_id: string | null;
  status: ReferralStatus;
  public_note: string;
  next_step: string;
  version: number;
  is_demo: true;
  updated_at: string;
}

/** Item GET /admin/referrals (API 0.3.1): Referral + nama RS pemilik (BE-08). */
export interface AdminReferral extends Referral {
  hospital_name: string;
}

/**
 * State machine dari panduan (§6). Server tetap yang memutuskan: transisi
 * tidak sah → 409 conflict. Dipakai hanya untuk menyusun pilihan di UI.
 * confirmed → searching = "dialihkan" (alasan wajib).
 */
export const ALLOWED_TRANSITIONS: Record<ReferralStatus, ReferralStatus[]> = {
  submitted: ["verified"],
  verified: ["searching", "rejected"],
  searching: ["confirmed", "rejected"],
  confirmed: ["completed", "searching"],
  completed: [],
  rejected: [],
};

/* ---------------- Auth operator ---------------- */

export interface Operator {
  id: string;
  email: string;
  hospital_ids: string[];
}

export interface LoginResult {
  /** Opsional sejak API 0.3.1 (kontrak §3); bila kosong ambil via GET /auth/csrf. */
  csrf_token?: string;
  expires_at: string;
}

export interface CsrfResult {
  csrf_token: string;
}

/* ---------------- Sistem ---------------- */

/** GET /health — liveness proses, tanpa menyentuh DB. */
export interface HealthResult {
  status: "ok";
}

/** GET /ready — DB terhubung dan migration tersedia; gagal -> 503 not_ready. */
export interface ReadyResult {
  status: "ready";
}

/* ---------------- Cek BPJS (simulasi; API 0.3.1 tidak menyimpan NIK mentah) ---------------- */

export const BPJS_PARTICIPANT_STATUSES = ["active", "inactive"] as const;
export type BpjsParticipantStatus = (typeof BPJS_PARTICIPANT_STATUSES)[number];

/** Body POST /bpjs/check. Data pribadi hanya lewat body, tidak pernah di URL. */
export interface BpjsCheckRequest {
  /** 16 digit angka. */
  nik: string;
  name: string;
  /** YYYY-MM-DD. */
  birth_date: string;
}

/** Identitas yang dikembalikan selalu disamarkan oleh server. */
export interface BpjsParticipant {
  nik_masked: string;
  name_masked: string;
  status: BpjsParticipantStatus;
  /** Alasan tidak aktif (mis. tunggakan iuran); null bila aktif/tidak diketahui. */
  inactive_reason: string | null;
  /** Jenis kepesertaan, mis. {code:"PBI", name:"Penerima Bantuan Iuran"}. */
  membership_type: Coded | null;
  /** Kelas rawat "1" | "2" | "3"; null bila tidak diketahui. */
  care_class: string | null;
  /** Faskes tingkat pertama terdaftar. */
  primary_facility: { code: string; name: string } | null;
}

export interface BpjsCheckResult {
  /** "not_found" = data tidak cocok dengan peserta mana pun (bukan galat). */
  result: "found" | "not_found";
  participant: BpjsParticipant | null;
  /** Selalu "simulation" sampai ada integrasi resmi. */
  data_origin: DataOrigin;
  checked_at: string;
}

/* ---------------- Rekomendasi (API 0.4.0, kontrak §4) ---------------- */

export const RADIUS_OPTIONS = [5, 10, 20, 50] as const;
export type RadiusKm = (typeof RADIUS_OPTIONS)[number];

export const BPJS_PREFERENCES = ["required", "any"] as const;
export type BpjsPreference = (typeof BPJS_PREFERENCES)[number];

export const SCORE_LEVELS = ["high", "medium", "low"] as const;
export type ScoreLevel = (typeof SCORE_LEVELS)[number];

export const SCORE_COMPONENT_KEYS = [
  "service_match",
  "bed_availability",
  "distance",
  "bpjs",
  "data_confidence",
] as const;
export type ScoreComponentKey = (typeof SCORE_COMPONENT_KEYS)[number];

export const RECOMMENDATION_FLAGS = [
  "contains_simulated_data",
  "stale_or_unknown_freshness",
] as const;
export type RecommendationFlag = (typeof RECOMMENDATION_FLAGS)[number];

export const EXCLUSION_REASONS = [
  "service_unavailable",
  "bpjs_false",
  "out_of_radius",
  "location_unknown",
  "not_operational",
] as const;
export type ExclusionReason = (typeof EXCLUSION_REASONS)[number];

export interface ScoreComponent {
  key: ScoreComponentKey;
  label: string;
  /** Bobot setelah renormalisasi, 0..1. */
  weight: number;
  value: number;
  /** round(100 × weight × value × penalti). */
  contribution: number;
  /** Penjelasan Bahasa Indonesia dari server; tampilkan apa adanya. */
  reason: string;
}

/** DTO RS ringkas di rekomendasi: memakai `lat`/`lng`, bukan latitude/longitude. */
export interface RecommendedHospital {
  id: string;
  name: string;
  address: string | null;
  city_name: string;
  province_name: string;
  phone: string | null;
  lat: number | null;
  lng: number | null;
  bpjs: boolean | null;
  data_origin: DataOrigin;
  facility_summary: FacilitySummary;
  data_quality: DataQuality;
}

export interface Recommendation {
  hospital: RecommendedHospital;
  score: number;
  level: ScoreLevel;
  /** Garis lurus; null bila permintaan tanpa lat/lng. */
  distance_km: number | null;
  components: ScoreComponent[];
  /** Nilai yang belum diketahui, mis. "service_icu", "bed_nicu", "bpjs". */
  unknowns: string[];
  flags: RecommendationFlag[];
}

export interface RecommendationMeta {
  total_considered: number;
  /** Hanya alasan dengan ≥ 1 RS yang muncul. */
  excluded: Partial<Record<ExclusionReason, number>>;
  weights: Record<ScoreComponentKey, number>;
  generated_at: string;
  algorithm_version: string;
  dataset: Dataset;
  candidates_truncated: boolean;
  radius_km: number | null;
}

/* ---------------- Marker peta (API 0.4.0, kontrak §7) ---------------- */

export const MARKER_MATCHES = ["all", "partial", "none"] as const;
export type MarkerMatch = (typeof MARKER_MATCHES)[number];

export interface HospitalMarker {
  id: string;
  name: string;
  lat: number;
  lng: number;
  match: MarkerMatch;
  data_quality_label: DataQualityLabel;
  has_simulated_data: boolean;
}

export interface MarkerMeta {
  count: number;
  truncated: boolean;
  dataset: Dataset;
  as_of: string;
}
