/**
 * Matematika Web Mercator untuk peta tile sederhana (tanpa library).
 * Fungsi murni agar mudah diuji.
 */

export const TILE_SIZE = 256;
export const MIN_ZOOM = 2;
export const MAX_ZOOM = 18;
const MAX_LAT = 85.0511;

export interface LatLng {
  lat: number;
  lng: number;
}

export function clampLat(lat: number): number {
  return Math.max(-MAX_LAT, Math.min(MAX_LAT, lat));
}

export function wrapLng(lng: number): number {
  return ((((lng + 180) % 360) + 360) % 360) - 180;
}

/** Koordinat piksel global pada zoom tertentu. */
export function project(point: LatLng, zoom: number): { x: number; y: number } {
  const scale = TILE_SIZE * 2 ** zoom;
  const lat = clampLat(point.lat);
  const sin = Math.sin((lat * Math.PI) / 180);
  return {
    x: ((point.lng + 180) / 360) * scale,
    y: (0.5 - Math.log((1 + sin) / (1 - sin)) / (4 * Math.PI)) * scale,
  };
}

export function unproject(px: { x: number; y: number }, zoom: number): LatLng {
  const scale = TILE_SIZE * 2 ** zoom;
  const lng = (px.x / scale) * 360 - 180;
  const n = Math.PI - (2 * Math.PI * px.y) / scale;
  const lat = (180 / Math.PI) * Math.atan(Math.sinh(n));
  return { lat: clampLat(lat), lng: wrapLng(lng) };
}

/** Zoom terbesar yang memuat seluruh titik di dalam viewport (dengan padding). */
export function fitZoom(
  points: LatLng[],
  width: number,
  height: number,
  padding = 48,
): { center: LatLng; zoom: number } {
  if (points.length === 0) {
    // Pusat Indonesia, zoom nasional.
    return { center: { lat: -2.5, lng: 118 }, zoom: 4 };
  }
  if (points.length === 1) return { center: points[0], zoom: 13 };

  const lats = points.map((p) => p.lat);
  const lngs = points.map((p) => p.lng);
  const center: LatLng = {
    lat: (Math.min(...lats) + Math.max(...lats)) / 2,
    lng: (Math.min(...lngs) + Math.max(...lngs)) / 2,
  };
  const availW = Math.max(1, width - padding * 2);
  const availH = Math.max(1, height - padding * 2);

  for (let zoom = 15; zoom >= MIN_ZOOM; zoom--) {
    const projected = points.map((p) => project(p, zoom));
    const xs = projected.map((p) => p.x);
    const ys = projected.map((p) => p.y);
    if (
      Math.max(...xs) - Math.min(...xs) <= availW &&
      Math.max(...ys) - Math.min(...ys) <= availH
    ) {
      return { center, zoom };
    }
  }
  return { center, zoom: MIN_ZOOM };
}

export interface TileRef {
  x: number;
  y: number;
  /** Kolom/baris tanpa wrap; identitas stabil saat peta digeser. */
  col: number;
  row: number;
  /** Posisi kiri-atas tile relatif terhadap viewport, dalam piksel. */
  left: number;
  top: number;
}

/** Daftar tile yang menutupi viewport; tile di luar rentang Y dibuang, X di-wrap. */
export function visibleTiles(
  center: LatLng,
  zoom: number,
  width: number,
  height: number,
): TileRef[] {
  const c = project(center, zoom);
  const originX = c.x - width / 2;
  const originY = c.y - height / 2;
  const n = 2 ** zoom;
  const x0 = Math.floor(originX / TILE_SIZE);
  const x1 = Math.floor((originX + width) / TILE_SIZE);
  const y0 = Math.floor(originY / TILE_SIZE);
  const y1 = Math.floor((originY + height) / TILE_SIZE);

  const tiles: TileRef[] = [];
  for (let ty = y0; ty <= y1; ty++) {
    if (ty < 0 || ty >= n) continue;
    for (let tx = x0; tx <= x1; tx++) {
      tiles.push({
        x: ((tx % n) + n) % n,
        y: ty,
        col: tx,
        row: ty,
        left: Math.round(tx * TILE_SIZE - originX),
        top: Math.round(ty * TILE_SIZE - originY),
      });
    }
  }
  return tiles;
}

/** Posisi marker (px) relatif terhadap viewport. */
export function markerOffset(
  point: LatLng,
  center: LatLng,
  zoom: number,
  width: number,
  height: number,
): { left: number; top: number } {
  const p = project(point, zoom);
  const c = project(center, zoom);
  return { left: p.x - c.x + width / 2, top: p.y - c.y + height / 2 };
}

/** Geser pusat peta sebesar (dx, dy) piksel layar. */
export function panCenter(
  center: LatLng,
  zoom: number,
  dx: number,
  dy: number,
): LatLng {
  const c = project(center, zoom);
  return unproject({ x: c.x - dx, y: c.y - dy }, zoom);
}
