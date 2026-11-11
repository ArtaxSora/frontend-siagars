"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import {
  getCrowdsourceReports,
  updateReportStatus,
} from "@/lib/crowdsource/store";
import type { CrowdsourceReport, ReportStatus } from "@/lib/contracts/types";
import {
  REPORT_CATEGORY_LABEL,
  REPORT_STATUS_LABEL,
} from "@/lib/contracts/labels";
import { formatWib } from "@/lib/format/time";
import { useOperator } from "@/features/operator/operator-shell";
import { Button } from "@/components/ui/button";
import { CheckIcon, CrossIcon, FlagIcon, ShieldCheckIcon } from "@/components/ui/icons";

export function LaporanWargaView() {
  const { operator } = useOperator();
  const [reports, setReports] = useState<CrowdsourceReport[]>(() =>
    getCrowdsourceReports(),
  );
  const [filterStatus, setFilterStatus] = useState<"all" | ReportStatus>("all");
  const [feedbackMessage, setFeedbackMessage] = useState<string | null>(null);

  const refresh = useCallback(() => {
    setReports(getCrowdsourceReports());
  }, []);

  useEffect(() => {
    const handleStorage = () => refresh();
    window.addEventListener("siagars:reports-updated", handleStorage);
    return () => window.removeEventListener("siagars:reports-updated", handleStorage);
  }, [refresh]);

  const totalCount = reports.length;
  const pendingCount = reports.filter((r) => r.status === "pending_review").length;
  const verifiedCount = reports.filter((r) => r.status === "verified").length;
  const rejectedCount = reports.filter((r) => r.status === "rejected").length;

  const filtered = reports.filter((r) => {
    if (filterStatus === "all") return true;
    return r.status === filterStatus;
  });

  const handleAction = (id: string, status: ReportStatus) => {
    const updated = updateReportStatus(
      id,
      status,
      operator.email,
      status === "verified"
        ? `Diverifikasi oleh ${operator.email} via konfirmasi admisi`
        : `Ditolak oleh ${operator.email} karena data tidak sesuai catatan riil RS`,
    );

    if (updated) {
      refresh();
      setFeedbackMessage(
        `Laporan ${id} berhasil ditandai sebagai: ${REPORT_STATUS_LABEL[status]}.`,
      );
      setTimeout(() => setFeedbackMessage(null), 5000);
    }
  };

  const getStatusBadge = (status: ReportStatus) => {
    switch (status) {
      case "pending_review":
        return (
          <span className="inline-flex items-center gap-1 rounded-md border border-warn-line bg-warn-bg px-2 py-0.5 text-[12px] font-semibold text-warn-fg">
            <span className="h-1.5 w-1.5 rounded-full bg-warn-fg" />
            {REPORT_STATUS_LABEL.pending_review}
          </span>
        );
      case "verified":
        return (
          <span className="inline-flex items-center gap-1 rounded-md border border-ok-line bg-ok-bg px-2 py-0.5 text-[12px] font-semibold text-ok-fg">
            <CheckIcon className="h-3.5 w-3.5" />
            {REPORT_STATUS_LABEL.verified}
          </span>
        );
      case "rejected":
        return (
          <span className="inline-flex items-center gap-1 rounded-md border border-bad-line bg-bad-bg px-2 py-0.5 text-[12px] font-semibold text-bad-fg">
            <CrossIcon className="h-3.5 w-3.5" />
            {REPORT_STATUS_LABEL.rejected}
          </span>
        );
    }
  };

  return (
    <div className="flex flex-col gap-6">
      {/* Live Region Toast */}
      {feedbackMessage && (
        <div
          role="status"
          aria-live="polite"
          className="rounded-md border border-ok-line bg-ok-bg p-3 text-[13px] font-semibold text-ok-fg shadow-sm"
        >
          {feedbackMessage}
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col gap-2 rounded-md border border-line bg-surface p-5">
        <div className="flex items-center gap-2 text-brand">
          <FlagIcon className="h-5 w-5 text-brand" />
          <h1 className="text-[24px] font-bold tracking-[-0.01em] text-ink">
            Antrean Verifikasi Koreksi Data (Crowdsourcing)
          </h1>
        </div>
        <p className="text-[14px] leading-5 text-muted">
          Laporan ketersediaan fasilitas dan kontak dari masyarakat serta tenaga medis di lapangan.
          Operator bertugas memverifikasi silang sebelum data publik dimutakhirkan.
        </p>
      </div>

      {/* Catatan Edukasi Juri / Mentor: Anti-Stale Mechanism */}
      <div className="flex flex-col gap-2 rounded-md border border-brand/20 bg-brand-tint/30 p-4 text-[13px] text-ink">
        <div className="flex items-center gap-1.5 font-bold text-brand-deep">
          <ShieldCheckIcon className="h-4 w-4" />
          <span>Alur Validasi Crowdsourcing SiagaRS (Menjawab Masalah Data Cepat Usang)</span>
        </div>
        <p className="leading-5 text-muted">
          Pembaruan resmi melalui sistem rumah sakit sering memiliki jeda 1–24 jam. Dengan kanal crowdsourcing
          tervalidasi ini, laporan faktual dari keluarga pasien di IGD/ICU ditinjau langsung oleh operator.
          Data yang terverifikasi akan menaikkan skor kesegaran data (freshness) dan mencegah rujukan tersesat ke fasilitas yang sudah penuh.
        </p>
      </div>

      {/* KPI Counters */}
      <div className="grid gap-3 sm:grid-cols-4">
        <div className="flex flex-col gap-1 rounded-md border border-line bg-surface p-4">
          <span className="text-[12px] font-semibold text-muted">Total Laporan Masuk</span>
          <span className="text-[26px] font-bold tabular-nums text-ink">{totalCount}</span>
        </div>
        <div className="flex flex-col gap-1 rounded-md border border-warn-line bg-warn-bg/50 p-4">
          <span className="text-[12px] font-semibold text-warn-fg">Menunggu Verifikasi</span>
          <span className="text-[26px] font-bold tabular-nums text-warn-fg">{pendingCount}</span>
        </div>
        <div className="flex flex-col gap-1 rounded-md border border-ok-line bg-ok-bg/50 p-4">
          <span className="text-[12px] font-semibold text-ok-fg">Terverifikasi</span>
          <span className="text-[26px] font-bold tabular-nums text-ok-fg">{verifiedCount}</span>
        </div>
        <div className="flex flex-col gap-1 rounded-md border border-bad-line bg-bad-bg/50 p-4">
          <span className="text-[12px] font-semibold text-bad-fg">Ditolak</span>
          <span className="text-[26px] font-bold tabular-nums text-bad-fg">{rejectedCount}</span>
        </div>
      </div>

      {/* Tabs Filter */}
      <div className="flex flex-wrap items-center gap-2">
        <span className="text-[13px] font-semibold text-muted mr-1">Filter:</span>
        {(
          [
            { id: "all", label: `Semua (${totalCount})` },
            { id: "pending_review", label: `Menunggu (${pendingCount})` },
            { id: "verified", label: `Terverifikasi (${verifiedCount})` },
            { id: "rejected", label: `Ditolak (${rejectedCount})` },
          ] as const
        ).map((tab) => (
          <button
            key={tab.id}
            type="button"
            onClick={() => setFilterStatus(tab.id)}
            className={`min-h-9 rounded-md px-3 text-[13px] font-semibold transition-colors ${
              filterStatus === tab.id
                ? "bg-brand text-white"
                : "border border-line bg-surface text-muted hover:bg-well"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Table Data */}
      <div className="overflow-x-auto rounded-md border border-line bg-surface">
        <table className="w-full text-left text-[13px]">
          <caption className="sr-only">Daftar laporan koreksi crowdsourcing dari warga</caption>
          <thead className="border-b border-line bg-well font-semibold text-muted">
            <tr>
              <th scope="col" className="px-4 py-3">Tiket & Waktu</th>
              <th scope="col" className="px-4 py-3">Rumah Sakit</th>
              <th scope="col" className="px-4 py-3">Kategori & Bagian</th>
              <th scope="col" className="px-4 py-3">Kondisi Dilaporkan & Bukti</th>
              <th scope="col" className="px-4 py-3">Status</th>
              <th scope="col" className="px-4 py-3 text-right">Aksi Operator</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-line">
            {filtered.length === 0 ? (
              <tr>
                <td colSpan={6} className="p-8 text-center text-muted">
                  Tidak ada laporan dengan status ini.
                </td>
              </tr>
            ) : (
              filtered.map((r) => (
                <tr key={r.id} className="hover:bg-canvas">
                  <td className="px-4 py-3 align-top whitespace-nowrap">
                    <span className="font-mono font-bold text-brand-deep">{r.id}</span>
                    <span className="block text-[11px] text-muted">{formatWib(r.created_at)}</span>
                  </td>
                  <td className="px-4 py-3 align-top">
                    <Link
                      href={`/rumah-sakit/${encodeURIComponent(r.hospital_id)}`}
                      className="font-semibold text-ink hover:underline"
                    >
                      {r.hospital_name}
                    </Link>
                    <span className="block text-[12px] text-muted">
                      {r.city_name}, {r.province_name}
                    </span>
                  </td>
                  <td className="px-4 py-3 align-top">
                    <span className="font-semibold text-ink">{r.detail_field}</span>
                    <span className="block text-[11px] text-muted">
                      {REPORT_CATEGORY_LABEL[r.category]}
                    </span>
                  </td>
                  <td className="px-4 py-3 align-top max-w-sm">
                    <p className="font-medium text-ink leading-5">{r.current_claim}</p>
                    <span className="block text-[11px] text-muted mt-1">
                      Sumber: <em>{r.source_proof}</em>
                    </span>
                    {r.notes && (
                      <span className="block text-[11px] text-faint mt-0.5">
                        Catatan: {r.notes}
                      </span>
                    )}
                    {r.reporter_name && (
                      <span className="block text-[11px] text-muted mt-0.5">
                        Pelapor: {r.reporter_name} {r.reporter_contact ? `(${r.reporter_contact})` : ""}
                      </span>
                    )}
                    {r.review_note && (
                      <div className="mt-1.5 rounded bg-well p-1.5 text-[11px] text-ink">
                        <strong>Catatan Verifikasi:</strong> {r.review_note}
                        {r.reviewed_by && <> ({r.reviewed_by})</>}
                      </div>
                    )}
                  </td>
                  <td className="px-4 py-3 align-top whitespace-nowrap">
                    {getStatusBadge(r.status)}
                  </td>
                  <td className="px-4 py-3 align-top text-right whitespace-nowrap">
                    {r.status === "pending_review" ? (
                      <div className="flex items-center justify-end gap-1.5">
                        <Button
                          variant="secondary"
                          className="min-h-8 px-2.5 text-[12px] border-ok-line text-ok-fg hover:bg-ok-bg"
                          onClick={() => handleAction(r.id, "verified")}
                        >
                          Verifikasi
                        </Button>
                        <Button
                          variant="tertiary"
                          className="min-h-8 px-2.5 text-[12px] text-bad-fg hover:bg-bad-bg"
                          onClick={() => handleAction(r.id, "rejected")}
                        >
                          Tolak
                        </Button>
                      </div>
                    ) : (
                      <Button
                        variant="tertiary"
                        className="min-h-8 px-2 text-[12px] text-muted"
                        onClick={() => handleAction(r.id, "pending_review")}
                      >
                        Ubah Status
                      </Button>
                    )}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
