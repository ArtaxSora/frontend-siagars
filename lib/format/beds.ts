/**
 * Tampilan tempat tidur.
 * Aturan keras: available === null berarti BELUM DIKETAHUI (bukan 0);
 * available === 0 berarti nol menurut sumber. Keduanya tidak boleh tertukar.
 * Tempat tidur kosong bukan jaminan pasien diterima.
 */

export type BedTone = "unknown" | "zero" | "some";

export interface BedDescription {
  tone: BedTone;
  headline: string;
  detail: string;
}

export function describeBeds(
  available: number | null,
  total: number | null,
): BedDescription {
  if (available === null) {
    return {
      tone: "unknown",
      headline: "Belum diketahui",
      detail: total === null ? "" : `Total ${total} tempat tidur`,
    };
  }
  if (available === 0) {
    return {
      tone: "zero",
      headline: "0 tersedia",
      detail:
        total === null
          ? "nol menurut sumber"
          : `dari ${total} tempat tidur (nol menurut sumber)`,
    };
  }
  return {
    tone: "some",
    headline: `${available} tersedia`,
    detail:
      total === null
        ? "total belum diketahui"
        : `dari ${total} tempat tidur`,
  };
}

/** "± 3,2 km (garis lurus)". null bila jarak tidak tersedia. Bukan ETA. */
export function formatDistanceKm(km: number | null | undefined): string | null {
  if (km === null || km === undefined || !Number.isFinite(km)) return null;
  return `± ${km.toFixed(1).replace(".", ",")} km (garis lurus)`;
}
