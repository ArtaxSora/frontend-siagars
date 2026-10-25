import type { FacilitySummary } from "@/lib/contracts/types";
import { FACILITY_KEYS, FACILITY_LABEL } from "@/lib/contracts/labels";
import { StatusBadge } from "@/components/ui/badges";
import { CheckIcon, CrossIcon, QuestionIcon } from "@/components/ui/icons";

/**
 * Badge ICU/NICU/PICU/Rawat inap dari facility_summary. `unknown` tampil
 * abu-abu "Belum diketahui" — bukan "tidak tersedia".
 */
export function FacilityBadges({ summary }: { summary: FacilitySummary }) {
  return (
    <ul className="flex flex-wrap gap-x-4 gap-y-1.5" aria-label="Ringkasan fasilitas">
      {FACILITY_KEYS.map((key) => (
        <li key={key} className="flex items-center gap-1.5">
          <span className="text-ink">{FACILITY_LABEL[key]}</span>
          <StatusBadge status={summary[key]} />
        </li>
      ))}
    </ul>
  );
}

/** BPJS dari facility_summary.bpjs; null = belum diketahui, bukan "tidak menerima". */
export function BpjsStatus({
  accepted,
  long = false,
}: {
  accepted: boolean | null;
  /** Kalimat panjang untuk halaman detail. */
  long?: boolean;
}) {
  if (accepted === true) {
    return (
      <span className="inline-flex items-center gap-1 text-ok-fg">
        <CheckIcon /> {long ? "Menerima BPJS menurut sumber" : "BPJS: diterima menurut sumber"}
      </span>
    );
  }
  if (accepted === false) {
    return (
      <span className="inline-flex items-center gap-1 text-bad-fg">
        <CrossIcon />{" "}
        {long ? "Tidak menerima BPJS menurut sumber" : "BPJS: tidak diterima menurut sumber"}
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1 text-unk-fg">
      <QuestionIcon /> {long ? "Belum diketahui" : "BPJS: belum diketahui"}
    </span>
  );
}
