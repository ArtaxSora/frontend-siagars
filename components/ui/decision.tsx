import type { ReactNode } from "react";
import Link from "next/link";
import type {
  DataQuality,
  DataQualityLabel,
  ScoreLevel,
} from "@/lib/contracts/types";
import { DATA_QUALITY_LABEL, SCORE_LEVEL_LABEL } from "@/lib/contracts/labels";
import { formatRatio } from "@/lib/recommendations/format";
import { FreshnessLabel, OriginBadge } from "@/components/ui/badges";
import {
  AlertIcon,
  CheckIcon,
  ChevronDownIcon,
  CrossIcon,
  GaugeIcon,
  PhoneIcon,
  StarIcon,
} from "@/components/ui/icons";

/* Kelas ditulis utuh agar terdeteksi Tailwind. */
const LEVEL_STYLE: Record<ScoreLevel, string> = {
  high: "bg-ok-bg text-ok-fg border-ok-line",
  medium: "bg-warn-bg text-warn-fg border-warn-line",
  low: "bg-bad-bg text-bad-fg border-bad-line",
};

const LEVEL_ICON: Record<ScoreLevel, ReactNode> = {
  high: <CheckIcon />,
  medium: <AlertIcon />,
  low: <CrossIcon />,
};

/** Skor kecocokan 0–100 + level: angka + ikon + teks + warna. */
export function ScoreBadge({ score, level }: { score: number; level: ScoreLevel }) {
  return (
    <span
      className={`inline-flex items-center gap-2 rounded-lg border px-2.5 py-1 ${LEVEL_STYLE[level]}`}
    >
      <span className="text-[22px] font-bold leading-7 tabular-nums">{score}</span>
      <span className="flex flex-col text-[11px] font-bold leading-[14px]">
        <span className="inline-flex items-center gap-1">
          {LEVEL_ICON[level]}
          {SCORE_LEVEL_LABEL[level]}
        </span>
        <span className="font-semibold opacity-80">skor dari 100</span>
      </span>
    </span>
  );
}

const QUALITY_STYLE: Record<DataQualityLabel, string> = {
  baik: "bg-ok-bg text-ok-fg border-ok-line",
  cukup: "bg-warn-bg text-warn-fg border-warn-line",
  terbatas: "bg-unk-bg text-unk-fg border-unk-line",
};

const QUALITY_ICON: Record<DataQualityLabel, ReactNode> = {
  baik: <CheckIcon />,
  cukup: <AlertIcon />,
  terbatas: <GaugeIcon />,
};

/** Label kualitas data saja (mis. di popup marker peta). */
export function DataQualityTag({ label }: { label: DataQualityLabel }) {
  return (
    <span
      className={`inline-flex items-center gap-1 rounded-lg border px-2 py-0.5 text-[11px] font-bold leading-[14px] tracking-[0.04em] ${QUALITY_STYLE[label]}`}
    >
      {QUALITY_ICON[label]}
      {DATA_QUALITY_LABEL[label]}
    </span>
  );
}

/**
 * Kualitas DATA (bukan kualitas layanan RS) + penjelasan yang bisa dibuka.
 * <details> agar dapat dipakai keyboard & pembaca layar tanpa JavaScript.
 */
export function DataQualityBadge({ quality }: { quality: DataQuality }) {
  return (
    <details className="group relative inline-block max-w-full">
      <summary
        className={`inline-flex min-h-11 cursor-pointer list-none items-center gap-1.5 rounded-lg border px-2.5 text-[12px] font-bold leading-4 md:min-h-8 [&::-webkit-details-marker]:hidden ${QUALITY_STYLE[quality.label]}`}
      >
        {QUALITY_ICON[quality.label]}
        <span>
          {DATA_QUALITY_LABEL[quality.label]}{" "}
          <span className="tabular-nums">{quality.score}/100</span>
        </span>
        <ChevronDownIcon className="transition-transform group-open:rotate-180" />
        <span className="sr-only">— tampilkan penjelasan kualitas data</span>
      </summary>
      <div className="mt-2 flex w-[min(20rem,calc(100vw-3rem))] flex-col gap-2 rounded-md border border-line bg-surface p-3 text-[12px] leading-[18px] text-ink shadow-level3">
        <p className="text-muted">
          Seberapa lengkap, baru, dan terpercaya data kami tentang RS ini —
          <strong> bukan</strong> penilaian mutu layanan rumah sakit.
        </p>
        <dl className="grid grid-cols-[auto_1fr] items-center gap-x-3 gap-y-1.5">
          <dt className="text-muted">Kelengkapan</dt>
          <dd className="font-semibold tabular-nums">
            {formatRatio(quality.completeness)} item kunci diketahui
          </dd>
          <dt className="text-muted">Kesegaran</dt>
          <dd>
            <FreshnessLabel freshness={quality.freshness} />
          </dd>
          <dt className="text-muted">Asal utama</dt>
          <dd>
            <OriginBadge origin={quality.primary_origin} />
          </dd>
        </dl>
        <Link
          href="/tentang-data#kualitas-data"
          className="inline-flex min-h-11 items-center font-semibold text-trust underline md:min-h-0"
        >
          Cara skor kualitas data dihitung
        </Link>
      </div>
    </details>
  );
}

