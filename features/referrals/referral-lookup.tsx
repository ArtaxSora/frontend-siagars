"use client";

import { useEffect, useRef, useState, type FormEvent } from "react";
import { ApiError, isAbortError, toApiError } from "@/lib/api/client";
import { lookupReferral } from "@/lib/api/endpoints";
import type { TrackingResult } from "@/lib/contracts/types";
import { formatWib } from "@/lib/format/time";
import { ReferralStatusBadge } from "@/features/referrals/referral-status-badge";
import { ReferralTimeline } from "@/features/referrals/referral-timeline";
import { Button } from "@/components/ui/button";
import { Field, describedBy, inputClasses } from "@/components/ui/field";
import { FlaskIcon } from "@/components/ui/icons";
import { describeApiError } from "@/components/ui/states";

type LookupState =
  | { kind: "idle" }
  | { kind: "loading" }
  | { kind: "success"; result: TrackingResult }
  | { kind: "error"; error: ApiError };

/**
 * Kode pelacakan hanya hidup di memori komponen ini dan dikirim lewat BODY
 * POST. Tidak ditulis ke URL, localStorage, analytics, atau log.
 */
export function ReferralLookup() {
  const [code, setCode] = useState("");
  // Kode yang terakhir dikirim, dipakai tombol "Muat ulang status".
  const [submittedCode, setSubmittedCode] = useState<string | null>(null);
  const [state, setState] = useState<LookupState>({ kind: "idle" });
  const [secondsLeft, setSecondsLeft] = useState(0);
  const controllerRef = useRef<AbortController | null>(null);

  useEffect(() => () => controllerRef.current?.abort(), []);

  useEffect(() => {
    if (secondsLeft <= 0) return;
    const timer = setTimeout(() => setSecondsLeft((s) => s - 1), 1000);
    return () => clearTimeout(timer);
  }, [secondsLeft]);

  async function runLookup(trackingCode: string) {
    controllerRef.current?.abort();
    const controller = new AbortController();
    controllerRef.current = controller;
    setState({ kind: "loading" });
    try {
      const res = await lookupReferral(trackingCode, controller.signal);
      if (controller.signal.aborted) return;
      setState({ kind: "success", result: res.data });
    } catch (err) {
      if (controller.signal.aborted || isAbortError(err)) return;
      const apiError = toApiError(err);
      if (apiError.status === 429 && apiError.retryAfterSeconds) {
        setSecondsLeft(apiError.retryAfterSeconds);
      }
      setState({ kind: "error", error: apiError });
    }
  }

  function onSubmit(e: FormEvent) {
    e.preventDefault();
    const trimmed = code.trim();
    if (!trimmed || secondsLeft > 0) return;
    setSubmittedCode(trimmed);
    void runLookup(trimmed);
  }

  const loading = state.kind === "loading";
  const blocked = secondsLeft > 0;
  const fieldError =
    state.kind === "error" && (state.error.status === 404 || state.error.status === 422)
      ? "Kode tidak ditemukan atau tidak valid. Periksa kembali kode Anda."
      : null;

  return (
    <div className="flex flex-col gap-6">
      {/* Input tanpa atribut name: bila JS belum aktif, kode tidak ikut terkirim lewat URL. */}
      <form
        onSubmit={onSubmit}
        className="flex flex-col gap-3 rounded-md border border-line bg-surface p-4 md:p-6"
        noValidate
      >
        <Field
          id="tracking-code"
          label="Kode pelacakan"
          hint="Masukkan kode demo yang Anda terima. Kode tidak disimpan di peramban."
          error={fieldError}
        >
          <input
            id="tracking-code"
            type="text"
            autoComplete="off"
            autoCapitalize="characters"
            spellCheck={false}
            maxLength={64}
            required
            className={inputClasses}
            value={code}
            onChange={(e) => setCode(e.target.value)}
            aria-invalid={fieldError ? true : undefined}
            aria-describedby={describedBy("tracking-code", {
              hint: true,
              error: Boolean(fieldError),
            })}
          />
        </Field>
        <div className="flex flex-wrap items-center gap-3">
          <Button
            type="submit"
            loading={loading}
            loadingLabel="Mencari…"
            disabled={code.trim() === "" || blocked}
          >
            Lacak rujukan
          </Button>
          {blocked && (
            <p role="status" className="text-warn-fg tabular-nums">
              Terlalu banyak percobaan. Coba lagi dalam {secondsLeft} detik.
            </p>
          )}
        </div>
      </form>

      <div aria-live="polite" className="flex flex-col gap-4">
        {state.kind === "error" && !fieldError && !blocked && (
          <div
            role="alert"
            className="rounded-md border border-bad-line bg-bad-bg p-4 text-bad-fg"
          >
            <p className="font-semibold">{describeApiError(state.error)}</p>
            {state.error.requestId && (
              <p className="mt-1 text-[12px] text-muted">
                Kode referensi: <code className="font-mono">{state.error.requestId}</code>
              </p>
            )}
          </div>
        )}

        {state.kind === "success" && (
          <section
            aria-label="Status rujukan simulasi"
            className="flex flex-col gap-4 rounded-md border-[1.5px] border-dashed border-sim-line bg-surface p-4 md:p-6"
          >
            <p className="inline-flex items-start gap-2 rounded-md bg-sim-bg px-3 py-2 text-[12px] font-semibold leading-[18px] text-sim-fg">
              <FlaskIcon className="mt-0.5 shrink-0" />
              <span>
                DEMO — data sintetis untuk simulasi. Tidak ada rujukan resmi yang
                dibuat, dan tampilan ini bukan bukti rujukan medis.
              </span>
            </p>

            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="flex flex-col gap-1">
                <ReferralStatusBadge status={state.result.public_status} />
                <p className="text-[12px] text-muted tabular-nums">
                  Diperbarui {formatWib(state.result.updated_at) ?? "pada waktu yang tidak diketahui"}
                </p>
              </div>
              <Button
                variant="secondary"
                loading={loading}
                loadingLabel="Memuat ulang…"
                disabled={blocked}
                onClick={() => submittedCode && void runLookup(submittedCode)}
              >
                Muat ulang status
              </Button>
            </div>

            {state.result.destination && (
              <p>
                <span className="text-muted">Rumah sakit tujuan: </span>
                <span className="font-semibold">{state.result.destination.name}</span>
                <span className="text-muted">
                  {" "}
                  — {state.result.destination.city_name}
                </span>
              </p>
            )}

            {state.result.public_note && (
              <p className="whitespace-pre-wrap break-words">
                {state.result.public_note}
              </p>
            )}

            <div className="rounded-md bg-well p-3">
              <p className="text-[11px] font-semibold tracking-[0.02em] text-faint">
                LANGKAH BERIKUTNYA
              </p>
              <p>{state.result.next_step}</p>
            </div>

            <div>
              <h2 className="mb-3 text-[18px] font-semibold leading-[26px]">
                Linimasa
              </h2>
              <ReferralTimeline entries={state.result.history} />
            </div>
          </section>
        )}
      </div>
    </div>
  );
}
