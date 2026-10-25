"use client";

import { useState, type ReactNode } from "react";
import type { ApiResource } from "@/lib/hooks/use-api-resource";
import type {
  ApiSuccess,
  CountMeta,
  Province,
  Region,
  ServiceMaster,
} from "@/lib/contracts/types";
import {
  activeFilterCount,
  type HospitalDataset,
  type HospitalQuery,
  type HospitalSort,
} from "@/lib/hospitals/query";
import { Button } from "@/components/ui/button";
import { Field, inputClasses } from "@/components/ui/field";
import { FilterIcon, PinIcon } from "@/components/ui/icons";

/** Chip yang dapat di-toggle; checkbox asli tetap ada untuk keyboard & pembaca layar. */
function ToggleChip({
  checked,
  onChange,
  title,
  children,
}: {
  checked: boolean;
  onChange: (checked: boolean) => void;
  title?: string;
  children: ReactNode;
}) {
  return (
    <label
      title={title}
      className={`inline-flex min-h-11 cursor-pointer md:min-h-9 items-center gap-1.5 rounded-lg border px-3 text-[13px] font-semibold focus-within:outline focus-within:outline-[3px] focus-within:outline-offset-2 focus-within:outline-brand ${
        checked
          ? "border-brand bg-brand text-white"
          : "border-line bg-well text-muted hover:border-line-strong"
      }`}
    >
      <input
        type="checkbox"
        className="sr-only"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
      />
      <span aria-hidden="true">{checked ? "✓" : "+"}</span>
      {children}
    </label>
  );
}

/**
 * Kode seed ("36.71") dan SATUSEHAT ("3671") adalah wilayah berbeda dengan
 * nama yang bisa sama; tampilkan kode hanya bila nama bentrok.
 */
function regionOptionLabel(region: Region, siblings: Region[]): string {
  const clash = siblings.some((r) => r.code !== region.code && r.name === region.name);
  return clash ? `${region.name} (${region.code})` : region.name;
}

function RegionFilter({
  query,
  regions,
  onFilterChange,
}: {
  query: HospitalQuery;
  regions: ApiResource<ApiSuccess<Province[], CountMeta>>;
  onFilterChange: (patch: Partial<Omit<HospitalQuery, "page">>) => void;
}) {
  const provinces = regions.data?.data ?? [];
  const province = provinces.find((p) => p.code === query.province_code) ?? null;
  const cities = province?.cities ?? [];
  // Kode dari URL/kartu yang tidak ada di master tetap dipertahankan.
  const unknownProvince = query.province_code !== "" && province === null;
  const unknownCity =
    query.city_code !== "" && !cities.some((c) => c.code === query.city_code);

  if (regions.error && provinces.length === 0) {
    return (
      <p className="text-muted sm:col-span-2">
        Daftar wilayah tidak dapat dimuat.{" "}
        <button
          type="button"
          onClick={regions.reload}
          className="font-semibold text-trust underline"
        >
          Coba lagi
        </button>
      </p>
    );
  }

  return (
    <>
      <Field id="filter-province" label="Provinsi">
        <select
          id="filter-province"
          className={inputClasses}
          value={query.province_code}
          disabled={provinces.length === 0}
          onChange={(e) =>
            onFilterChange({ province_code: e.target.value, city_code: "" })
          }
        >
          <option value="">
            {regions.loading && provinces.length === 0 ? "Memuat…" : "Semua provinsi"}
          </option>
          {unknownProvince && (
            <option value={query.province_code}>Wilayah terpilih</option>
          )}
          {provinces.map((p) => (
            <option key={p.code} value={p.code}>
              {regionOptionLabel(p, provinces)}
            </option>
          ))}
        </select>
      </Field>
      <Field id="filter-city" label="Kota/kabupaten">
        <select
          id="filter-city"
          className={inputClasses}
          value={query.city_code}
          disabled={query.province_code === ""}
          onChange={(e) => onFilterChange({ city_code: e.target.value })}
        >
          <option value="">
            {query.province_code === "" ? "Pilih provinsi dulu" : "Semua kota/kabupaten"}
          </option>
          {unknownCity && <option value={query.city_code}>Wilayah terpilih</option>}
          {cities.map((c) => (
            <option key={c.code} value={c.code}>
              {regionOptionLabel(c, cities)}
            </option>
          ))}
        </select>
      </Field>
    </>
  );
}

const DATASET_OPTIONS: Array<{ value: HospitalDataset; label: string }> = [
  { value: "simulation", label: "Simulasi (demo, RS fiktif)" },
  { value: "real", label: "Data sandbox / nyata" },
  { value: "all", label: "Semua data" },
];

