import assert from "node:assert/strict";
import { describe, test } from "node:test";
import {
  aggregateInsightsCoverage,
  aggregateInsightsFreshness,
  aggregateInsightsServiceGaps,
  aggregateInsightsSummary,
  buildBpjsChecksQuery,
  buildInsightsQuery,
  describeHospitalMetadata,
} from "../../lib/insights/aggregate.ts";
import { makeHospital, service } from "./hospital-fixture.ts";

describe("query builder v0.5.0", () => {
  test("buildInsightsQuery: dataset default real & hanya kode wilayah tanpa titik", () => {
    assert.equal(buildInsightsQuery(), "dataset=real");
    assert.equal(
      buildInsightsQuery({ province_code: "31", dataset: "all", service: "NICU" }),
      "dataset=all&province_code=31&service=nicu",
    );
    assert.equal(
      buildInsightsQuery({ province_code: "31.71" }),
      "dataset=real",
      "kode wilayah bertitik diabaikan",
    );
  });

  test("buildBpjsChecksQuery: paginasi aman & filter result", () => {
    assert.equal(buildBpjsChecksQuery(), "page=1&limit=20");
    assert.equal(
      buildBpjsChecksQuery({ page: 3, limit: 15, result: "found" }),
      "page=3&limit=15&result=found",
    );
    assert.equal(
      buildBpjsChecksQuery({ page: 0, limit: 999, result: "" }),
      "page=1&limit=20",
    );
  });
});

describe("agregasi cadangan wawasan data (FE-20)", () => {
  const rsBekasiKurasi = makeHospital({
    id: "00000000-0000-4000-8000-000000000010",
    name: "RSUD Bekasi",
    city_code: "3275",
    city_name: "Kota Bekasi",
    data_origin: "curated",
    bpjs: true,
    facility_class: { code: "B", name: "Kelas B" },
    facility_summary: {
      ...makeHospital().facility_summary,
      nicu: "available",
      bpjs: true,
      data_origin: "curated",
    },
    data_quality: {
      score: 88,
      label: "baik",
      completeness: 0.9,
      freshness: "fresh",
      primary_origin: "curated",
    },
    services: [{ ...service("nicu", "available"), data_origin: "curated" }],
  });

  const rsBekasiSandbox = makeHospital({
    id: "00000000-0000-4000-8000-000000000011",
    name: "RS Mitra Bekasi",
    city_code: "3275",
    city_name: "Kota Bekasi",
    data_origin: "satusehat_sandbox",
    bpjs: null,
    facility_class: { code: "C", name: null },
    facility_summary: {
      ...makeHospital().facility_summary,
      nicu: "unavailable",
      bpjs: null,
      data_origin: "simulation",
    },
    data_quality: {
      score: 52,
      label: "cukup",
      completeness: 0.6,
      freshness: "aging",
      primary_origin: "satusehat_sandbox",
    },
    services: [service("nicu", "unavailable")],
  });

  const rsDepokGap = makeHospital({
    id: "00000000-0000-4000-8000-000000000012",
    name: "RS Depok",
    city_code: "3276",
    city_name: "Kota Depok",
    data_origin: "satusehat_sandbox",
    bpjs: false,
    facility_class: null,
    facility_summary: {
      ...makeHospital().facility_summary,
      nicu: "unknown",
      bpjs: false,
      data_origin: null,
    },
    data_quality: {
      score: 35,
      label: "terbatas",
      completeness: 0.4,
      freshness: "stale",
      primary_origin: "satusehat_sandbox",
    },
    services: [],
  });

  const sample = [rsBekasiKurasi, rsBekasiSandbox, rsDepokGap];

  test("aggregateInsightsSummary menghitung total, kota, kurasi, simulasi, fresh, dan BPJS", () => {
    assert.deepEqual(aggregateInsightsSummary([]), {
      hospital_count: 0,
      city_count: 0,
      curated_count: 0,
      simulated_facility_count: 0,
      fresh_ratio: 0,
      with_known_bpjs_ratio: 0,
    });

    const summary = aggregateInsightsSummary(sample);
    assert.equal(summary.hospital_count, 3);
    assert.equal(summary.city_count, 2);
    assert.equal(summary.curated_count, 1);
    assert.equal(summary.simulated_facility_count, 1);
    assert.ok(Math.abs(summary.fresh_ratio - 1 / 3) < 1e-6);
    assert.ok(Math.abs(summary.with_known_bpjs_ratio - 2 / 3) < 1e-6);
  });

  test("aggregateInsightsCoverage mengelompokkan per kota & kelas", () => {
    const cov = aggregateInsightsCoverage(sample);
    assert.equal(cov.length, 2);
    assert.equal(cov[0].city_name, "Kota Bekasi");
    assert.equal(cov[0].hospital_count, 2);
    assert.equal(cov[0].curated_count, 1);
    assert.deepEqual(cov[0].by_class, { A: 0, B: 1, C: 1, D: 0, unknown: 0 });
    assert.equal(cov[1].city_name, "Kota Depok");
    assert.deepEqual(cov[1].by_class, { A: 0, B: 0, C: 0, D: 0, unknown: 1 });
  });

  test("aggregateInsightsServiceGaps: gap = available + limited == 0", () => {
    const gaps = aggregateInsightsServiceGaps(sample, "nicu");
    const depok = gaps.find((g) => g.city_code === "3276");
    const bekasi = gaps.find((g) => g.city_code === "3275");
    assert.ok(depok);
    assert.equal(depok.gap, true);
    assert.equal(depok.unknown, 1);
    assert.ok(bekasi);
    assert.equal(bekasi.gap, false);
    assert.equal(bekasi.available, 1);
    assert.equal(bekasi.unavailable, 1);
  });

  test("aggregateInsightsFreshness mengelompokkan per asal data", () => {
    const fresh = aggregateInsightsFreshness(sample);
    const curated = fresh.find((f) => f.data_origin === "curated");
    const sandbox = fresh.find((f) => f.data_origin === "satusehat_sandbox");
    assert.deepEqual(curated, {
      data_origin: "curated",
      fresh: 1,
      aging: 0,
      stale: 0,
      unknown: 0,
    });
    assert.deepEqual(sandbox, {
      data_origin: "satusehat_sandbox",
      fresh: 0,
      aging: 1,
      stale: 1,
      unknown: 0,
    });
  });

  test("describeHospitalMetadata menyusun judul dan deskripsi OG yang jujur", () => {
    const meta = describeHospitalMetadata(rsBekasiKurasi);
    assert.equal(meta.title, "RSUD Bekasi (Kota Bekasi)");
    assert.ok(meta.description.includes("Menerima BPJS"));
    assert.ok(meta.description.includes("NICU: tersedia"));
    assert.ok(meta.description.includes("Data baik (88/100)"));

    const metaUnk = describeHospitalMetadata(rsBekasiSandbox);
    assert.ok(metaUnk.description.includes("Status BPJS belum diketahui"));
  });
});
