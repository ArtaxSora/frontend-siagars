import { test } from "node:test";
import assert from "node:assert/strict";
import { searchHrefFromRecommendation } from "../../lib/hospitals/from-recommendation.ts";
import { EMPTY_WIZARD } from "../../lib/recommendations/wizard.ts";

test("recommendation links preserve services, region, dataset and BPJS in search format", () => {
  const url = new URL(searchHrefFromRecommendation({ ...EMPTY_WIZARD, services: ["nicu"], bpjs: "required", province_code: "32", city_code: "3216", dataset: "all" }), "https://example.test");
  assert.equal(url.pathname, "/rumah-sakit");
  for (const [key, value] of Object.entries({ services: "nicu", bpjs: "true", province_code: "32", city_code: "3216", dataset: "all", sort: "match" })) assert.equal(url.searchParams.get(key), value);
  assert.equal(url.searchParams.has("step"), false);
});

test("coordinate search uses distance and retains rounded coordinates", () => {
  const url = new URL(searchHrefFromRecommendation({ ...EMPTY_WIZARD, lat: -6.12345, lng: 106.12345 }), "https://example.test");
  assert.equal(url.searchParams.get("sort"), "distance");
  assert.equal(url.searchParams.get("lat"), "-6.123");
  assert.equal(url.searchParams.get("lng"), "106.123");
  assert.equal(url.searchParams.has("bpjs"), false);
});
