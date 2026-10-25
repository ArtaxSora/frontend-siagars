import Link from "next/link";
import type { Hospital } from "@/lib/contracts/types";
import { FACILITY_SERVICE_SLUGS, bedCategoryLabel } from "@/lib/contracts/labels";
import { formatDistanceKm } from "@/lib/format/beds";
import {
  cardBeds,
  collectSources,
  hasSimulatedData,
  isMappable,
  telHref,
  uniqueOrigins,
  worstFreshness,
} from "@/lib/hospitals/summary";
import { BedTile } from "@/features/hospitals/bed-tile";
import { BpjsStatus, FacilityBadges } from "@/features/hospitals/facility-badges";
import { FreshnessLabel, OriginBadge, StatusBadge } from "@/components/ui/badges";
import { ButtonLink, Button } from "@/components/ui/button";
import { PhoneIcon, PinIcon } from "@/components/ui/icons";

export function HospitalCard({
  hospital,
  selected,
  onShowOnMap,
  onFilterRegion,
  compare,
}: {
  hospital: Hospital;
  selected: boolean;
  /** Dihilangkan bila peta tidak tersedia. */
  onShowOnMap?: (id: string) => void;
  /** Terapkan filter wilayah memakai kode persis dari API. */
  onFilterRegion?: (hospital: Hospital) => void;
  /** Kontrol pilih-untuk-bandingkan; dihilangkan bila fitur tidak dipakai. */
  compare?: {
    checked: boolean;
    disabled: boolean;
    onChange: (checked: boolean) => void;
  };
}) {
  const sources = collectSources(hospital);
  const origins = uniqueOrigins(sources);
  const worst = worstFreshness(sources);
  const distance = formatDistanceKm(hospital.distance_km);
  const tel = telHref(hospital.phone);
  // ICU/NICU/PICU/rawat inap sudah tampil lewat facility_summary.
  const otherServices = hospital.services.filter(
    (s) => !FACILITY_SERVICE_SLUGS.has(s.slug),
  );
  const known = otherServices.filter((s) => s.status !== "unknown");
  const unknownCount = otherServices.length - known.length;
  // Kartu berbasis data simulasi: garis putus-putus amber, tanpa bayangan (DESIGN.md).
  // Sejak API 0.2.1 RS nyata bisa membawa data fasilitas/BPJS contoh.
  const hasSimulation = hasSimulatedData(hospital);
  if (hasSimulation && !origins.includes("simulation")) origins.push("simulation");

  return (
    <article
      id={`hospital-card-${hospital.id}`}
      aria-current={selected ? "true" : undefined}
      className={`flex flex-col rounded-md bg-surface ${
        hasSimulation
          ? "border-[1.5px] border-dashed border-sim-line"
          : "border border-line hover:border-line-strong hover:shadow-level2"
      } ${selected ? "outline outline-[3px] outline-offset-2 outline-brand" : ""}`}
    >
      <div className="flex flex-col gap-3 p-4">
        <header className="flex flex-col gap-1">
          <h3 className="text-[18px] font-semibold leading-[26px] text-ink">
            <Link
              href={`/rumah-sakit/${encodeURIComponent(hospital.id)}`}
              className="hover:underline"
            >
              {hospital.name}
            </Link>
          </h3>
          <p className="flex flex-wrap items-center gap-x-2 gap-y-1 text-[12px] leading-[18px] text-muted">
            <span>
              {hospital.city_name}, {hospital.province_name}
            </span>
            {distance && <span className="tabular-nums">{distance}</span>}
          </p>
          <p className="text-[13px] font-semibold leading-4">
            <BpjsStatus
              accepted={hospital.facility_summary.bpjs}
              origin={hospital.bpjs_data_origin}
            />
          </p>
        </header>

        <div
          className="grid grid-cols-2 gap-2 sm:grid-cols-4 lg:grid-cols-2 xl:grid-cols-4"
          role="group"
          aria-label="Tempat tidur"
        >
          {cardBeds(hospital).map(({ category, bed }) => (
            <BedTile
              key={category}
              label={bedCategoryLabel(category)}
              available={bed ? bed.available : null}
              total={bed ? bed.total : null}
            />
          ))}
        </div>

        <div className="flex flex-col gap-1.5">
          <p className="text-[11px] font-semibold tracking-[0.02em] text-faint">
            FASILITAS
          </p>
          <FacilityBadges summary={hospital.facility_summary} />
        </div>

        <div className="flex flex-col gap-1.5">
          <p className="text-[11px] font-semibold tracking-[0.02em] text-faint">
            LAYANAN LAIN
          </p>
          {known.length > 0 ? (
            <ul className="flex flex-wrap gap-x-4 gap-y-1.5">
              {known.map((s) => (
                <li key={s.slug} className="flex items-center gap-1.5">
                  <span className="text-ink">{s.name}</span>
                  <StatusBadge status={s.status} />
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-unk-fg">Belum ada layanan yang diketahui statusnya.</p>
          )}
          {unknownCount > 0 && known.length > 0 && (
            <p className="text-[12px] text-faint">
              {unknownCount} layanan lain belum diketahui.
            </p>
          )}
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <ButtonLink
            href={`/rumah-sakit/${encodeURIComponent(hospital.id)}`}
            variant="primary"
          >
            Lihat detail
          </ButtonLink>
          {onShowOnMap && isMappable(hospital) && (
            <Button
              variant="secondary"
              aria-pressed={selected}
              onClick={() => onShowOnMap(hospital.id)}
            >
              <PinIcon /> Lihat di peta
            </Button>
          )}
          {tel && (
            <ButtonLink href={tel} variant="secondary" native>
              <PhoneIcon /> Telepon
            </ButtonLink>
          )}
        </div>

        <div className="flex flex-wrap items-center gap-x-4 gap-y-1">
          {compare && (
            <label className="inline-flex min-h-11 cursor-pointer items-center gap-2 text-[13px] font-semibold md:min-h-9">
              <input
                type="checkbox"
                className="h-4 w-4 accent-[var(--color-brand)]"
                checked={compare.checked}
                disabled={compare.disabled && !compare.checked}
                onChange={(e) => compare.onChange(e.target.checked)}
              />
              Bandingkan
              <span className="sr-only"> {hospital.name}</span>
            </label>
          )}
          {onFilterRegion && (
            <Button variant="tertiary" onClick={() => onFilterRegion(hospital)}>
              Hanya di {hospital.city_name}
            </Button>
          )}
        </div>
      </div>

      <footer className="flex flex-wrap items-center gap-x-3 gap-y-1.5 rounded-b-md border-t border-line bg-canvas px-4 py-2.5">
        {origins.map((o) => (
          <OriginBadge key={o} origin={o} />
        ))}
        <span className="inline-flex items-center gap-1 text-[12px] text-muted">
          Data paling lama:
          <FreshnessLabel freshness={worst} />
        </span>
      </footer>
    </article>
  );
}
