import type { ReactNode } from "react";
import type {
  DataOrigin,
  Freshness,
  Provenance,
  ServiceStatus,
} from "@/lib/contracts/types";
import { safeSourceUrl } from "@/lib/hospitals/summary";
import {
  FRESHNESS_LABEL,
  ORIGIN_DESCRIPTION,
  ORIGIN_LABEL,
  SERVICE_STATUS_LABEL,
} from "@/lib/contracts/labels";
import { formatWib } from "@/lib/format/time";
import {
  AlertIcon,
  CheckIcon,
  CrossIcon,
  FlaskIcon,
  PlugIcon,
  QuestionIcon,
  ShieldCheckIcon,
} from "@/components/ui/icons";

/* Kelas ditulis utuh agar terdeteksi Tailwind. */
const STATUS_STYLE: Record<ServiceStatus, string> = {
  available: "bg-ok-bg text-ok-fg border-ok-line",
  limited: "bg-warn-bg text-warn-fg border-warn-line",
  unavailable: "bg-bad-bg text-bad-fg border-bad-line",
  unknown: "bg-unk-bg text-unk-fg border-unk-line",
};

const STATUS_ICON: Record<ServiceStatus, ReactNode> = {
  available: <CheckIcon />,
  limited: <AlertIcon />,
  unavailable: <CrossIcon />,
  unknown: <QuestionIcon />,
};

/** Status layanan: ikon + teks + warna (warna bukan satu-satunya penanda). */
export function StatusBadge({ status }: { status: ServiceStatus }) {
  return (
    <span
      className={`inline-flex items-center gap-1 rounded-lg border px-2 py-0.5 text-[11px] font-bold leading-[14px] tracking-[0.04em] ${STATUS_STYLE[status]}`}
    >
      {STATUS_ICON[status]}
      {SERVICE_STATUS_LABEL[status]}
    </span>
  );
}

const ORIGIN_STYLE: Record<DataOrigin, string> = {
  curated: "bg-kurasi-bg text-kurasi-fg border border-kurasi-line",
  simulation: "bg-sim-bg text-sim-fg border-[1.5px] border-dashed border-sim-line",
  satusehat_sandbox: "bg-sandbox-bg text-sandbox-fg border border-sandbox-line",
  satusehat_production: "bg-kurasi-bg text-kurasi-fg border border-kurasi-line",
};

const ORIGIN_ICON: Record<DataOrigin, ReactNode> = {
  curated: <ShieldCheckIcon />,
  simulation: <FlaskIcon />,
  satusehat_sandbox: <PlugIcon />,
  satusehat_production: <PlugIcon />,
};

/** Label asal data. Label simulasi selalu terlihat (garis putus-putus). */
export function OriginBadge({ origin }: { origin: DataOrigin }) {
  return (
    <span
      title={ORIGIN_DESCRIPTION[origin]}
      className={`inline-flex items-center gap-1 rounded-lg px-2 py-0.5 text-[11px] font-bold leading-[14px] tracking-[0.04em] ${ORIGIN_STYLE[origin]}`}
    >
      {ORIGIN_ICON[origin]}
      {ORIGIN_LABEL[origin]}
    </span>
  );
}

const DOT_STYLE: Record<Freshness, string> = {
  fresh: "bg-fresh",
  aging: "bg-aging",
  stale: "bg-stale",
  unknown: "bg-unknown-dot",
};

/** Kesegaran data dari server (bukan bukti verifikasi). */
export function FreshnessLabel({ freshness }: { freshness: Freshness }) {
  return (
    <span className="inline-flex items-center gap-1.5 text-[12px] leading-[18px] text-muted">
      <span
        aria-hidden="true"
        className={`inline-block h-2 w-2 rounded-full ${DOT_STYLE[freshness]}`}
      />
      {FRESHNESS_LABEL[freshness]}
    </span>
  );
}

/**
 * Sumber + waktu per informasi. Atribut dibedakan:
 * diperbarui sumber ≠ disinkronkan ≠ diverifikasi ≠ asal data.
 */
export function SourceLine({
  source,
  compact = false,
}: {
  source: Provenance;
  compact?: boolean;
}) {
  const updated = formatWib(source.source_updated_at);
  const synced = formatWib(source.synced_at);
  const verified = formatWib(source.verified_at);
  const sourceUrl = safeSourceUrl(source.source_url);

  return (
    <div className="flex flex-col gap-1">
      <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
        <OriginBadge origin={source.data_origin} />
        <FreshnessLabel freshness={source.freshness} />
      </div>
      {!compact && (
        <dl className="grid grid-cols-[auto_1fr] gap-x-2 text-[12px] leading-[18px] text-faint">
          {sourceUrl && (
            <>
              <dt>Sumber</dt>
              <dd className="break-all">
                <a
                  href={sourceUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-trust underline"
                >
                  Lihat sumber
                </a>
              </dd>
            </>
          )}
          <dt>Diperbarui sumber</dt>
          <dd className="text-muted tabular-nums">
            {updated ?? "Jadwal pembaruan tidak terlacak"}
          </dd>
          <dt>Disinkronkan</dt>
          <dd className="text-muted tabular-nums">{synced ?? "Tidak diketahui"}</dd>
          <dt>Diverifikasi</dt>
          <dd className="text-muted tabular-nums">{verified ?? "Belum diverifikasi"}</dd>
        </dl>
      )}
    </div>
  );
}
