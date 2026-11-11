/**
 * Penanda "Unggul" di /bandingkan (FE-13) — satu-satunya penilaian yang
 * dihitung FE (kontrak §8), dari data compare apa adanya. Fungsi murni.
 *
 * Aturan per baris:
 * - status layanan: available > limited; unavailable/unknown tidak unggul.
 * - tempat tidur: `available` terbesar; null tidak unggul, 0 tidak unggul.
 * - data: kesegaran terbaik (fresh > aging > stale); unknown tidak unggul.
 * - BPJS: true unggul; false/null tidak.
 * - Nilai tidak diketahui TIDAK PERNAH unggul. Seri → semua yang seri ditandai.
 * - Bila tidak ada nilai yang layak unggul, baris itu tanpa pemenang.
 */
import { FACILITY_KEYS } from "../contracts/labels.ts";
import {
  BED_CATEGORIES,
  type Freshness,
  type Hospital,
  type ServiceStatus,
} from "../contracts/types.ts";

/** Skor peringkat; null = tidak dinilai (tidak pernah unggul). */
export type Rank = number | null;

export function statusRank(status: ServiceStatus | undefined): Rank {
  if (status === "available") return 2;
  if (status === "limited") return 1;
  return null;
}

export function bedRank(available: number | null | undefined): Rank {
  return typeof available === "number" && available > 0 ? available : null;
}

const FRESHNESS_RANK: Record<Freshness, Rank> = {
  fresh: 3,
  aging: 2,
  stale: 1,
  unknown: null,
};

export function freshnessRank(freshness: Freshness): Rank {
  return FRESHNESS_RANK[freshness];
}

export function bpjsRank(bpjs: boolean | null): Rank {
  return bpjs === true ? 1 : null;
}

/** Indeks pemenang: semua yang bernilai maksimum (seri ikut). */
export function pickWinners(ranks: Rank[]): number[] {
  const scored = ranks.filter((r): r is number => r !== null);
  if (scored.length === 0) return [];
  const best = Math.max(...scored);
  return ranks.flatMap((r, i) => (r === best ? [i] : []));
}

export interface CompareJudgement {
  /** Kunci baris (sama dengan kunci baris tabel bandingkan) -> indeks pemenang. */
  winners: Record<string, number[]>;
  /** Jumlah baris yang dimenangkan tiap RS (urut sesuai masukan). */
  wins: number[];
  /** Jumlah atribut yang dinilai. */
  judged: number;
}

/** Slug layanan di luar facility_summary yang dimiliki minimal satu RS. */
function extraServiceSlugs(hospitals: Hospital[], skip: ReadonlySet<string>): string[] {
  return [
    ...new Set(
      hospitals.flatMap((h) => h.services.map((s) => s.slug).filter((s) => !skip.has(s))),
    ),
  ];
}

/**
 * Nilai setiap baris. `skipServiceSlugs` = slug yang sudah terwakili baris
 * fasilitas (agar tidak dihitung dua kali).
 */
export function judgeCompare(
  hospitals: Hospital[],
  skipServiceSlugs: ReadonlySet<string> = new Set(),
): CompareJudgement {
  const rows: Array<[string, Rank[]]> = [
    ["bpjs", hospitals.map((h) => bpjsRank(h.facility_summary.bpjs))],
    ...FACILITY_KEYS.map(
      (key) =>
        [
          `facility:${key}`,
          hospitals.map((h) => statusRank(h.facility_summary[key])),
        ] as [string, Rank[]],
    ),
    ...BED_CATEGORIES.map(
      (cat) =>
        [
          `bed:${cat}`,
          hospitals.map((h) => bedRank(h.beds.find((b) => b.category === cat)?.available)),
        ] as [string, Rank[]],
    ),
    ...extraServiceSlugs(hospitals, skipServiceSlugs).map(
      (slug) =>
        [
          `svc:${slug}`,
          hospitals.map((h) => statusRank(h.services.find((s) => s.slug === slug)?.status)),
        ] as [string, Rank[]],
    ),
    ["data", hospitals.map((h) => freshnessRank(h.data_quality.freshness))],
  ];

  const winners: Record<string, number[]> = {};
  const wins = hospitals.map(() => 0);
  for (const [key, ranks] of rows) {
    const w = pickWinners(ranks);
    winners[key] = w;
    for (const i of w) wins[i] += 1;
  }
  return { winners, wins, judged: rows.length };
}

/**
 * Kalimat ringkasan, mis. "RS A unggul di 4 dari 7 atribut." untuk RS dengan
 * kemenangan terbanyak (seri → semua disebut). null bila tidak ada pemenang.
 */
export function compareSummary(
  names: string[],
  judgement: CompareJudgement,
): string | null {
  const top = Math.max(0, ...judgement.wins);
  if (top === 0) return null;
  const leaders = names.filter((_, i) => judgement.wins[i] === top);
  const who =
    leaders.length === 1
      ? leaders[0]
      : `${leaders.slice(0, -1).join(", ")} dan ${leaders[leaders.length - 1]}`;
  return `${who} unggul di ${top} dari ${judgement.judged} atribut.`;
}
