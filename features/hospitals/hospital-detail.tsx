"use client";

import type { ReactNode } from "react";
import Link from "next/link";
import { getHospital } from "@/lib/api/endpoints";
import { useApiResource } from "@/lib/hooks/use-api-resource";
import { formatDistanceKm } from "@/lib/format/beds";
import {
  bedCategoryLabel,
  codedLabel,
  operationalLabel,
} from "@/lib/contracts/labels";
import { formatWib } from "@/lib/format/time";
import { directionsHref, safeSourceUrl, telHref } from "@/lib/hospitals/summary";
import { BedTile } from "@/features/hospitals/bed-tile";
import { BpjsStatus, FacilityBadges } from "@/features/hospitals/facility-badges";
import { SourceLine, StatusBadge } from "@/components/ui/badges";
import { ButtonLink } from "@/components/ui/button";
import { PhoneIcon, QuestionIcon, RouteIcon } from "@/components/ui/icons";
import { CapacityDisclaimer, SimulationNotice } from "@/components/ui/notices";
import { EmptyState, ErrorState, LoadingBlock } from "@/components/ui/states";

function Section({
  title,
  children,
}: {
  title: string;
  children: ReactNode;
}) {
  return (
    <section className="flex flex-col gap-3 rounded-md border border-line bg-surface p-4 md:p-5">
      <h2 className="text-[18px] font-semibold leading-[26px]">{title}</h2>
      {children}
    </section>
  );
}

