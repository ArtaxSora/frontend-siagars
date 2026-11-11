"use client";

import type { ReactNode } from "react";
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
import { hasSimulatedData, parseCompareIds } from "@/lib/hospitals/summary";
import {
  compareSummary,
  judgeCompare,
  type CompareJudgement,
} from "@/lib/hospitals/compare-winner";
import { BedTile } from "@/features/hospitals/bed-tile";
import { BpjsStatus, SimulatedTag } from "@/features/hospitals/facility-badges";
import {
  FreshnessLabel,
  OriginBadge,
  SourceLine,
  StatusBadge,
} from "@/components/ui/badges";
import { DataQualityBadge, WinnerMark } from "@/components/ui/decision";
import { StarIcon } from "@/components/ui/icons";
import { ButtonLink } from "@/components/ui/button";
import { CapacityDisclaimer, SimulationNotice } from "@/components/ui/notices";
import { EmptyState, ErrorState, LoadingBlock } from "@/components/ui/states";

interface CompareRow {
  key: string;
  label: string;
  /** `label` dipakai sebagai judul ubin bila sel menampilkan BedTile. */
  cell: (h: Hospital, label: string) => ReactNode;
}

function buildRows(hospitals: Hospital[]): CompareRow[] {
  const slugs = [
    ...new Map(
      hospitals.flatMap((h) =>
        h.services
          .filter((s) => !FACILITY_SERVICE_SLUGS.has(s.slug))
          .map((s) => [s.slug, s.name] as const),
      ),
    ),
  ];
  return [
    {
      key: "bpjs",
      label: "BPJS",
      cell: (h) => (
        <BpjsStatus accepted={h.facility_summary.bpjs} origin={h.bpjs_data_origin} long />
      ),
    },
    {
      key: "class",
      label: "Kelas",
      cell: (h) =>
        codedLabel(h.facility_class) ?? <span className="text-unk-fg">Belum diketahui</span>,
    },
    {
      key: "operational",
      label: "Status operasional",
      cell: (h) => (
        <span className={h.operational === null ? "text-unk-fg" : undefined}>
          {operationalLabel(h.operational)}
        </span>
      ),
    },
    ...FACILITY_KEYS.map((key) => ({
      key: `facility:${key}`,
      label: FACILITY_LABEL[key],
      cell: (h: Hospital) => (
        <div className="flex flex-wrap items-center gap-1">
          <StatusBadge status={h.facility_summary[key]} />
          <SimulatedTag origin={h.facility_summary.data_origin} />
        </div>
      ),
    })),
    ...BED_CATEGORIES.map((cat) => ({
      key: `bed:${cat}`,
      label: bedCategoryLabel(cat),
      cell: (h: Hospital, label: string) => {
        const bed = h.beds.find((b) => b.category === cat);
        return (
          <>
            <BedTile
              label={label}
              available={bed ? bed.available : null}
              total={bed ? bed.total : null}
            />
            {bed && <SourceLine source={bed} compact />}
          </>
        );
      },
    })),
    ...slugs.map(([slug, name]) => ({
      key: `svc:${slug}`,
      label: name,
      cell: (h: Hospital) => {
        const svc = h.services.find((s) => s.slug === slug);
        return svc ? (
          <div className="flex flex-col gap-1">
            <StatusBadge status={svc.status} />
            <SourceLine source={svc} compact />
          </div>
        ) : (
          <span className="text-unk-fg">Belum diketahui</span>
        );
      },
    })),
    {
      key: "data",
      label: "Kualitas & kesegaran data",
      cell: (h: Hospital) => (
        <div className="flex flex-col items-start gap-1">
          <DataQualityBadge quality={h.data_quality} />
          <FreshnessLabel freshness={h.data_quality.freshness} />
        </div>
      ),
    },
  ];
}

/** Isi sel + penanda "Unggul" (ikon + teks) bila RS ke-i menang di baris ini. */
function JudgedCell({
  row,
  h,
  index,
  label,
  judgement,
}: {
  row: CompareRow;
  h: Hospital;
  index: number;
  label: string;
  judgement: CompareJudgement;
}) {
  const won = judgement.winners[row.key]?.includes(index) ?? false;
  return (
    <div className="flex flex-col items-start gap-1.5">
      {won && <WinnerMark />}
      <div>{row.cell(h, label)}</div>
    </div>
  );
}

function WinCount({ wins, judged }: { wins: number; judged: number }) {
  return (
    <p className="mt-1 text-[12px] font-semibold text-muted tabular-nums">
      Unggul di {wins} dari {judged} atribut
    </p>
  );
}

function HospitalHeading({ h }: { h: Hospital }) {
  return (
    <>
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
    </>
  );
}

