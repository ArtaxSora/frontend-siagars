import assert from "node:assert/strict";
import { describe, test } from "node:test";
import {
  bedRank,
  compareSummary,
  judgeCompare,
  pickWinners,
  statusRank,
} from "../../lib/hospitals/compare-winner.ts";
import { FACILITY_SERVICE_SLUGS } from "../../lib/contracts/labels.ts";
import {
  MAX_BBOX_SPAN,
  bboxParam,
  clampBBox,
  isValidBBox,
  viewportBBox,
} from "../../lib/geo/bbox.ts";
import { bed, makeHospital, service } from "./hospital-fixture.ts";

describe("compare-winner", () => {
  test("pickWinners: maksimum menang, seri semua ditandai, null tidak pernah", () => {
    assert.deepEqual(pickWinners([2, 1, 2]), [0, 2]);
    assert.deepEqual(pickWinners([null, 1, null]), [1]);
    assert.deepEqual(pickWinners([null, null]), []);
  });

  test("status: available > limited; unavailable & unknown tidak unggul", () => {
    assert.equal(statusRank("unknown"), null);
    assert.equal(statusRank("unavailable"), null);
    assert.equal(statusRank(undefined), null);
    assert.ok((statusRank("available") ?? 0) > (statusRank("limited") ?? 0));
  });

  test("bed: null dan 0 tidak unggul", () => {
    assert.equal(bedRank(null), null);
    assert.equal(bedRank(0), null);
    assert.equal(bedRank(4), 4);
  });

  const a = makeHospital({
    name: "RS A",
    facility_summary: {
      ...makeHospital().facility_summary,
      icu: "available",
      nicu: "limited",
      bpjs: true,
    },
    beds: [bed("icu", 5), bed("nicu", 0)],
    services: [service("igd-24h", "available"), service("icu", "available")],
    data_quality: { ...makeHospital().data_quality, freshness: "aging" },
  });
  const b = makeHospital({
    id: "00000000-0000-4000-8000-000000000002",
    name: "RS B",
    facility_summary: {
      ...makeHospital().facility_summary,
      icu: "available",
      nicu: "unknown",
      bpjs: null,
    },
    beds: [bed("icu", 2), bed("nicu", null)],
    services: [service("igd-24h", "unknown")],
    data_quality: { ...makeHospital().data_quality, freshness: "fresh" },
  });

  test("judgeCompare per baris", () => {
    const j = judgeCompare([a, b], FACILITY_SERVICE_SLUGS);
    assert.deepEqual(j.winners.bpjs, [0]);
    assert.deepEqual(j.winners["facility:icu"], [0, 1]);
    assert.deepEqual(j.winners["facility:nicu"], [0]);
    assert.deepEqual(j.winners["facility:picu"], []);
    assert.deepEqual(j.winners["bed:icu"], [0]);
    assert.deepEqual(j.winners["bed:nicu"], []);
    assert.deepEqual(j.winners["svc:igd-24h"], [0]);
    assert.equal(j.winners["svc:icu"], undefined, "slug fasilitas tidak dihitung dua kali");
    assert.deepEqual(j.winners.data, [1]);
    // bpjs + 4 fasilitas + 4 bed + 1 layanan + data
    assert.equal(j.judged, 11);
    assert.deepEqual(j.wins, [5, 2]);
  });

  test("ringkasan menyebut pemenang terbanyak; seri disebut semua", () => {
    const j = judgeCompare([a, b], FACILITY_SERVICE_SLUGS);
    assert.equal(compareSummary(["RS A", "RS B"], j), "RS A unggul di 5 dari 11 atribut.");
    assert.equal(
      compareSummary(["X", "Y", "Z"], { winners: {}, wins: [2, 2, 1], judged: 7 }),
      "X dan Y unggul di 2 dari 7 atribut.",
    );
    assert.equal(compareSummary(["X", "Y"], { winners: {}, wins: [0, 0], judged: 7 }), null);
  });
});

describe("bbox markers", () => {
  test("validasi bbox", () => {
    assert.ok(isValidBBox({ minLng: 106.6, minLat: -6.4, maxLng: 107.1, maxLat: -6.1 }));
    assert.ok(!isValidBBox({ minLng: 107, minLat: -6.4, maxLng: 106, maxLat: -6.1 }));
    assert.ok(!isValidBBox({ minLng: 104, minLat: -6.4, maxLng: 107.1, maxLat: -6.1 }));
    assert.ok(!isValidBBox({ minLng: Number.NaN, minLat: -6.4, maxLng: 107, maxLat: -6.1 }));
  });

  test("bbox terlalu luas dipotong ≤ 2° di sekitar pusat", () => {
    const { bbox, clamped } = clampBBox({ minLng: 100, minLat: -10, maxLng: 110, maxLat: 0 });
    assert.equal(clamped, true);
    assert.ok(isValidBBox(bbox));
    assert.ok(bbox.maxLng - bbox.minLng <= MAX_BBOX_SPAN);
    assert.ok(Math.abs((bbox.minLng + bbox.maxLng) / 2 - 105) < 1e-4);
    const small = { minLng: 106.6, minLat: -6.4, maxLng: 107.1, maxLat: -6.1 };
    assert.deepEqual(clampBBox(small), { bbox: small, clamped: false });
  });

  test("viewportBBox mengapit pusat & bboxParam berurutan minLng,minLat,maxLng,maxLat", () => {
    const b = viewportBBox({ lat: -6.2, lng: 106.85 }, 11, 640, 420);
    assert.ok(b.minLng < 106.85 && b.maxLng > 106.85);
    assert.ok(b.minLat < -6.2 && b.maxLat > -6.2);
    assert.ok(isValidBBox(b));
    assert.equal(
      bboxParam({ minLng: 106.123456, minLat: -6.4, maxLng: 107.1, maxLat: -6.1 }),
      "106.12346,-6.4,107.1,-6.1",
    );
  });
});
