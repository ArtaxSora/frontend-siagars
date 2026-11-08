import assert from "node:assert/strict";
import { describe, test } from "node:test";
import { parseAssistantQuery } from "../../lib/ai/nlp-parser.ts";

describe("parseAssistantQuery - Asisten AI NLP Parser", () => {
  test("mendeteksi kebutuhan NICU, Bekasi, dan BPJS", () => {
    const q = parseAssistantQuery("Cari RS di Bekasi yang punya NICU dan terima BPJS");
    assert.deepEqual(q.services, ["nicu"]);
    assert.equal(q.bpjs, "required");
    assert.equal(q.city_code, "3275");
    assert.equal(q.province_code, "32");
    assert.equal(q.isEmergency, false);
    assert.match(q.explanation, /NICU/);
    assert.match(q.explanation, /Bekasi/);
  });

  test("mendeteksi ICU di Jakarta Selatan", () => {
    const q = parseAssistantQuery("RS dengan ICU kosong di Jakarta Selatan");
    assert.deepEqual(q.services, ["icu"]);
    assert.equal(q.bpjs, "any");
    assert.equal(q.city_code, "3174");
    assert.equal(q.province_code, "31");
    assert.equal(q.isEmergency, false);
  });

  test("mendeteksi red flag gawat darurat (pendarahan hebat & tidak sadar)", () => {
    const q = parseAssistantQuery("Tolong pasien kecelakaan tidak sadar dan pendarahan hebat di jalan");
    assert.equal(q.isEmergency, true);
    assert.ok(q.emergencyKeywords.length >= 2);
    // Layanan otomatis diarahkan ke IGD 24 jam saat darurat
    assert.ok(q.services.includes("igd-24h"));
  });

  test("mendeteksi BPJS dinegasikan (tanpa bpjs)", () => {
    const q = parseAssistantQuery("Cari kamar inap di Depok tanpa BPJS");
    assert.deepEqual(q.services, ["rawat-inap"]);
    assert.equal(q.bpjs, "any");
    assert.equal(q.city_code, "3276");
  });

  test("fallback layanan default saat pengguna hanya menyebut kota", () => {
    const q = parseAssistantQuery("Rumah sakit terdekat di Bogor");
    assert.equal(q.isDefaultService, true);
    assert.deepEqual(q.services, ["igd-24h", "rawat-inap"]);
    assert.equal(q.city_code, "3271");
  });

  test("mendeteksi dataset simulasi", () => {
    const q = parseAssistantQuery("Cari RS di Bandung sertakan simulasi fiktif");
    assert.equal(q.dataset, "all");
    assert.equal(q.city_code, "3273");
  });
});
