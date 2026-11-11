"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { listRegions, getRecommendations } from "@/lib/api/endpoints";
import { useApiResource } from "@/lib/hooks/use-api-resource";
import type { Province, Recommendation } from "@/lib/contracts/types";
import { parseAssistantQuery, type ParsedAssistantQuery } from "@/lib/ai/nlp-parser";
import { serializeWizardState, type WizardState } from "@/lib/recommendations/wizard";
import { RecommendationCard } from "@/features/recommendations/recommendation-card";
import { Button, ButtonLink } from "@/components/ui/button";
import { inputClasses } from "@/components/ui/field";
import { AlertIcon, PhoneIcon, SparklesIcon } from "@/components/ui/icons";
import { LoadingBlock } from "@/components/ui/states";

const QUICK_PROMPTS = [
  "Cari RS di Bekasi yang punya NICU dan terima BPJS",
  "RS dengan ICU di Jakarta Selatan",
  "Cari IGD 24 jam dan rawat inap di Depok",
  "RS dengan PICU di Bandung",
] as const;

interface ChatTurn {
  id: string;
  sender: "user" | "assistant";
  text?: string;
  parsed?: ParsedAssistantQuery;
  recommendations?: Recommendation[];
  recommendationState?: WizardState;
  loading?: boolean;
  error?: string | null;
}

