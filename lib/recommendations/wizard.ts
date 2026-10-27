/**
 * State wizard /pilih-rs. URL adalah sumber kebenaran: setiap langkah dapat
 * dibuka ulang di tab baru dan tombol kembali peramban mundur satu langkah.
 * Fungsi murni.
 *
 * Aturan dari kontrak §4.1:
 * - `services` wajib (1–6 slug).
 * - Lokasi: lat+lng (berpasangan, radius 5/10/20/50) ATAU kode wilayah.
 * - `bpjs` required|any, `dataset` real|simulation|all, `limit` 1–20.
 * Koordinat dibulatkan 3 desimal (privasi) sebelum masuk URL.
 */
import {
  RADIUS_OPTIONS,
  type BpjsPreference,
  type RadiusKm,
} from "../contracts/types.ts";

export const WIZARD_STEPS = [1, 2, 3, "hasil"] as const;
export type WizardStep = (typeof WIZARD_STEPS)[number];

export const MAX_SERVICES = 6;
export const DEFAULT_RADIUS: RadiusKm = 20;
export const RESULT_LIMIT = 10;

/** Dataset yang ditawarkan wizard: data nyata saja, atau sertakan simulasi. */
export type WizardDataset = "real" | "all";

export interface WizardState {
  step: WizardStep;
  services: string[];
  lat: number | null;
  lng: number | null;
  radius_km: RadiusKm;
  province_code: string;
  city_code: string;
  bpjs: BpjsPreference;
  dataset: WizardDataset;
}

export const EMPTY_WIZARD: WizardState = {
  step: 1,
  services: [],
  lat: null,
  lng: null,
  radius_km: DEFAULT_RADIUS,
  province_code: "",
  city_code: "",
  bpjs: "any",
  dataset: "real",
};

interface ParamReader {
  get(name: string): string | null;
}

const SLUG_RE = /^[a-z0-9][a-z0-9-]{0,39}$/;
const REGION_RE = /^[0-9]{2,10}$/;

/** Bulatkan ke 3 desimal (± 110 m) agar lokasi presisi tidak tersimpan di URL. */
export function roundCoord(value: number): number {
  return Math.round(value * 1000) / 1000;
}

function toCoord(raw: string | null, min: number, max: number): number | null {
  if (raw === null || raw.trim() === "") return null;
  const n = Number(raw);
  return Number.isFinite(n) && n >= min && n <= max ? roundCoord(n) : null;
}

function toServices(raw: string | null): string[] {
  const slugs = (raw ?? "")
    .split(",")
    .map((s) => s.trim().toLowerCase())
    .filter((s) => SLUG_RE.test(s));
  return [...new Set(slugs)].sort().slice(0, MAX_SERVICES);
}

function toRadius(raw: string | null): RadiusKm {
  const n = Number(raw);
  return (RADIUS_OPTIONS as readonly number[]).includes(n)
    ? (n as RadiusKm)
    : DEFAULT_RADIUS;
}

function toRegion(raw: string | null): string {
  return raw !== null && REGION_RE.test(raw) ? raw : "";
}

export function hasCoords(s: Pick<WizardState, "lat" | "lng">): boolean {
  return s.lat !== null && s.lng !== null;
}

/** Lokasi lengkap: koordinat, atau minimal provinsi. */
export function hasLocation(s: WizardState): boolean {
  return hasCoords(s) || s.province_code !== "" || s.city_code !== "";
}

/**
 * Langkah terjauh yang boleh dibuka dengan isian saat ini. Langkah 2 butuh
 * layanan; langkah 3 dan hasil butuh lokasi juga.
 */
export function maxReachableStep(s: WizardState): WizardStep {
  if (s.services.length === 0) return 1;
  if (!hasLocation(s)) return 2;
  return "hasil";
}

function stepIndex(step: WizardStep): number {
  return WIZARD_STEPS.indexOf(step);
}

export function parseWizardState(params: ParamReader): WizardState {
  const lat = toCoord(params.get("lat"), -90, 90);
  const lng = toCoord(params.get("lng"), -180, 180);
  const paired = lat !== null && lng !== null;
  const city = toRegion(params.get("city_code"));
  // Koordinat menang bila keduanya ada; kode wilayah diabaikan.
  const state: WizardState = {
    step: 1,
    services: toServices(params.get("services")),
    lat: paired ? lat : null,
    lng: paired ? lng : null,
    radius_km: toRadius(params.get("radius_km")),
    province_code: paired ? "" : toRegion(params.get("province_code")),
    // Kota hanya berarti bersama provinsinya (kode kota diawali kode provinsi).
    city_code: paired ? "" : city,
    bpjs: params.get("bpjs") === "required" ? "required" : "any",
    dataset: params.get("dataset") === "all" ? "all" : "real",
  };
  if (state.city_code && !state.city_code.startsWith(state.province_code || "\0")) {
    state.city_code = "";
  }

  const rawStep = params.get("step");
  const requested = WIZARD_STEPS.find((s) => String(s) === rawStep) ?? 1;
  const max = maxReachableStep(state);
  state.step = stepIndex(requested) <= stepIndex(max) ? requested : max;
  return state;
}

/** Query string URL halaman (urutan tetap, tanpa nilai bawaan/kosong). */
export function serializeWizardState(s: WizardState): string {
  const out = new URLSearchParams();
  if (s.step !== 1) out.set("step", String(s.step));
  if (s.services.length > 0) out.set("services", s.services.join(","));
  if (hasCoords(s)) {
    out.set("lat", String(s.lat));
    out.set("lng", String(s.lng));
    if (s.radius_km !== DEFAULT_RADIUS) out.set("radius_km", String(s.radius_km));
  } else {
    if (s.province_code) out.set("province_code", s.province_code);
    if (s.city_code) out.set("city_code", s.city_code);
  }
  if (s.bpjs !== "any") out.set("bpjs", s.bpjs);
  if (s.dataset !== "real") out.set("dataset", s.dataset);
  return out.toString();
}

/** Query GET /recommendations. Selalu eksplisit; tidak pernah mengirim nilai kosong. */
export function buildRecommendationApiQuery(s: WizardState): string {
  const out = new URLSearchParams();
  out.set("services", s.services.join(","));
  if (hasCoords(s)) {
    out.set("lat", String(s.lat));
    out.set("lng", String(s.lng));
    out.set("radius_km", String(s.radius_km));
  } else {
    if (s.province_code) out.set("province_code", s.province_code);
    if (s.city_code) out.set("city_code", s.city_code);
  }
  out.set("bpjs", s.bpjs);
  out.set("dataset", s.dataset);
  out.set("limit", String(RESULT_LIMIT));
  return out.toString();
}

/**
 * Langkah wizard yang memuat field bermasalah dari galat 422 (`details[].field`),
 * agar pengguna dikembalikan ke langkah terkait.
 */
export function stepForField(field: string): 1 | 2 | 3 {
  if (field === "services") return 1;
  if (["lat", "lng", "radius_km", "province_code", "city_code"].includes(field)) {
    return 2;
  }
  return 3;
}
