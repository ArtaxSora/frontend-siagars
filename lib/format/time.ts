/**
 * Format waktu. Timestamp API = RFC3339 UTC; tampilan = Asia/Jakarta (WIB).
 * Format dibangun manual dari formatToParts agar tidak bergantung pada
 * variasi ICU antar lingkungan.
 */

const MONTHS_ID = [
  "Jan",
  "Feb",
  "Mar",
  "Apr",
  "Mei",
  "Jun",
  "Jul",
  "Agu",
  "Sep",
  "Okt",
  "Nov",
  "Des",
] as const;

const wibFormatter = new Intl.DateTimeFormat("en-US", {
  timeZone: "Asia/Jakarta",
  year: "numeric",
  month: "numeric",
  day: "numeric",
  hour: "2-digit",
  minute: "2-digit",
  hourCycle: "h23",
});

/** "23 Okt 2026 21.16 WIB". Mengembalikan null untuk input kosong/tidak valid. */
export function formatWib(iso: string | null | undefined): string | null {
  if (!iso) return null;
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return null;
  const parts = wibFormatter.formatToParts(date);
  const pick = (type: Intl.DateTimeFormatPartTypes) =>
    parts.find((p) => p.type === type)?.value ?? "";
  const month = MONTHS_ID[Number(pick("month")) - 1] ?? "";
  return `${pick("day")} ${month} ${pick("year")} ${pick("hour")}.${pick("minute")} WIB`;
}

/** "5 menit lalu", "3 jam lalu", "2 hari lalu". null bila tidak valid. */
export function formatRelativeAge(
  iso: string | null | undefined,
  nowMs: number,
): string | null {
  if (!iso) return null;
  const then = new Date(iso).getTime();
  if (Number.isNaN(then)) return null;
  const diffSec = Math.max(0, Math.floor((nowMs - then) / 1000));
  if (diffSec < 60) return "baru saja";
  const minutes = Math.floor(diffSec / 60);
  if (minutes < 60) return `${minutes} menit lalu`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours} jam lalu`;
  return `${Math.floor(hours / 24)} hari lalu`;
}
