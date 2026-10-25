/**
 * Pemetaan label Indonesia terpusat untuk enum kontrak.
 * UI tidak boleh menulis label status sendiri-sendiri.
 */
import type {
  BedCategory,
  Coded,
  DataOrigin,
  FacilitySummary,
  Freshness,
  ReferralStatus,
  ServiceStatus,
  TrackingHistory,
} from "./types.ts";

export const SERVICE_STATUS_LABEL: Record<ServiceStatus, string> = {
  available: "Tersedia",
  limited: "Terbatas",
  unavailable: "Tidak tersedia",
  unknown: "Belum diketahui",
};

export const ORIGIN_LABEL: Record<DataOrigin, string> = {
  curated: "Kurasi Tim",
  simulation: "Simulasi",
  satusehat_sandbox: "SATUSEHAT Sandbox",
  satusehat_production: "SATUSEHAT",
};

export const ORIGIN_DESCRIPTION: Record<DataOrigin, string> = {
  curated: "Dikurasi tim dari sumber lapangan atau dokumen publik.",
  simulation:
    "Data simulasi dengan rumah sakit fiktif untuk demo; bukan fakta layanan rumah sakit nyata.",
  satusehat_sandbox:
    "Data dari lingkungan sandbox SATUSEHAT; bukan data produksi dan bisa tidak lengkap.",
  satusehat_production: "Data dari SATUSEHAT produksi (hanya bila berizin).",
};

export const FRESHNESS_LABEL: Record<Freshness, string> = {
  fresh: "Terbaru (< 1 jam)",
  aging: "Mulai lama (1–24 jam)",
  stale: "Kedaluwarsa (> 24 jam)",
  unknown: "Waktu pembaruan tidak diketahui",
};

export const REFERRAL_STATUS_LABEL: Record<ReferralStatus, string> = {
  submitted: "Diajukan",
  verified: "Terverifikasi",
  searching: "Mencari rumah sakit",
  confirmed: "Terkonfirmasi",
  completed: "Selesai",
  rejected: "Ditolak",
};

/** confirmed -> searching adalah event "dialihkan", bukan status ke-7. */
export function isRedirect(
  from: ReferralStatus | null,
  to: ReferralStatus,
): boolean {
  return from === "confirmed" && to === "searching";
}

export function historyEntryLabel(entry: TrackingHistory): string {
  const base = REFERRAL_STATUS_LABEL[entry.to_status];
  return isRedirect(entry.from_status, entry.to_status)
    ? `Dialihkan — ${base}`
    : base;
}

export const BED_CATEGORY_LABEL: Record<BedCategory, string> = {
  icu: "ICU",
  nicu: "NICU",
  picu: "PICU",
  general: "Rawat inap umum",
};

/** Label kategori tempat tidur; kategori tak dikenal ditampilkan apa adanya. */
export function bedCategoryLabel(category: string): string {
  return (BED_CATEGORY_LABEL as Record<string, string>)[category] ?? category;
}

/** Status fasilitas pada facility_summary (urut tampil tetap). */
export const FACILITY_KEYS = ["icu", "nicu", "picu", "rawat_inap"] as const satisfies
  readonly (keyof FacilitySummary)[];
export type FacilityKey = (typeof FACILITY_KEYS)[number];

export const FACILITY_LABEL: Record<FacilityKey, string> = {
  icu: "ICU",
  nicu: "NICU",
  picu: "PICU",
  rawat_inap: "Rawat inap",
};

/** Slug layanan yang sudah terwakili facility_summary (hindari tampil ganda). */
export const FACILITY_SERVICE_SLUGS: ReadonlySet<string> = new Set([
  "icu",
  "nicu",
  "picu",
  "rawat-inap",
]);

/** Kelas/subtipe RS: name bisa null sampai sumber disinkron ulang -> pakai code. */
export function codedLabel(value: Coded | null): string | null {
  if (!value) return null;
  return value.name ?? value.code;
}

/** null = belum diketahui, bukan "tidak beroperasi". */
export function operationalLabel(value: boolean | null): string {
  if (value === true) return "Beroperasi menurut sumber";
  if (value === false) return "Tidak beroperasi menurut sumber";
  return "Belum diketahui";
}
