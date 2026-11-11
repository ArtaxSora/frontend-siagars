import type { BpjsPreference } from "../contracts/types.ts";
import type { WizardDataset, WizardState } from "./wizard.ts";

export interface UrgentScenario {
  id: string;
  title: string;
  badge: string;
  description: string;
  services: string[];
  bpjs: BpjsPreference;
  dataset: WizardDataset;
}

export const URGENT_SCENARIOS: readonly UrgentScenario[] = [
  {
    id: "nicu-bpjs",
    title: "Darurat Bayi (NICU + BPJS)",
    badge: "Kritis Bayi",
    description: "Layanan NICU & BPJS aktif langsung terpilih",
    services: ["nicu"],
    bpjs: "required",
    dataset: "real",
  },
  {
    id: "icu-bpjs",
    title: "Butuh ICU Segera + BPJS",
    badge: "Intensif Dewasa",
    description: "Layanan ICU intensif & wajib terima BPJS",
    services: ["icu"],
    bpjs: "required",
    dataset: "real",
  },
  {
    id: "igd-24h",
    title: "IGD 24 Jam Terdekat",
    badge: "Gawat Darurat",
    description: "Instalasi Gawat Darurat siap 24 jam",
    services: ["igd-24h"],
    bpjs: "any",
    dataset: "real",
  },
  {
    id: "picu-bpjs",
    title: "Anak Kritis (PICU + BPJS)",
    badge: "Kritis Anak",
    description: "Layanan PICU anak & wajib terima BPJS",
    services: ["picu"],
    bpjs: "required",
    dataset: "real",
  },
  {
    id: "rawat-inap-bpjs",
    title: "Rawat Inap Umum + BPJS",
    badge: "Kamar Inap",
    description: "Kamar rawat inap & wajib terima BPJS",
    services: ["rawat-inap"],
    bpjs: "required",
    dataset: "real",
  },
] as const;

export function isScenarioMatched(
  state: WizardState,
  scenario: UrgentScenario,
): boolean {
  if (state.services.length !== scenario.services.length) return false;
  const matchServices = scenario.services.every((s) =>
    state.services.includes(s),
  );
  if (!matchServices) return false;
  if (state.bpjs !== scenario.bpjs) return false;
  if (state.dataset !== scenario.dataset) return false;
  return true;
}
