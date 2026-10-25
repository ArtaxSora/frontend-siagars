"use client";

import { useEffect, useRef, useState, type FormEvent } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { listHospitals, listRegions, listServices } from "@/lib/api/endpoints";
import { useApiResource } from "@/lib/hooks/use-api-resource";
import { useMediaQuery } from "@/lib/hooks/use-media-query";
import {
  EMPTY_QUERY,
  applyFilterChange,
  applyPageChange,
  parseHospitalQuery,
  serializeHospitalQuery,
  type HospitalQuery,
} from "@/lib/hospitals/query";
import { hasSimulatedData, isMappable } from "@/lib/hospitals/summary";
import type { Hospital } from "@/lib/contracts/types";
import Link from "next/link";
import { HospitalCard } from "@/features/hospitals/hospital-card";
import { HospitalFilters } from "@/features/hospitals/hospital-filters";
import { HospitalSuggestInput } from "@/features/hospitals/hospital-suggest";
import { HospitalMap } from "@/features/hospitals/map/hospital-map";
import { Button } from "@/components/ui/button";
import { Field } from "@/components/ui/field";
import { SearchIcon } from "@/components/ui/icons";
import { SimulationNotice } from "@/components/ui/notices";
import { Pagination } from "@/components/ui/pagination";
import { EmptyState, ErrorState, LoadingBlock } from "@/components/ui/states";

const DEBOUNCE_MS = 300;

