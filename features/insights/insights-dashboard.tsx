"use client";

import { useState } from "react";
import Link from "next/link";
import { listRegions, listServices } from "@/lib/api/endpoints";
import type {
  Dataset,
  InsightsCoverageRow,
  InsightsFreshnessRow,
  InsightsServiceGapRow,
} from "@/lib/contracts/types";
import { ORIGIN_LABEL } from "@/lib/contracts/labels";
import { formatWib } from "@/lib/format/time";
import { useApiResource } from "@/lib/hooks/use-api-resource";
import { formatRatio } from "@/lib/recommendations/format";
import { useInsightsData } from "@/features/insights/use-insights-data";
import { BarChart } from "@/components/charts/bar-chart";
import {
  ChartSection,
  DataTable,
  type DataTableColumn,
} from "@/components/charts/data-table";
import { KpiCard } from "@/components/charts/kpi-card";
import { StackedBar } from "@/components/charts/stacked-bar";
import { OriginBadge } from "@/components/ui/badges";
import { Field, inputClasses } from "@/components/ui/field";
import { AlertIcon, CheckIcon, FlaskIcon } from "@/components/ui/icons";
import { SimulationNotice } from "@/components/ui/notices";
import { EmptyState, ErrorState, LoadingBlock } from "@/components/ui/states";
import { ToggleChip } from "@/components/ui/toggle-chip";

const DEFAULT_SERVICES = [
  { slug: "nicu", name: "NICU" },
  { slug: "icu", name: "ICU" },
  { slug: "picu", name: "PICU" },
  { slug: "igd-24h", name: "IGD 24 jam" },
  { slug: "ambulance", name: "Ambulans" },
  { slug: "rawat-inap", name: "Rawat inap" },
] as const;

const COVERAGE_COLUMNS: readonly DataTableColumn<InsightsCoverageRow>[] = [
  { key: "city", header: "Kota / Kabupaten", render: (r) => r.city_name },
  {
    key: "total",
    header: "Total RS",
    align: "right",
    render: (r) => r.hospital_count,
  },
  {
    key: "curated",
    header: "Kurasi Tim",
    align: "right",
    render: (r) => r.curated_count,
  },
  {
    key: "class_a",
    header: "Kelas A",
    align: "right",
    render: (r) => r.by_class.A,
  },
  {
    key: "class_b",
    header: "Kelas B",
    align: "right",
    render: (r) => r.by_class.B,
  },
  {
    key: "class_c",
    header: "Kelas C",
    align: "right",
    render: (r) => r.by_class.C,
  },
  {
    key: "class_d",
    header: "Kelas D",
    align: "right",
    render: (r) => r.by_class.D,
  },
  {
    key: "class_unk",
    header: "Kelas belum diketahui",
    align: "right",
    render: (r) => r.by_class.unknown,
  },
];

const GAP_COLUMNS: readonly DataTableColumn<InsightsServiceGapRow>[] = [
  { key: "city", header: "Kota / Kabupaten", render: (r) => r.city_name },
  {
    key: "gap",
    header: "Status di data kami",
    render: (r) =>
      r.gap ? (
        <span className="inline-flex items-center gap-1 rounded-lg border border-warn-line bg-warn-bg px-2 py-0.5 text-[11px] font-bold leading-[14px] text-warn-fg">
          <AlertIcon />
          Kesenjangan tercatat
        </span>
      ) : (
        <span className="inline-flex items-center gap-1 rounded-lg border border-ok-line bg-ok-bg px-2 py-0.5 text-[11px] font-bold leading-[14px] text-ok-fg">
          <CheckIcon />
          Ada RS tercatat
        </span>
      ),
  },
  {
    key: "available",
    header: "Tersedia",
    align: "right",
    render: (r) => r.available,
  },
  {
    key: "limited",
    header: "Terbatas",
    align: "right",
    render: (r) => r.limited,
  },
  {
    key: "unavailable",
    header: "Tidak tersedia",
    align: "right",
    render: (r) => r.unavailable,
  },
  {
    key: "unknown",
    header: "Belum diketahui",
    align: "right",
    render: (r) => <span className="text-unk-fg">{r.unknown}</span>,
  },
];

