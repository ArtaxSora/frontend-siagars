"use client";

import { useEffect, useRef, useState, type FormEvent } from "react";
import { ApiError, isAbortError, toApiError } from "@/lib/api/client";
import { checkBpjs } from "@/lib/api/endpoints";
import {
  NIK_LENGTH,
  MAX_NAME_LENGTH,
  toBpjsRequest,
  validateBpjsForm,
  type BpjsFieldErrors,
} from "@/lib/bpjs/validate";
import { BPJS_PARTICIPANT_STATUS_LABEL, codedLabel } from "@/lib/contracts/labels";
import type { BpjsCheckRequest, BpjsCheckResult } from "@/lib/contracts/types";
import { formatWib } from "@/lib/format/time";
import { Button } from "@/components/ui/button";
import { Field, describedBy, inputClasses } from "@/components/ui/field";
import { CheckIcon, CrossIcon, FlaskIcon } from "@/components/ui/icons";
import { describeApiError } from "@/components/ui/states";

type CheckState =
  | { kind: "idle" }
  | { kind: "loading" }
  | { kind: "success"; result: BpjsCheckResult }
  | { kind: "error"; error: ApiError };

const EMPTY: BpjsCheckRequest = { nik: "", name: "", birth_date: "" };

/** Tanggal hari ini (WIB) sebagai YYYY-MM-DD; dipanggil saat submit, bukan saat render. */
function todayWib(): string {
  return new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Jakarta" }).format(new Date());
}

/** Endpoint belum ada di server (backend belum merilis fitur ini). */
function isUnavailable(error: ApiError): boolean {
  return error.status === 404 || error.status === 405 || error.status === 501;
}

/**
 * Cek kepesertaan BPJS — SIMULASI. NIK, nama, dan tanggal lahir hanya hidup di
 * memori komponen ini dan dikirim lewat BODY POST; tidak ditulis ke URL,
 * storage, analytics, atau log. Formulir dikosongkan setelah hasil diterima.
 */
export function BpjsCheck() {
  const [form, setForm] = useState<BpjsCheckRequest>(EMPTY);
  const [fieldErrors, setFieldErrors] = useState<BpjsFieldErrors>({});
  const [understood, setUnderstood] = useState(false);
  const [state, setState] = useState<CheckState>({ kind: "idle" });
  const [secondsLeft, setSecondsLeft] = useState(0);
  const controllerRef = useRef<AbortController | null>(null);

  useEffect(() => () => controllerRef.current?.abort(), []);

  useEffect(() => {
    if (secondsLeft <= 0) return;
    const timer = setTimeout(() => setSecondsLeft((s) => s - 1), 1000);
    return () => clearTimeout(timer);
  }, [secondsLeft]);

  function update(field: keyof BpjsCheckRequest, value: string) {
    setForm((f) => ({ ...f, [field]: value }));
    if (fieldErrors[field]) setFieldErrors((e) => ({ ...e, [field]: undefined }));
  }

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    if (state.kind === "loading" || secondsLeft > 0 || !understood) return;
    const errors = validateBpjsForm(form, todayWib());
    setFieldErrors(errors);
    if (Object.keys(errors).length > 0) return;

    controllerRef.current?.abort();
    const controller = new AbortController();
    controllerRef.current = controller;
    setState({ kind: "loading" });
    try {
      const res = await checkBpjs(toBpjsRequest(form), controller.signal);
      if (controller.signal.aborted) return;
      setState({ kind: "success", result: res.data });
      // Data pribadi tidak dibiarkan tertinggal di formulir.
      setForm(EMPTY);
    } catch (err) {
      if (controller.signal.aborted || isAbortError(err)) return;
      const apiError = toApiError(err);
      if (apiError.status === 429 && apiError.retryAfterSeconds) {
        setSecondsLeft(apiError.retryAfterSeconds);
      }
      setState({ kind: "error", error: apiError });
    }
  }

  function reset() {
    setForm(EMPTY);
    setFieldErrors({});
    setState({ kind: "idle" });
  }

  const loading = state.kind === "loading";
  const blocked = secondsLeft > 0;
  const fieldProps = (id: keyof BpjsCheckRequest, hint: boolean) => ({
    "aria-invalid": fieldErrors[id] ? true : undefined,
    "aria-describedby": describedBy(`bpjs-${id}`, { hint, error: Boolean(fieldErrors[id]) }),
  });

  return (
    <div className="flex flex-col gap-6">
      {/* Input tanpa atribut name: bila JS belum aktif, data tidak ikut terkirim lewat URL. */}
      <form
        onSubmit={onSubmit}
        noValidate
        className="flex flex-col gap-4 rounded-md border border-line bg-surface p-4 md:p-6"
      >
        <Field
          id="bpjs-nik"
          label="NIK"
          hint={`${NIK_LENGTH} digit sesuai KTP/KK. Gunakan NIK demo, bukan NIK asli.`}
          error={fieldErrors.nik}
        >
          <input
            id="bpjs-nik"
            type="text"
            inputMode="numeric"
            autoComplete="off"
            spellCheck={false}
            maxLength={NIK_LENGTH + 4}
            className={`${inputClasses} font-mono tabular-nums`}
            value={form.nik}
            onChange={(e) => update("nik", e.target.value)}
            {...fieldProps("nik", true)}
          />
        </Field>
        <Field id="bpjs-name" label="Nama lengkap" hint="Sesuai kartu peserta." error={fieldErrors.name}>
          <input
            id="bpjs-name"
            type="text"
            autoComplete="off"
            spellCheck={false}
            maxLength={MAX_NAME_LENGTH}
            className={inputClasses}
            value={form.name}
            onChange={(e) => update("name", e.target.value)}
            {...fieldProps("name", true)}
          />
        </Field>
        <Field id="bpjs-birth_date" label="Tanggal lahir" error={fieldErrors.birth_date}>
          <input
            id="bpjs-birth_date"
            type="date"
            autoComplete="off"
            className={inputClasses}
            value={form.birth_date}
            onChange={(e) => update("birth_date", e.target.value)}
            {...fieldProps("birth_date", false)}
          />
        </Field>

        <label className="flex min-h-11 cursor-pointer items-start gap-2 text-[14px] md:min-h-0">
          <input
            type="checkbox"
            className="mt-1 h-4 w-4 shrink-0 accent-[var(--color-brand)]"
            checked={understood}
            onChange={(e) => setUnderstood(e.target.checked)}
          />
          <span>
            Saya mengerti ini <strong>simulasi</strong> dan hanya memakai data demo,
            bukan data pribadi saya atau orang lain.
          </span>
        </label>

        <div className="flex flex-wrap items-center gap-3">
          <Button
            type="submit"
            loading={loading}
            loadingLabel="Memeriksa…"
            disabled={!understood || blocked}
          >
            Cek kepesertaan
          </Button>
          {(state.kind !== "idle" || Object.values(form).some(Boolean)) && (
            <Button variant="tertiary" onClick={reset} disabled={loading}>
              Hapus
            </Button>
          )}
          {blocked && (
            <p role="status" className="text-warn-fg tabular-nums">
              Terlalu banyak percobaan. Coba lagi dalam {secondsLeft} detik.
            </p>
          )}
        </div>
      </form>

      <div aria-live="polite" className="flex flex-col gap-4">
        {state.kind === "error" && isUnavailable(state.error) && (
          <div role="status" className="rounded-md border border-line bg-well p-4">
            <p className="font-semibold">Fitur cek BPJS belum tersedia di server.</p>
            <p className="text-muted">
              Tampilan sudah siap; layanan pemeriksaan sedang disiapkan tim backend.
              Coba lagi nanti.
            </p>
          </div>
        )}

        {state.kind === "error" && !isUnavailable(state.error) && !blocked && (
          <div role="alert" className="rounded-md border border-bad-line bg-bad-bg p-4 text-bad-fg">
            <p className="font-semibold">
              {state.error.status === 422
                ? state.error.message || "Data tidak valid. Periksa kembali isian Anda."
                : describeApiError(state.error)}
            </p>
            {state.error.requestId && (
              <p className="mt-1 text-[12px] text-muted">
                Kode referensi: <code className="font-mono">{state.error.requestId}</code>
              </p>
            )}
          </div>
        )}

        {state.kind === "success" && <BpjsResult result={state.result} />}
      </div>
    </div>
  );
}

