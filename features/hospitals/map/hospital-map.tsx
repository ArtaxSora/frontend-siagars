"use client";

import dynamic from "next/dynamic";
import { Component, type ReactNode } from "react";
import type { MapMarker } from "@/features/hospitals/map/tile-map";
import type { LatLng } from "@/lib/geo/mercator";

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

export function HospitalMap({
  markers,
  selectedId,
  onSelect,
  userLocation,
  omittedCount,
}: {
  markers: MapMarker[];
  selectedId: string | null;
  onSelect: (id: string) => void;
  userLocation: LatLng | null;
  /** Jumlah RS di halaman ini tanpa koordinat (tidak tampil di peta). */
  omittedCount: number;
}) {
  // key mengatur ulang tampilan peta saat kumpulan marker berganti (halaman/filter baru).
  const signature = markers.map((m) => m.id).join("|");
  return (
    <div className="flex flex-col gap-2">
      <MapBoundary key={signature}>
        <TileMap
          key={signature}
          markers={markers}
          selectedId={selectedId}
          onSelect={onSelect}
          userLocation={userLocation}
        />
      </MapBoundary>
      <p className="text-[12px] leading-[18px] text-muted">
        Peta hanya menampilkan {markers.length} rumah sakit pada halaman hasil ini
        {omittedCount > 0 ? `; ${omittedCount} lainnya tidak memiliki koordinat` : ""}
        . Gunakan pagination untuk melihat hasil lain — tidak semua titik dimuat sekaligus.
      </p>
    </div>
  );
}
