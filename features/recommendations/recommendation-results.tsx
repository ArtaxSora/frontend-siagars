"use client";

import { useState } from "react";
import { getRecommendations } from "@/lib/api/endpoints";
import { useApiResource } from "@/lib/hooks/use-api-resource";
import { RADIUS_OPTIONS } from "@/lib/contracts/types";
import { formatWib } from "@/lib/format/time";
import { excludedSummary } from "@/lib/recommendations/format";
import {
  buildRecommendationApiQuery,
  hasCoords,
  stepForField,
  type WizardState,
} from "@/lib/recommendations/wizard";
import { RecommendationCard } from "@/features/recommendations/recommendation-card";
import { Button, ButtonLink } from "@/components/ui/button";
import { EmergencyBanner } from "@/components/ui/decision";
import { SimulationNotice } from "@/components/ui/notices";
import { EmptyState, ErrorState, LoadingBlock } from "@/components/ui/states";

const MAX_COMPARE = 3;

function SummaryItem({
  label,
  value,
  onEdit,
}: {
  label: string;
  value: string;
  onEdit: () => void;
}) {
  return (
    <div className="flex items-center justify-between gap-3 py-1.5">
      <div className="min-w-0">
        <dt className="text-[12px] text-muted">{label}</dt>
        <dd className="font-semibold">{value}</dd>
      </div>
      <Button variant="tertiary" onClick={onEdit}>
        Ubah<span className="sr-only"> {label.toLowerCase()}</span>
      </Button>
    </div>
  );
}