function BpjsResult({ result }: { result: BpjsCheckResult }) {
  const checked = formatWib(result.checked_at);
  const p = result.participant;

  return (
    <section
      aria-label="Hasil cek BPJS simulasi"
      className="flex flex-col gap-4 rounded-md border-[1.5px] border-dashed border-sim-line bg-surface p-4 md:p-6"
    >
      <p className="inline-flex items-start gap-2 rounded-md bg-sim-bg px-3 py-2 text-[12px] font-semibold leading-[18px] text-sim-fg">
        <FlaskIcon className="mt-0.5 shrink-0" />
        <span>
          SIMULASI — data peserta sintetis untuk demo. Bukan hasil resmi BPJS
          Kesehatan dan bukan jaminan pasien diterima.
        </span>
      </p>

      {result.result === "not_found" || !p ? (
        <div className="flex flex-col gap-1">
          <p className="text-[18px] font-semibold">Data tidak ditemukan</p>
          <p className="text-muted">
            NIK, nama, dan tanggal lahir tidak cocok dengan peserta mana pun di data
            simulasi. Periksa kembali isian Anda.
          </p>
        </div>
      ) : (
        <>
          <div className="flex flex-wrap items-center gap-3">
            <span
              className={`inline-flex items-center gap-1 rounded-lg border px-2.5 py-1 text-[14px] font-bold ${
                p.status === "active"
                  ? "border-ok-line bg-ok-bg text-ok-fg"
                  : "border-bad-line bg-bad-bg text-bad-fg"
              }`}
            >
              {p.status === "active" ? <CheckIcon /> : <CrossIcon />}
              Kepesertaan {BPJS_PARTICIPANT_STATUS_LABEL[p.status]}
            </span>
            {p.status === "inactive" && p.inactive_reason && (
              <span className="text-bad-fg">{p.inactive_reason}</span>
            )}
          </div>
          <dl className="grid gap-x-6 gap-y-1 sm:grid-cols-[max-content_1fr]">
            <dt className="text-muted">Nama</dt>
            <dd className="font-semibold">{p.name_masked}</dd>
            <dt className="text-muted">NIK</dt>
            <dd className="font-mono tabular-nums">{p.nik_masked}</dd>
            <dt className="text-muted">Jenis kepesertaan</dt>
            <dd>{codedLabel(p.membership_type) ?? <span className="text-unk-fg">Belum diketahui</span>}</dd>
            <dt className="text-muted">Kelas rawat</dt>
            <dd>{p.care_class ? `Kelas ${p.care_class}` : <span className="text-unk-fg">Belum diketahui</span>}</dd>
            <dt className="text-muted">Faskes tingkat pertama</dt>
            <dd>{p.primary_facility?.name ?? <span className="text-unk-fg">Belum diketahui</span>}</dd>
          </dl>
        </>
      )}

      {checked && <p className="text-[12px] text-muted">Diperiksa {checked}</p>}
    </section>
  );
}
