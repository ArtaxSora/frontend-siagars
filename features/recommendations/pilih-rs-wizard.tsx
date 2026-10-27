"use client";

import { useEffect, useRef, useState, type FormEvent, type ReactNode } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { listRegions, listServices } from "@/lib/api/endpoints";
import { useApiResource } from "@/lib/hooks/use-api-resource";
import { RADIUS_OPTIONS } from "@/lib/contracts/types";
import {
  hasCoords,
  hasLocation,
  parseWizardState,
  roundCoord,
  serializeWizardState,
  type WizardState,
  type WizardStep,
} from "@/lib/recommendations/wizard";
import { RecommendationResults } from "@/features/recommendations/recommendation-results";
import { Button } from "@/components/ui/button";
import { WizardStepper } from "@/components/ui/decision";
import { Field, inputClasses } from "@/components/ui/field";
import { PinIcon } from "@/components/ui/icons";
import { ToggleChip } from "@/components/ui/toggle-chip";
import { ErrorState, LoadingBlock } from "@/components/ui/states";

const STEP_LABELS = ["Layanan", "Lokasi", "Preferensi"] as const;

function stepPosition(step: WizardStep): number {
  return step === "hasil" ? STEP_LABELS.length : step - 1;
}

function StepPanel({
  title,
  description,
  children,
  onSubmit,
  actions,
  focusOnMount,
}: {
  focusOnMount: boolean;
  title: string;
  description: string;
  children: ReactNode;
  onSubmit: () => void;
  actions: ReactNode;
}) {
  const headingRef = useRef<HTMLHeadingElement>(null);
  // Setelah pindah langkah, fokus ke judul agar pembaca layar mengumumkan langkah
  // baru. Tidak saat halaman pertama dibuka (fokus tetap di awal halaman).
  useEffect(() => {
    if (focusOnMount) headingRef.current?.focus();
  }, [focusOnMount]);

  function submit(e: FormEvent) {
    e.preventDefault();
    onSubmit();
  }

  return (
    <form
      onSubmit={submit}
      noValidate
      className="flex flex-col gap-5 rounded-md border border-line bg-surface p-4 md:p-6"
    >
      <div className="flex flex-col gap-1">
        <h2 ref={headingRef} tabIndex={-1} className="text-[20px] font-bold leading-7">
          {title}
        </h2>
        <p className="text-muted">{description}</p>
      </div>
      {children}
      <div className="flex flex-wrap-reverse items-center gap-3">{actions}</div>
    </form>
  );
}

/**
 * Asisten Pilih RS (FE-10): 3 langkah → hasil. Semua isian di URL; pindah
 * langkah = entri riwayat baru (tombol kembali peramban = langkah sebelumnya),
 * perubahan isian dalam satu langkah mengganti entri yang sama.
 */