const FRESHNESS_COLUMNS: readonly DataTableColumn<InsightsFreshnessRow>[] = [
  {
    key: "origin",
    header: "Asal data",
    render: (r) => <OriginBadge origin={r.data_origin} />,
  },
  {
    key: "fresh",
    header: "Terbaru (< 1 jam)",
    align: "right",
    render: (r) => r.fresh,
  },
  {
    key: "aging",
    header: "Mulai lama (1–24 jam)",
    align: "right",
    render: (r) => r.aging,
  },
  {
    key: "stale",
    header: "Kedaluwarsa (> 24 jam)",
    align: "right",
    render: (r) => r.stale,
  },
  {
    key: "unknown",
    header: "Tidak diketahui",
    align: "right",
    render: (r) => <span className="text-unk-fg">{r.unknown}</span>,
  },
];

/**
 * Dashboard Wawasan Data (/wawasan, FE-20): KPI ringkasan, bar cakupan per kota,
 * tabel kesenjangan per layanan, dan stacked bar kesegaran per asal data.
 */
export function InsightsDashboard() {
  const [provinceCode, setProvinceCode] = useState("");
  const [dataset, setDataset] = useState<Dataset>("real");
  const [service, setService] = useState("nicu");

  const regionsRes = useApiResource("regions", (s) => listRegions(s));
  const servicesRes = useApiResource("services", (s) => listServices(s));

  const provinces = regionsRes.data?.data ?? [];
  const serviceOptions =
    servicesRes.data?.data && servicesRes.data.data.length > 0
      ? servicesRes.data.data
      : DEFAULT_SERVICES;

  const selectedServiceName =
    serviceOptions.find((s) => s.slug === service)?.name ??
    service.toUpperCase();
  const selectedProvinceName =
    provinces.find((p) => p.code === provinceCode)?.name ?? "Semua provinsi pilot";

  const insights = useInsightsData({
    province_code: provinceCode,
    dataset,
    service,
  });

  const bundle = insights.data;
  const generatedWib = bundle ? formatWib(bundle.meta.generated_at) : null;
  const sources = bundle?.meta.sources;

  return (
    <div className="flex flex-col gap-6">
      <section
        aria-label="Filter wawasan data"
        className="grid gap-4 rounded-md border border-line bg-surface p-4 md:grid-cols-2 md:p-5"
      >
        <Field
          id="insights-province"
          label="Filter provinsi"
          hint="Pilih provinsi untuk mempersempit KPI dan grafik wilayah."
        >
          <select
            id="insights-province"
            className={inputClasses}
            value={provinceCode}
            onChange={(e) => setProvinceCode(e.target.value)}
          >
            <option value="">Semua provinsi (Jabodetabek pilot)</option>
            {provinces.map((p) => (
              <option key={p.code} value={p.code}>
                {p.name}
              </option>
            ))}
          </select>
        </Field>

        <Field
          id="insights-dataset"
          label="Cakupan dataset"
          hint="Default hanya RS nyata/sandbox; simulasi selalu dilabeli."
        >
          <select
            id="insights-dataset"
            className={inputClasses}
            value={dataset}
            onChange={(e) => setDataset(e.target.value as Dataset)}
          >
            <option value="real">RS nyata (SATUSEHAT Sandbox + Kurasi)</option>
            <option value="all">Semua (termasuk RS simulasi demo)</option>
            <option value="simulation">Hanya RS simulasi (demo)</option>
          </select>
        </Field>
      </section>

      {insights.error ? (
        <ErrorState
          error={insights.error}
          onRetry={insights.reload}
          title="Wawasan data tidak dapat dimuat"
        />
      ) : insights.loading || !bundle ? (
        <LoadingBlock label="Memuat agregasi wawasan data…" rows={4} />
      ) : (
        <>
          {(dataset !== "real" ||
            bundle.summary.simulated_facility_count > 0) && <SimulationNotice />}

          {bundle.usingFallback && (
            <p
              role="status"
              className="rounded-md border border-line bg-well px-3.5 py-2.5 text-[13px] leading-5 text-muted"
            >
              Endpoint agregasi <code className="font-mono">/insights/*</code>{" "}
              (v0.5.0) belum diaktifkan di server ini — menampilkan agregasi
              langsung dari daftar rumah sakit (<code className="font-mono">GET /hospitals</code>) untuk{" "}
              <strong className="text-ink">{selectedProvinceName}</strong>.
            </p>
          )}

          {/* KPI Kartu */}
          <section aria-label="Ringkasan indikator utama">
            <dl className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
              <KpiCard
                label="Total rumah sakit"
                value={String(bundle.summary.hospital_count)}
                detail={`Tersebar di ${bundle.summary.city_count} kota/kabupaten (${selectedProvinceName})`}
              />
              <KpiCard
                label="RS dengan data kurasi"
                value={String(bundle.summary.curated_count)}
                badge={<OriginBadge origin="curated" />}
                detail={
                  bundle.summary.hospital_count > 0
                    ? `${formatRatio(
                        bundle.summary.curated_count /
                          bundle.summary.hospital_count,
                      )} dari total RS tercatat`
                    : "Belum ada RS pada filter ini"
                }
              />
              <KpiCard
                label="Rasio data terbaru (< 1 jam)"
                value={formatRatio(bundle.summary.fresh_ratio)}
                detail="Proporsi RS dengan kesegaran terbaru menurut waktu pembaruan sumber"
              />
              <KpiCard
                label="Status BPJS diketahui"
                value={formatRatio(bundle.summary.with_known_bpjs_ratio)}
                badge={
                  bundle.summary.simulated_facility_count > 0 ? (
                    <span className="inline-flex items-center gap-1 rounded-lg border border-sim-line bg-sim-bg px-2 py-0.5 text-[11px] font-bold text-sim-fg">
                      <FlaskIcon />
                      {bundle.summary.simulated_facility_count} fasilitas simulasi
                    </span>
                  ) : undefined
                }
                detail="Sisanya masih berstatus Belum diketahui (bukan berarti menolak BPJS)"
              />
            </dl>
          </section>

          {/* Grafik 1: Cakupan per Kota */}
          <ChartSection
            id="chart-coverage"
            title={`Jumlah rumah sakit per kota/kabupaten (${selectedProvinceName})`}
            description={
              <p>
                Perbandingan jumlah rumah sakit tercatat beserta porsi yang
                sudah memiliki data <strong>Kurasi Tim</strong> di setiap
                kota/kabupaten.
              </p>
            }
            generatedWib={generatedWib}
            sources={sources}
            altTable={
              <DataTable
                caption={`Tabel jumlah rumah sakit dan rincian kelas per kota/kabupaten (${selectedProvinceName})`}
                columns={COVERAGE_COLUMNS}
                rows={bundle.coverage}
                rowKey={(r) => r.city_code || r.city_name}
              />
            }
          >
            {bundle.coverage.length === 0 ? (
              <EmptyState
                title="Tidak ada data cakupan kota"
                description="Belum ada rumah sakit tercatat untuk filter wilayah ini."
              />
            ) : (
              <BarChart
                title={`Grafik batang jumlah rumah sakit per kota/kabupaten di ${selectedProvinceName}`}
                primaryLabel="Total rumah sakit tercatat"
                secondaryLabel="Sudah dikurasi tim"
                data={bundle.coverage.map((c) => ({
                  id: c.city_code || c.city_name,
                  label: c.city_name,
                  value: c.hospital_count,
                  secondaryValue: c.curated_count,
                }))}
              />
            )}
          </ChartSection>

          {/* Grafik/Tabel 2: Kesenjangan Layanan per Kota */}
          <ChartSection
            id="chart-service-gaps"
            title={`Kesenjangan layanan ${selectedServiceName} per kota/kabupaten`}
            description={
              <div className="flex flex-col gap-3">
                <p
                  role="note"
                  className="flex items-start gap-2 rounded-md border border-warn-line bg-warn-bg px-3 py-2.5 text-[13px] leading-5 text-ink"
                >
                  <AlertIcon className="mt-0.5 shrink-0 text-warn-fg" />
                  <span>
                    <strong className="text-warn-fg">
                      Catatan wajib arti &ldquo;Kesenjangan&rdquo;:
                    </strong>{" "}
                    Kesenjangan (<em>gap</em>) berarti{" "}
                    <strong>
                      tidak ada RS dengan layanan tersebut yang tercatat
                      tersedia di data kami
                    </strong>{" "}
                    (<code className="font-mono">tersedia + terbatas = 0</code>
                    ), bukan klaim faktual bahwa layanan sama sekali tidak ada
                    di wilayah tersebut.
                  </span>
                </p>

                <div className="flex flex-col gap-1.5">
                  <span className="text-[13px] font-semibold text-ink">
                    Pilih layanan yang dianalisis:
                  </span>
                  <div
                    role="group"
                    aria-label="Pilih layanan untuk tabel kesenjangan"
                    className="flex flex-wrap gap-2"
                  >
                    {serviceOptions.map((svc) => (
                      <ToggleChip
                        key={svc.slug}
                        checked={service === svc.slug}
                        onChange={() => setService(svc.slug)}
                      >
                        {svc.name}
                      </ToggleChip>
                    ))}
                  </div>
                </div>
              </div>
            }
            generatedWib={generatedWib}
            sources={sources}
          >
            {bundle.serviceGaps.length === 0 ? (
              <EmptyState
                title="Tidak ada data layanan wilayah"
                description="Belum ada data untuk kombinasi provinsi dan layanan ini."
              />
            ) : (
              <DataTable
                caption={`Status pencatatan layanan ${selectedServiceName} per kota/kabupaten (${selectedProvinceName})`}
                columns={GAP_COLUMNS}
                rows={bundle.serviceGaps}
                rowKey={(r) => r.city_code || r.city_name}
              />
            )}
          </ChartSection>

          {/* Grafik 3: Distribusi Kesegaran per Asal Data */}
          <ChartSection
            id="chart-freshness"
            title="Distribusi kesegaran informasi menurut asal data"
            description={
              <p>
                Menunjukkan proporsi data terbaru (&lt; 1 jam), mulai lama (1–24
                jam), kedaluwarsa (&gt; 24 jam), dan waktu pembaruan tidak
                diketahui untuk setiap asal data.{" "}
                <Link
                  href="/tentang-data#pembaruan-data"
                  className="font-semibold text-trust underline"
                >
                  Pelajari cara kami menjaga kesegaran data
                </Link>
              </p>
            }
            generatedWib={generatedWib}
            sources={sources}
            altTable={
              <DataTable
                caption="Tabel distribusi kesegaran per asal data"
                columns={FRESHNESS_COLUMNS}
                rows={bundle.freshness}
                rowKey={(r) => r.data_origin}
              />
            }
          >
            {bundle.freshness.length === 0 ? (
              <EmptyState
                title="Tidak ada data kesegaran"
                description="Belum ada entri rumah sakit untuk ditampilkan."
              />
            ) : (
              <StackedBar
                title="Grafik stacked bar distribusi kesegaran per asal data"
                rows={bundle.freshness.map((r) => ({
                  id: r.data_origin,
                  label: ORIGIN_LABEL[r.data_origin],
                  segments: {
                    fresh: r.fresh,
                    aging: r.aging,
                    stale: r.stale,
                    unknown: r.unknown,
                  },
                }))}
              />
            )}
          </ChartSection>
        </>
      )}
    </div>
  );
}
