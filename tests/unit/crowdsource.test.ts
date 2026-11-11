import assert from "node:assert/strict";
import { describe, test } from "node:test";
import {
  getCrowdsourceReports,
  submitCrowdsourceReport,
  updateReportStatus,
} from "../../lib/crowdsource/store.ts";

describe("crowdsource store", () => {
  test("mengembalikan seed data awal bila storage kosong", () => {
    const list = getCrowdsourceReports();
    assert.ok(list.length >= 3);
    assert.equal(list[0].id, "LAP-20261108-001");
  });

  test("submitCrowdsourceReport menambahkan laporan baru dengan status pending_review", () => {
    const report = submitCrowdsourceReport({
      hospital_id: "rs-test-1",
      hospital_name: "RSUD Coba",
      city_name: "Kota Bekasi",
      province_name: "Jawa Barat",
      category: "beds",
      detail_field: "ICU",
      current_claim: "Tersedia 2 bed",
      source_proof: "Nakes",
      notes: "Kondisi terkini",
    });

    assert.ok(report.id.startsWith("LAP-"));
    assert.equal(report.status, "pending_review");
    assert.equal(report.hospital_name, "RSUD Coba");

    const updatedList = getCrowdsourceReports();
    assert.equal(updatedList[0].id, report.id);
  });

  test("updateReportStatus memverifikasi laporan", () => {
    const list = getCrowdsourceReports();
    const target = list[0];
    const res = updateReportStatus(target.id, "verified", "Operator Unit", "Data valid");

    assert.ok(res !== null);
    assert.equal(res?.status, "verified");
    assert.equal(res?.reviewed_by, "Operator Unit");
    assert.equal(res?.review_note, "Data valid");
  });
});
