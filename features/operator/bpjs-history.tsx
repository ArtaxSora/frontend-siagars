"use client";

import { useEffect, useState } from "react";
import { listAdminBpjsChecks } from "@/lib/api/endpoints";
import {
  BPJS_CHECK_RESULT_LABEL,
  BPJS_PARTICIPANT_STATUS_LABEL,
} from "@/lib/contracts/labels";
import type {
  BpjsCheckHistoryItem,
  BpjsCheckResultKind,
} from "@/lib/contracts/types";
import { formatWib } from "@/lib/format/time";
import { useApiResource } from "@/lib/hooks/use-api-resource";
import { buildBpjsChecksQuery } from "@/lib/insights/aggregate";
import { useOperator } from "@/features/operator/operator-shell";
import { DataTable, type DataTableColumn } from "@/components/charts/data-table";
import { Field, inputClasses } from "@/components/ui/field";
import {
  CheckIcon,
  CrossIcon,
  QuestionIcon,
  ShieldCheckIcon,
} from "@/components/ui/icons";
import { Pagination } from "@/components/ui/pagination";
import { EmptyState, ErrorState, LoadingBlock } from "@/components/ui/states";

const PAGE_LIMIT = 20;

const COLUMNS: readonly DataTableColumn<BpjsCheckHistoryItem>[] = [
  {
    key: "checked_at",
    header: "Waktu periksa (WIB)",
    render: (item) => (
      <span className="tabular-nums">
        {formatWib(item.checked_at) ?? "Waktu tidak diketahui"}
      </span>
    ),
  },
  {
    key: "nik_masked",
    header: "NIK tersamar",
    render: (item) => (
      <code className="font-mono text-[13px] font-semibold tabular-nums">
        {item.nik_masked}
      </code>
    ),
  },
  {
    key: "name_masked",
    header: "Nama tersamar",
    render: (item) => <span className="font-semibold">{item.name_masked}</span>,
  },
  {
    key: "birth_year",
    header: "Tahun lahir",
    align: "right",
    render: (item) => item.birth_year,
  },
  {
    key: "result",
    header: "Hasil",
    render: (item) =>
      item.result === "found" ? (
        <span className="inline-flex items-center gap-1 rounded-lg border border-ok-line bg-ok-bg px-2 py-0.5 text-[11px] font-bold leading-[14px] text-ok-fg">
          <CheckIcon />
          {BPJS_CHECK_RESULT_LABEL.found}
        </span>
      ) : (
        <span className="inline-flex items-center gap-1 rounded-lg border border-unk-line bg-unk-bg px-2 py-0.5 text-[11px] font-bold leading-[14px] text-unk-fg">
          <CrossIcon />
          {BPJS_CHECK_RESULT_LABEL.not_found}
        </span>
      ),
  },
  {
    key: "status",
    header: "Status kepesertaan",
    render: (item) => {
      if (item.result === "not_found") {
        return <span className="text-faint">—</span>;
      }
      if (item.status === "active") {
        return (
          <span className="inline-flex items-center gap-1 rounded-lg border border-ok-line bg-ok-bg px-2 py-0.5 text-[11px] font-bold leading-[14px] text-ok-fg">
            <CheckIcon />
            {BPJS_PARTICIPANT_STATUS_LABEL.active}
          </span>
        );
      }
      if (item.status === "inactive") {
        return (
          <span className="inline-flex items-center gap-1 rounded-lg border border-bad-line bg-bad-bg px-2 py-0.5 text-[11px] font-bold leading-[14px] text-bad-fg">
            <CrossIcon />
            {BPJS_PARTICIPANT_STATUS_LABEL.inactive}
          </span>
        );
      }
      return (
        <span className="inline-flex items-center gap-1 text-unk-fg">
          <QuestionIcon />
          Belum diketahui
        </span>
      );
    },
  },
  {
    key: "repeat_count",
    header: "Pengecekan (30 hari)",
    align: "right",
    render: (item) => `${item.repeat_count}×`,
  },
];

/**
 * Halaman riwayat cek BPJS tersamar untuk operator (FE-22, PRD §4.9).
 * Sesuai keputusan D-03, NIK/nama asli tidak disimpan dan tidak ada fitur reveal.
 */
