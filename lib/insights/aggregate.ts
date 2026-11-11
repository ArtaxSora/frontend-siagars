/**
 * Fungsi murni untuk query & agregasi cadangan Wawasan Data (FE-20),
 * deskripsi metadata OpenGraph RS (FE-21), dan query riwayat BPJS (FE-22).
 *
 * Bebas dependensi React/Next agar dapat diuji langsung dengan `node:test`.
 */
import {
  BPJS_CHECK_RESULTS,
  DATASETS,
  DATA_ORIGINS,
  type BpjsCheckResultKind,
  type DataOrigin,
  type Dataset,
  type Freshness,
  type Hospital,
  type InsightsCoverageByClass,
  type InsightsCoverageRow,
  type InsightsFreshnessRow,
  type InsightsServiceGapRow,
  type InsightsSummary,
  type ServiceStatus,
} from "../contracts/types.ts";
import {
  DATA_QUALITY_LABEL,
  FACILITY_KEYS,
  FACILITY_LABEL,
  SERVICE_STATUS_LABEL,
} from "../contracts/labels.ts";
import { hasSimulatedData } from "../hospitals/summary.ts";

export interface InsightsQueryOptions {
  province_code?: string;
  dataset?: Dataset;
  service?: string;
}

const REGION_CODE_RE = /^\d{2,6}$/;

export function isValidRegionCode(code: string | undefined): code is string {
  return typeof code === "string" && REGION_CODE_RE.test(code.trim());
}

/** Query string eksplisit untuk endpoint /insights/* (kontrak §6). */
export function buildInsightsQuery(opts: InsightsQueryOptions = {}): string {
  const dataset: Dataset =
    opts.dataset && (DATASETS as readonly string[]).includes(opts.dataset)
      ? opts.dataset
      : "real";
  const params = new URLSearchParams({ dataset });
  if (isValidRegionCode(opts.province_code)) {
    params.set("province_code", opts.province_code.trim());
  }
  if (opts.service && opts.service.trim().length > 0) {
    params.set("service", opts.service.trim().toLowerCase());
  }
  return params.toString();
}

export interface BpjsChecksQueryOptions {
  page?: number;
  limit?: number;
  result?: BpjsCheckResultKind | "";
}

/** Query string untuk GET /admin/bpjs-checks (kontrak §2 #27). */
export function buildBpjsChecksQuery(opts: BpjsChecksQueryOptions = {}): string {
  const page =
    typeof opts.page === "number" && Number.isInteger(opts.page) && opts.page >= 1
      ? opts.page
      : 1;
  const limit =
    typeof opts.limit === "number" &&
    Number.isInteger(opts.limit) &&
    opts.limit >= 1 &&
    opts.limit <= 50
      ? opts.limit
      : 20;
  const params = new URLSearchParams({
    page: String(page),
    limit: String(limit),
  });
  if (
    opts.result &&
    (BPJS_CHECK_RESULTS as readonly string[]).includes(opts.result)
  ) {
    params.set("result", opts.result);
  }
  return params.toString();
}

function isCuratedHospital(h: Hospital): boolean {
  return (
    h.data_origin === "curated" ||
    h.data_quality?.primary_origin === "curated" ||
    h.facility_summary?.data_origin === "curated" ||
    h.bpjs_data_origin === "curated" ||
    h.services.some((s) => s.data_origin === "curated") ||
    h.beds.some((b) => b.data_origin === "curated")
  );
}

function effectiveFreshness(h: Hospital): Freshness {
  return h.data_quality?.freshness ?? h.freshness ?? "unknown";
}

function effectiveOrigin(h: Hospital): DataOrigin {
  return (
    h.data_quality?.primary_origin ??
    h.facility_summary?.data_origin ??
    h.data_origin
  );
}

/**
 * Agregasi cadangan untuk GET /insights/summary bila backend prod belum
 * mengaktifkan endpoint v0.5.0.
 */
export function aggregateInsightsSummary(
  hospitals: readonly Hospital[],
): InsightsSummary {
  const total = hospitals.length;
  if (total === 0) {
    return {
      hospital_count: 0,
      city_count: 0,
      curated_count: 0,
      simulated_facility_count: 0,
      fresh_ratio: 0,
      with_known_bpjs_ratio: 0,
    };
  }
  const cities = new Set<string>();
  let curated = 0;
  let simulated = 0;
  let fresh = 0;
  let knownBpjs = 0;

  for (const h of hospitals) {
    if (h.city_code) cities.add(h.city_code);
    if (isCuratedHospital(h)) curated += 1;
    if (hasSimulatedData(h)) simulated += 1;
    if (effectiveFreshness(h) === "fresh") fresh += 1;
    if ((h.bpjs ?? h.facility_summary?.bpjs ?? null) !== null) knownBpjs += 1;
  }

  return {
    hospital_count: total,
    city_count: cities.size,
    curated_count: curated,
    simulated_facility_count: simulated,
    fresh_ratio: fresh / total,
    with_known_bpjs_ratio: knownBpjs / total,
  };
}