/** Hasil /pilih-rs (FE-11): kartu ber-skor, rincian, dan RS yang dikeluarkan. */
export function RecommendationResults({
  state,
  serviceNames,
  regionName,
  onEdit,
  onChange,
}: {
  state: WizardState;
  serviceNames: Record<string, string>;
  regionName: string | null;
  onEdit: (step: 1 | 2 | 3) => void;
  onChange: (patch: Partial<WizardState>) => void;
}) {
  const key = buildRecommendationApiQuery(state);
  const res = useApiResource(`recommendations?${key}`, (signal) =>
    getRecommendations(state, signal),
  );
  const [compareIds, setCompareIds] = useState<string[]>([]);

  const selectedNames = state.services.map((s) => serviceNames[s] ?? s.toUpperCase());
  const location = hasCoords(state)
    ? `Lokasi Anda, radius ${state.radius_km} km (garis lurus)`
    : (regionName ?? "Wilayah terpilih");
  const nextRadius = RADIUS_OPTIONS.find((r) => r > state.radius_km);

  const summary = (
    <section aria-label="Kebutuhan Anda" className="rounded-md border border-line bg-surface px-4 py-2">
      <dl className="flex flex-col divide-y divide-line">
        <SummaryItem label="Layanan" value={selectedNames.join(", ")} onEdit={() => onEdit(1)} />
        <SummaryItem label="Lokasi" value={location} onEdit={() => onEdit(2)} />
        <SummaryItem
          label="Preferensi"
          value={`${state.bpjs === "required" ? "BPJS wajib" : "BPJS tidak penting"} · ${
            state.dataset === "all" ? "Termasuk RS simulasi" : "Hanya RS nyata"
          }`}
          onEdit={() => onEdit(3)}
        />
      </dl>
    </section>
  );

  let body;
  if (res.error) {
    const field = res.error.details[0]?.field;
    body =
      res.error.status === 422 ? (
        <EmptyState
          title="Isian belum dapat diproses"
          description={res.error.message || "Periksa kembali layanan dan lokasi."}
          action={
            <Button onClick={() => onEdit(field ? stepForField(field) : 1)}>
              Perbaiki isian
            </Button>
          }
        />
      ) : (
        <ErrorState error={res.error} onRetry={res.reload} title="Rekomendasi tidak dapat dimuat" />
      );
  } else if (res.loading || res.data === null) {
    body = <LoadingBlock label="Menyusun rekomendasi…" rows={3} />;
  } else {
    const items = res.data.data;
    const meta = res.data.meta;
    const excluded = meta ? excludedSummary(meta.excluded, selectedNames) : [];
    const generated = meta ? formatWib(meta.generated_at) : null;

    body = (
      <div className="flex flex-col gap-4">
        <div className="flex flex-col gap-1 text-[13px] text-muted" aria-live="polite">
          <p>
            <strong className="text-ink">{items.length} rumah sakit</strong> paling cocok
            {meta ? ` dari ${meta.total_considered} yang dinilai` : ""}, diurutkan dari skor tertinggi.
          </p>
          {excluded.length > 0 && (
            <ul className="list-inside list-disc">
              {excluded.map((line) => (
                <li key={line}>{line}</li>
              ))}
            </ul>
          )}
          {meta?.candidates_truncated && (
            <p>Wilayah ini sangat luas; hanya sebagian RS yang dinilai. Persempit lokasi untuk hasil lebih lengkap.</p>
          )}
          {generated && <p className="text-[12px] text-faint">Dihitung {generated}</p>}
        </div>

        {items.some((r) => r.flags.includes("contains_simulated_data")) && <SimulationNotice />}

        {items.length === 0 ? (
          <EmptyState
            title="Belum ada RS yang cocok"
            description="Tidak ada RS di data kami yang memenuhi semua syarat. Coba longgarkan pencarian:"
            action={
              <div className="flex flex-wrap gap-2">
                {hasCoords(state) && nextRadius && (
                  <Button variant="secondary" onClick={() => onChange({ radius_km: nextRadius })}>
                    Perluas radius ke {nextRadius} km
                  </Button>
                )}
                {state.bpjs === "required" && (
                  <Button variant="secondary" onClick={() => onChange({ bpjs: "any" })}>
                    Hapus syarat BPJS
                  </Button>
                )}
                {state.services.length > 1 && (
                  <Button variant="secondary" onClick={() => onEdit(1)}>
                    Kurangi layanan
                  </Button>
                )}
                {state.dataset === "real" && (
                  <Button variant="tertiary" onClick={() => onChange({ dataset: "all" })}>
                    Sertakan RS simulasi
                  </Button>
                )}
              </div>
            }
          />
        ) : (
          <ol className="flex flex-col gap-4">
            {items.map((rec, i) => (
              <li key={rec.hospital.id}>
                <RecommendationCard
                  rec={rec}
                  rank={i + 1}
                  serviceNames={serviceNames}
                  compare={{
                    checked: compareIds.includes(rec.hospital.id),
                    disabled: compareIds.length >= MAX_COMPARE,
                    onChange: (on) =>
                      setCompareIds((cur) =>
                        on
                          ? cur.includes(rec.hospital.id) || cur.length >= MAX_COMPARE
                            ? cur
                            : [...cur, rec.hospital.id]
                          : cur.filter((x) => x !== rec.hospital.id),
                      ),
                  }}
                />
              </li>
            ))}
          </ol>
        )}
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      <EmergencyBanner />
      {summary}
      {body}
      {compareIds.length > 0 && (
        <div
          role="region"
          aria-label="Pilihan bandingkan"
          className="sticky bottom-3 z-20 flex flex-wrap items-center justify-between gap-3 rounded-md border border-line bg-surface p-3 shadow-level3"
        >
          <p className="font-semibold" aria-live="polite">
            {compareIds.length} dari {MAX_COMPARE} RS dipilih
            {compareIds.length < 2 && <span className="font-normal text-muted"> — pilih minimal 2</span>}
          </p>
          <div className="flex gap-2">
            <Button variant="tertiary" onClick={() => setCompareIds([])}>
              Batal
            </Button>
            {compareIds.length >= 2 && (
              <ButtonLink href={`/bandingkan?ids=${compareIds.join(",")}`}>
                Bandingkan {compareIds.length} RS
              </ButtonLink>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
