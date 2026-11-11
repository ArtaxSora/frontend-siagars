/**
 * Penyimpanan crowdsourcing koreksi data tervalidasi di sisi klien.
 * Menggunakan localStorage browser dengan seed data contoh untuk demo & penilaian juri.
 * Dilengkapi event listener custom untuk reaktivitas antar komponen.
 */
import type {
  CrowdsourceReport,
  ReportCategory,
  ReportStatus,
} from "../contracts/types.ts";

const STORAGE_KEY = "siagars_crowdsource_reports_v1";

const SEED_REPORTS: CrowdsourceReport[] = [
  {
    id: "LAP-20261108-001",
    hospital_id: "rs-bekasi-01",
    hospital_name: "RSUD dr. Chasbullah Abdulmadjid",
    city_name: "Kota Bekasi",
    province_name: "Jawa Barat",
    category: "beds",
    detail_field: "Tempat Tidur ICU",
    current_claim: "ICU penuh per siang ini (sedang ada 4 pasien antre masuk dari IGD)",
    source_proof: "Keluarga pasien sedang menunggu di depan IGD RS",
    notes: "Keluarga saya diarahkan mencari rujukan luar karena kapasitas ICU terisi penuh.",
    reporter_name: "Keluarga Pasien Ny. S",
    reporter_contact: "0812-3456-7890",
    created_at: "2026-11-08T09:15:00+07:00",
    status: "pending_review",
    reviewed_at: null,
    reviewed_by: null,
    review_note: null,
  },
  {
    id: "LAP-20261108-002",
    hospital_id: "rs-jaksel-02",
    hospital_name: "RS Hermina Kemayoran",
    city_name: "Jakarta Pusat",
    province_name: "DKI Jakarta",
    category: "phone",
    detail_field: "Nomor Telepon Hotline IGD",
    current_claim: "Hotline IGD berganti ke 021-2260-8899 ext 118",
    source_proof: "Papan informasi resmi di lobi RS",
    notes: "Nomor lama di portal sering nada sibuk.",
    reporter_name: "Relawan Kesehatan DKI",
    reporter_contact: "relawan@siagars.id",
    created_at: "2026-11-08T08:30:00+07:00",
    status: "verified",
    reviewed_at: "2026-11-08T09:00:00+07:00",
    reviewed_by: "Operator Pusat SiagaRS",
    review_note: "Dikonfirmasi langsung melalui panggilan ke admisi RS Hermina.",
  },
  {
    id: "LAP-20261107-003",
    hospital_id: "rs-bogor-03",
    hospital_name: "RS PMI Bogor",
    city_name: "Kota Bogor",
    province_name: "Jawa Barat",
    category: "services",
    detail_field: "Layanan Kateterisasi Jantung (Cath Lab)",
    current_claim: "Cath Lab beroperasi normal 24 jam",
    source_proof: "Tenaga medis RS terkait",
    notes: "Alat cath lab selesai kalibrasi berkala dan sudah aktif.",
    reporter_name: "Staf Farmasi RS",
    created_at: "2026-11-07T16:45:00+07:00",
    status: "verified",
    reviewed_at: "2026-11-07T17:15:00+07:00",
    reviewed_by: "Operator Dinkes",
    review_note: "Surat operasional fasilitas sudah diverifikasi.",
  },
];

let memoryReports: CrowdsourceReport[] | null = null;

function notifyChange() {
  if (typeof window !== "undefined") {
    window.dispatchEvent(new CustomEvent("siagars:reports-updated"));
  }
}

export function getCrowdsourceReports(): CrowdsourceReport[] {
  if (typeof window === "undefined") {
    return memoryReports ?? SEED_REPORTS;
  }

  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(SEED_REPORTS));
      memoryReports = SEED_REPORTS;
      return SEED_REPORTS;
    }
    const parsed = JSON.parse(raw) as CrowdsourceReport[];
    memoryReports = parsed;
    return parsed;
  } catch {
    return memoryReports ?? SEED_REPORTS;
  }
}

export interface NewReportInput {
  hospital_id: string;
  hospital_name: string;
  city_name: string;
  province_name: string;
  category: ReportCategory;
  detail_field: string;
  current_claim: string;
  source_proof: string;
  notes: string;
  reporter_name?: string;
  reporter_contact?: string;
}

export function submitCrowdsourceReport(input: NewReportInput): CrowdsourceReport {
  const current = getCrowdsourceReports();
  const nextNum = current.length + 1;
  const today = new Date().toISOString().slice(0, 10).replace(/-/g, "");
  const id = `LAP-${today}-${String(nextNum).padStart(3, "0")}`;

  const report: CrowdsourceReport = {
    ...input,
    id,
    created_at: new Date().toISOString(),
    status: "pending_review",
    reviewed_at: null,
    reviewed_by: null,
    review_note: null,
  };

  const updated = [report, ...current];
  memoryReports = updated;

  if (typeof window !== "undefined") {
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
    } catch {
      // storage full or disabled
    }
    notifyChange();
  }

  return report;
}

export function updateReportStatus(
  reportId: string,
  status: ReportStatus,
  reviewerName = "Operator RS",
  note = "",
): CrowdsourceReport | null {
  const current = getCrowdsourceReports();
  const idx = current.findIndex((r) => r.id === reportId);
  if (idx === -1) return null;

  const target = current[idx];
  const updatedReport: CrowdsourceReport = {
    ...target,
    status,
    reviewed_at: new Date().toISOString(),
    reviewed_by: reviewerName,
    review_note: note || (status === "verified" ? "Diverifikasi operator RS" : "Laporan tidak dapat diverifikasi"),
  };

  const updated = [...current];
  updated[idx] = updatedReport;
  memoryReports = updated;

  if (typeof window !== "undefined") {
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
    } catch {
      // storage quota or blocked
    }
    notifyChange();
  }

  return updatedReport;
}
