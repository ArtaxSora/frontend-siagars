"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { compareHospitals } from "@/lib/api/endpoints";
import { useApiResource } from "@/lib/hooks/use-api-resource";
import {
  FACILITY_KEYS,
  FACILITY_LABEL,
  FACILITY_SERVICE_SLUGS,
  bedCategoryLabel,
  codedLabel,
  operationalLabel,
} from "@/lib/contracts/labels";
import { BED_CATEGORIES, type Hospital } from "@/lib/contracts/types";
import { parseCompareIds } from "@/lib/hospitals/summary";
import { BedTile } from "@/features/hospitals/bed-tile";
import { OriginBadge, SourceLine, StatusBadge } from "@/components/ui/badges";
import { CapacityDisclaimer, SimulationNotice } from "@/components/ui/notices";
import { EmptyState, ErrorState, LoadingBlock } from "@/components/ui/states";

function bpjsText(v: boolean | null) {
  return v === true
    ? "Diterima menurut sumber"
    : v === false
      ? "Tidak diterima menurut sumber"
      : "Belum diketahui";
}

function Table({ hospitals }: { hospitals: Hospital[] }) {
  const slugs = [
    ...new Map(
      hospitals.flatMap((h) =>
        h.services
          .filter((s) => !FACILITY_SERVICE_SLUGS.has(s.slug))
          .map((s) => [s.slug, s.name] as const),
      ),
    ),
  ];
  return (
    <div className="overflow-x-auto rounded-md border border-line bg-surface">
      <table className="w-full min-w-[640px] border-collapse text-left">
        <caption className="sr-only">Perbandingan rumah sakit</caption>
        <thead>
          <tr className="border-b border-line">
            <th scope="col" className="p-3" />
            {hospitals.map((h) => (
              <th key={h.id} scope="col" className="p-3 align-top">
                <Link
                  href={`/rumah-sakit/${encodeURIComponent(h.id)}`}
                  className="text-[16px] font-semibold text-trust hover:underline"
                >
                  {h.name}
                </Link>
                <p className="font-normal text-muted">
                  {h.city_name}, {h.province_name}
                </p>
                <div className="mt-1">
                  <OriginBadge origin={h.data_origin} />
                </div>
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          <tr className="border-b border-line">
            <th scope="row" className="p-3 align-top">BPJS</th>
            {hospitals.map((h) => (
              <td key={h.id} className="p-3 align-top">
                {bpjsText(h.facility_summary.bpjs)}
              </td>
            ))}
          </tr>
          <tr className="border-b border-line">
            <th scope="row" className="p-3 align-top">Kelas</th>
            {hospitals.map((h) => (
              <td key={h.id} className="p-3 align-top">
                {codedLabel(h.facility_class) ?? (
                  <span className="text-unk-fg">Belum diketahui</span>
                )}
              </td>
            ))}
          </tr>
          <tr className="border-b border-line">
            <th scope="row" className="p-3 align-top">Status operasional</th>
            {hospitals.map((h) => (
              <td key={h.id} className="p-3 align-top">
                <span className={h.operational === null ? "text-unk-fg" : undefined}>
                  {operationalLabel(h.operational)}
                </span>
              </td>
            ))}
          </tr>
          {FACILITY_KEYS.map((key) => (
            <tr key={key} className="border-b border-line">
              <th scope="row" className="p-3 align-top">{FACILITY_LABEL[key]}</th>
              {hospitals.map((h) => (
                <td key={h.id} className="p-3 align-top">
                  <StatusBadge status={h.facility_summary[key]} />
                </td>
              ))}
            </tr>
          ))}
          {BED_CATEGORIES.map((cat) => (
            <tr key={cat} className="border-b border-line">
              <th scope="row" className="p-3 align-top">{bedCategoryLabel(cat)}</th>
              {hospitals.map((h) => {
                const bed = h.beds.find((b) => b.category === cat);
                return (
                  <td key={h.id} className="p-3 align-top">
                    <BedTile
                      label={bedCategoryLabel(cat)}
                      available={bed ? bed.available : null}
                      total={bed ? bed.total : null}
                    />
                    {bed && <SourceLine source={bed} compact />}
                  </td>
                );
              })}
            </tr>
          ))}
          {slugs.map(([slug, name]) => (
            <tr key={slug} className="border-b border-line last:border-0">
              <th scope="row" className="p-3 align-top">{name}</th>
              {hospitals.map((h) => {
                const svc = h.services.find((s) => s.slug === slug);
                return (
                  <td key={h.id} className="p-3 align-top">
                    {svc ? (
                      <div className="flex flex-col gap-1">
                        <StatusBadge status={svc.status} />
                        <SourceLine source={svc} compact />
                      </div>
                    ) : (
                      <span className="text-unk-fg">Belum diketahui</span>
                    )}
                  </td>
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export function CompareView() {
  const ids = parseCompareIds(useSearchParams().get("ids"));
  const key = ids ? ids.join(",") : "";
  const res = useApiResource(`compare:${key}`, (signal) =>
    ids ? compareHospitals(ids, signal) : Promise.reject(new Error("no ids")),
  );

  const back = (
    <Link href="/rumah-sakit" className="inline-flex min-h-10 items-center font-semibold text-trust hover:underline">
      ← Kembali ke pencarian
    </Link>
  );

  if (!ids) {
    return (
      <div className="flex flex-col gap-4">
        {back}
        <EmptyState
          title="Pilih 2–3 rumah sakit"
          description="Tautan perbandingan harus memuat 2 sampai 3 ID rumah sakit yang berbeda (UUID atau kode SATUSEHAT). Pilih dari hasil pencarian."
        />
      </div>
    );
  }
  if (res.error) {
    return (
      <div className="flex flex-col gap-4">
        {back}
        {res.error.status === 404 ? (
          <EmptyState
            title="Rumah sakit tidak ditemukan"
            description="Salah satu ID tidak ada, sehingga seluruh perbandingan tidak dapat ditampilkan."
          />
        ) : res.error.status === 422 ? (
          <EmptyState
            title="Perbandingan tidak valid"
            description="Dua ID menunjuk rumah sakit yang sama, atau ID tidak sah. Pilih 2–3 rumah sakit yang berbeda."
          />
        ) : (
          <ErrorState error={res.error} onRetry={res.reload} title="Perbandingan tidak dapat dimuat" />
        )}
      </div>
    );
  }
  const hospitals = res.data?.data;
  if (!hospitals) return <LoadingBlock label="Memuat perbandingan…" rows={4} />;

  return (
    <div className="flex flex-col gap-4">
      {back}
      {hospitals.some((h) => h.data_origin === "simulation") && <SimulationNotice />}
      <Table hospitals={hospitals} />
      <CapacityDisclaimer />
    </div>
  );
}