export function BpjsHistory() {
  const { handleAuthError } = useOperator();
  const [page, setPage] = useState(1);
  const [resultFilter, setResultFilter] = useState<BpjsCheckResultKind | "">("");

  const queryKey = buildBpjsChecksQuery({
    page,
    limit: PAGE_LIMIT,
    result: resultFilter,
  });

  const resource = useApiResource(
    `admin:bpjs-checks?${queryKey}`,
    (signal) =>
      listAdminBpjsChecks(
        {
          page,
          limit: PAGE_LIMIT,
          result: resultFilter,
        },
        signal,
      ),
  );

  useEffect(() => {
    if (resource.error) handleAuthError(resource.error);
  }, [resource.error, handleAuthError]);

  function onFilterChange(next: BpjsCheckResultKind | "") {
    setResultFilter(next);
    setPage(1);
  }

  if (resource.error) {
    if (resource.error.status === 401) {
      return <LoadingBlock label="Mengalihkan ke halaman login…" rows={1} />;
    }
    if (resource.error.status === 403) {
      return (
        <EmptyState
          title="Tidak berwenang"
          description="Akun operator ini tidak memiliki akses ke riwayat pemeriksaan BPJS."
        />
      );
    }
    return (
      <ErrorState
        error={resource.error}
        onRetry={resource.reload}
        title="Riwayat cek BPJS tidak dapat dimuat"
      />
    );
  }

  const items = resource.data?.data ?? [];
  const meta = resource.data?.meta;
  const asOf = meta ? formatWib(meta.as_of) : null;

  return (
    <div className="flex flex-col gap-4">
      <header className="flex flex-col gap-1">
        <h1 className="text-[24px] font-bold leading-8">
          Riwayat cek BPJS (tersamar)
        </h1>
        <p className="text-muted">
          Catatan pemeriksaan simulasi kepesertaan BPJS Kesehatan dari halaman
          publik.
        </p>
      </header>

      <p
        role="note"
        className="flex items-start gap-2 rounded-md border border-kurasi-line bg-kurasi-bg px-3.5 py-2.5 text-[13px] leading-5 text-ink"
      >
        <ShieldCheckIcon className="mt-0.5 shrink-0 text-kurasi-fg" />
        <span>
          <strong className="text-kurasi-fg">
            Privasi &amp; perlindungan data (D-03):
          </strong>{" "}
          Server hanya menyimpan NIK tersamar, nama tersamar, dan tahun lahir.
          NIK maupun nama asli <strong>tidak disimpan</strong> dalam bentuk apa
          pun dan tidak dapat dibuka kembali. Seluruh entri dihapus otomatis
          setelah 30 hari.
        </span>
      </p>

      <div className="flex flex-wrap items-end justify-between gap-3 rounded-md border border-line bg-surface p-4">
        <div className="w-full sm:w-64">
          <Field id="bpjs-history-result" label="Saring hasil pemeriksaan">
            <select
              id="bpjs-history-result"
              className={inputClasses}
              value={resultFilter}
              onChange={(e) =>
                onFilterChange(e.target.value as BpjsCheckResultKind | "")
              }
            >
              <option value="">Semua hasil</option>
              <option value="found">Ditemukan</option>
              <option value="not_found">Tidak ditemukan</option>
            </select>
          </Field>
        </div>
        {asOf && (
          <p className="text-[12px] text-faint tabular-nums">
            Data per {asOf}
          </p>
        )}
      </div>

      {resource.loading && resource.data === null ? (
        <LoadingBlock label="Memuat riwayat cek BPJS…" rows={3} />
      ) : items.length === 0 ? (
        <EmptyState
          title="Belum ada riwayat pemeriksaan"
          description="Belum ada pengecekan simulasi BPJS yang tercatat untuk filter ini."
        />
      ) : (
        <>
          <DataTable
            caption="Daftar riwayat pemeriksaan simulasi BPJS dalam bentuk tersamar (terbaru lebih dulu)"
            columns={COLUMNS}
            rows={items}
            rowKey={(item) => item.id}
          />
          {meta && (
            <Pagination
              page={meta.page}
              totalPages={Math.max(1, meta.total_pages)}
              total={meta.total}
              limit={meta.limit}
              onPageChange={setPage}
              disabled={resource.loading}
            />
          )}
        </>
      )}
    </div>
  );
}
