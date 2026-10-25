import type { Metadata } from "next";
import { ORIGIN_DESCRIPTION } from "@/lib/contracts/labels";
import {
  DATA_ORIGINS,
  FRESHNESS_LEVELS,
  SERVICE_STATUSES,
} from "@/lib/contracts/types";
import { FreshnessLabel, OriginBadge, StatusBadge } from "@/components/ui/badges";

export const metadata: Metadata = {
  title: "Tentang data",
  description:
    "Cakupan pilot, sumber, arti waktu, batas kesegaran, penanda simulasi, dan metode jarak yang dipakai SiagaRS.",
};

const STATUS_MEANING: Record<(typeof SERVICE_STATUSES)[number], string> = {
  available: "Sumber menyatakan layanan tersedia.",
  limited: "Sumber menyatakan layanan tersedia dengan kapasitas terbatas.",
  unavailable: "Sumber menyatakan layanan tidak tersedia.",
  unknown: "Tidak ada informasi yang dapat dipercaya. Ini BUKAN berarti tidak tersedia.",
};

export default function AboutDataPage() {
  return (
    <article className="mx-auto flex max-w-3xl flex-col gap-8">
      <header className="flex flex-col gap-2">
        <h1 className="text-[28px] font-bold leading-9 tracking-[-0.01em] md:text-[36px] md:leading-[44px] md:tracking-[-0.02em]">
          Tentang data
        </h1>
        <p className="text-[16px] leading-6 text-muted">
          Halaman ini menjelaskan apa yang SiagaRS tampilkan, dari mana
          datanya berasal, dan apa batasnya.
        </p>
      </header>

      <section className="flex flex-col gap-2">
        <h2 className="text-[24px] font-bold leading-8">Cakupan pilot</h2>
        <p>
          Antarmuka dirancang untuk skala nasional, tetapi kelengkapan data tidak.
          Versi 0.1 hanya memuat sejumlah rumah sakit pilot yang berhasil
          dikurasi, dan hanya sebagian yang profilnya lengkap. Jumlah aktual
          ditampilkan di beranda dan pada hasil pencarian; rumah sakit di luar
          data ini tidak akan muncul.
        </p>
      </section>

      <section className="flex flex-col gap-3">
        <h2 className="text-[24px] font-bold leading-8">Asal data</h2>
        <ul className="flex flex-col gap-3">
          {DATA_ORIGINS.map((origin) => (
            <li
              key={origin}
              className="flex flex-col gap-1 rounded-md border border-line bg-surface p-3 sm:flex-row sm:items-center sm:gap-4"
            >
              <span className="shrink-0">
                <OriginBadge origin={origin} />
              </span>
              <span className="text-muted">{ORIGIN_DESCRIPTION[origin]}</span>
            </li>
          ))}
        </ul>
        <p className="text-muted">
          Label asal ditentukan server untuk setiap nilai dan tidak dapat diubah
          oleh tampilan. Data berlabel <strong>Simulasi</strong> selalu
          diberi garis putus-putus dan bukan data operasional rumah sakit.
        </p>
      </section>

      <section className="flex flex-col gap-3">
        <h2 className="text-[24px] font-bold leading-8">Arti waktu</h2>
        <dl className="grid gap-3 sm:grid-cols-[max-content_1fr] sm:gap-x-6">
          <dt className="font-semibold">Diperbarui sumber</dt>
          <dd className="text-muted">
            Kapan sumber terakhir mengubah nilai tersebut. Dasar perhitungan
            kesegaran.
          </dd>
          <dt className="font-semibold">Disinkronkan</dt>
          <dd className="text-muted">
            Kapan sistem kami terakhir menarik data dari sumber. Ini
            <strong> bukan</strong> waktu pembaruan sumber.
          </dd>
          <dt className="font-semibold">Diverifikasi</dt>
          <dd className="text-muted">
            Kapan seseorang memeriksa nilai tersebut. Kesegaran tidak
            membuktikan verifikasi.
          </dd>
        </dl>
        <p className="text-muted">
          Semua waktu ditampilkan dalam WIB (Asia/Jakarta); sistem menyimpannya
          dalam UTC.
        </p>
      </section>

      <section className="flex flex-col gap-3">
        <h2 className="text-[24px] font-bold leading-8">Batas kesegaran</h2>
        <p className="text-muted">
          Batas berikut adalah kebijakan demo, bukan standar resmi, dan dihitung
          oleh server:
        </p>
        <ul className="flex flex-col gap-2">
          {FRESHNESS_LEVELS.map((level) => (
            <li key={level} className="flex items-center gap-3">
              <FreshnessLabel freshness={level} />
            </li>
          ))}
        </ul>
      </section>

      <section className="flex flex-col gap-3">
        <h2 className="text-[24px] font-bold leading-8">Status layanan dan tempat tidur</h2>
        <ul className="flex flex-col gap-2">
          {SERVICE_STATUSES.map((status) => (
            <li
              key={status}
              className="flex flex-col gap-1 sm:flex-row sm:items-center sm:gap-4"
            >
              <span className="shrink-0">
                <StatusBadge status={status} />
              </span>
              <span className="text-muted">{STATUS_MEANING[status]}</span>
            </li>
          ))}
        </ul>
        <p className="text-muted">
          Untuk tempat tidur, <strong>0 tersedia</strong> berarti nol menurut
          sumber, sedangkan <strong>Belum diketahui</strong> berarti tidak ada
          angka. Tempat tidur kosong atau status layanan bukan jaminan pasien
          diterima.
        </p>
      </section>

      <section className="flex flex-col gap-2">
        <h2 className="text-[24px] font-bold leading-8">Jarak</h2>
        <p className="text-muted">
          Jarak adalah garis lurus antara lokasi yang Anda berikan dan titik
          koordinat rumah sakit. Itu bukan jarak tempuh atau perkiraan waktu
          tiba. Lokasi Anda hanya dipakai pada permintaan pencarian dan tidak
          disimpan permanen.
        </p>
      </section>

      <section className="flex flex-col gap-2">
        <h2 className="text-[24px] font-bold leading-8">BPJS</h2>
        <p className="text-muted">
          Informasi BPJS berasal dari sumber yang tertera dan bukan jaminan
          kelayakan pasien. Konfirmasikan langsung ke rumah sakit dan BPJS
          Kesehatan.
        </p>
      </section>

      <section className="flex flex-col gap-2 rounded-md border border-line bg-surface p-4">
        <h2 className="text-[18px] font-semibold leading-[26px]">
          Afiliasi dan batas layanan
        </h2>
        <p className="text-muted">
          SiagaRS adalah prototipe lomba. Tidak ada afiliasi resmi dengan
          Kementerian Kesehatan atau BPJS Kesehatan yang diklaim di sini. Kami
          tidak menyediakan diagnosis, triase, rekam medis, pembayaran, atau
          rujukan medis produksi. Dokumentasi sumber akan ditautkan di sini
          setelah tersedia dari tim backend.
        </p>
      </section>
    </article>
  );
}