export function HospitalFilters({
  query,
  services,
  regions,
  onFilterChange,
  onReset,
  onUseLocation,
  onClearLocation,
  geoLoading,
  geoMessage,
}: {
  query: HospitalQuery;
  services: ApiResource<ApiSuccess<ServiceMaster[]>>;
  regions: ApiResource<ApiSuccess<Province[], CountMeta>>;
  onFilterChange: (patch: Partial<Omit<HospitalQuery, "page">>) => void;
  onReset: () => void;
  onUseLocation: () => void;
  onClearLocation: () => void;
  geoLoading: boolean;
  geoMessage: string | null;
}) {
  const hasCoords = query.lat !== null && query.lng !== null;
  const serviceList = services.data?.data ?? [];
  const activeCount = activeFilterCount(query) + (hasCoords ? 1 : 0);
  // < lg: panel dilipat agar hasil tidak terdorong ~2 layar ke bawah.
  const [open, setOpen] = useState(false);

  function toggleService(slug: string, on: boolean) {
    const next = on
      ? [...query.services, slug]
      : query.services.filter((s) => s !== slug);
    onFilterChange({ services: next });
  }

  return (
    <div className="flex flex-col gap-2">
      <Button
        variant="secondary"
        className="w-full lg:hidden"
        aria-expanded={open}
        aria-controls="search-filters"
        onClick={() => setOpen((v) => !v)}
      >
        <span className="mr-auto inline-flex items-center gap-2">
          <FilterIcon /> Filter &amp; urutan
          {activeCount > 0 && (
            <span className="rounded-full bg-brand px-2 text-[12px] text-white">
              {activeCount} aktif
            </span>
          )}
        </span>
        <span aria-hidden="true">{open ? "▲" : "▼"}</span>
      </Button>
      <section
        id="search-filters"
        aria-label="Filter pencarian"
        className={`${open ? "flex" : "hidden"} flex-col gap-4 rounded-md border border-line bg-surface p-4 lg:flex`}
      >
        <fieldset className="flex flex-col gap-2">
          <legend className="text-[13px] font-semibold leading-4">
            Layanan yang dibutuhkan{" "}
            <span className="font-normal text-muted">(harus semua terpenuhi)</span>
          </legend>
          <div className="flex flex-wrap gap-2">
            {services.error && serviceList.length === 0 && (
              <p className="text-muted">
                Daftar layanan tidak dapat dimuat.{" "}
                <button
                  type="button"
                  onClick={services.reload}
                  className="font-semibold text-trust underline"
                >
                  Coba lagi
                </button>
              </p>
            )}
            {services.loading && serviceList.length === 0 && !services.error && (
              <span className="skeleton inline-block h-9 w-48" role="status">
                <span className="sr-only">Memuat daftar layanan…</span>
              </span>
            )}
            {serviceList.map((s) => (
              <ToggleChip
                key={s.slug}
                checked={query.services.includes(s.slug)}
                onChange={(on) => toggleService(s.slug, on)}
              >
                {s.name}
              </ToggleChip>
            ))}
            <ToggleChip
              checked={query.bpjs}
              onChange={(on) => onFilterChange({ bpjs: on })}
            >
              Menerima BPJS
            </ToggleChip>
            <ToggleChip
              checked={query.has_available_beds}
              onChange={(on) => onFilterChange({ has_available_beds: on })}
              title="Hanya cocok bila ada tempat tidur tersedia > 0 yang datanya terbaru (< 1 jam) dan bukan simulasi."
            >
              Tempat tidur kosong terkonfirmasi
            </ToggleChip>
          </div>
          {query.has_available_beds && query.dataset === "simulation" && (
            <p role="status" className="text-[12px] leading-[18px] text-warn-fg">
              Filter tempat tidur kosong terkonfirmasi tidak mencakup data
              simulasi, jadi hasil pada dataset Simulasi akan kosong. Pilih
              “Data sandbox / nyata” atau “Semua data”.
            </p>
          )}
        </fieldset>

        <div className="grid gap-4 sm:grid-cols-2">
          <RegionFilter
            query={query}
            regions={regions}
            onFilterChange={onFilterChange}
          />
          <Field id="filter-dataset" label="Sumber data">
            <select
              id="filter-dataset"
              className={inputClasses}
              value={query.dataset}
              onChange={(e) =>
                onFilterChange({ dataset: e.target.value as HospitalDataset })
              }
            >
              {DATASET_OPTIONS.map((o) => (
                <option key={o.value} value={o.value}>
                  {o.label}
                </option>
              ))}
            </select>
          </Field>

          <Field id="filter-sort" label="Urutkan">
            <select
              id="filter-sort"
              className={inputClasses}
              value={query.sort}
              onChange={(e) => onFilterChange({ sort: e.target.value as HospitalSort })}
            >
              <option value="name">Nama (A–Z)</option>
              <option value="match">Kecocokan layanan &amp; kesegaran data</option>
              <option value="distance" disabled={!hasCoords}>
                Jarak terdekat (garis lurus){hasCoords ? "" : " — butuh lokasi"}
              </option>
            </select>
          </Field>
        </div>


        <div className="flex flex-wrap items-center gap-2">
          {hasCoords ? (
            <Button variant="secondary" onClick={onClearLocation}>
              <PinIcon /> Hapus lokasi saya
            </Button>
          ) : (
            <Button
              variant="secondary"
              onClick={onUseLocation}
              loading={geoLoading}
              loadingLabel="Mencari lokasi…"
            >
              <PinIcon /> Gunakan lokasi saya
            </Button>
          )}
          <Button
            variant="tertiary"
            onClick={onReset}
            disabled={activeFilterCount(query) === 0 && !hasCoords}
          >
            Reset filter
          </Button>
        </div>
        {geoMessage && (
          <p role="status" className="text-[12px] leading-[18px] text-muted">
            {geoMessage}
          </p>
        )}
        <p className="text-[12px] leading-[18px] text-faint">
          Lokasi hanya dipakai untuk menghitung jarak garis lurus dan tidak
          disimpan permanen. Tanpa lokasi, cari nama kota atau provinsi pada
          kolom pencarian.
        </p>
      </section>
    </div>
  );
}