export function AiAssistant() {
  const searchParams = useSearchParams();
  const initialPrompt = searchParams.get("prompt") ?? "";

  const regions = useApiResource("regions", (signal) => listRegions(signal));
  const provinces: Province[] = useMemo(
    () => regions.data?.data ?? [],
    [regions.data],
  );

  const [input, setInput] = useState(initialPrompt);
  const [messages, setMessages] = useState<ChatTurn[]>([
    {
      id: "turn-welcome",
      sender: "assistant",
      text: "Halo! Saya Asisten AI SiagaRS. Anda bisa bertanya dalam bahasa sehari-hari untuk mencari rumah sakit yang sesuai kebutuhan gawat darurat atau rawat inap Anda. Jawaban kami ambil langsung dari data ketersediaan riil SiagaRS.",
    },
  ]);

  const [compareIds, setCompareIds] = useState<string[]>([]);
  const executedInitialRef = useRef(false);
  const threadEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    threadEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  const handleSend = useCallback(
    async (promptToSend: string) => {
      const raw = promptToSend.trim();
      if (!raw) return;

      const userTurnId = `u-${Date.now()}`;
      const assistantTurnId = `a-${Date.now()}`;

      const parsed = parseAssistantQuery(raw, provinces);

      const userTurn: ChatTurn = {
        id: userTurnId,
        sender: "user",
        text: raw,
      };

      const assistantPlaceholder: ChatTurn = {
        id: assistantTurnId,
        sender: "assistant",
        parsed,
        loading: true,
        error: null,
      };

      setMessages((prev) => [...prev, userTurn, assistantPlaceholder]);
      setInput("");
      setTimeout(scrollToBottom, 50);

      // Siapkan parameter rekomendasi dari hasil parsing
      const wizardState: WizardState = {
        step: "hasil",
        services: parsed.services,
        lat: null,
        lng: null,
        radius_km: 20,
        province_code: parsed.province_code,
        city_code: parsed.city_code,
        bpjs: parsed.bpjs,
        dataset: parsed.dataset,
      };

      try {
        const res = await getRecommendations(wizardState);
        setMessages((prev) =>
          prev.map((m) =>
            m.id === assistantTurnId
              ? {
                  ...m,
                  loading: false,
                  recommendations: res.data,
                  recommendationState: wizardState,
                }
              : m,
          ),
        );
      } catch {
        setMessages((prev) =>
          prev.map((m) =>
            m.id === assistantTurnId
              ? {
                  ...m,
                  loading: false,
                  error:
                    "Maaf, tidak dapat mengambil rekomendasi saat ini. Silakan periksa koneksi atau coba sesuaikan kata kunci pencarian Anda.",
                }
              : m,
          ),
        );
      }
      setTimeout(scrollToBottom, 100);
    },
    [provinces],
  );

  useEffect(() => {
    if (initialPrompt && !executedInitialRef.current && provinces.length > 0) {
      executedInitialRef.current = true;
      handleSend(initialPrompt);
    }
  }, [initialPrompt, provinces, handleSend]);

  const toggleCompare = (id: string, on: boolean) => {
    setCompareIds((cur) => {
      if (on) {
        if (cur.length >= 3) return cur;
        return [...cur, id];
      }
      return cur.filter((x) => x !== id);
    });
  };

  return (
    <div className="flex flex-col gap-6">
      {/* Header & Disclaimer */}
      <div className="flex flex-col gap-3 rounded-md border border-line bg-surface p-5 md:p-6">
        <div className="flex items-center gap-2 text-brand">
          <SparklesIcon className="h-5 w-5 text-brand" />
          <h1 className="text-[24px] font-bold tracking-[-0.01em] text-ink md:text-[28px]">
            Asisten AI Pencari Rumah Sakit
          </h1>
        </div>
        <p className="text-[15px] leading-6 text-muted">
          Ketik kebutuhan Anda dalam kalimat bebas. Asisten kami mengekstrak
          kebutuhan layanan dan lokasi secara deterministik dan mencocokkannya
          langsung dengan data ketersediaan riil SiagaRS.
        </p>

        {/* Banner Wajib: Bukan diagnosis medis */}
        <div
          role="note"
          aria-label="Batasan Asisten AI"
          className="flex items-start gap-2.5 rounded-md border border-trust/20 bg-trust-wash p-3 text-[13px] text-trust"
        >
          <span className="font-bold">Penting:</span>
          <span>
            Bukan diagnosis atau saran medis. Jawaban diambil langsung dari data
            ketersediaan dan kepastian riil SiagaRS untuk membantu percepatan
            pencarian rujukan fasilitas kesehatan.
          </span>
        </div>
      </div>

      {/* Quick Prompts */}
      <div className="flex flex-col gap-2">
        <span className="text-[13px] font-semibold text-muted">
          Pilihan pertanyaan cepat:
        </span>
        <div className="flex flex-wrap gap-2">
          {QUICK_PROMPTS.map((q) => (
            <button
              key={q}
              type="button"
              onClick={() => handleSend(q)}
              className="inline-flex min-h-11 items-center rounded-lg border border-line bg-surface px-3 py-1.5 text-left text-[13px] font-medium text-ink hover:border-brand hover:bg-brand-tint hover:text-brand-deep"
            >
              &ldquo;{q}&rdquo;
            </button>
          ))}
        </div>
      </div>

      {/* Chat Thread */}
      <div
        role="log"
        aria-live="polite"
        className="flex flex-col gap-4 rounded-md border border-line bg-canvas p-4 md:p-6"
      >
        {messages.map((turn) => {
          if (turn.sender === "user") {
            return (
              <div key={turn.id} className="flex justify-end">
                <div className="max-w-2xl rounded-2xl rounded-br-none bg-brand px-4 py-3 text-[14px] leading-6 text-white shadow-sm">
                  {turn.text}
                </div>
              </div>
            );
          }

          // Assistant Turn
          return (
            <div key={turn.id} className="flex flex-col gap-3">
              <div className="flex max-w-3xl flex-col gap-3 rounded-2xl rounded-bl-none border border-line bg-surface p-4 text-[14px] leading-6 text-ink shadow-sm">
                {turn.text && <p>{turn.text}</p>}

                {/* Indikator Gawat Darurat (Guardrail Red Flag) */}
                {turn.parsed?.isEmergency && (
                  <div
                    role="alert"
                    className="flex flex-col gap-2.5 rounded-md border-2 border-bad-fg bg-bad-bg p-3.5 text-bad-fg"
                  >
                    <div className="flex items-center gap-2 font-bold text-[15px]">
                      <AlertIcon className="h-5 w-5 shrink-0" />
                      <span>Peringatan Kondisi Gawat Darurat</span>
                    </div>
                    <p className="text-[13px] leading-5">
                      Terdeteksi indikasi kegawatdaruratan (
                      {turn.parsed.emergencyKeywords.join(", ")}). Jangan buang
                      waktu mencari di aplikasi bila kondisi kritis mengancam
                      nyawa! Segera hubungi saluran bantuan darurat atau bawa
                      pasien ke IGD terdekat:
                    </p>
                    <div className="flex flex-wrap gap-2 pt-1">
                      <a
                        href="tel:112"
                        className="inline-flex min-h-11 items-center gap-1.5 rounded-md bg-bad-fg px-3.5 py-1.5 text-[13px] font-bold text-white hover:opacity-90"
                      >
                        <PhoneIcon /> Hubungi 112 (Panggilan Darurat)
                      </a>
                      <a
                        href="tel:119"
                        className="inline-flex min-h-11 items-center gap-1.5 rounded-md border border-bad-fg bg-white px-3.5 py-1.5 text-[13px] font-bold text-bad-fg hover:bg-bad-bg"
                      >
                        <PhoneIcon /> Hubungi 119 (SPGDT Medis)
                      </a>
                    </div>
                  </div>
                )}

                {/* Filter Explanation */}
                {turn.parsed && (
                  <div className="flex flex-col gap-1 rounded-md bg-well p-3 text-[13px]">
                    <span className="font-semibold text-muted">
                      Kriteria pencarian terdeteksi:
                    </span>
                    <span className="font-medium text-ink">
                      {turn.parsed.explanation}
                    </span>
                  </div>
                )}

                {/* Loading state */}
                {turn.loading && (
                  <LoadingBlock label="Mencari dan memberi skor kecocokan rumah sakit…" rows={2} />
                )}

                {/* Error state */}
                {turn.error && (
                  <p className="text-[13px] text-bad-fg">{turn.error}</p>
                )}

                {/* Hasil Rekomendasi */}
                {turn.recommendations && (
                  <div className="mt-2 flex flex-col gap-3">
                    {turn.recommendations.length === 0 ? (
                      <div className="flex flex-col gap-2 rounded-md border border-dashed border-line p-4 text-center">
                        <p className="font-semibold text-ink">
                          Tidak ada rumah sakit yang cocok dengan filter ini
                        </p>
                        <p className="text-[13px] text-muted">
                          Coba luaskan wilayah pencarian atau hapus filter BPJS
                          untuk melihat fasilitas lainnya.
                        </p>
                        <ButtonLink href="/pilih-rs" variant="secondary" className="self-center mt-2">
                          Buka Wizard Pilih RS
                        </ButtonLink>
                      </div>
                    ) : (
                      <>
                        <div className="flex items-center justify-between">
                          <span className="text-[13px] font-semibold text-ink">
                            Rekomendasi teratas ({turn.recommendations.length} RS ditemukan):
                          </span>
                          {turn.recommendationState && (
                            <Link
                              href={`/pilih-rs?${serializeWizardState(turn.recommendationState)}`}
                              className="text-[13px] font-semibold text-trust hover:underline"
                            >
                              Lihat semua di Pilih RS →
                            </Link>
                          )}
                        </div>

                        <div className="flex flex-col gap-3">
                          {turn.recommendations.slice(0, 3).map((rec, idx) => (
                            <RecommendationCard
                              key={rec.hospital.id}
                              rec={rec}
                              rank={idx + 1}
                              serviceNames={{
                                nicu: "NICU",
                                picu: "PICU",
                                icu: "ICU",
                                "igd-24h": "IGD 24 Jam",
                                ambulance: "Ambulans",
                                "rawat-inap": "Rawat Inap",
                                isolasi: "Ruang Isolasi",
                                hemodialisis: "Hemodialisis",
                              }}
                              compare={{
                                checked: compareIds.includes(rec.hospital.id),
                                disabled:
                                  compareIds.length >= 3 &&
                                  !compareIds.includes(rec.hospital.id),
                                onChange: (on) =>
                                  toggleCompare(rec.hospital.id, on),
                              }}
                            />
                          ))}
                        </div>

                        {turn.recommendationState && (
                          <div className="pt-2">
                            <ButtonLink
                              href={`/pilih-rs?${serializeWizardState(turn.recommendationState)}`}
                              variant="secondary"
                              className="w-full justify-center"
                            >
                              Lihat rincian lengkap & saring di Pilih RS ({turn.recommendations.length} RS)
                            </ButtonLink>
                          </div>
                        )}
                      </>
                    )}
                  </div>
                )}
              </div>
            </div>
          );
        })}
        <div ref={threadEndRef} />
      </div>

      {/* Input Form */}
      <form
        onSubmit={(e) => {
          e.preventDefault();
          handleSend(input);
        }}
        className="sticky bottom-4 z-20 flex gap-2 rounded-xl border border-line bg-surface p-2 shadow-level3 md:p-3"
      >
        <label htmlFor="assistant-input" className="sr-only">
          Tanyakan pada Asisten AI SiagaRS
        </label>
        <input
          id="assistant-input"
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Tulis pertanyaan (mis. 'RS dengan NICU di Bekasi terima BPJS')…"
          className={`${inputClasses} flex-1 border-0 bg-transparent shadow-none focus:ring-0`}
        />
        <Button type="submit" disabled={!input.trim()}>
          Kirim
        </Button>
      </form>

      {/* Floating Compare Bar */}
      {compareIds.length >= 2 && (
        <aside
          role="region"
          aria-label="Bandingkan pilihan"
          className="fixed bottom-20 left-4 right-4 z-40 mx-auto max-w-[800px] rounded-lg border border-brand bg-brand-deep px-4 py-3 text-white shadow-level3"
        >
          <div className="flex flex-wrap items-center justify-between gap-3">
            <span className="text-[14px] font-semibold">
              {compareIds.length} rumah sakit dipilih untuk dibandingkan
            </span>
            <div className="flex items-center gap-2">
              <Button
                variant="tertiary"
                onClick={() => setCompareIds([])}
                className="text-white hover:text-white/80"
              >
                Batal
              </Button>
              <ButtonLink
                href={`/bandingkan?ids=${encodeURIComponent(compareIds.join(","))}`}
                className="bg-white text-brand-deep hover:bg-well"
              >
                Bandingkan sekarang ({compareIds.length})
              </ButtonLink>
            </div>
          </div>
        </aside>
      )}
    </div>
  );
}