function normalizeClassKey(
  code: string | null | undefined,
): keyof InsightsCoverageByClass {
  const clean = code?.trim().toUpperCase().replace(/^KELAS\s+/i, "") ?? "";
  if (clean === "A" || clean === "B" || clean === "C" || clean === "D") {
    return clean;
  }
  return "unknown";
}

/** Agregasi cadangan untuk GET /insights/coverage per kota/kabupaten. */
export function aggregateInsightsCoverage(
  hospitals: readonly Hospital[],
): InsightsCoverageRow[] {
  const map = new Map<string, InsightsCoverageRow>();

  for (const h of hospitals) {
    const code = h.city_code || h.city_name;
    let row = map.get(code);
    if (!row) {
      row = {
        city_code: h.city_code,
        city_name: h.city_name,
        hospital_count: 0,
        by_class: { A: 0, B: 0, C: 0, D: 0, unknown: 0 },
        curated_count: 0,
      };
      map.set(code, row);
    }
    row.hospital_count += 1;
    const cls = normalizeClassKey(h.facility_class?.code);
    row.by_class[cls] += 1;
    if (isCuratedHospital(h)) row.curated_count += 1;
  }

  return Array.from(map.values()).sort(
    (a, b) =>
      b.hospital_count - a.hospital_count ||
      a.city_name.localeCompare(b.city_name, "id"),
  );
}

function statusForService(h: Hospital, slug: string): ServiceStatus {
  const normalized = slug.trim().toLowerCase();
  const found = h.services.find((s) => s.slug.toLowerCase() === normalized);
  if (found) return found.status;
  if (normalized === "icu") return h.facility_summary.icu;
  if (normalized === "nicu") return h.facility_summary.nicu;
  if (normalized === "picu") return h.facility_summary.picu;
  if (normalized === "rawat-inap" || normalized === "rawat_inap") {
    return h.facility_summary.rawat_inap;
  }
  return "unknown";
}

/**
 * Agregasi cadangan untuk GET /insights/service-gaps?service=<slug>.
 * Kontrak §6: `gap = available + limited == 0`.
 */
export function aggregateInsightsServiceGaps(
  hospitals: readonly Hospital[],
  serviceSlug: string,
): InsightsServiceGapRow[] {
  const map = new Map<string, InsightsServiceGapRow>();

  for (const h of hospitals) {
    const code = h.city_code || h.city_name;
    let row = map.get(code);
    if (!row) {
      row = {
        city_code: h.city_code,
        city_name: h.city_name,
        available: 0,
        limited: 0,
        unavailable: 0,
        unknown: 0,
        gap: true,
      };
      map.set(code, row);
    }
    const st = statusForService(h, serviceSlug);
    row[st] += 1;
    row.gap = row.available + row.limited === 0;
  }

  return Array.from(map.values()).sort(
    (a, b) =>
      Number(b.gap) - Number(a.gap) ||
      a.city_name.localeCompare(b.city_name, "id"),
  );
}

/** Agregasi cadangan untuk GET /insights/freshness per asal data. */
export function aggregateInsightsFreshness(
  hospitals: readonly Hospital[],
): InsightsFreshnessRow[] {
  const map = new Map<DataOrigin, InsightsFreshnessRow>();
  for (const origin of DATA_ORIGINS) {
    map.set(origin, {
      data_origin: origin,
      fresh: 0,
      aging: 0,
      stale: 0,
      unknown: 0,
    });
  }

  for (const h of hospitals) {
    const origin = effectiveOrigin(h);
    const freshness = effectiveFreshness(h);
    const row = map.get(origin);
    if (row) row[freshness] += 1;
  }

  return Array.from(map.values()).filter(
    (r) => r.fresh + r.aging + r.stale + r.unknown > 0,
  );
}

/**
 * Ringkasan judul & deskripsi OpenGraph untuk detail RS (FE-21).
 * Jujur terhadap status null/simulasi: tidak mengklaim kualitas medis.
 */
export function describeHospitalMetadata(hospital: Hospital): {
  title: string;
  description: string;
} {
  const title = `${hospital.name} (${hospital.city_name})`;
  const bpjs = hospital.bpjs ?? hospital.facility_summary.bpjs;
  const bpjsText =
    bpjs === true
      ? "Menerima BPJS"
      : bpjs === false
        ? "Tercatat tidak menerima BPJS"
        : "Status BPJS belum diketahui";

  const facilities = FACILITY_KEYS.map(
    (k) => `${FACILITY_LABEL[k]}: ${SERVICE_STATUS_LABEL[hospital.facility_summary[k]].toLowerCase()}`,
  ).join(", ");

  const quality = `${DATA_QUALITY_LABEL[hospital.data_quality.label]} (${hospital.data_quality.score}/100)`;

  return {
    title,
    description: `${hospital.name} di ${hospital.city_name}, ${hospital.province_name}. ${bpjsText}. Ringkasan layanan — ${facilities}. ${quality}.`,
  };
}
