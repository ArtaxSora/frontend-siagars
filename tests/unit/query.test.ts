import assert from "node:assert/strict";
import { describe, test } from "node:test";
import {
  DEFAULT_LIMIT,
  EMPTY_QUERY,
  MAX_LIMIT,
  activeFilterCount,
  applyFilterChange,
  applyPageChange,
  parseHospitalQuery,
  serializeHospitalQuery,
  buildApiQueryString,
} from "../../lib/hospitals/query.ts";

const parse = (qs: string) => parseHospitalQuery(new URLSearchParams(qs));

describe("parseHospitalQuery", () => {
  test("nilai kosong menghasilkan query default", () => {
    assert.deepEqual(parse(""), EMPTY_QUERY);
  });

  test("services dipisah koma, dinormalkan, tanpa duplikat, urut alfabet", () => {
    const q = parse("services=NICU, icu ,icu,Igd-24h");
    assert.deepEqual(q.services, ["icu", "igd-24h", "nicu"]);
  });

  test("slug layanan tidak valid dibuang", () => {
    const q = parse("services=icu,<script>,--x,,nicu");
    assert.deepEqual(q.services, ["icu", "nicu"]);
  });

  test("page/limit tidak valid kembali ke default; limit dibatasi", () => {
    assert.equal(parse("page=0").page, 1);
    assert.equal(parse("page=abc").page, 1);
    assert.equal(parse("page=-3").page, 1);
    assert.equal(parse("page=4").page, 4);
    assert.equal(parse("limit=0").limit, DEFAULT_LIMIT);
    assert.equal(parse("limit=9999").limit, MAX_LIMIT);
  });

  test("sort=distance diabaikan tanpa koordinat", () => {
    assert.equal(parse("sort=distance").sort, "name");
    assert.equal(parse("sort=distance&lat=-6.2&lng=106.8").sort, "distance");
  });

  test("koordinat setengah atau di luar rentang dibuang", () => {
    assert.equal(parse("lat=-6.2").lat, null);
    assert.equal(parse("lat=-6.2").lng, null);
    assert.equal(parse("lat=999&lng=106").lat, null);
  });

  test("bpjs hanya true yang dihitung", () => {
    assert.equal(parse("bpjs=true").bpjs, true);
    assert.equal(parse("bpjs=1").bpjs, false);
    assert.equal(parse("bpjs=false").bpjs, false);
  });

  test("kode wilayah harus numerik", () => {
    assert.equal(parse("province_code=31").province_code, "31");
    assert.equal(parse("province_code=abc").province_code, "");
    assert.equal(parse("city_code=3173").city_code, "3173");
  });
});

describe("serializeHospitalQuery", () => {
  test("query default menghasilkan string kosong", () => {
    assert.equal(serializeHospitalQuery(EMPTY_QUERY), "");
  });

  test("deterministik: urutan layanan tidak memengaruhi hasil", () => {
    const a = serializeHospitalQuery({ ...EMPTY_QUERY, services: ["nicu", "icu"] });
    const b = serializeHospitalQuery({ ...EMPTY_QUERY, services: ["icu", "nicu"] });
    assert.equal(a, b);
    assert.equal(a, "services=icu%2Cnicu");
  });

  test("round-trip parse -> serialize -> parse", () => {
    const qs =
      "q=surabaya&province_code=35&services=icu%2Cnicu&bpjs=true&page=2&limit=20&sort=distance&lat=-7.258&lng=112.752";
    const first = parse(qs);
    const again = parse(serializeHospitalQuery(first));
    assert.deepEqual(again, first);
  });

  test("koordinat dibulatkan 3 desimal agar tidak menyimpan lokasi presisi", () => {
    const out = serializeHospitalQuery({
      ...EMPTY_QUERY,
      lat: -7.2574719,
      lng: 112.7520883,
    });
    assert.match(out, /lat=-7\.257/);
    assert.match(out, /lng=112\.752/);
  });
});

describe("perubahan filter", () => {
  test("mengubah filter mengembalikan halaman ke 1", () => {
    const onPage3 = { ...EMPTY_QUERY, page: 3 };
    assert.equal(applyFilterChange(onPage3, { bpjs: true }).page, 1);
    assert.equal(applyFilterChange(onPage3, { q: "x" }).page, 1);
    assert.equal(applyFilterChange(onPage3, { services: ["icu"] }).page, 1);
  });

  test("applyPageChange hanya mengubah halaman dan tidak turun di bawah 1", () => {
    const base = { ...EMPTY_QUERY, bpjs: true };
    assert.deepEqual(applyPageChange(base, 4), { ...base, page: 4 });
    assert.equal(applyPageChange(base, 0).page, 1);
  });

  test("activeFilterCount menghitung filter, bukan page/sort", () => {
    assert.equal(activeFilterCount(EMPTY_QUERY), 0);
    assert.equal(
      activeFilterCount({
        ...EMPTY_QUERY,
        q: "a",
        bpjs: true,
        services: ["icu", "nicu"],
        page: 5,
      }),
      4,
    );
  });
});

describe("kontrak API nyata", () => {
  test("q diawali $ dibuang", () => {
    assert.equal(parse("q=%24where").q, "where");
  });

  test("dataset default simulation; nilai tak dikenal kembali ke default", () => {
    assert.equal(parse("").dataset, "simulation");
    assert.equal(parse("dataset=real").dataset, "real");
    assert.equal(parse("dataset=hack").dataset, "simulation");
  });

  test("has_available_beds hanya true yang dihitung", () => {
    assert.equal(parse("has_available_beds=true").has_available_beds, true);
    assert.equal(parse("has_available_beds=1").has_available_beds, false);
  });

  test("buildApiQueryString selalu eksplisit & tanpa param kosong", () => {
    const p = new URLSearchParams(buildApiQueryString(EMPTY_QUERY));
    assert.equal(p.get("dataset"), "simulation");
    assert.equal(p.get("page"), "1");
    assert.equal(p.get("limit"), "20");
    assert.equal(p.get("sort"), "name");
    assert.equal(p.has("q"), false);
    assert.equal(p.has("services"), false);
    assert.equal(p.has("bpjs"), false);
  });
});
