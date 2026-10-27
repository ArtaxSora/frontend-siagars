"use client";

/**
 * Peta tile sederhana tanpa library (Web Mercator).
 * - Pan: seret / tombol panah; zoom: tombol +/− atau tombol keyboard + dan −.
 * - Marker adalah <button> yang dapat difokus; memilih marker memilih kartu.
 * - Jika tile gagal dimuat, marker tetap ada dan daftar tetap dapat dipakai.
 *
 * Tile provider: lihat .env.example. Atribusi wajib ditampilkan.
 */
import {
  useEffect,
  useEffectEvent,
  useRef,
  useState,
  type KeyboardEvent,
  type PointerEvent,
} from "react";
import {
  MAX_ZOOM,
  MIN_ZOOM,
  fitZoom,
  markerOffset,
  panCenter,
  visibleTiles,
  type LatLng,
} from "@/lib/geo/mercator";
import Link from "next/link";
import type { DataQualityLabel, MarkerMatch } from "@/lib/contracts/types";
import { MARKER_MATCH_LABEL } from "@/lib/contracts/labels";
import { OriginBadge } from "@/components/ui/badges";
import { DataQualityTag } from "@/components/ui/decision";
import {
  AlertIcon,
  CheckIcon,
  CrossIcon,
  PinIcon,
} from "@/components/ui/icons";

export interface MapMarker {
  id: string;
  lat: number;
  lng: number;
  label: string;
  /** Marker dari GET /hospitals/markers: dibedakan menurut kecocokan layanan. */
  info?: { match: MarkerMatch; quality: DataQualityLabel; simulated: boolean };
}

export interface MapView {
  center: LatLng;
  zoom: number;
  width: number;
  height: number;
}

/* Kelas ditulis utuh agar terdeteksi Tailwind. Warna selalu ditemani ikon. */
const MATCH_STYLE: Record<MarkerMatch, string> = {
  all: "bg-ok-fg",
  partial: "bg-warn-fg",
  none: "bg-faint",
};

export const MATCH_ICON = {
  all: CheckIcon,
  partial: AlertIcon,
  none: CrossIcon,
} as const;

const TILE_URL =
  process.env.NEXT_PUBLIC_TILE_URL ||
  "https://tile.openstreetmap.org/{z}/{x}/{y}.png";
const CUSTOM_ATTRIBUTION = process.env.NEXT_PUBLIC_TILE_ATTRIBUTION;

const KEY_PAN_PX = 80;
const INITIAL_SIZE = { w: 640, h: 420 };

function tileSrc(z: number, x: number, y: number): string {
  return TILE_URL.replace("{z}", String(z))
    .replace("{x}", String(x))
    .replace("{y}", String(y));
}

