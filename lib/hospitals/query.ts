/**
 * Serializer/parser tunggal untuk filter pencarian RS.
 * URL adalah sumber kebenaran; permintaan API memakai query yang sama.
 *
 * Aturan dari kontrak API:
 * - `services`: slug dipisah koma, logika AND.
 * - Parameter kosong/berulang/tidak dikenal -> 422, jadi nilai kosong
 *   TIDAK PERNAH dikirim.
 * - `lat` & `lng` hanya berpasangan; `sort=distance` butuh keduanya.
 * - Kode wilayah dikirim kembali persis seperti yang diterima dari API
 *   (format seed "31.71" vs sandbox "3171" berbeda) — jangan ditebak.
 * - `q` berawalan `$` ditolak/di-escape di frontend (temuan backend terbuka).
 */

export const SORT_VALUES = ["name", "distance", "match"] as const;
export type HospitalSort = (typeof SORT_VALUES)[number];

export const DATASET_VALUES = ["real", "simulation", "all"] as const;
export type HospitalDataset = (typeof DATASET_VALUES)[number];

/**
 * Dataset bawaan UI. Panduan menyarankan `simulation` untuk demo (default API
 * adalah `real`, yang berisi data sandbox yang sering kosong layanan/bed).
 */
export const DEFAULT_DATASET: HospitalDataset = "real";
export const DEFAULT_LIMIT = 20;
export const MAX_LIMIT = 50;
export const MAX_Q_LENGTH = 100;

export interface HospitalQuery {
  q: string;
  province_code: string;
  city_code: string;
  /** Semua layanan harus terpenuhi (AND). Urutan dinormalkan (alfabetis). */
  services: string[];
  bpjs: boolean;
  has_available_beds: boolean;
  dataset: HospitalDataset;
  page: number;
  limit: number;
  sort: HospitalSort;
  lat: number | null;
  lng: number | null;
}

export const EMPTY_QUERY: HospitalQuery = {
  q: "",
  province_code: "",
  city_code: "",
  services: [],
  bpjs: false,
  has_available_beds: false,
  dataset: DEFAULT_DATASET,
  page: 1,
  limit: DEFAULT_LIMIT,
  sort: "name",
  lat: null,
  lng: null,
};

/** Subset minimum dari URLSearchParams/ReadonlyURLSearchParams. */
interface ParamReader {
  get(name: string): string | null;
}

function toPositiveInt(raw: string | null, fallback: number, max?: number): number {
  if (raw === null || !/^\d+$/.test(raw)) return fallback;
  const n = Number.parseInt(raw, 10);
  if (!Number.isFinite(n) || n < 1) return fallback;
  return max !== undefined ? Math.min(n, max) : n;
}

function toCoord(raw: string | null, min: number, max: number): number | null {
  if (raw === null || raw.trim() === "") return null;
  const n = Number(raw);
  if (!Number.isFinite(n) || n < min || n > max) return null;
  return n;
}

function normalizeServices(values: Iterable<string>): string[] {
  const set = new Set<string>();
  for (const v of values) {
    const slug = v.trim().toLowerCase();
    if (/^[a-z0-9][a-z0-9-]*$/.test(slug)) set.add(slug);
  }
  return [...set].sort();
}

/** Bersihkan q: trim, buang `$` di awal (temuan backend), batasi panjang. */
export function sanitizeSearchText(raw: string): string {
  return raw.trim().replace(/^[\s$]+/, "").slice(0, MAX_Q_LENGTH).trim();
}

function toRegionCode(raw: string | null): string {
  return raw !== null && /^[0-9.]{1,12}$/.test(raw) ? raw : "";
}

