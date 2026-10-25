import type { ReactNode } from "react";
import { describeBeds, type BedTone } from "@/lib/format/beds";
import { CheckIcon, CrossIcon, QuestionIcon } from "@/components/ui/icons";

const TONE_TEXT: Record<BedTone, string> = {
  some: "text-ok-fg",
  zero: "text-bad-fg",
  unknown: "text-unk-fg",
};

const TONE_ICON: Record<BedTone, ReactNode> = {
  some: <CheckIcon />,
  zero: <CrossIcon />,
  unknown: <QuestionIcon />,
};

/**
 * Satu unit tempat tidur. "Belum diketahui" tampil dengan skala tipografi
 * yang sama dengan angka agar tidak terlewat. 0 ≠ belum diketahui.
 */
export function BedTile({
  label,
  available,
  total,
}: {
  label: string;
  available: number | null;
  total: number | null;
}) {
  const d = describeBeds(available, total);
  return (
    <div className="flex flex-col gap-0.5 rounded-md bg-well px-3 py-2">
      <span className="text-[11px] font-semibold leading-[14px] tracking-[0.02em] text-faint">
        {label}
      </span>
      <span
        className={`inline-flex items-center gap-1 text-[16px] font-bold leading-6 tabular-nums ${TONE_TEXT[d.tone]}`}
      >
        {TONE_ICON[d.tone]}
        {d.headline}
      </span>
      {d.detail && (
        <span className="text-[12px] leading-[18px] text-muted tabular-nums">
          {d.detail}
        </span>
      )}
    </div>
  );
}
