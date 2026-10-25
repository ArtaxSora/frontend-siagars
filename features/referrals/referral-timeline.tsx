import type { TrackingHistory } from "@/lib/contracts/types";
import { historyEntryLabel } from "@/lib/contracts/labels";
import { formatWib } from "@/lib/format/time";

/**
 * Linimasa publik, urut dari yang paling lama. Catatan operator dirender
 * sebagai teks biasa (React meng-escape); jangan pernah memakai HTML mentah.
 */
export function ReferralTimeline({ entries }: { entries: TrackingHistory[] }) {
  const ordered = [...entries].sort(
    (a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime(),
  );
  return (
    <ol className="flex flex-col gap-0 border-l-2 border-line-strong pl-4">
      {ordered.map((entry, i) => (
        <li
          key={`${entry.created_at}-${i}`}
          className="relative flex flex-col gap-0.5 pb-4 last:pb-0"
        >
          <span
            aria-hidden="true"
            className="absolute -left-[23px] top-1 h-3 w-3 rounded-full border-2 border-white bg-brand"
          />
          <p className="font-semibold">{historyEntryLabel(entry)}</p>
          <p className="text-[12px] text-muted tabular-nums">
            {formatWib(entry.created_at) ?? "Waktu tidak diketahui"}
          </p>
          {entry.public_note && (
            <p className="mt-0.5 whitespace-pre-wrap break-words text-ink">
              {entry.public_note}
            </p>
          )}
        </li>
      ))}
    </ol>
  );
}
