import assert from "node:assert/strict";
import { describe, test } from "node:test";
import {
  fitZoom,
  markerOffset,
  panCenter,
  project,
  unproject,
  visibleTiles,
} from "../../lib/geo/mercator.ts";
import {
  parseCompareIds,
  safeSourceUrl,
  telHref,
  uniqueOrigins,
  worstFreshness,
} from "../../lib/hospitals/summary.ts";
import type { Provenance } from "../../lib/contracts/types.ts";

const near = (a: number, b: number, eps = 1e-6) =>
  assert.ok(Math.abs(a - b) < eps, `${a} ≉ ${b}`);

describe("mercator", () => {
  test("project/unproject round-trip", () => {
    const p = { lat: -7.2575, lng: 112.7521 };
    const back = unproject(project(p, 12), 12);
    near(back.lat, p.lat);
    near(back.lng, p.lng);
  });

  test("pusat peta berada di tengah viewport", () => {
    const c = { lat: -6.2, lng: 106.8 };
    const off = markerOffset(c, c, 10, 640, 420);
    near(off.left, 320);
    near(off.top, 210);
  });

  test("fitZoom: satu titik zoom 13, tanpa titik pusat Indonesia", () => {
    assert.equal(fitZoom([{ lat: 1, lng: 100 }], 640, 420).zoom, 13);
    assert.equal(fitZoom([], 640, 420).zoom, 4);
  });

  test("fitZoom: semua titik muat di dalam viewport", () => {
    const pts = [
      { lat: -6.2, lng: 106.8 },
      { lat: -7.25, lng: 112.75 },
    ];
    const { center, zoom } = fitZoom(pts, 640, 420);
    for (const p of pts) {
      const o = markerOffset(p, center, zoom, 640, 420);
      assert.ok(o.left >= 0 && o.left <= 640, `x ${o.left}`);
      assert.ok(o.top >= 0 && o.top <= 420, `y ${o.top}`);
    }
  });

  test("visibleTiles menutupi seluruh viewport", () => {
    const tiles = visibleTiles({ lat: -6.2, lng: 106.8 }, 10, 640, 420);
    assert.ok(tiles.length > 0);
    assert.ok(Math.min(...tiles.map((t) => t.left)) <= 0);
    assert.ok(Math.max(...tiles.map((t) => t.left + 256)) >= 640);
    assert.ok(Math.min(...tiles.map((t) => t.top)) <= 0);
    assert.ok(Math.max(...tiles.map((t) => t.top + 256)) >= 420);
    for (const t of tiles) assert.ok(t.x >= 0 && t.x < 2 ** 10);
  });

  test("panCenter: menggeser konten ke kanan memindahkan pusat ke barat", () => {
    const c = { lat: 0, lng: 100 };
    const moved = panCenter(c, 8, 100, 0);
    assert.ok(moved.lng < c.lng);
  });
});

function source(partial: Partial<Provenance>): Provenance {
  return {
    data_origin: "simulation",
    source_url: null,
    source_updated_at: null,
    synced_at: null,
    verified_at: null,
    freshness: "fresh",
    ...partial,
  };
}

describe("ringkasan sumber", () => {
  test("worstFreshness mengambil yang paling meragukan; unknown paling buruk", () => {
    assert.equal(
      worstFreshness([source({ freshness: "fresh" }), source({ freshness: "aging" })]),
      "aging",
    );
    assert.equal(
      worstFreshness([source({ freshness: "stale" }), source({ freshness: "aging" })]),
      "stale",
    );
    assert.equal(
      worstFreshness([source({ freshness: "stale" }), source({ freshness: "unknown" })]),
      "unknown",
    );
    assert.equal(worstFreshness([]), "unknown");
  });

  test("uniqueOrigins tanpa duplikat", () => {
    assert.deepEqual(
      uniqueOrigins([
        source({ data_origin: "simulation" }),
        source({ data_origin: "curated" }),
        source({ data_origin: "simulation" }),
      ]),
      ["simulation", "curated"],
    );
  });

  test("telHref membersihkan nomor; null bila tidak ada", () => {
    assert.equal(telHref("(021) 555-0101"), "tel:0215550101");
    assert.equal(telHref(null), null);
    assert.equal(telHref("12"), null);
  });
});

describe("tautan & ID", () => {
  test("safeSourceUrl hanya http/https", () => {
    assert.equal(safeSourceUrl("https://contoh.id/x"), "https://contoh.id/x");
    assert.equal(safeSourceUrl("javascript:alert(1)"), null);
    assert.equal(safeSourceUrl(null), null);
  });

  test("parseCompareIds: 2–3 UUID unik", () => {
    const a = "123e4567-e89b-12d3-a456-426614174000";
    const b = "123e4567-e89b-12d3-a456-426614174001";
    assert.deepEqual(parseCompareIds(`${a},${b}`), [a, b]);
    assert.equal(parseCompareIds(a), null);
    assert.equal(parseCompareIds(`${a},${a}`), null);
    assert.equal(parseCompareIds(`${a},bukan-uuid`), null);
    assert.equal(parseCompareIds(null), null);
  });
});
