"use client";

import dynamic from "next/dynamic";
import { Component, useEffect, useRef, useState, type ReactNode } from "react";
import type { MapMarker, MapView } from "@/features/hospitals/map/tile-map";
import type { Dataset } from "@/lib/contracts/types";
import { MARKER_MATCH_LABEL } from "@/lib/contracts/labels";
import { listMarkers } from "@/lib/api/endpoints";
import { isAbortError } from "@/lib/api/client";
import { clampBBox, isValidBBox, viewportBBox } from "@/lib/geo/bbox";
import type { LatLng } from "@/lib/geo/mercator";
import { AlertIcon, CheckIcon, CrossIcon } from "@/components/ui/icons";

// Peta dimuat hanya di client; tidak masuk jalur SSR.
const TileMap = dynamic(() => import("@/features/hospitals/map/tile-map"), {
  ssr: false,
  loading: () => (
    <div
      role="status"
      className="flex h-[360px] items-center justify-center rounded-md border border-line bg-well text-muted md:h-[520px]"
    >
      Memuat peta…
    </div>
  ),
});

/** Jeda setelah pan/zoom selesai sebelum memuat marker area (PRD §4.5). */
const MARKER_DEBOUNCE_MS = 400;

class MapBoundary extends Component<
  { children: ReactNode },
  { failed: boolean }
> {
  state = { failed: false };

  static getDerivedStateFromError() {
    return { failed: true };
  }

  render() {
    if (this.state.failed) {
      return (
        <div
          role="alert"
          className="rounded-md border border-bad-line bg-bad-bg p-4 text-bad-fg"
        >
          Peta tidak dapat ditampilkan. Daftar rumah sakit di samping tetap dapat
          dipakai sepenuhnya.
        </div>
      );
    }
    return this.props.children;
  }
}

export interface AreaFilters {
  services: string[];
  bpjs: boolean;
  dataset: Dataset;
}

type AreaState =
  | { kind: "idle" }
  | { kind: "ok"; markers: MapMarker[]; truncated: boolean }
  /** Tampilan lebih luas dari 2° × 2°: server menolaknya, jadi tidak diminta. */
  | { kind: "too_wide" }
  | { kind: "error" };

/**
 * Marker semua RS di area tampilan dari GET /hospitals/markers. Permintaan
 * lama dibatalkan; gagal -> peta kembali ke marker halaman hasil saja.
 */
function useAreaMarkers(filters: AreaFilters | undefined) {
  const [state, setState] = useState<AreaState>({ kind: "idle" });
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const controller = useRef<AbortController | null>(null);
  const filterKey = filters
    ? `${filters.services.join(",")}|${filters.bpjs}|${filters.dataset}`
    : "";
  const lastView = useRef<MapView | null>(null);

  useEffect(
    () => () => {
      if (timer.current) clearTimeout(timer.current);
      controller.current?.abort();
    },
    [],
  );

  function load(view: MapView) {
    if (!filters) return;
    const { bbox, clamped } = clampBBox(
      viewportBBox(view.center, view.zoom, view.width, view.height),
    );
    controller.current?.abort();
    if (clamped) {
      setState({ kind: "too_wide" });
      return;
    }
    if (!isValidBBox(bbox)) return;
    const ac = new AbortController();
    controller.current = ac;
    listMarkers(bbox, filters, ac.signal)
      .then((res) => {
        if (ac.signal.aborted) return;
        setState({
          kind: "ok",
          truncated: Boolean(res.meta?.truncated),
          markers: res.data.map((m) => ({
            id: m.id,
            lat: m.lat,
            lng: m.lng,
            label: m.name,
            info: {
              match: m.match,
              quality: m.data_quality_label,
              simulated: m.has_simulated_data,
            },
          })),
        });
      })
      .catch((err: unknown) => {
        if (ac.signal.aborted || isAbortError(err)) return;
        setState({ kind: "error" });
      });
  }

  function onViewChange(view: MapView) {
    lastView.current = view;
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(() => load(view), MARKER_DEBOUNCE_MS);
  }

  // Filter berubah: muat ulang area yang sedang terlihat.
  useEffect(() => {
    if (lastView.current) onViewChange(lastView.current);
    // eslint-disable-next-line react-hooks/exhaustive-deps -- hanya saat filter berubah
  }, [filterKey]);

  return { state, onViewChange };
}

function MatchLegend() {
  return (
    <ul className="flex flex-wrap gap-x-4 gap-y-1 text-[12px] leading-[18px] text-muted">
      <li className="inline-flex items-center gap-1">
        <span className="inline-flex h-4 w-4 items-center justify-center rounded-full bg-ok-fg text-white">
          <CheckIcon width={10} height={10} />
        </span>
        {MARKER_MATCH_LABEL.all}
      </li>
      <li className="inline-flex items-center gap-1">
        <span className="inline-flex h-4 w-4 items-center justify-center rounded-full bg-warn-fg text-white">
          <AlertIcon width={10} height={10} />
        </span>
        Sebagian cocok
      </li>
      <li className="inline-flex items-center gap-1">
        <span className="inline-flex h-4 w-4 items-center justify-center rounded-full bg-faint text-white">
          <CrossIcon width={10} height={10} />
        </span>
        Tidak cocok
      </li>
    </ul>
  );
}

export function HospitalMap({
  markers,
  selectedId,
  onSelect,
  userLocation,
  omittedCount,
  area,
}: {
  /** Marker RS di halaman hasil aktif (dipakai untuk posisi awal peta). */
  markers: MapMarker[];
  selectedId: string | null;
  onSelect: (id: string) => void;
  userLocation: LatLng | null;
  /** Jumlah RS di halaman ini tanpa koordinat (tidak tampil di peta). */
  omittedCount: number;
  /** Bila ada, peta memuat semua RS di area tampilan dengan filter ini. */
  area?: AreaFilters;
}) {
  const { state, onViewChange } = useAreaMarkers(area);
  // key mengatur ulang tampilan peta saat kumpulan hasil berganti (halaman/filter baru).
  const signature = markers.map((m) => m.id).join("|");

  // Marker halaman hasil menang (tanpa info) agar terhubung ke kartu; sisanya dari area.
  const pageIds = new Set(markers.map((m) => m.id));
  const shown =
    state.kind === "ok"
      ? [...state.markers.filter((m) => !pageIds.has(m.id)), ...markers]
      : markers;

  return (
    <div className="flex flex-col gap-2">
      <MapBoundary key={signature}>
        <TileMap
          key={signature}
          markers={shown}
          selectedId={selectedId}
          onSelect={onSelect}
          userLocation={userLocation}
          onViewChange={area ? onViewChange : undefined}
        />
      </MapBoundary>
      {state.kind === "ok" ? (
        <>
          <MatchLegend />
          <p className="text-[12px] leading-[18px] text-muted" aria-live="polite">
            Peta menampilkan {state.markers.length} rumah sakit di area ini; penanda
            biru adalah hasil di halaman daftar.
            {state.truncated && (
              <strong className="text-warn-fg"> Perbesar peta untuk melihat semua RS.</strong>
            )}
          </p>
        </>
      ) : (
        <p className="text-[12px] leading-[18px] text-muted">
          {state.kind === "error" && "Marker area tidak dapat dimuat. "}
          Peta menampilkan {markers.length} rumah sakit pada halaman hasil ini
          {omittedCount > 0 ? `; ${omittedCount} lainnya tidak memiliki koordinat` : ""}.
          {state.kind === "too_wide" && (
            <strong className="text-warn-fg"> Perbesar peta untuk melihat semua RS di area tersebut.</strong>
          )}
        </p>
      )}
    </div>
  );
}
