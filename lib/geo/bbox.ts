/**
 * Bounding box untuk GET /hospitals/markers (kontrak §7). Server menolak bbox
 * tidak valid atau lebih luas dari 2° × 2° (422), jadi FE memotongnya di
 * sekitar pusat tampilan sebelum meminta. Fungsi murni.
 */
import { project, unproject, type LatLng } from "./mercator.ts";

export interface BBox {
  minLng: number;
  minLat: number;
  maxLng: number;
  maxLat: number;
}

/** Lebar/tinggi maksimum yang diterima server, dalam derajat. */
export const MAX_BBOX_SPAN = 2;

const round5 = (n: number) => Math.round(n * 1e5) / 1e5;

export function isValidBBox(b: BBox): boolean {
  return (
    [b.minLng, b.minLat, b.maxLng, b.maxLat].every(Number.isFinite) &&
    b.minLng >= -180 &&
    b.maxLng <= 180 &&
    b.minLat >= -90 &&
    b.maxLat <= 90 &&
    b.minLng < b.maxLng &&
    b.minLat < b.maxLat &&
    b.maxLng - b.minLng <= MAX_BBOX_SPAN &&
    b.maxLat - b.minLat <= MAX_BBOX_SPAN
  );
}

/** Kotak tampilan peta (piksel) sebagai bbox derajat. */
export function viewportBBox(
  center: LatLng,
  zoom: number,
  width: number,
  height: number,
): BBox {
  const c = project(center, zoom);
  const nw = unproject({ x: c.x - width / 2, y: c.y - height / 2 }, zoom);
  const se = unproject({ x: c.x + width / 2, y: c.y + height / 2 }, zoom);
  return {
    minLng: Math.max(-180, Math.min(nw.lng, se.lng)),
    maxLng: Math.min(180, Math.max(nw.lng, se.lng)),
    minLat: Math.max(-90, se.lat),
    maxLat: Math.min(90, nw.lat),
  };
}

/**
 * Potong bbox agar tiap sisi ≤ 2°, berpusat di tengah bbox semula.
 * `clamped` = true bila sebagian tampilan tidak tercakup (UI meminta perbesar).
 */
export function clampBBox(b: BBox): { bbox: BBox; clamped: boolean } {
  const cx = (b.minLng + b.maxLng) / 2;
  const cy = (b.minLat + b.maxLat) / 2;
  const half = MAX_BBOX_SPAN / 2 - 1e-6;
  const wide = b.maxLng - b.minLng > MAX_BBOX_SPAN;
  const tall = b.maxLat - b.minLat > MAX_BBOX_SPAN;
  const bbox: BBox = {
    minLng: round5(wide ? cx - half : b.minLng),
    maxLng: round5(wide ? cx + half : b.maxLng),
    minLat: round5(tall ? cy - half : b.minLat),
    maxLat: round5(tall ? cy + half : b.maxLat),
  };
  return { bbox, clamped: wide || tall };
}

/** Parameter `bbox=minLng,minLat,maxLng,maxLat`. */
export function bboxParam(b: BBox): string {
  return [b.minLng, b.minLat, b.maxLng, b.maxLat].map(round5).join(",");
}