/** md+: tabel berdampingan. */
function Table({
  hospitals,
  rows,
  judgement,
}: {
  hospitals: Hospital[];
  rows: CompareRow[];
  judgement: CompareJudgement;
}) {
  return (
    <div className="hidden overflow-x-auto rounded-md border border-line bg-surface md:block">
      <table className="w-full border-collapse text-left">
        <caption className="sr-only">Perbandingan rumah sakit</caption>
        <thead>
          <tr className="border-b border-line">
            <th scope="col" className="p-3" />
            {hospitals.map((h, i) => (
              <th key={h.id} scope="col" className="p-3 align-top">
                <HospitalHeading h={h} />
                <WinCount wins={judgement.wins[i]} judged={judgement.judged} />
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr key={row.key} className="border-b border-line last:border-0">
              <th scope="row" className="p-3 align-top">{row.label}</th>
              {hospitals.map((h, i) => (
                <td key={h.id} className="p-3 align-top">
                  <JudgedCell row={row} h={h} index={i} label={row.label} judgement={judgement} />
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

/**
 * < md: satu blok per atribut, tiap RS ditumpuk di bawahnya. Tetap bisa
 * dibandingkan tanpa menggulir tabel ke samping.
 */
function Stacked({
  hospitals,
  rows,
  judgement,
}: {
  hospitals: Hospital[];
  rows: CompareRow[];
  judgement: CompareJudgement;
}) {
  return (
    <div className="flex flex-col gap-3 md:hidden">
      <ol className="flex flex-col gap-2 rounded-md border border-line bg-surface p-3">
        {hospitals.map((h, i) => (
          <li key={h.id} className="flex gap-2">
            <span className="font-semibold text-faint">{i + 1}.</span>
            <div>
              <HospitalHeading h={h} />
              <WinCount wins={judgement.wins[i]} judged={judgement.judged} />
            </div>
          </li>
        ))}
      </ol>
      {rows.map((row) => (
        <section
          key={row.key}
          className="flex flex-col gap-2 rounded-md border border-line bg-surface p-3"
        >
          <h2 className="text-[16px] font-semibold">{row.label}</h2>
          <ul className="flex flex-col divide-y divide-line">
            {hospitals.map((h, i) => (
              <li key={h.id} className="flex flex-col gap-1 py-2 first:pt-0 last:pb-0">
                <span className="text-[12px] font-semibold text-muted">
                  {i + 1}. {h.name}
                </span>
                <JudgedCell row={row} h={h} index={i} label={h.name} judgement={judgement} />
              </li>
            ))}
          </ul>
        </section>
      ))}
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
    <Link href="/rumah-sakit" className="inline-flex min-h-11 items-center font-semibold text-trust hover:underline md:min-h-10">
      ← Kembali ke pencarian
    </Link>
  );

  if (!ids) {
    return (
      <div className="flex flex-col gap-4">
        {back}
        <EmptyState
          title="Pilih 2–3 rumah sakit"
          description="Centang “Bandingkan” pada 2 sampai 3 rumah sakit di hasil rekomendasi atau pencarian. SiagaRS lalu menandai siapa yang unggul di setiap atribut."
          action={
            <div className="flex flex-wrap gap-2">
              <ButtonLink href="/pilih-rs">Bantu saya pilih RS</ButtonLink>
              <ButtonLink href="/rumah-sakit" variant="secondary">
                Cari rumah sakit
              </ButtonLink>
            </div>
          }
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
  const rows = buildRows(hospitals);
  const judgement = judgeCompare(hospitals, FACILITY_SERVICE_SLUGS);
  const verdict = compareSummary(
    hospitals.map((h) => h.name),
    judgement,
  );

  return (
    <div className="flex flex-col gap-4">
      {back}
      <section
        aria-label="Ringkasan perbandingan"
        className="flex flex-col gap-1 rounded-md border border-ok-line bg-ok-bg p-4"
      >
        <p className="inline-flex items-center gap-2 text-[16px] font-semibold text-ok-fg">
          <StarIcon className="shrink-0" />
          {verdict ?? "Belum ada rumah sakit yang unggul pada atribut yang diketahui."}
        </p>
        <p className="text-[12px] leading-[18px] text-muted">
          &ldquo;Unggul&rdquo; = nilai terbaik di baris itu menurut data kami
          (layanan tersedia &gt; terbatas, tempat tidur kosong terbanyak, BPJS
          diterima, data paling baru). Nilai yang belum diketahui tidak pernah
          unggul; nilai seri ditandai semua. Ini bukan penilaian mutu medis.
        </p>
      </section>
      {hospitals.some(hasSimulatedData) && <SimulationNotice />}
      <Table hospitals={hospitals} rows={rows} judgement={judgement} />
      <Stacked hospitals={hospitals} rows={rows} judgement={judgement} />
      <CapacityDisclaimer />
    </div>
  );
}
