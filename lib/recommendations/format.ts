/**
 * Format tampilan hasil rekomendasi. Skor & alasan berasal dari server dan
 * tidak dihitung ulang di sini; modul ini hanya menyusun kalimat. Fungsi murni.
 */
import {
  BED_CATEGORY_LABEL,
  EXCLUSION_REASON_LABEL,
} from "../contracts/labels.ts";
import {
  EXCLUSION_REASONS,
  type ExclusionReason,
  type RecommendationMeta,
} from "../contracts/types.ts";

/** Gabung daftar Indonesia: "A", "A atau B", "A, B, atau C". */
export function joinOr(items: string[]): string {
  if (items.length <= 1) return items[0] ?? "";
  if (items.length === 2) return `${items[0]} atau ${items[1]}`;
  return `${items.slice(0, -1).join(", ")}, atau ${items[items.length - 1]}`;
}

/**
 * Label untuk satu kunci `unknowns` dari server, mis. "service_icu",
 * "bed_nicu", "bpjs". Kunci tak dikenal ditampilkan apa adanya.
 */
export function unknownLabel(
  key: string,
  serviceNames: Record<string, string> = {},
): string {
  if (key === "bpjs") return "Penerimaan BPJS";
  if (key.startsWith("service_")) {
    const slug = key.slice("service_".length);
    // Server memakai "_" untuk slug ber-tanda hubung (mis. service_igd_24h).
    const name =
      serviceNames[slug] ?? serviceNames[slug.replaceAll("_", "-")] ?? slug.toUpperCase();
    return `Status layanan ${name}`;
  }
  if (key.startsWith("bed_")) {
    const category = key.slice("bed_".length);
    const name =
      (BED_CATEGORY_LABEL as Record<string, string>)[category] ?? category;
    return `Tempat tidur ${name}`;
  }
  return key;
}

/**
 * Ringkasan RS yang dikeluarkan filter keras, satu kalimat per alasan.
 * Contoh: "3 RS tidak ditampilkan karena NICU tercatat tidak tersedia."
 */
export function excludedSummary(
  excluded: RecommendationMeta["excluded"],
  selectedServiceNames: string[],
): string[] {
  const services = joinOr(selectedServiceNames) || "layanan yang dipilih";
  return EXCLUSION_REASONS.flatMap((reason: ExclusionReason) => {
    const count = excluded[reason];
    if (!count || count < 1) return [];
    const why = EXCLUSION_REASON_LABEL[reason].replace("{services}", services);
    return [`${count} RS tidak ditampilkan karena ${why}.`];
  });
}

/** 0..1 -> "80%". */
export function formatRatio(value: number): string {
  const clamped = Math.max(0, Math.min(1, value));
  return `${Math.round(clamped * 100)}%`;
}

/** "Google Maps" rute ke koordinat; null tanpa koordinat. */
export function routeHref(lat: number | null, lng: number | null): string | null {
  if (lat === null || lng === null) return null;
  return `https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}`;
}
