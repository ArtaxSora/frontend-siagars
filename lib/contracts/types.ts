/**
 * DTO kontrak API SiagaRS (/api/v1) — snake_case, timestamp RFC3339 UTC,
 * ID = UUID lowercase.
 *
 * Disusun dari "SiagaRS API v0.1 — Panduan Integrasi Frontend". Sumber
 * kontrak resmi tetap `openapi.yaml` backend
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
  services: HospitalService[];
  beds: HospitalBed[];
}

export interface ServiceMaster {
  slug: string;
  name: string;
  category: string;
}

/** Kode wilayah dipakai apa adanya: seed "31.71" dan MSI "3171" berbeda. */
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

export interface ApiErrorBody {
  error: { code: string; message: string };
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
  csrf_token: string;
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