export function PilihRsWizard() {
  const router = useRouter();
  const pathname = usePathname();
  const state = parseWizardState(useSearchParams());
  const [initialStep] = useState(state.step);
  const moved = state.step !== initialStep;

  const services = useApiResource("services", (signal) => listServices(signal));
  const regions = useApiResource("regions", (signal) => listRegions(signal));
  const serviceNames = Object.fromEntries(
    (services.data?.data ?? []).map((s) => [s.slug, s.name]),
  );

  function go(next: WizardState, mode: "push" | "replace") {
    const qs = serializeWizardState(next);
    const url = qs ? `${pathname}?${qs}` : pathname;
    if (mode === "push") router.push(url, { scroll: true });
    else router.replace(url, { scroll: false });
  }
  const update = (patch: Partial<WizardState>) => go({ ...state, ...patch }, "replace");
  const toStep = (step: WizardStep) => go({ ...state, step }, "push");

  /* ---- Lokasi: hanya setelah klik pengguna ---- */
  const [geoLoading, setGeoLoading] = useState(false);
  const [geoMessage, setGeoMessage] = useState<string | null>(null);

  function requestLocation() {
    if (!("geolocation" in navigator)) {
      setGeoMessage("Peramban ini tidak mendukung lokasi. Pilih provinsi dan kota di bawah.");
      return;
    }
    setGeoLoading(true);
    setGeoMessage(null);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setGeoLoading(false);
        update({
          lat: roundCoord(pos.coords.latitude),
          lng: roundCoord(pos.coords.longitude),
          province_code: "",
          city_code: "",
        });
      },
      () => {
        setGeoLoading(false);
        setGeoMessage(
          "Lokasi tidak dapat digunakan (izin ditolak atau tidak tersedia). Pilih provinsi dan kota sebagai gantinya.",
        );
      },
      { enableHighAccuracy: false, timeout: 10_000, maximumAge: 60_000 },
    );
  }

  const provinces = regions.data?.data ?? [];
  const province = provinces.find((p) => p.code === state.province_code) ?? null;

  return (
    <div className="flex flex-col gap-5">
      <WizardStepper steps={STEP_LABELS} current={stepPosition(state.step)} />

      {state.step === 1 && (
        <StepPanel
          key="step-1"
          focusOnMount={moved}
          title="Layanan apa yang dibutuhkan?"
          description="Pilih satu atau lebih. Rumah sakit yang tercatat tidak menyediakan layanan ini tidak akan direkomendasikan."
          onSubmit={() => state.services.length > 0 && toStep(2)}
          actions={
            <Button type="submit" disabled={state.services.length === 0}>
              Lanjut
            </Button>
          }
        >
          {services.error ? (
            <ErrorState error={services.error} onRetry={services.reload} title="Daftar layanan tidak dapat dimuat" />
          ) : services.data === null ? (
            <LoadingBlock label="Memuat daftar layanan…" rows={1} />
          ) : (
            <fieldset className="flex flex-col gap-2">
              <legend className="mb-2 text-[13px] font-semibold">Layanan</legend>
              <div className="flex flex-wrap gap-2">
                {services.data.data.map((s) => (
                  <ToggleChip
                    key={s.slug}
                    checked={state.services.includes(s.slug)}
                    onChange={(on) =>
                      update({
                        services: on
                          ? [...state.services, s.slug].sort()
                          : state.services.filter((x) => x !== s.slug),
                      })
                    }
                  >
                    {s.name}
                  </ToggleChip>
                ))}
              </div>
              <p className="text-[12px] text-muted" aria-live="polite">
                {state.services.length === 0
                  ? "Belum ada layanan dipilih."
                  : `${state.services.length} layanan dipilih.`}
              </p>
            </fieldset>
          )}
        </StepPanel>
      )}

      {state.step === 2 && (
        <StepPanel
          key="step-2"
          focusOnMount={moved}
          title="Di mana pasien berada?"
          description="Gunakan lokasi Anda untuk mengurutkan berdasarkan jarak, atau pilih wilayah."
          onSubmit={() => hasLocation(state) && toStep(3)}
          actions={
            <>
              <Button variant="tertiary" onClick={() => toStep(1)}>
                Kembali
              </Button>
              <Button type="submit" disabled={!hasLocation(state)}>
                Lanjut
              </Button>
            </>
          }
        >
          <fieldset className="flex flex-col gap-3 rounded-md border border-line p-3">
            <legend className="px-1 text-[13px] font-semibold">Pakai lokasi saya</legend>
            <div className="flex flex-wrap items-center gap-3">
              <Button
                variant="secondary"
                onClick={requestLocation}
                loading={geoLoading}
                loadingLabel="Mencari lokasi…"
              >
                <PinIcon /> Gunakan lokasi saya
              </Button>
              {hasCoords(state) && (
                <span className="text-[13px] font-semibold text-ok-fg" role="status">
                  Lokasi dipakai (dibulatkan ± 100 m).
                </span>
              )}
            </div>
            {geoMessage && (
              <p role="alert" className="text-[13px] text-bad-fg">
                {geoMessage}
              </p>
            )}
            <p className="text-[12px] text-muted">
              Izin lokasi hanya diminta saat tombol ditekan. Lokasi tidak disimpan;
              jarak dihitung garis lurus, bukan waktu tempuh.
            </p>
            {hasCoords(state) && (
              <div className="flex flex-col gap-2">
                <span className="text-[13px] font-semibold" id="radius-label">
                  Radius pencarian
                </span>
                <div role="radiogroup" aria-labelledby="radius-label" className="flex flex-wrap gap-2">
                  {RADIUS_OPTIONS.map((r) => (
                    <label
                      key={r}
                      className={`inline-flex min-h-11 cursor-pointer items-center rounded-lg border px-3 text-[13px] font-semibold focus-within:outline focus-within:outline-[3px] focus-within:outline-offset-2 focus-within:outline-brand md:min-h-9 ${
                        state.radius_km === r
                          ? "border-brand bg-brand text-white"
                          : "border-line bg-well text-muted hover:border-line-strong"
                      }`}
                    >
                      <input
                        type="radio"
                        name="radius"
                        className="sr-only"
                        checked={state.radius_km === r}
                        onChange={() => update({ radius_km: r })}
                      />
                      {r} km
                    </label>
                  ))}
                </div>
              </div>
            )}
          </fieldset>

          <fieldset className="flex flex-col gap-3 rounded-md border border-line p-3">
            <legend className="px-1 text-[13px] font-semibold">Atau pilih wilayah</legend>
            {regions.error ? (
              <ErrorState error={regions.error} onRetry={regions.reload} title="Daftar wilayah tidak dapat dimuat" />
            ) : (
              <div className="grid gap-3 sm:grid-cols-2">
                <Field id="wiz-province" label="Provinsi">
                  <select
                    id="wiz-province"
                    className={inputClasses}
                    value={state.province_code}
                    disabled={regions.data === null}
                    onChange={(e) =>
                      update({
                        province_code: e.target.value,
                        city_code: "",
                        lat: null,
                        lng: null,
                      })
                    }
                  >
                    <option value="">{regions.data === null ? "Memuat…" : "Pilih provinsi"}</option>
                    {provinces.map((p) => (
                      <option key={p.code} value={p.code}>
                        {p.name}
                      </option>
                    ))}
                  </select>
                </Field>
                <Field id="wiz-city" label="Kota/kabupaten (opsional)">
                  <select
                    id="wiz-city"
                    className={inputClasses}
                    value={state.city_code}
                    disabled={province === null}
                    onChange={(e) => update({ city_code: e.target.value })}
                  >
                    <option value="">Semua kota di provinsi ini</option>
                    {(province?.cities ?? []).map((c) => (
                      <option key={c.code} value={c.code}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                </Field>
              </div>
            )}
          </fieldset>
        </StepPanel>
      )}

      {state.step === 3 && (
        <StepPanel
          key="step-3"
          focusOnMount={moved}
          title="Preferensi"
          description="Atur syarat tambahan. Anda dapat mengubahnya lagi setelah melihat hasil."
          onSubmit={() => toStep("hasil")}
          actions={
            <>
              <Button variant="tertiary" onClick={() => toStep(2)}>
                Kembali
              </Button>
              <Button type="submit">Lihat rekomendasi</Button>
            </>
          }
        >
          <fieldset className="flex flex-col gap-2">
            <legend className="mb-2 text-[13px] font-semibold">BPJS</legend>
            {(
              [
                ["required", "Wajib menerima BPJS", "RS yang tercatat tidak menerima BPJS dikeluarkan; yang belum diketahui tetap tampil dengan nilai lebih rendah."],
                ["any", "Tidak penting", "BPJS tidak memengaruhi skor."],
              ] as const
            ).map(([value, label, hint]) => (
              <label key={value} className="flex min-h-11 cursor-pointer items-start gap-2 rounded-md border border-line p-3">
                <input
                  type="radio"
                  name="bpjs"
                  className="mt-1 h-4 w-4 accent-[var(--color-brand)]"
                  checked={state.bpjs === value}
                  onChange={() => update({ bpjs: value })}
                />
                <span className="flex flex-col">
                  <span className="font-semibold">{label}</span>
                  <span className="text-[12px] text-muted">{hint}</span>
                </span>
              </label>
            ))}
          </fieldset>
          <label className="flex min-h-11 cursor-pointer items-start gap-2 rounded-md border-[1.5px] border-dashed border-sim-line bg-sim-bg p-3">
            <input
              type="checkbox"
              className="mt-1 h-4 w-4 accent-[var(--color-brand)]"
              checked={state.dataset === "all"}
              onChange={(e) => update({ dataset: e.target.checked ? "all" : "real" })}
            />
            <span className="flex flex-col">
              <span className="font-semibold text-sim-fg">Sertakan RS simulasi (fiktif)</span>
              <span className="text-[12px] text-muted">
                Bawaan: hanya RS nyata. Angka fasilitas contoh pada RS nyata tetap
                diberi label Simulasi.
              </span>
            </span>
          </label>
        </StepPanel>
      )}

      {state.step === "hasil" && (
        <RecommendationResults
          state={state}
          serviceNames={serviceNames}
          regionName={
            hasCoords(state)
              ? null
              : [
                  province?.cities.find((c) => c.code === state.city_code)?.name,
                  province?.name,
                ]
                  .filter(Boolean)
                  .join(", ") || null
          }
          onEdit={(step) => toStep(step)}
          onChange={(patch) => go({ ...state, ...patch }, "replace")}
        />
      )}
    </div>
  );
}
