import type { Hospital, HospitalBed, HospitalService } from "../../lib/contracts/types.ts";

const PROVENANCE = {
  data_origin: "simulation",
  source_url: null,
  source_updated_at: null,
  synced_at: null,
  verified_at: null,
  freshness: "unknown",
} as const;

export function service(slug: string, status: HospitalService["status"]): HospitalService {
  return { ...PROVENANCE, slug, name: slug.toUpperCase(), status, version: 1 };
}

export function bed(category: HospitalBed["category"], available: number | null): HospitalBed {
  return { ...PROVENANCE, category, total: available === null ? null : 50, available, version: 1 };
}

/** RS minimal yang valid menurut tipe kontrak; override per test. */
export function makeHospital(overrides: Partial<Hospital> = {}): Hospital {
  return {
    ...PROVENANCE,
    id: "00000000-0000-4000-8000-000000000001",
    external_id: null,
    source_namespace: null,
    name: "RS Uji",
    address: null,
    city_code: "3275",
    city_name: "Kota Bekasi",
    province_code: "32",
    province_name: "Jawa Barat",
    latitude: null,
    longitude: null,
    phone: null,
    bpjs: null,
    bpjs_data_origin: null,
    bpjs_source_url: null,
    bpjs_source_updated_at: null,
    distance_km: null,
    facility_class: null,
    facility_subtype: null,
    operational: null,
    facility_summary: {
      icu: "unknown",
      nicu: "unknown",
      picu: "unknown",
      rawat_inap: "unknown",
      bpjs: null,
      inpatient_beds: { total: null, available: null, freshness: "unknown" },
      last_source_updated_at: null,
      data_origin: null,
    },
    data_quality: {
      score: 40,
      label: "terbatas",
      completeness: 0.5,
      freshness: "unknown",
      primary_origin: "simulation",
    },
    services: [],
    beds: [],
    ...overrides,
  };
}
