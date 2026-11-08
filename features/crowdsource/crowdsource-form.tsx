"use client";

import { useState } from "react";
import { useSearchParams } from "next/navigation";
import { getHospital, suggestHospitals } from "@/lib/api/endpoints";
import { useApiResource } from "@/lib/hooks/use-api-resource";
import {
  REPORT_CATEGORIES,
  type CrowdsourceReport,
  type Hospital,
  type ReportCategory,
  type Suggestion,
} from "@/lib/contracts/types";
import {
  REPORT_CATEGORY_LABEL,
  REPORT_STATUS_LABEL,
} from "@/lib/contracts/labels";
import { formatWib } from "@/lib/format/time";
import { submitCrowdsourceReport } from "@/lib/crowdsource/store";
import { Button, ButtonLink } from "@/components/ui/button";
import { Field, inputClasses } from "@/components/ui/field";
import { CheckIcon, FlagIcon, ShieldCheckIcon } from "@/components/ui/icons";
import { LoadingBlock } from "@/components/ui/states";

const PROOF_OPTIONS = [
  "Saya / keluarga pasien sedang di lokasi rumah sakit",
  "Saya adalah tenaga kesehatan / staf rumah sakit ini",
  "Konfirmasi langsung via panggilan telepon rumah sakit",
  "Papan informasi resmi atau pengumuman RS di lapangan",
  "Informasi pihak ketiga / lainnya",
] as const;

