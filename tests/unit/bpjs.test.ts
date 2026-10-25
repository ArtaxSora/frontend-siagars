import assert from "node:assert/strict";
import { describe, test } from "node:test";
import {
  normalizeName,
  normalizeNik,
  toBpjsRequest,
  validateBpjsForm,
} from "../../lib/bpjs/validate.ts";

const TODAY = "2026-10-25";
const valid = { nik: "3171010101900001", name: "Budi Santoso", birth_date: "1990-01-01" };

describe("validasi cek BPJS", () => {
  test("data lengkap dan benar lolos", () => {
    assert.deepEqual(validateBpjsForm(valid, TODAY), {});
  });

  test("NIK: wajib, angka saja, tepat 16 digit; spasi/tanda hubung dibuang", () => {
    assert.equal(normalizeNik("3171 0101-0190 0001"), "3171010101900001");
    assert.deepEqual(validateBpjsForm({ ...valid, nik: "3171 0101 0190 0001" }, TODAY), {});
    assert.ok(validateBpjsForm({ ...valid, nik: "" }, TODAY).nik);
    assert.ok(validateBpjsForm({ ...valid, nik: "31710101019000" }, TODAY).nik);
    assert.ok(validateBpjsForm({ ...valid, nik: "31710101019000011" }, TODAY).nik);
    assert.ok(validateBpjsForm({ ...valid, nik: "3171O10101900001" }, TODAY).nik);
  });

  test("nama: wajib, huruf (termasuk aksen) dan tanda baca umum", () => {
    assert.equal(normalizeName("  Siti   Nur'aini  "), "Siti Nur'aini");
    assert.deepEqual(validateBpjsForm({ ...valid, name: "Ni Made Ayu-Dewi" }, TODAY), {});
    assert.deepEqual(validateBpjsForm({ ...valid, name: "M. Tauriq" }, TODAY), {});
    assert.deepEqual(validateBpjsForm({ ...valid, name: "José" }, TODAY), {});
    assert.ok(validateBpjsForm({ ...valid, name: "   " }, TODAY).name);
    assert.ok(validateBpjsForm({ ...valid, name: "Budi123" }, TODAY).name);
    assert.ok(validateBpjsForm({ ...valid, name: "<script>" }, TODAY).name);
    assert.ok(validateBpjsForm({ ...valid, name: "a".repeat(101) }, TODAY).name);
  });

  test("tanggal lahir: wajib, valid, tidak di masa depan", () => {
    assert.deepEqual(validateBpjsForm({ ...valid, birth_date: TODAY }, TODAY), {});
    assert.ok(validateBpjsForm({ ...valid, birth_date: "" }, TODAY).birth_date);
    assert.ok(validateBpjsForm({ ...valid, birth_date: "2026-10-26" }, TODAY).birth_date);
    assert.ok(validateBpjsForm({ ...valid, birth_date: "1990-02-30" }, TODAY).birth_date);
    assert.ok(validateBpjsForm({ ...valid, birth_date: "1899-12-31" }, TODAY).birth_date);
    assert.ok(validateBpjsForm({ ...valid, birth_date: "01-01-1990" }, TODAY).birth_date);
  });

  test("body yang dikirim sudah dinormalkan", () => {
    assert.deepEqual(
      toBpjsRequest({ nik: "3171-0101 0190 0001", name: " Budi  Santoso ", birth_date: "1990-01-01" }),
      valid,
    );
  });
});