export function HospitalDetail({ id }: { id: string }) {
  const resource = useApiResource(`hospital:${id}`, (signal) =>
    getHospital(id, signal),
  );

  // Abaikan data dari ID lain yang masih tersimpan saat berpindah halaman.
  const hospital = resource.data?.data.id === id ? resource.data.data : null;

  const backLink = (
    <Link
      href="/rumah-sakit"
      className="inline-flex min-h-10 items-center text-[14px] font-semibold text-trust hover:underline"
    >
      ← Kembali ke pencarian
    </Link>
  );

  if (resource.error) {
    if (resource.error.status === 404) {
      return (
        <div className="flex flex-col gap-4">
          {backLink}
          <EmptyState
            title="Rumah sakit tidak ditemukan"
            description="Tautan mungkin salah, atau rumah sakit tidak termasuk dalam data pilot."
          />
        </div>
      );
    }
    return (
      <div className="flex flex-col gap-4">
        {backLink}
        <ErrorState
          error={resource.error}
          onRetry={resource.reload}
          title="Detail rumah sakit tidak dapat dimuat"
        />
      </div>
    );
  }

  if (!hospital) {
    return (
      <div className="flex flex-col gap-4">
        {backLink}
        <LoadingBlock label="Memuat detail rumah sakit…" rows={4} />
      </div>
    );
  }

  const tel = telHref(hospital.phone);
  const route = directionsHref(hospital);
  const distance = formatDistanceKm(hospital.distance_km);
  const summary = hospital.facility_summary;
  const bpjsSource = safeSourceUrl(hospital.bpjs_source_url);
  const bpjsUpdated = formatWib(hospital.bpjs_source_updated_at);
  const profile: Array<[string, string]> = [
    ["Kelas", codedLabel(hospital.facility_class) ?? "Belum diketahui"],
    ["Jenis", codedLabel(hospital.facility_subtype) ?? "Belum diketahui"],
    ["Status operasional", operationalLabel(hospital.operational)],
  ];
  if (hospital.external_id) profile.push(["Kode SATUSEHAT", hospital.external_id]);

  return (
    <div className="flex flex-col gap-4">
      {backLink}
      {hospital.data_origin === "simulation" && <SimulationNotice />}

      <header className="flex flex-col gap-3 rounded-md border border-line bg-surface p-4 md:p-6">
        <div className="flex flex-col gap-1">
          <h1 className="text-[28px] font-bold leading-9 tracking-[-0.01em] md:text-[36px] md:leading-[44px] md:tracking-[-0.02em]">
            {hospital.name}
          </h1>
          <p className="text-muted">
            {hospital.city_name}, {hospital.province_name}
          </p>
          <p className="text-muted">
            {hospital.address ?? "Alamat belum diketahui"}
          </p>
          {distance && <p className="tabular-nums text-muted">{distance}</p>}
        </div>

        <div className="flex flex-wrap gap-2">
          {tel ? (
            <ButtonLink href={tel} native>
              <PhoneIcon /> Telepon {hospital.phone}
            </ButtonLink>
          ) : (
            <p className="inline-flex items-center gap-1 text-unk-fg">
              <QuestionIcon /> Nomor telepon belum diketahui
            </p>
          )}
          {route ? (
            <ButtonLink href={route} variant="secondary" external>
              <RouteIcon /> Buka rute (peta eksternal)
            </ButtonLink>
          ) : (
            <p className="inline-flex items-center gap-1 text-unk-fg">
              <QuestionIcon /> Koordinat belum diketahui — rute tidak tersedia
            </p>
          )}
        </div>
        <CapacityDisclaimer />
      </header>

      <Section title="Profil fasilitas">
        <dl className="grid gap-x-6 gap-y-1 sm:grid-cols-[max-content_1fr]">
          {profile.map(([label, value]) => (
            <div key={label} className="contents">
              <dt className="text-muted">{label}</dt>
              <dd className={value === "Belum diketahui" ? "text-unk-fg" : "font-semibold"}>
                {value}
              </dd>
            </div>
          ))}
        </dl>
      </Section>

      <Section title="Ringkasan fasilitas">
        <FacilityBadges summary={summary} />
        <BedTile
          label="Tempat tidur rawat inap"
          available={summary.inpatient_beds.available}
          total={summary.inpatient_beds.total}
        />
        <p className="text-[12px] leading-[18px] text-muted">
          Ringkasan dari data yang ada; status &ldquo;Belum diketahui&rdquo;
          berarti sumber belum menyediakan datanya, bukan tidak tersedia.
        </p>
      </Section>

      <Section title="BPJS">
        <p className="text-[16px] font-semibold">
          <BpjsStatus accepted={summary.bpjs} long />
        </p>
        {(bpjsSource || bpjsUpdated) && (
          <p className="text-[12px] leading-[18px] text-muted">
            Sumber BPJS
            {bpjsUpdated && <> diperbarui {bpjsUpdated}</>}
            {bpjsSource && (
              <>
                {" — "}
                <a
                  href={bpjsSource}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="font-semibold text-trust underline"
                >
                  lihat sumber
                </a>
              </>
            )}
          </p>
        )}
        <p className="text-[12px] leading-[18px] text-muted">
          Informasi ini bukan jaminan kelayakan pasien; konfirmasikan ke rumah
          sakit dan BPJS.
        </p>
        <SourceLine source={hospital} />
      </Section>

      <Section title="Tempat tidur">
        {hospital.beds.length === 0 ? (
          <p className="text-unk-fg">
            Belum ada data tempat tidur yang diketahui untuk rumah sakit ini.
          </p>
        ) : (
          <ul className="grid gap-3 md:grid-cols-2">
            {hospital.beds.map((bed) => (
              <li
                key={bed.category}
                className="flex flex-col gap-2 rounded-md border border-line p-3"
              >
                <BedTile
                  label={bedCategoryLabel(bed.category)}
                  available={bed.available}
                  total={bed.total}
                />
                <SourceLine source={bed} />
              </li>
            ))}
          </ul>
        )}
      </Section>

      <Section title="Layanan">
        <ul className="grid gap-3 md:grid-cols-2">
          {hospital.services.map((svc) => (
            <li
              key={svc.slug}
              className="flex flex-col gap-2 rounded-md border border-line p-3"
            >
              <div className="flex flex-wrap items-center justify-between gap-2">
                <span className="text-[16px] font-semibold">{svc.name}</span>
                <StatusBadge status={svc.status} />
              </div>
              <SourceLine source={svc} />
            </li>
          ))}
        </ul>
      </Section>
    </div>
  );
}