export function CrowdsourceForm() {
  const searchParams = useSearchParams();
  const prefilledHospitalId = searchParams.get("hospital_id") ?? "";

  const hospitalRes = useApiResource<Hospital | null>(
    prefilledHospitalId ? `hospital:${prefilledHospitalId}` : "hospital:none",
    (signal) =>
      prefilledHospitalId
        ? getHospital(prefilledHospitalId, signal).then((r) => r.data)
        : Promise.resolve(null),
  );

  const [chosenHospital, setChosenHospital] = useState<Hospital | null>(null);
  const hospital: Hospital | null =
    chosenHospital ?? hospitalRes.data;
  const loadingHospital = Boolean(prefilledHospitalId && hospitalRes.loading);

  const [hospitalQuery, setHospitalQuery] = useState("");
  const trimmedQuery = hospitalQuery.trim();
  const searchEnabled = !hospital && trimmedQuery.length >= 2;

  const suggestRes = useApiResource<Suggestion[]>(
    searchEnabled ? `suggest:all:${trimmedQuery}` : "suggest:none",
    (signal) =>
      searchEnabled
        ? suggestHospitals(trimmedQuery, "all", 5, signal).then((r) => r.data)
        : Promise.resolve([]),
  );

  const searchResults =
    searchEnabled && !suggestRes.loading ? (suggestRes.data ?? []) : [];
  const searchLoading = searchEnabled && suggestRes.loading;

  // Form states
  const [category, setCategory] = useState<ReportCategory>("services");
  const [detailField, setDetailField] = useState("");
  const [currentClaim, setCurrentClaim] = useState("");
  const [sourceProof, setSourceProof] = useState<string>(PROOF_OPTIONS[0]);
  const [notes, setNotes] = useState("");
  const [reporterName, setReporterName] = useState("");
  const [reporterContact, setReporterContact] = useState("");

  const [submittedReport, setSubmittedReport] = useState<CrowdsourceReport | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!hospital || !currentClaim.trim() || !detailField.trim()) return;

    setSubmitting(true);
    const report = submitCrowdsourceReport({
      hospital_id: hospital.id,
      hospital_name: hospital.name,
      city_name: hospital.city_name,
      province_name: hospital.province_name,
      category,
      detail_field: detailField.trim(),
      current_claim: currentClaim.trim(),
      source_proof: sourceProof,
      notes: notes.trim(),
      reporter_name: reporterName.trim() || undefined,
      reporter_contact: reporterContact.trim() || undefined,
    });

    setSubmittedReport(report);
    setSubmitting(false);
  };

  if (loadingHospital) {
    return <LoadingBlock label="Memuat informasi rumah sakit…" rows={3} />;
  }

  // Tampilan Berhasil Kirim Laporan (Receipt & Anti-Stale Explanation)
  if (submittedReport) {
    return (
      <div className="flex flex-col gap-6">
        <div className="flex flex-col gap-4 rounded-md border border-ok-line bg-ok-bg p-6 text-ok-fg">
          <div className="flex items-center gap-2">
            <CheckIcon className="h-6 w-6 shrink-0" />
            <h1 className="text-[22px] font-bold text-ink">
              Laporan Koreksi Berhasil Diterima
            </h1>
          </div>
          <p className="text-[14px] leading-6 text-ink">
            Terima kasih atas kontribusi Anda. Laporan Anda telah masuk ke antrean verifikasi
            operator untuk menjaga akurasi dan kesegaran data publik.
          </p>

          <dl className="grid gap-2 rounded-md border border-line bg-surface p-4 text-[13px] text-ink sm:grid-cols-2">
            <div>
              <dt className="text-muted">Nomor Tiket Laporan</dt>
              <dd className="font-mono font-bold text-brand-deep text-[15px]">
                {submittedReport.id}
              </dd>
            </div>
            <div>
              <dt className="text-muted">Status</dt>
              <dd className="inline-flex items-center gap-1 font-semibold text-warn-fg">
                <span className="h-2 w-2 rounded-full bg-warn-fg" />
                {REPORT_STATUS_LABEL[submittedReport.status]}
              </dd>
            </div>
            <div>
              <dt className="text-muted">Rumah Sakit</dt>
              <dd className="font-semibold">{submittedReport.hospital_name}</dd>
            </div>
            <div>
              <dt className="text-muted">Waktu Pengajuan</dt>
              <dd className="font-semibold">{formatWib(submittedReport.created_at)}</dd>
            </div>
            <div className="sm:col-span-2">
              <dt className="text-muted">Koreksi yang Diajukan ({submittedReport.detail_field})</dt>
              <dd className="font-medium text-ink mt-0.5">{submittedReport.current_claim}</dd>
            </div>
          </dl>
        </div>

        {/* Edukasi Anti-Stale Crowdsourcing Tervalidasi */}
        <section
          aria-labelledby="anti-stale-title"
          className="flex flex-col gap-3 rounded-md border border-brand/30 bg-brand-tint/50 p-5 md:p-6"
        >
          <div className="flex items-center gap-2 text-brand-deep">
            <ShieldCheckIcon className="h-5 w-5 text-brand" />
            <h2 id="anti-stale-title" className="text-[16px] font-bold">
              Bagaimana Crowdsourcing Tervalidasi Menjaga Data Tetap Segar?
            </h2>
          </div>
          <p className="text-[14px] leading-6 text-ink">
            Keterbatasan sinkronisasi resmi (SATUSEHAT / SIRS) sering kali memiliki jeda waktu pembaruan
            ketersediaan tempat tidur dan layanan gawat darurat. Melalui fitur ini, laporan faktual dari keluarga
            pasien atau tenaga medis di lapangan masuk langsung ke dasbor operator rumah sakit untuk divalidasi
            silang sebelum diperbarui ke publik. Ini memastikan data tidak cepat usang tanpa mengorbankan integritas informasi.
          </p>
          <div className="flex flex-wrap gap-3 pt-1">
            <ButtonLink href="/operator/laporan-warga" variant="secondary">
              Lihat Antrean di Panel Operator →
            </ButtonLink>
            <ButtonLink
              href={`/rumah-sakit/${encodeURIComponent(submittedReport.hospital_id)}`}
              variant="tertiary"
            >
              Kembali ke Detail RS
            </ButtonLink>
            <Button
              variant="tertiary"
              onClick={() => {
                setSubmittedReport(null);
                setCurrentClaim("");
                setDetailField("");
                setNotes("");
              }}
            >
              Kirim Laporan Lain
            </Button>
          </div>
        </section>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-2 rounded-md border border-line bg-surface p-5 md:p-6">
        <div className="flex items-center gap-2 text-brand">
          <FlagIcon className="h-5 w-5 text-brand" />
          <h1 className="text-[24px] font-bold tracking-[-0.01em] text-ink md:text-[28px]">
            Laporan Koreksi Data Rumah Sakit
          </h1>
        </div>
        <p className="text-[15px] leading-6 text-muted">
          Menemukan ketersediaan ruang perawatan, tempat tidur, kontak telepon, atau layanan yang
          berbeda di lapangan? Laporkan di sini agar diverifikasi oleh operator rumah sakit.
        </p>
      </div>

      <form
        onSubmit={handleSubmit}
        className="flex flex-col gap-5 rounded-md border border-line bg-surface p-5 md:p-6"
      >
        {/* Pilih / Tampilkan Rumah Sakit */}
        <fieldset className="flex flex-col gap-2">
          <legend className="text-[14px] font-semibold text-ink">
            Rumah Sakit yang Dilaporkan <span className="text-bad-fg">*</span>
          </legend>

          {hospital ? (
            <div className="flex items-center justify-between rounded-md border border-line bg-well p-3">
              <div className="flex flex-col">
                <span className="font-semibold text-ink">{hospital.name}</span>
                <span className="text-[12px] text-muted">
                  {hospital.city_name}, {hospital.province_name}
                </span>
              </div>
              {!prefilledHospitalId && (
                <Button
                  type="button"
                  variant="tertiary"
                  onClick={() => setChosenHospital(null)}
                >
                  Ganti
                </Button>
              )}
            </div>
          ) : (
            <div className="relative flex flex-col gap-1">
              <input
                type="text"
                value={hospitalQuery}
                onChange={(e) => setHospitalQuery(e.target.value)}
                placeholder="Ketik nama rumah sakit (cth. RSUD Bekasi, RS Hermina)…"
                className={inputClasses}
              />
              {searchLoading && (
                <span className="text-[12px] text-muted">Mencari rumah sakit…</span>
              )}
              {searchResults.length > 0 && (
                <ul className="absolute top-full z-20 mt-1 max-h-60 w-full overflow-y-auto rounded-md border border-line bg-surface shadow-level3">
                  {searchResults.map((r) => (
                    <li key={r.id}>
                      <button
                        type="button"
                        onClick={() => {
                          setChosenHospital({
                            id: r.id,
                            name: r.name,
                            city_name: r.city_name,
                            province_name: "",
                          } as Hospital);
                          setHospitalQuery("");
                        }}
                        className="flex min-h-11 w-full flex-col justify-center px-3 py-2 text-left hover:bg-well"
                      >
                        <span className="font-semibold text-[14px]">{r.name}</span>
                        <span className="text-[12px] text-muted">{r.city_name}</span>
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          )}
        </fieldset>

        {/* Kategori Koreksi */}
        <fieldset className="flex flex-col gap-2">
          <legend className="text-[14px] font-semibold text-ink">
            Kategori Informasi yang Dikoreksi <span className="text-bad-fg">*</span>
          </legend>
          <div className="grid gap-2 sm:grid-cols-2">
            {REPORT_CATEGORIES.map((cat) => (
              <label
                key={cat}
                className={`flex min-h-11 cursor-pointer items-start gap-2.5 rounded-md border p-3 text-[13px] ${
                  category === cat
                    ? "border-brand bg-brand-tint/40 font-semibold text-brand-deep"
                    : "border-line bg-surface text-ink hover:bg-well"
                }`}
              >
                <input
                  type="radio"
                  name="report-category"
                  value={cat}
                  checked={category === cat}
                  onChange={() => setCategory(cat)}
                  className="mt-0.5 accent-[var(--color-brand)]"
                />
                <span>{REPORT_CATEGORY_LABEL[cat]}</span>
              </label>
            ))}
          </div>
        </fieldset>

        {/* Bagian / Layanan Spesifik */}
        <Field
          id="detail-field"
          label="Bagian atau Nama Fasilitas Spesifik"
          hint="Contoh: Ruang NICU, ICU Dewasa, Nomor Hotline IGD, Poli Anak, dll."
        >
          <input
            id="detail-field"
            type="text"
            required
            value={detailField}
            onChange={(e) => setDetailField(e.target.value)}
            placeholder="Mis. Ruang NICU / Tempat Tidur ICU"
            className={inputClasses}
          />
        </Field>

        {/* Kondisi Lapangan Terkini */}
        <Field
          id="current-claim"
          label="Kondisi Terbaru di Lapangan"
          hint="Jelaskan fakta yang Anda lihat atau konfirmasi di rumah sakit."
        >
          <textarea
            id="current-claim"
            required
            rows={3}
            value={currentClaim}
            onChange={(e) => setCurrentClaim(e.target.value)}
            placeholder="Contoh: Saat ini kapasitas NICU penuh, ada 2 pasien antre di IGD sejak pukul 10.00 WIB."
            className={inputClasses}
          />
        </Field>

        {/* Sumber Bukti / Informasi */}
        <Field
          id="source-proof"
          label="Sumber Bukti / Informasi"
          hint="Membantu operator memvalidasi keabsahan laporan."
        >
          <select
            id="source-proof"
            value={sourceProof}
            onChange={(e) => setSourceProof(e.target.value)}
            className={inputClasses}
          >
            {PROOF_OPTIONS.map((opt) => (
              <option key={opt} value={opt}>
                {opt}
              </option>
            ))}
          </select>
        </Field>

        {/* Catatan Tambahan (Opsional) */}
        <Field id="notes" label="Catatan Tambahan (Opsional)">
          <textarea
            id="notes"
            rows={2}
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Rincian lain yang perlu diketahui operator…"
            className={inputClasses}
          />
        </Field>

        {/* Informasi Kontak Pelapor (Opsional) */}
        <div className="grid gap-4 sm:grid-cols-2">
          <Field id="reporter-name" label="Nama Pelapor (Opsional)">
            <input
              id="reporter-name"
              type="text"
              value={reporterName}
              onChange={(e) => setReporterName(e.target.value)}
              placeholder="Inisial atau nama Anda"
              className={inputClasses}
            />
          </Field>
          <Field
            id="reporter-contact"
            label="Kontak / No. HP / Email (Opsional)"
            hint="Hanya digunakan jika operator perlu klarifikasi"
          >
            <input
              id="reporter-contact"
              type="text"
              value={reporterContact}
              onChange={(e) => setReporterContact(e.target.value)}
              placeholder="0812-xxxx-xxxx"
              className={inputClasses}
            />
          </Field>
        </div>

        <div className="flex items-center gap-3 pt-3">
          <Button
            type="submit"
            disabled={!hospital || !currentClaim.trim() || !detailField.trim() || submitting}
          >
            {submitting ? "Mengirim Laporan…" : "Kirim Laporan Koreksi"}
          </Button>
          {hospital && (
            <ButtonLink
              href={`/rumah-sakit/${encodeURIComponent(hospital.id)}`}
              variant="tertiary"
            >
              Batal
            </ButtonLink>
          )}
        </div>
      </form>
    </div>
  );
}
