import assert from "node:assert/strict";
import { describe, test } from "node:test";
import {
  EMPTY_WIZARD,
  buildRecommendationApiQuery,
  maxReachableStep,
  parseWizardState,
  roundCoord,
  serializeWizardState,
  stepForField,
} from "../../lib/recommendations/wizard.ts";
import {
  excludedSummary,
  formatRatio,
  joinOr,
  routeHref,
  unknownLabel,
} from "../../lib/recommendations/format.ts";

const parse = (qs: string) => parseWizardState(new URLSearchParams(qs));

describe("parseWizardState", () => {
  test("URL kosong = langkah 1 dengan nilai bawaan", () => {
    assert.deepEqual(parse(""), EMPTY_WIZARD);
  });

  test("layanan dinormalkan, unik, urut, maks 6", () => {
    const s = parse("services=NICU,icu,icu,<x>,a,b,c,d,e");
    assert.deepEqual(s.services, ["a", "b", "c", "d", "e", "icu"]);
  });

  test("langkah yang belum boleh dibuka dikembalikan ke langkah terjauh yang sah", () => {
    assert.equal(parse("step=3").step, 1);
    assert.equal(parse("step=hasil&services=nicu").step, 2);
    assert.equal(parse("step=2&services=nicu").step, 2);
    assert.equal(parse("step=hasil&services=nicu&province_code=32").step, "hasil");
    assert.equal(parse("step=9&services=nicu&province_code=32").step, 1);
  });

  test("koordinat berpasangan, dibulatkan 3 desimal, menang atas kode wilayah", () => {
    const s = parse("services=nicu&lat=-6.23812345&lng=106.97561&province_code=32");
    assert.equal(s.lat, -6.238);
    assert.equal(s.lng, 106.976);
    assert.equal(s.province_code, "");
    const lone = parse("services=nicu&lat=-6.2");
    assert.equal(lone.lat, null);
    assert.equal(lone.lng, null);
  });

  test("radius hanya 5/10/20/50, selain itu 20", () => {
    assert.equal(parse("radius_km=10").radius_km, 10);
    assert.equal(parse("radius_km=15").radius_km, 20);
    assert.equal(parse("radius_km=abc").radius_km, 20);
  });

  test("kode wilayah bertitik ditolak (API 0.3.1); kota harus milik provinsinya", () => {
    assert.equal(parse("province_code=31.71").province_code, "");
    assert.equal(parse("province_code=32&city_code=3275").city_code, "3275");
    assert.equal(parse("province_code=31&city_code=3275").city_code, "");
    assert.equal(parse("city_code=3275").city_code, "");
  });

  test("bpjs & dataset hanya nilai yang dikenal", () => {
    assert.equal(parse("bpjs=required").bpjs, "required");
    assert.equal(parse("bpjs=true").bpjs, "any");
    assert.equal(parse("dataset=all").dataset, "all");
    assert.equal(parse("dataset=simulation").dataset, "real");
  });
});

describe("serialize & API query", () => {
  test("serialize -> parse bolak-balik sama", () => {
    const qs =
      "step=hasil&services=icu%2Cnicu&lat=-6.238&lng=106.976&radius_km=10&bpjs=required&dataset=all";
    const s = parse(qs);
    assert.equal(serializeWizardState(s), qs);
    assert.deepEqual(parse(serializeWizardState(s)), s);
  });

  test("nilai bawaan tidak ditulis ke URL", () => {
    assert.equal(serializeWizardState(EMPTY_WIZARD), "");
    assert.equal(
      serializeWizardState({ ...EMPTY_WIZARD, step: 2, services: ["nicu"] }),
      "step=2&services=nicu",
    );
  });

  test("API query selalu eksplisit dan memilih satu jenis lokasi", () => {
    const gps = parse("services=nicu&lat=-6.2&lng=106.9");
    assert.equal(
      buildRecommendationApiQuery(gps),
      "services=nicu&lat=-6.2&lng=106.9&radius_km=20&bpjs=any&dataset=real&limit=10",
    );
    const region = parse("services=icu,nicu&province_code=32&city_code=3275&bpjs=required");
    assert.equal(
      buildRecommendationApiQuery(region),
      "services=icu%2Cnicu&province_code=32&city_code=3275&bpjs=required&dataset=real&limit=10",
    );
  });

  test("langkah terjauh mengikuti isian", () => {
    assert.equal(maxReachableStep(EMPTY_WIZARD), 1);
    assert.equal(maxReachableStep({ ...EMPTY_WIZARD, services: ["icu"] }), 2);
    assert.equal(
      maxReachableStep({ ...EMPTY_WIZARD, services: ["icu"], province_code: "31" }),
      "hasil",
    );
  });

  test("galat 422 per field kembali ke langkah terkait", () => {
    assert.equal(stepForField("services"), 1);
    assert.equal(stepForField("lat"), 2);
    assert.equal(stepForField("city_code"), 2);
    assert.equal(stepForField("bpjs"), 3);
  });

  test("roundCoord 3 desimal", () => {
    assert.equal(roundCoord(-6.2384999), -6.238);
    assert.equal(roundCoord(106.9765), 106.977);
  });
});

describe("format rekomendasi", () => {
  test("joinOr", () => {
    assert.equal(joinOr([]), "");
    assert.equal(joinOr(["NICU"]), "NICU");
    assert.equal(joinOr(["ICU", "NICU"]), "ICU atau NICU");
    assert.equal(joinOr(["ICU", "NICU", "PICU"]), "ICU, NICU, atau PICU");
  });

  test("unknownLabel untuk layanan, bed, BPJS, dan kunci asing", () => {
    const names = { "igd-24h": "IGD 24 Jam", nicu: "NICU" };
    assert.equal(unknownLabel("service_nicu", names), "Status layanan NICU");
    assert.equal(unknownLabel("service_igd-24h", names), "Status layanan IGD 24 Jam");
    assert.equal(unknownLabel("service_igd_24h", names), "Status layanan IGD 24 Jam");
    assert.equal(unknownLabel("bed_general"), "Tempat tidur Rawat inap umum");
    assert.equal(unknownLabel("bpjs"), "Penerimaan BPJS");
    assert.equal(unknownLabel("lainnya"), "lainnya");
  });

  test("excludedSummary: satu kalimat per alasan, urutan tetap, nol diabaikan", () => {
    assert.deepEqual(
      excludedSummary({ bpjs_false: 1, service_unavailable: 3 }, ["NICU"]),
      [
        "3 RS tidak ditampilkan karena NICU tercatat tidak tersedia.",
        "1 RS tidak ditampilkan karena tercatat tidak menerima BPJS.",
      ],
    );
    assert.deepEqual(excludedSummary({}, ["NICU"]), []);
    assert.deepEqual(excludedSummary({ service_unavailable: 2 }, []), [
      "2 RS tidak ditampilkan karena layanan yang dipilih tercatat tidak tersedia.",
    ]);
  });

  test("formatRatio & routeHref", () => {
    assert.equal(formatRatio(0.8), "80%");
    assert.equal(formatRatio(1.4), "100%");
    assert.equal(routeHref(null, 106.9), null);
    assert.equal(
      routeHref(-6.2, 106.9),
      "https://www.google.com/maps/dir/?api=1&destination=-6.2,106.9",
    );
  });
});
