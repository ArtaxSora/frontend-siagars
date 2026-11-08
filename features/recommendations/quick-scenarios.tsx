"use client";

import { useState } from "react";
import type { WizardState } from "@/lib/recommendations/wizard";
import {
  URGENT_SCENARIOS,
  isScenarioMatched,
  type UrgentScenario,
} from "@/lib/recommendations/scenarios";
import { AlertIcon, CheckIcon, SparklesIcon } from "@/components/ui/icons";

export { URGENT_SCENARIOS, isScenarioMatched, type UrgentScenario };

export function QuickScenarios({
  state,
  onSelect,
  onReset,
}: {
  state: WizardState;
  onSelect: (scenario: UrgentScenario) => void;
  onReset?: () => void;
}) {
  const [announcement, setAnnouncement] = useState<string | null>(null);
  const activeScenario = URGENT_SCENARIOS.find((s) =>
    isScenarioMatched(state, s),
  );

  const handleSelect = (scenario: UrgentScenario) => {
    setAnnouncement(
      `Skenario ${scenario.title} diterapkan. Langkah 1 dan 3 telah terisi otomatis. Silakan tentukan lokasi pasien.`,
    );
    onSelect(scenario);
  };

  return (
    <section
      aria-labelledby="quick-scenarios-heading"
      className="flex flex-col gap-3 rounded-md border border-brand/30 bg-brand-tint/30 p-4 md:p-5"
    >
      <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-2">
          <span
            aria-hidden="true"
            className="flex h-7 w-7 items-center justify-center rounded-full bg-brand text-white"
          >
            <SparklesIcon className="h-4 w-4" />
          </span>
          <h2
            id="quick-scenarios-heading"
            className="text-[16px] font-bold text-ink sm:text-[18px]"
          >
            Skenario Cepat (1-Klik)
          </h2>
          <span className="rounded bg-brand/10 px-2 py-0.5 text-[11px] font-bold text-brand-deep">
            Darurat / Stres Tinggi
          </span>
        </div>
        {activeScenario && onReset && (
          <button
            type="button"
            onClick={onReset}
            className="inline-flex min-h-11 items-center self-start text-[12px] font-semibold text-trust hover:underline sm:self-auto"
          >
            Atur manual / reset
          </button>
        )}
      </div>

      <p className="text-[13px] leading-5 text-muted">
        Dalam kondisi mendesak, lewati langkah pemilihan layanan dan preferensi
        dengan sekali tekan. Anda hanya perlu menentukan lokasi pasien di
        Langkah 2:
      </p>

      {/* Accessible live region for screen readers */}
      <div aria-live="polite" className="sr-only">
        {announcement}
      </div>

      <div
        role="group"
        aria-label="Pilihan skenario cepat gawat darurat"
        className="grid grid-cols-1 gap-2.5 sm:grid-cols-2 lg:grid-cols-3"
      >
        {URGENT_SCENARIOS.map((sc) => {
          const isActive = activeScenario?.id === sc.id;
          return (
            <button
              key={sc.id}
              type="button"
              onClick={() => handleSelect(sc)}
              className={`flex min-h-[52px] flex-col justify-between rounded-lg border p-3 text-left transition-all focus-visible:outline focus-visible:outline-2 focus-visible:outline-brand focus-visible:outline-offset-2 ${
                isActive
                  ? "border-brand bg-surface font-semibold shadow-sm ring-2 ring-brand/30"
                  : "border-line bg-surface hover:border-brand/70 hover:bg-well"
              }`}
            >
              <div className="flex items-start justify-between gap-2">
                <span className="text-[14px] font-bold text-ink">
                  {sc.title}
                </span>
                <span
                  className={`shrink-0 rounded px-1.5 py-0.5 text-[10px] font-bold ${
                    isActive
                      ? "bg-brand text-white"
                      : "bg-well text-muted border border-line"
                  }`}
                >
                  {sc.badge}
                </span>
              </div>
              <p className="mt-1 text-[12px] leading-4 text-muted">
                {sc.description}
              </p>
              <div className="mt-2 flex items-center justify-between text-[11px] font-semibold">
                <span className="text-brand-deep">
                  {isActive ? "✓ Sedang aktif" : "Pilih skenario ini →"}
                </span>
                {isActive && (
                  <span className="inline-flex items-center gap-1 text-ok-fg">
                    <CheckIcon className="h-3.5 w-3.5" /> Terisi
                  </span>
                )}
              </div>
            </button>
          );
        })}
      </div>

      {activeScenario && (
        <div
          role="status"
          className="flex items-center gap-2 rounded-md border border-ok-line bg-ok-bg p-2.5 text-[12px] font-medium text-ok-fg"
        >
          <AlertIcon className="h-4 w-4 shrink-0" />
          <span>
            Skenario <strong>{activeScenario.title}</strong> aktif. Layanan dan
            preferensi sudah terisi otomatis. Lanjutkan dengan memilih lokasi di
            bawah.
          </span>
        </div>
      )}
    </section>
  );
}
