import Link from "next/link";
import type { Recommendation } from "@/lib/contracts/types";
import { formatDistanceKm } from "@/lib/format/beds";
import { telHref } from "@/lib/hospitals/summary";
import { routeHref, unknownLabel } from "@/lib/recommendations/format";
import { BpjsStatus, FacilityBadges } from "@/features/hospitals/facility-badges";
import { OriginBadge } from "@/components/ui/badges";
import { ButtonLink } from "@/components/ui/button";
import { DataQualityBadge, ScoreBadge } from "@/components/ui/decision";
import {
  ChevronDownIcon,
  ClockIcon,
  PhoneIcon,
  QuestionIcon,
  RouteIcon,
} from "@/components/ui/icons";

/**
 * Rincian skor dari server: label, kontribusi (poin), dan alasan apa adanya.
 * FE tidak menghitung ulang (kontrak §8).
 */
export function ScoreBreakdown({
  rec,
  serviceNames,
}: {
  rec: Recommendation;
  serviceNames: Record<string, string>;
}) {
  return (
    <details className="group rounded-md border border-line bg-canvas">
      <summary className="flex min-h-11 cursor-pointer list-none items-center justify-between gap-2 px-3 font-semibold text-trust [&::-webkit-details-marker]:hidden">
        Kenapa skor ini?
        <ChevronDownIcon className="transition-transform group-open:rotate-180" />
      </summary>
      <div className="flex flex-col gap-3 border-t border-line px-3 py-3">
        <ul className="flex flex-col gap-3">
          {rec.components.map((c) => {
            const max = Math.round(c.weight * 100);
            return (
              <li key={c.key} className="flex flex-col gap-1">
                <div className="flex items-baseline justify-between gap-3">
                  <span className="font-semibold">{c.label}</span>
                  <span className="shrink-0 tabular-nums text-muted">
                    <strong className="text-ink">+{c.contribution}</strong> dari maks {max} poin
                  </span>
                </div>
                {/* Batang hanya penguat visual; angka di atas adalah informasinya. */}
                <div aria-hidden="true" className="h-1.5 overflow-hidden rounded-full bg-line">
                  <div
                    className="h-full rounded-full bg-brand"
                    style={{ width: `${max > 0 ? Math.min(100, (c.contribution / max) * 100) : 0}%` }}
                  />
                </div>
                <p className="text-[12px] leading-[18px] text-muted">{c.reason}</p>
              </li>
            );
          })}
        </ul>
        {rec.unknowns.length > 0 && (
          <div className="flex flex-col gap-1 rounded-md bg-unk-bg p-2.5">
            <p className="inline-flex items-center gap-1 text-[12px] font-semibold text-unk-fg">
              <QuestionIcon /> Belum diketahui (dinilai dengan nilai bawaan rendah)
            </p>
            <ul className="flex flex-wrap gap-x-3 gap-y-1 text-[12px] text-unk-fg">
              {rec.unknowns.map((key) => (
                <li key={key}>{unknownLabel(key, serviceNames)}</li>
              ))}
            </ul>
          </div>
        )}
        <p className="text-[12px] leading-[18px] text-faint">
          Komponen yang tidak berlaku dihapus dan bobotnya dibagi ke komponen lain.{" "}
          <Link href="/tentang-data#skor-rekomendasi" className="font-semibold text-trust underline">
            Metodologi skor
          </Link>
        </p>
      </div>
    </details>
  );
}

export function RecommendationCard({
  rec,
  rank,
  serviceNames,
  compare,
}: {
  rec: Recommendation;
  rank: number;
  serviceNames: Record<string, string>;
  compare: { checked: boolean; disabled: boolean; onChange: (on: boolean) => void };
}) {
  const h = rec.hospital;
  const simulated = rec.flags.includes("contains_simulated_data");
  const staleData = rec.flags.includes("stale_or_unknown_freshness");
  const distance = formatDistanceKm(rec.distance_km);
  const tel = telHref(h.phone);
  const route = routeHref(h.lat, h.lng);
  const detail = `/rumah-sakit/${encodeURIComponent(h.id)}`;

  return (
    <article
      aria-labelledby={`rec-${h.id}`}
      className={`flex flex-col gap-3 rounded-md bg-surface p-4 ${
        simulated
          ? "border-[1.5px] border-dashed border-sim-line"
          : "border border-line shadow-level2"
      }`}
    >
      <header className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex min-w-0 flex-col gap-1">
          <p className="text-[12px] font-semibold text-faint">Peringkat {rank}</p>
          <h3 id={`rec-${h.id}`} className="text-[18px] font-semibold leading-[26px]">
            <Link href={detail} className="hover:underline">
              {h.name}
            </Link>
          </h3>
          <p className="flex flex-wrap gap-x-2 text-[12px] leading-[18px] text-muted">
            <span>
              {h.city_name}, {h.province_name}
            </span>
            {distance && <span className="tabular-nums">{distance}</span>}
          </p>
        </div>
        <div className="shrink-0">
          <ScoreBadge score={rec.score} level={rec.level} />
        </div>
      </header>

      <div className="flex flex-wrap items-center gap-2">
        <DataQualityBadge quality={h.data_quality} />
        {simulated && <OriginBadge origin="simulation" />}
        {staleData && (
          <span className="inline-flex items-center gap-1 text-[12px] text-muted">
            <ClockIcon /> Sebagian data lama atau waktunya tidak diketahui
          </span>
        )}
      </div>

      <p className="text-[13px] font-semibold leading-4">
        <BpjsStatus
          accepted={h.facility_summary.bpjs}
          origin={h.facility_summary.data_origin}
        />
      </p>
      <FacilityBadges summary={h.facility_summary} />

      <ScoreBreakdown rec={rec} serviceNames={serviceNames} />

      <div className="flex flex-wrap items-center gap-2">
        {tel ? (
          <ButtonLink href={tel} native>
            <PhoneIcon /> Telepon
          </ButtonLink>
        ) : (
          <span className="inline-flex items-center gap-1 text-[12px] text-unk-fg">
            <QuestionIcon /> Telepon belum diketahui
          </span>
        )}
        {route && (
          <ButtonLink href={route} variant="secondary" external>
            <RouteIcon /> Rute
          </ButtonLink>
        )}
        <ButtonLink href={detail} variant="secondary">
          Detail
        </ButtonLink>
        <label className="inline-flex min-h-11 cursor-pointer items-center gap-2 px-1 text-[13px] font-semibold md:min-h-10">
          <input
            type="checkbox"
            className="h-4 w-4 accent-[var(--color-brand)]"
            checked={compare.checked}
            disabled={compare.disabled && !compare.checked}
            onChange={(e) => compare.onChange(e.target.checked)}
          />
          + Bandingkan
          <span className="sr-only"> {h.name}</span>
        </label>
      </div>
    </article>
  );
}
