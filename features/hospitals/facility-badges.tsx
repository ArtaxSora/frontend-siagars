import type { DataOrigin, FacilitySummary } from "@/lib/contracts/types";
import { FACILITY_KEYS, FACILITY_LABEL } from "@/lib/contracts/labels";
import { OriginBadge, StatusBadge } from "@/components/ui/badges";
import { CheckIcon, CrossIcon, QuestionIcon } from "@/components/ui/icons";

/** Label "Simulasi" bila nilai berasal dari data contoh (juga pada RS nyata). */
export function SimulatedTag({ origin }: { origin: DataOrigin | null }) {
  return origin === "simulation" ? <OriginBadge origin={origin} /> : null;
}

/**
 * Badge ICU/NICU/PICU/Rawat inap dari facility_summary. `unknown` tampil
 * abu-abu "Belum diketahui" — bukan "tidak tersedia".
 */
export function FacilityBadges({ summary, quiet = false }: { summary: FacilitySummary; quiet?: boolean }) {
  return (
    <div className="flex flex-col gap-1.5">
      <ul className="flex flex-wrap gap-x-4 gap-y-1.5" aria-label="Ringkasan fasilitas">
        {FACILITY_KEYS.map((key) => (
          <li key={key} className="flex items-center gap-1.5">
            <span className="text-ink">{FACILITY_LABEL[key]}</span>
            <StatusBadge status={summary[key]} quiet={quiet} />
          </li>
        ))}
      </ul>
      {!quiet && summary.data_origin === "simulation" && (
        <p className="flex flex-wrap items-center gap-2 text-[12px] leading-[18px] text-sim-fg">
          <SimulatedTag origin={summary.data_origin} />
          Angka contoh untuk demo, bukan fakta rumah sakit ini.
        </p>
      )}
    </div>
  );
}

/** BPJS dari facility_summary.bpjs; null = belum diketahui, bukan "tidak menerima". */
export function BpjsStatus({
  accepted,
  origin,
  long = false,
  quiet = false,
}: {
  accepted: boolean | null;
  /** bpjs_data_origin; "simulation" diberi label. */
  origin: DataOrigin | null;
  /** Kalimat panjang untuk halaman detail. */
  long?: boolean;
  quiet?: boolean;
}) {
  return (
    <span className="inline-flex flex-wrap items-center gap-2">
      {quiet ? <span className={accepted === true ? "text-ok-fg" : accepted === false ? "text-bad-fg" : "text-unk-fg"}>BPJS: {accepted === true ? "diterima" : accepted === false ? "tidak diterima" : "belum diketahui"}{origin === "simulation" ? " (data contoh)" : ""}</span> : <BpjsValue
        accepted={accepted}
        long={long}
        // Data contoh tidak punya sumber: jangan tulis "menurut sumber".
        basis={origin === "simulation" ? "(data contoh)" : "menurut sumber"}
      />}
      {!quiet && <SimulatedTag origin={origin} />}
    </span>
  );
}

function BpjsValue({
  accepted,
  long,
  basis,
}: {
  accepted: boolean | null;
  long: boolean;
  basis: string;
}) {
  if (accepted === true) {
    return (
      <span className="inline-flex items-center gap-1 text-ok-fg">
        <CheckIcon /> {long ? `Menerima BPJS ${basis}` : `BPJS: diterima ${basis}`}
      </span>
    );
  }
  if (accepted === false) {
    return (
      <span className="inline-flex items-center gap-1 text-bad-fg">
        <CrossIcon />{" "}
        {long ? `Tidak menerima BPJS ${basis}` : `BPJS: tidak diterima ${basis}`}
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1 text-unk-fg">
      <QuestionIcon /> {long ? "Belum diketahui" : "BPJS: belum diketahui"}
    </span>
  );
}