/** Penanda baris pemenang di /bandingkan: ikon + teks, bukan warna saja. */
export function WinnerMark() {
  return (
    <span className="inline-flex items-center gap-1 rounded-lg border border-ok-line bg-ok-bg px-2 py-0.5 text-[11px] font-bold leading-[14px] text-ok-fg">
      <StarIcon />
      Unggul
    </span>
  );
}

/** Banner tetap di hasil rekomendasi (PRD §4.1). */
export function EmergencyBanner() {
  return (
    <p
      role="note"
      className="flex items-start gap-2 rounded-md border border-bad-line bg-bad-bg px-3 py-2.5 text-[13px] leading-5 text-ink"
    >
      <PhoneIcon className="mt-0.5 shrink-0 text-bad-fg" />
      <span>
        <strong className="text-bad-fg">Darurat? Hubungi 112.</strong> Skor ini
        tentang kecocokan kebutuhan &amp; kepastian data, bukan kualitas medis.
      </span>
    </p>
  );
}

/**
 * Penunjuk langkah wizard (WCAG 2.2 AA compliant, min 48px touch targets,
 * indikator tahapan nomor + ikon centang selesai, navigasi interaktif).
 */
export function WizardStepper({
  steps,
  current,
  onStepClick,
  maxReachable = current,
}: {
  steps: readonly string[];
  /** Indeks 0-based; = steps.length bila semua langkah selesai. */
  current: number;
  /** Callback navigasi langsung ke langkah (1-based: 1, 2, 3) */
  onStepClick?: (step: 1 | 2 | 3) => void;
  /** Indeks langkah terjauh yang valid diakses. */
  maxReachable?: number;
}) {
  return (
    <nav aria-label="Tahapan formulir" className="w-full">
      <ol className="grid grid-cols-3 gap-2 sm:gap-3">
        {steps.map((label, i) => {
          const stepNum = (i + 1) as 1 | 2 | 3;
          const done = i < current;
          const active = i === current;
          const isReachable = Boolean(onStepClick && (done || i <= maxReachable));

          const content = (
            <div className="flex w-full items-center gap-2 sm:gap-3">
              <span
                aria-hidden="true"
                className={`flex h-7 w-7 sm:h-8 sm:w-8 shrink-0 items-center justify-center rounded-full text-[12px] sm:text-[13px] font-bold transition-colors ${
                  active
                    ? "bg-brand text-white shadow-sm ring-4 ring-brand-tint"
                    : done
                      ? "bg-brand-deep text-white"
                      : "border border-line bg-well text-faint"
                }`}
              >
                {done ? <CheckIcon className="h-4 w-4" /> : stepNum}
              </span>
              <div className="flex min-w-0 flex-col text-left">
                <span
                  className={`text-[10px] sm:text-[11px] font-semibold uppercase tracking-wider ${
                    active
                      ? "text-brand-deep"
                      : done
                        ? "text-muted"
                        : "text-faint"
                  }`}
                >
                  Langkah {stepNum}
                </span>
                <span
                  className={`truncate text-[12px] sm:text-[14px] ${
                    active
                      ? "font-bold text-ink"
                      : done
                        ? "font-semibold text-ink"
                        : "text-muted"
                  }`}
                >
                  {label}
                </span>
              </div>
            </div>
          );

          return (
            <li
              key={label}
              aria-current={active ? "step" : undefined}
              className="flex"
            >
              {isReachable && !active ? (
                <button
                  type="button"
                  onClick={() => onStepClick?.(stepNum)}
                  className={`flex min-h-12 w-full items-center rounded-lg border p-2 sm:px-3 sm:py-2.5 text-left transition-all hover:border-brand hover:bg-well focus-visible:outline focus-visible:outline-2 focus-visible:outline-brand focus-visible:outline-offset-2 ${
                    done
                      ? "border-line-strong bg-surface"
                      : "border-line bg-canvas"
                  }`}
                  aria-label={`Langkah ${stepNum}: ${label} (${done ? "selesai, klik untuk ubah" : "buka"})`}
                >
                  {content}
                </button>
              ) : (
                <div
                  className={`flex min-h-12 w-full items-center rounded-lg border p-2 sm:px-3 sm:py-2.5 ${
                    active
                      ? "border-brand bg-brand-tint/60 shadow-sm"
                      : "border-line bg-surface/70"
                  }`}
                >
                  {content}
                </div>
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