export function parseHospitalQuery(params: ParamReader): HospitalQuery {
  const lat = toCoord(params.get("lat"), -90, 90);
  const lng = toCoord(params.get("lng"), -180, 180);
  const hasCoords = lat !== null && lng !== null;

  const sortRaw = params.get("sort");
  let sort: HospitalSort = "name";
  if (sortRaw === "match") sort = "match";
  else if (sortRaw === "distance" && hasCoords) sort = "distance";

  const datasetRaw = params.get("dataset");
  const dataset =
    (DATASET_VALUES as readonly string[]).includes(datasetRaw ?? "")
      ? (datasetRaw as HospitalDataset)
      : DEFAULT_DATASET;

  return {
    q: sanitizeSearchText(params.get("q") ?? ""),
    province_code: toRegionCode(params.get("province_code")),
    city_code: toRegionCode(params.get("city_code")),
    services: normalizeServices((params.get("services") ?? "").split(",")),
    bpjs: params.get("bpjs") === "true",
    has_available_beds: params.get("has_available_beds") === "true",
    dataset,
    page: toPositiveInt(params.get("page"), 1),
    limit: toPositiveInt(params.get("limit"), DEFAULT_LIMIT, MAX_LIMIT),
    sort,
    lat: hasCoords ? lat : null,
    lng: hasCoords ? lng : null,
  };
}

function appendCommon(out: URLSearchParams, query: HospitalQuery): void {
  if (query.q) out.set("q", query.q);
  if (query.province_code) out.set("province_code", query.province_code);
  if (query.city_code) out.set("city_code", query.city_code);
  const services = normalizeServices(query.services);
  if (services.length > 0) out.set("services", services.join(","));
  if (query.bpjs) out.set("bpjs", "true");
  if (query.has_available_beds) out.set("has_available_beds", "true");
  if (query.lat !== null && query.lng !== null) {
    out.set("lat", query.lat.toFixed(3));
    out.set("lng", query.lng.toFixed(3));
  }
}

/**
 * Query untuk URL halaman. Nilai default tidak ditulis agar URL ringkas dan
 * dua query yang setara menghasilkan string yang sama.
 */
export function serializeHospitalQuery(query: HospitalQuery): string {
  const out = new URLSearchParams();
  appendCommon(out, query);
  if (query.dataset !== DEFAULT_DATASET) out.set("dataset", query.dataset);
  if (query.page > 1) out.set("page", String(query.page));
  if (query.limit !== DEFAULT_LIMIT) out.set("limit", String(query.limit));
  const hasCoords = query.lat !== null && query.lng !== null;
  if (query.sort !== "name" && (query.sort !== "distance" || hasCoords)) {
    out.set("sort", query.sort);
  }
  return out.toString();
}

/**
 * Query untuk permintaan API. `dataset`, `page`, `limit`, dan `sort` SELALU
 * eksplisit (jangan mengandalkan default server); nilai kosong tidak dikirim.
 */
export function buildApiQueryString(query: HospitalQuery): string {
  const out = new URLSearchParams();
  appendCommon(out, query);
  out.set("dataset", query.dataset);
  out.set("page", String(query.page));
  out.set("limit", String(query.limit));
  const hasCoords = query.lat !== null && query.lng !== null;
  out.set("sort", query.sort === "distance" && !hasCoords ? "name" : query.sort);
  return out.toString();
}

/** Ubah filter: halaman selalu kembali ke 1. */
export function applyFilterChange(
  current: HospitalQuery,
  patch: Partial<Omit<HospitalQuery, "page">>,
): HospitalQuery {
  return { ...current, ...patch, page: 1 };
}

export function applyPageChange(
  current: HospitalQuery,
  page: number,
): HospitalQuery {
  return { ...current, page: Math.max(1, Math.floor(page)) };
}

/** Jumlah filter aktif (selain dataset/page/limit/sort) — untuk "Reset filter". */
export function activeFilterCount(query: HospitalQuery): number {
  let n = 0;
  if (query.q) n++;
  if (query.province_code) n++;
  if (query.city_code) n++;
  n += query.services.length;
  if (query.bpjs) n++;
  if (query.has_available_beds) n++;
  return n;
}