export function HospitalSearch() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  // URL adalah satu-satunya sumber kebenaran filter.
  const query = parseHospitalQuery(searchParams);
  const queryKey = serializeHospitalQuery(query);

  const hospitals = useApiResource(`hospitals?${queryKey}`, (signal) =>
    listHospitals(query, signal),
  );
  const services = useApiResource("services", (signal) => listServices(signal));
  const regions = useApiResource("regions", (signal) => listRegions(signal));

  const queryRef = useRef(query);
  useEffect(() => {
    queryRef.current = query;
  });

  function navigate(next: HospitalQuery) {
    const qs = serializeHospitalQuery(next);
    router.replace(qs ? `${pathname}?${qs}` : pathname, { scroll: false });
  }

  /* ---- Kolom pencarian dengan debounce ---- */
  const [text, setText] = useState(query.q);
  const [prevUrlQ, setPrevUrlQ] = useState(query.q);
  const [lastSentQ, setLastSentQ] = useState(query.q);
  // Sinkronkan input hanya bila URL berubah dari luar (mis. tombol kembali).
  if (query.q !== prevUrlQ) {
    setPrevUrlQ(query.q);
    if (query.q !== lastSentQ) {
      setText(query.q);
      setLastSentQ(query.q);
    }
  }

  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  useEffect(
    () => () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    },
    [],
  );

  function commitQuery(value: string) {
    const q = value.trim();
    setLastSentQ(q);
    navigate(applyFilterChange(queryRef.current, { q }));
  }

  function onTextChange(value: string) {
    setText(value);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => commitQuery(value), DEBOUNCE_MS);
  }

  function onSubmit(e: FormEvent) {
    e.preventDefault();
    if (debounceRef.current) clearTimeout(debounceRef.current);
    commitQuery(text);
  }

  /* ---- Lokasi: hanya setelah klik pengguna ---- */
  const [geoLoading, setGeoLoading] = useState(false);
  const [geoMessage, setGeoMessage] = useState<string | null>(null);

  function requestLocation() {
    if (!("geolocation" in navigator)) {
      setGeoMessage(
        "Peramban ini tidak mendukung lokasi. Gunakan filter provinsi atau cari nama kota.",
      );
      return;
    }
    setGeoLoading(true);
    setGeoMessage(null);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setGeoLoading(false);
        navigate(
          applyFilterChange(queryRef.current, {
            lat: pos.coords.latitude,
            lng: pos.coords.longitude,
            sort: "distance",
          }),
        );
      },
      () => {
        setGeoLoading(false);
        setGeoMessage(
          "Lokasi tidak dapat digunakan (izin ditolak atau tidak tersedia). Pilih provinsi atau cari nama kota sebagai gantinya.",
        );
      },
      { enableHighAccuracy: false, timeout: 10_000, maximumAge: 60_000 },
    );
  }

  /* ---- Pilihan kartu <-> marker ---- */
  const isDesktop = useMediaQuery("(min-width: 1024px)");
  const [mobileView, setMobileView] = useState<"list" | "map">("list");
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const items = hospitals.data?.data ?? [];
  const meta = hospitals.data?.meta;
  const showMap = isDesktop || mobileView === "map";
  const mappable = items.filter(isMappable);
  const selectedHospital = items.find((h) => h.id === selectedId) ?? null;

  function selectFromMarker(id: string) {
    setSelectedId(id);
    if (isDesktop) {
      document
        .getElementById(`hospital-card-${id}`)
        ?.scrollIntoView({ block: "nearest" });
    }
  }

  function showOnMap(id: string) {
    setSelectedId(id);
    if (!isDesktop) setMobileView("map");
  }

  const userLocation =
    query.lat !== null && query.lng !== null
      ? { lat: query.lat, lng: query.lng }
      : null;

  const resetQuery = (): HospitalQuery => ({ ...EMPTY_QUERY, limit: query.limit });

  /* ---- Bandingkan (2–3 RS) ---- */
  const [compareIds, setCompareIds] = useState<string[]>([]);
  function toggleCompare(id: string, on: boolean) {
    setCompareIds((cur) =>
      on ? (cur.includes(id) || cur.length >= 3 ? cur : [...cur, id]) : cur.filter((x) => x !== id),
    );
  }
  const compareFor = (h: Hospital) => ({
    checked: compareIds.includes(h.id),
    disabled: compareIds.length >= 3,
    onChange: (on: boolean) => toggleCompare(h.id, on),
  });

  /* ---- Filter wilayah: kode persis dari API ---- */
  function filterRegion(h: Hospital) {
    navigate(
      applyFilterChange(queryRef.current, {
        province_code: h.province_code,
        city_code: h.city_code,
      }),
    );
  }

  /* ---- Render ---- */
  const firstLoad = hospitals.loading && hospitals.data === null;
  const stale = hospitals.loading && hospitals.data !== null;

  return (
    <div className="flex flex-col gap-4">
      <form
        role="search"
        onSubmit={onSubmit}
        className="flex flex-col gap-2 sm:flex-row sm:items-end"
      >
        <div className="flex-1">
          <Field
            id="search-q"
            label="Cari nama rumah sakit, kota, atau provinsi"
          >
            <HospitalSuggestInput
              id="search-q"
              placeholder="Contoh: Surabaya, atau nama rumah sakit"
              value={text}
              onChange={onTextChange}
              dataset={query.dataset}
            />
          </Field>
        </div>
        <Button type="submit">
          <SearchIcon /> Cari
        </Button>
      </form>

      <HospitalFilters
        query={query}
        services={services}
        regions={regions}
        onFilterChange={(patch) => navigate(applyFilterChange(query, patch))}
        onReset={() => {
          setText("");
          setLastSentQ("");
          setGeoMessage(null);
          navigate(resetQuery());
        }}
        onUseLocation={requestLocation}
        onClearLocation={() =>
          navigate(
            applyFilterChange(query, { lat: null, lng: null, sort: "match" }),
          )
        }
        geoLoading={geoLoading}
        geoMessage={geoMessage}
      />

      {/* Dataset real pun bisa memuat data fasilitas contoh (API 0.2.1). */}
      {(query.dataset !== "real" || items.some(hasSimulatedData)) && <SimulationNotice />}

      {compareIds.length > 0 && (
        <div
          role="region"
          aria-label="Perbandingan"
          className="flex flex-wrap items-center gap-3 rounded-md border border-brand bg-surface px-4 py-3"
        >
          <p className="text-[14px] font-semibold">
            {compareIds.length} rumah sakit dipilih (maks. 3)
          </p>
          {compareIds.length >= 2 ? (
            <Link
              href={`/bandingkan?ids=${compareIds.join(",")}`}
              className="inline-flex min-h-10 items-center rounded-md bg-brand px-4 font-semibold text-white"
            >
              Bandingkan
            </Link>
          ) : (
            <span className="text-muted">Pilih minimal 2.</span>
          )}
          <Button variant="tertiary" onClick={() => setCompareIds([])}>
            Kosongkan
          </Button>
        </div>
      )}

      <div aria-live="polite" className="text-[14px] font-semibold">
        {meta && !hospitals.error ? (
          <p className="tabular-nums">
            {meta.total} rumah sakit ditemukan
            <span className="font-normal text-muted">
              {" "}
              · cakupan terbatas pada data pilot
            </span>
          </p>
        ) : (
          <p className="sr-only">{hospitals.loading ? "Memuat hasil…" : ""}</p>
        )}
      </div>

      {!isDesktop && (
        <div
          role="group"
          aria-label="Tampilan hasil"
          className="grid grid-cols-2 gap-2"
        >
          <Button
            variant={mobileView === "list" ? "primary" : "secondary"}
            aria-pressed={mobileView === "list"}
            onClick={() => setMobileView("list")}
          >
            Daftar
          </Button>
          <Button
            variant={mobileView === "map" ? "primary" : "secondary"}
            aria-pressed={mobileView === "map"}
            onClick={() => setMobileView("map")}
          >
            Peta
          </Button>
        </div>
      )}

      <div className="grid gap-4 lg:grid-cols-2 lg:items-start">
        {(isDesktop || mobileView === "list") && (
          <div
            aria-busy={hospitals.loading}
            className={`flex min-w-0 flex-col gap-4 ${stale ? "opacity-60" : ""}`}
          >
            {firstLoad && <LoadingBlock label="Memuat hasil pencarian…" />}

            {hospitals.error && (
              <ErrorState
                error={hospitals.error}
                onRetry={hospitals.reload}
                title="Hasil pencarian tidak dapat dimuat"
              />
            )}

            {!hospitals.error && meta && items.length === 0 && (
              <EmptyState
                title={
                  meta.total === 0
                    ? "Tidak ada rumah sakit yang cocok"
                    : "Halaman ini tidak tersedia"
                }
                description={
                  meta.total === 0
                    ? "Coba kurangi layanan yang dipilih, ubah kata kunci, atau reset filter. Cakupan data pilot terbatas, sehingga rumah sakit di luar data ini tidak muncul."
                    : "Jumlah halaman berubah sejak Anda membuka tautan ini."
                }
                action={
                  meta.total === 0 ? (
                    <Button
                      onClick={() => {
                        setText("");
                        setLastSentQ("");
                        navigate(resetQuery());
                      }}
                    >
                      Reset filter
                    </Button>
                  ) : (
                    <Button onClick={() => navigate(applyPageChange(query, 1))}>
                      Ke halaman 1
                    </Button>
                  )
                }
              />
            )}

            {items.map((h) => (
              <HospitalCard
                key={h.id}
                hospital={h}
                selected={h.id === selectedId}
                onShowOnMap={showOnMap}
                onFilterRegion={filterRegion}
                compare={compareFor(h)}
              />
            ))}

            {meta && meta.total > 0 && (
              <Pagination
                page={meta.page}
                totalPages={meta.total_pages}
                total={meta.total}
                limit={meta.limit}
                disabled={hospitals.loading}
                onPageChange={(page) => navigate(applyPageChange(query, page))}
              />
            )}
          </div>
        )}

        {showMap && (
          <div className="flex min-w-0 flex-col gap-3 lg:sticky lg:top-24">
            {hospitals.error ? (
              <p className="rounded-md border border-line bg-surface p-4 text-muted">
                Peta tidak menampilkan marker karena hasil belum berhasil dimuat.
              </p>
            ) : (
              <HospitalMap
                markers={mappable.map((h) => ({
                  id: h.id,
                  lat: h.latitude,
                  lng: h.longitude,
                  label: h.name,
                }))}
                selectedId={selectedId}
                onSelect={selectFromMarker}
                userLocation={userLocation}
                omittedCount={items.length - mappable.length}
              />
            )}
            {!isDesktop && selectedHospital && (
              <HospitalCard
                hospital={selectedHospital}
                selected
                onShowOnMap={showOnMap}
              />
            )}
          </div>
        )}
      </div>
    </div>
  );
}
