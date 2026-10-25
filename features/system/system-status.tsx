"use client";

import { useState } from "react";
import type { ApiError } from "@/lib/api/client";
import { getHealth, getReady } from "@/lib/api/endpoints";
import { useApiResource } from "@/lib/hooks/use-api-resource";
import { formatWib } from "@/lib/format/time";
import { Button } from "@/components/ui/button";
import { describeApiError } from "@/components/ui/states";
import { AlertIcon, CheckIcon } from "@/components/ui/icons";

interface ProbeResult {
  latencyMs: number;
  checkedAt: string;
}

/** Ukur satu probe; galat dibiarkan naik ke useApiResource. */
async function probe(
  call: (signal: AbortSignal) => Promise<unknown>,
  signal: AbortSignal,
): Promise<ProbeResult> {
  const started = performance.now();
  await call(signal);
  return {
    latencyMs: Math.round(performance.now() - started),
    checkedAt: new Date().toISOString(),
  };
}

type ProbeState = "checking" | "ok" | "down";

const STATE_STYLE: Record<ProbeState, string> = {
  checking: "bg-unk-bg text-unk-fg border-unk-line",
  ok: "bg-ok-bg text-ok-fg border-ok-line",
  down: "bg-bad-bg text-bad-fg border-bad-line",
};

const STATE_LABEL: Record<ProbeState, string> = {
  checking: "Memeriksa…",
  ok: "Normal",
  down: "Bermasalah",
};

function ProbeCard({
  title,
  description,
  data,
  error,
  loading,
}: {
  title: string;
  description: string;
  data: ProbeResult | null;
  error: ApiError | null;
  loading: boolean;
}) {
  const state: ProbeState = loading ? "checking" : error ? "down" : "ok";
  const checkedAt = formatWib(data?.checkedAt);

  return (
    <section className="flex flex-col gap-3 rounded-md border border-line bg-surface p-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h2 className="text-[18px] font-semibold leading-[26px]">{title}</h2>
        <span
          className={`inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5 text-[12px] font-semibold ${STATE_STYLE[state]}`}
        >
          {state === "ok" && <CheckIcon />}
          {state === "down" && <AlertIcon />}
          {STATE_LABEL[state]}
        </span>
      </div>
      <p className="text-muted">{description}</p>
      {state === "down" && error && (
        <div className="flex flex-col gap-1">
          <p className="text-ink">{describeApiError(error)}</p>
          {error.requestId && (
            <p className="text-[12px] text-muted">
              Kode referensi:{" "}
              <code className="rounded bg-well px-1 py-0.5 font-mono">
                {error.requestId}
              </code>
            </p>
          )}
        </div>
      )}
      {state === "ok" && data && (
        <dl className="grid grid-cols-[max-content_1fr] gap-x-4 gap-y-1 text-[14px]">
          <dt className="text-muted">Waktu respons</dt>
          <dd className="font-mono">{data.latencyMs} ms</dd>
          {checkedAt && (
            <>
              <dt className="text-muted">Diperiksa</dt>
              <dd>{checkedAt}</dd>
            </>
          )}
        </dl>
      )}
    </section>
  );
}

export function SystemStatus() {
  // Satu kunci untuk kedua probe agar "Periksa ulang" memicu keduanya.
  const [round, setRound] = useState(0);
  const key = `status-${round}`;
  const health = useApiResource(key, (signal) => probe(getHealth, signal));
  const ready = useApiResource(key, (signal) => probe(getReady, signal));
  const busy = health.loading || ready.loading;

  return (
    <div className="flex flex-col gap-4">
      <div aria-live="polite" className="grid gap-4 md:grid-cols-2">
        <ProbeCard
          title="Server API"
          description="Proses backend hidup dan menjawab permintaan. Tidak memeriksa database."
          data={health.data}
          error={health.error}
          loading={health.loading}
        />
        <ProbeCard
          title="Database"
          description="Koneksi database dan migration tersedia, sehingga data rumah sakit dan rujukan dapat dimuat."
          data={ready.data}
          error={ready.error}
          loading={ready.loading}
        />
      </div>
      <div>
        <Button
          variant="secondary"
          onClick={() => setRound((n) => n + 1)}
          disabled={busy}
        >
          Periksa ulang
        </Button>
      </div>
    </div>
  );
}
