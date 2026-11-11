import type { Metadata } from "next";
import { BpjsCheck } from "@/features/bpjs/bpjs-check";

export const metadata: Metadata = {
  title: "Cek BPJS",
  description: "Simulasi pemeriksaan status kepesertaan BPJS Kesehatan dengan data demo.",
  robots: { index: false },
};

export default function BpjsCheckPage() {
  return (
    <div className="mx-auto flex max-w-2xl flex-col gap-4">
      <h1 className="text-[28px] font-bold leading-9 tracking-[-0.01em] md:text-[36px] md:leading-[44px] md:tracking-[-0.02em]">
        Cek BPJS
      </h1>
      <p className="text-muted">
        Periksa status kepesertaan BPJS Kesehatan dengan NIK, nama, dan tanggal
        lahir. Fitur ini adalah <strong>simulasi</strong> dengan data peserta
        sintetis: SiagaRS tidak terhubung ke sistem BPJS Kesehatan.
      </p>
      <p className="rounded-md border border-line bg-well px-3 py-2 text-[14px]">
        <strong>Simulasi — bukan BPJS Kesehatan.</strong> Kami tidak menyimpan
        NIK lengkap Anda; riwayat pengecekan disimpan dalam bentuk tersamar
        selama 30 hari. Data yang Anda isi tidak disimpan di peramban.
      </p>
      <BpjsCheck />
    </div>
  );
}