export default function TileMap({
  markers,
  selectedId,
  onSelect,
  userLocation = null,
  onViewChange,
}: {
  markers: MapMarker[];
  selectedId: string | null;
  onSelect: (id: string) => void;
  userLocation?: LatLng | null;
  /** Dipanggil setiap tampilan (pusat/zoom/ukuran) berubah. */
  onViewChange?: (view: MapView) => void;
}) {
  const containerRef = useRef<HTMLDivElement>(null);
  const drag = useRef<{ x: number; y: number } | null>(null);

  const [size, setSize] = useState(INITIAL_SIZE);
  const [view, setView] = useState<{ center: LatLng; zoom: number }>(() =>
    fitZoom(
      [
        ...markers.map((m) => ({ lat: m.lat, lng: m.lng })),
        ...(userLocation ? [userLocation] : []),
      ],
      INITIAL_SIZE.w,
      INITIAL_SIZE.h,
    ),
  );
  const [tileStats, setTileStats] = useState({ loaded: 0, failed: 0 });

  // Pusatkan peta ke marker yang dipilih dari daftar (penyesuaian state saat render).
  const [lastSelected, setLastSelected] = useState(selectedId);
  if (selectedId !== lastSelected) {
    setLastSelected(selectedId);
    const target = markers.find((m) => m.id === selectedId);
    if (target) {
      setView((v) => ({ ...v, center: { lat: target.lat, lng: target.lng } }));
    }
  }

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const observer = new ResizeObserver((entries) => {
      const rect = entries[0]?.contentRect;
      if (rect && rect.width > 0 && rect.height > 0) {
        setSize({ w: Math.round(rect.width), h: Math.round(rect.height) });
      }
    });
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  const reportView = useEffectEvent((v: MapView) => onViewChange?.(v));
  useEffect(() => {
    reportView({ center: view.center, zoom: view.zoom, width: size.w, height: size.h });
  }, [view.center, view.zoom, size.w, size.h]);

  const zoomBy = (delta: number) =>
    setView((v) => ({
      ...v,
      zoom: Math.max(MIN_ZOOM, Math.min(MAX_ZOOM, v.zoom + delta)),
    }));

  const panBy = (dx: number, dy: number) =>
    setView((v) => ({ ...v, center: panCenter(v.center, v.zoom, dx, dy) }));

  function onPointerDown(e: PointerEvent<HTMLDivElement>) {
    if ((e.target as HTMLElement).closest("button")) return;
    drag.current = { x: e.clientX, y: e.clientY };
    e.currentTarget.setPointerCapture(e.pointerId);
  }

  function onPointerMove(e: PointerEvent<HTMLDivElement>) {
    if (!drag.current) return;
    const dx = e.clientX - drag.current.x;
    const dy = e.clientY - drag.current.y;
    drag.current = { x: e.clientX, y: e.clientY };
    panBy(dx, dy);
  }

  function endDrag() {
    drag.current = null;
  }

  function onKeyDown(e: KeyboardEvent<HTMLDivElement>) {
    if (e.target !== e.currentTarget) return;
    switch (e.key) {
      case "ArrowLeft":
        panBy(KEY_PAN_PX, 0);
        break;
      case "ArrowRight":
        panBy(-KEY_PAN_PX, 0);
        break;
      case "ArrowUp":
        panBy(0, KEY_PAN_PX);
        break;
      case "ArrowDown":
        panBy(0, -KEY_PAN_PX);
        break;
      case "+":
      case "=":
        zoomBy(1);
        break;
      case "-":
        zoomBy(-1);
        break;
      default:
        return;
    }
    e.preventDefault();
  }

  const tiles = visibleTiles(view.center, view.zoom, size.w, size.h);
  const allTilesFailed = tileStats.failed > 0 && tileStats.loaded === 0;

  return (
    <div className="flex flex-col gap-2">
      <div
        ref={containerRef}
        role="group"
        tabIndex={0}
        aria-label="Peta lokasi rumah sakit pada halaman ini. Gunakan tombol panah untuk menggeser, plus dan minus untuk zoom."
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={endDrag}
        onPointerCancel={endDrag}
        onKeyDown={onKeyDown}
        className="relative h-[360px] cursor-grab touch-none select-none overflow-hidden rounded-md border border-line bg-well active:cursor-grabbing md:h-[520px]"
      >
        {tiles.map((t) => (
          // eslint-disable-next-line @next/next/no-img-element -- tile peta eksternal dinamis, bukan aset yang dioptimasi
          <img
            key={`${view.zoom}/${t.col}/${t.row}`}
            src={tileSrc(view.zoom, t.x, t.y)}
            alt=""
            draggable={false}
            width={256}
            height={256}
            referrerPolicy="strict-origin-when-cross-origin"
            onLoad={() => setTileStats((s) => ({ ...s, loaded: s.loaded + 1 }))}
            onError={() => setTileStats((s) => ({ ...s, failed: s.failed + 1 }))}
            style={{ position: "absolute", left: t.left, top: t.top, width: 256, height: 256 }}
          />
        ))}

        {markers.map((m) => {
          const pos = markerOffset(m, view.center, view.zoom, size.w, size.h);
          if (pos.left < -24 || pos.left > size.w + 24 || pos.top < -24 || pos.top > size.h + 48) {
            return null;
          }
          const selected = m.id === selectedId;
          const Icon = m.info ? MATCH_ICON[m.info.match] : PinIcon;
          return (
            <button
              key={m.id}
              type="button"
              aria-label={
                m.info ? `${m.label} — ${MARKER_MATCH_LABEL[m.info.match]}` : m.label
              }
              aria-pressed={selected}
              onClick={() => onSelect(m.id)}
              style={{ left: pos.left, top: pos.top, zIndex: selected ? 20 : 10 }}
              className={`absolute flex -translate-x-1/2 -translate-y-full items-center justify-center rounded-full border-2 border-white text-white shadow-level2 ${
                selected
                  ? "h-9 w-9 bg-brand-deep ring-2 ring-brand"
                  : m.info
                    ? `h-7 w-7 ${MATCH_STYLE[m.info.match]} ${m.info.simulated ? "outline-dashed outline-[1.5px] outline-sim-line" : ""}`
                    : "h-7 w-7 bg-trust hover:bg-trust-action"
              }`}
            >
              <Icon width={selected ? 18 : 14} height={selected ? 18 : 14} />
            </button>
          );
        })}

        {(() => {
          const m = markers.find((x) => x.id === selectedId && x.info);
          if (!m?.info) return null;
          const pos = markerOffset(m, view.center, view.zoom, size.w, size.h);
          const Icon = MATCH_ICON[m.info.match];
          return (
            <div
              role="dialog"
              aria-label={m.label}
              style={{
                left: Math.max(8, Math.min(size.w - 248, pos.left - 120)),
                top: Math.max(8, pos.top - 44 - 132),
              }}
              className="absolute z-30 flex w-60 flex-col gap-1.5 rounded-md border border-line bg-surface p-3 text-[12px] leading-4 shadow-level3"
            >
              <Link
                href={`/rumah-sakit/${encodeURIComponent(m.id)}`}
                className="text-[14px] font-semibold leading-5 text-trust underline"
              >
                {m.label}
              </Link>
              <span className="inline-flex items-center gap-1 text-ink">
                <Icon /> {MARKER_MATCH_LABEL[m.info.match]}
              </span>
              <span className="flex flex-wrap gap-1">
                <DataQualityTag label={m.info.quality} />
                {m.info.simulated && <OriginBadge origin="simulation" />}
              </span>
            </div>
          );
        })()}

        {userLocation && (
          <span
            role="img"
            aria-label="Lokasi Anda"
            style={markerStyle(userLocation, view, size)}
            className="absolute z-10 h-3.5 w-3.5 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-white bg-trust-action shadow-level2"
          />
        )}

        <div className="absolute left-2 top-2 z-30 flex flex-col gap-1">
          <button
            type="button"
            onClick={() => zoomBy(1)}
            aria-label="Perbesar peta"
            className="h-10 w-10 rounded-md border border-line-strong bg-surface text-[18px] font-semibold hover:bg-well"
          >
            +
          </button>
          <button
            type="button"
            onClick={() => zoomBy(-1)}
            aria-label="Perkecil peta"
            className="h-10 w-10 rounded-md border border-line-strong bg-surface text-[18px] font-semibold hover:bg-well"
          >
            −
          </button>
        </div>

        <p className="absolute bottom-0 right-0 z-30 bg-white/85 px-1.5 py-0.5 text-[11px] leading-4 text-muted">
          {CUSTOM_ATTRIBUTION ?? (
            <>
              ©{" "}
              <a
                href="https://www.openstreetmap.org/copyright"
                target="_blank"
                rel="noopener noreferrer"
                className="underline"
              >
                kontributor OpenStreetMap
              </a>
            </>
          )}
        </p>
      </div>

      {allTilesFailed && (
        <p role="status" className="text-[12px] text-bad-fg">
          Gambar peta dasar tidak dapat dimuat. Marker tetap ditampilkan; gunakan
          daftar rumah sakit untuk melanjutkan.
        </p>
      )}
    </div>
  );
}

function markerStyle(
  point: LatLng,
  view: { center: LatLng; zoom: number },
  size: { w: number; h: number },
) {
  return markerOffset(point, view.center, view.zoom, size.w, size.h);
}
