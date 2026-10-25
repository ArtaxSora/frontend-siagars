/**
 * Ringkasan sumber & helper tampilan kartu RS. Fungsi murni.
 */
import type {
  BedCategory,
  DataOrigin,
  Freshness,
  Hospital,
  HospitalBed,
  Provenance,
} from "../contracts/types.ts";

/** Urutan dari paling baik ke paling meragukan. */
const FRESHNESS_RANK: Record<Freshness, number> = {
  fresh: 0,
  aging: 1,
  stale: 2,
  unknown: 3,
};

/** Provenance record RS + setiap layanan + setiap bed. */
export function collectSources(hospital: Hospital): Provenance[] {
  return [hospital, ...hospital.services, ...hospital.beds];
}

/** Kesegaran terburuk di antara sumber — "data paling lama". */
export function worstFreshness(sources: Provenance[]): Freshness {
  if (sources.length === 0) return "unknown";
  return sources.reduce<Freshness>(
    (worst, s) =>
      FRESHNESS_RANK[s.freshness] > FRESHNESS_RANK[worst] ? s.freshness : worst,
    "fresh",
  );
}

export function uniqueOrigins(sources: Provenance[]): DataOrigin[] {
  return [...new Set(sources.map((s) => s.data_origin))];
}

/** Kategori tempat tidur yang ditampilkan pada kartu (urut tetap). */
export const CARD_BED_CATEGORIES: readonly BedCategory[] = [
  "icu",
  "nicu",
  "picu",
  "general",
];

/** Bed null bila RS tidak melacak kategori tsb (= belum diketahui). */
export function cardBeds(
  hospital: Hospital,
): Array<{ category: BedCategory; bed: HospitalBed | null }> {
  return CARD_BED_CATEGORIES.map((category) => ({
    category,
    bed: hospital.beds.find((b) => b.category === category) ?? null,
  }));
}

/** tel: URI dari nomor tampilan, mis. "(021) 555-0101" -> "tel:0215550101". */
export function telHref(phone: string | null): string | null {
  if (!phone) return null;
  const digits = phone.replace(/[^\d+]/g, "");
  return digits.length >= 5 ? `tel:${digits}` : null;
}

/** Tautan rute ke aplikasi peta pengguna; null bila tidak ada koordinat. */
export function directionsHref(hospital: Hospital): string | null {
  if (hospital.latitude === null || hospital.longitude === null) return null;
  return `https://www.google.com/maps/dir/?api=1&destination=${hospital.latitude},${hospital.longitude}`;
}

/** Hanya http(s) yang boleh dijadikan tautan (hindari javascript:, data:). */
export function safeSourceUrl(url: string | null): string | null {
  if (!url) return null;
  try {
    const parsed = new URL(url);
    return parsed.protocol === "https:" || parsed.protocol === "http:"
      ? parsed.toString()
      : null;
  } catch {
    return null;
  }
}

export interface MappableHospital extends Hospital {
  latitude: number;
  longitude: number;
}

export function isMappable(hospital: Hospital): hospital is MappableHospital {
  return (
    typeof hospital.latitude === "number" && typeof hospital.longitude === "number"
  );
}

/** UUID lowercase (kontrak ID). */
export const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/;

/** Parse `ids` untuk /bandingkan: 2–3 UUID lowercase unik; selain itu null. */
export function parseCompareIds(raw: string | null): string[] | null {
  if (!raw) return null;
  const ids = raw.split(",").map((s) => s.trim());
  if (ids.length < 2 || ids.length > 3) return null;
  if (!ids.every((id) => UUID_RE.test(id))) return null;
  if (new Set(ids).size !== ids.length) return null;
  return ids;
}
