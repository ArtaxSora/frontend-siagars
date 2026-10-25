import assert from "node:assert/strict";
import { describe, test } from "node:test";
import { describeBeds, formatDistanceKm } from "../../lib/format/beds.ts";
import { formatRelativeAge, formatWib } from "../../lib/format/time.ts";
import {
  REFERRAL_STATUS_LABEL,
  historyEntryLabel,
  isRedirect,
} from "../../lib/contracts/labels.ts";
import { REFERRAL_STATUSES } from "../../lib/contracts/types.ts";

describe("describeBeds — 0 berbeda dari null", () => {
  test("available null = belum diketahui (bukan nol)", () => {
    const d = describeBeds(null, 10);
    assert.equal(d.tone, "unknown");
    assert.equal(d.headline, "Belum diketahui");
    assert.doesNotMatch(d.headline, /0/);
  });

  test("available 0 = nol menurut sumber", () => {
    const d = describeBeds(0, 8);
    assert.equal(d.tone, "zero");
    assert.equal(d.headline, "0 tersedia");
    assert.match(d.detail, /nol menurut sumber/);
  });

  test("available positif", () => {
    const d = describeBeds(3, 12);
    assert.equal(d.tone, "some");
    assert.equal(d.headline, "3 tersedia");
    assert.equal(d.detail, "dari 12 tempat tidur");
  });

  test("total null tidak diubah menjadi 0", () => {
    assert.equal(describeBeds(5, null).detail, "total belum diketahui");
    assert.equal(describeBeds(0, null).tone, "zero");
    assert.equal(describeBeds(null, null).detail, "");
  });
});

describe("formatWib", () => {
  test("UTC -> WIB (+7) dengan label", () => {
    assert.equal(formatWib("2026-10-23T14:16:00Z"), "23 Okt 2026 21.16 WIB");
  });

  test("melewati tengah malam ke hari berikutnya", () => {
    assert.equal(formatWib("2026-12-31T18:05:00Z"), "1 Jan 2027 01.05 WIB");
  });

  test("input kosong/tidak valid -> null (bukan 'Invalid Date')", () => {
    assert.equal(formatWib(null), null);
    assert.equal(formatWib(undefined), null);
    assert.equal(formatWib(""), null);
    assert.equal(formatWib("bukan-tanggal"), null);
  });
});

describe("formatRelativeAge", () => {
  const now = Date.parse("2026-10-23T12:00:00Z");
  test("satuan menit, jam, hari", () => {
    assert.equal(formatRelativeAge("2026-10-23T11:59:30Z", now), "baru saja");
    assert.equal(formatRelativeAge("2026-10-23T11:15:00Z", now), "45 menit lalu");
    assert.equal(formatRelativeAge("2026-10-23T06:00:00Z", now), "6 jam lalu");
    assert.equal(formatRelativeAge("2026-10-20T12:00:00Z", now), "3 hari lalu");
  });
  test("null bila tidak ada waktu", () => {
    assert.equal(formatRelativeAge(null, now), null);
  });
});

describe("formatDistanceKm", () => {
  test("garis lurus, koma desimal, tanpa ETA", () => {
    assert.equal(formatDistanceKm(3.24), "± 3,2 km (garis lurus)");
    assert.doesNotMatch(formatDistanceKm(3.24) ?? "", /menit|jam/);
  });
  test("null/NaN -> null", () => {
    assert.equal(formatDistanceKm(null), null);
    assert.equal(formatDistanceKm(Number.NaN), null);
  });
});

describe("label status rujukan", () => {
  test("setiap status kontrak punya label Indonesia", () => {
    for (const s of REFERRAL_STATUSES) {
      assert.ok(REFERRAL_STATUS_LABEL[s], `label untuk ${s}`);
    }
  });

  test("'dialihkan' adalah event, bukan status ke-7", () => {
    assert.equal(REFERRAL_STATUSES.length, 6);
    assert.ok(!(REFERRAL_STATUSES as readonly string[]).includes("redirected"));
    const entry = {
      from_status: "confirmed" as const,
      to_status: "searching" as const,
      public_note: "Alasan",
      created_at: "2026-10-23T10:00:00Z",
    };
    const label = historyEntryLabel(entry);
    assert.match(label, /Dialihkan/);
    assert.match(label, /Mencari rumah sakit/);
    assert.equal(isRedirect("confirmed", "searching"), true);
    assert.equal(isRedirect("verified", "searching"), false);
    assert.doesNotMatch(
      historyEntryLabel({ ...entry, from_status: "verified" }),
      /Dialihkan/,
    );
  });
});
