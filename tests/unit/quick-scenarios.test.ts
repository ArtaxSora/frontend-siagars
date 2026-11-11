import assert from "node:assert/strict";
import { describe, test } from "node:test";
import {
  URGENT_SCENARIOS,
  isScenarioMatched,
} from "../../lib/recommendations/scenarios.ts";
import {
  hasLocation,
  maxReachableStep,
  parseWizardState,
  serializeWizardState,
  type WizardState,
} from "../../lib/recommendations/wizard.ts";

describe("URGENT_SCENARIOS", () => {
  test("memiliki 5 skenario darurat dengan konfigurasi lengkap", () => {
    assert.equal(URGENT_SCENARIOS.length, 5);

    const ids = URGENT_SCENARIOS.map((s) => s.id);
    assert.ok(ids.includes("nicu-bpjs"));
    assert.ok(ids.includes("icu-bpjs"));
    assert.ok(ids.includes("igd-24h"));
    assert.ok(ids.includes("picu-bpjs"));
    assert.ok(ids.includes("rawat-inap-bpjs"));

    for (const sc of URGENT_SCENARIOS) {
      assert.ok(sc.title.length > 0);
      assert.ok(sc.badge.length > 0);
      assert.ok(sc.description.length > 0);
      assert.ok(sc.services.length >= 1 && sc.services.length <= 6);
      assert.ok(sc.bpjs === "required" || sc.bpjs === "any");
      assert.ok(sc.dataset === "real" || sc.dataset === "all");
    }
  });

  test("isScenarioMatched mencocokkan state dan skenario dengan benar", () => {
    const nicuScenario = URGENT_SCENARIOS.find((s) => s.id === "nicu-bpjs")!;

    const matchingState: WizardState = {
      step: 2,
      services: ["nicu"],
      lat: null,
      lng: null,
      radius_km: 20,
      province_code: "",
      city_code: "",
      bpjs: "required",
      dataset: "real",
    };
    assert.equal(isScenarioMatched(matchingState, nicuScenario), true);

    // Beda layanan
    assert.equal(
      isScenarioMatched({ ...matchingState, services: ["icu"] }, nicuScenario),
      false,
    );

    // Beda BPJS
    assert.equal(
      isScenarioMatched({ ...matchingState, bpjs: "any" }, nicuScenario),
      false,
    );

    // Beda dataset
    assert.equal(
      isScenarioMatched({ ...matchingState, dataset: "all" }, nicuScenario),
      false,
    );
  });

  test("skenario 1-klik mengisi langkah 1 & 3, pengguna hanya butuh isi lokasi", () => {
    const icuScenario = URGENT_SCENARIOS.find((s) => s.id === "icu-bpjs")!;

    // Kondisi awal tanpa lokasi -> langsung ke langkah 2
    const stateWithoutLocation: WizardState = {
      step: 1,
      services: icuScenario.services,
      lat: null,
      lng: null,
      radius_km: 20,
      province_code: "",
      city_code: "",
      bpjs: icuScenario.bpjs,
      dataset: icuScenario.dataset,
    };

    assert.equal(hasLocation(stateWithoutLocation), false);
    assert.equal(maxReachableStep(stateWithoutLocation), 2);

    // Kondisi bila lokasi sudah ada sebelumnya -> langsung sah ke 'hasil'
    const stateWithLocation: WizardState = {
      ...stateWithoutLocation,
      province_code: "32",
    };
    assert.equal(hasLocation(stateWithLocation), true);
    assert.equal(maxReachableStep(stateWithLocation), "hasil");
  });

  test("URL state round-trip untuk skenario cepat", () => {
    const rawatInap = URGENT_SCENARIOS.find((s) => s.id === "rawat-inap-bpjs")!;
    const state: WizardState = {
      step: 2,
      services: rawatInap.services,
      lat: null,
      lng: null,
      radius_km: 20,
      province_code: "",
      city_code: "",
      bpjs: rawatInap.bpjs,
      dataset: rawatInap.dataset,
    };

    const qs = serializeWizardState(state);
    const parsed = parseWizardState(new URLSearchParams(qs));

    assert.deepEqual(parsed.services, rawatInap.services);
    assert.equal(parsed.bpjs, rawatInap.bpjs);
    assert.equal(parsed.dataset, rawatInap.dataset);
    assert.equal(parsed.step, 2);
  });
});
