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
          Saat ini SiagaRS hanya memuat rumah sakit pilot di Jabodetabek, dan
          hanya sebagian yang profil fasilitasnya lengkap. Jumlah aktual
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

      <section id="skor-rekomendasi" className="flex scroll-mt-24 flex-col gap-3">
        <h2 className="text-[24px] font-bold leading-8">Skor rekomendasi</h2>
        <p className="text-muted">
          Di <strong>Pilih RS</strong>, server memberi setiap rumah sakit skor
          0–100 tentang <strong>kecocokan dengan kebutuhan Anda dan kepastian
          datanya</strong> — bukan kualitas medis. Tampilan hanya menampilkan
          skor itu apa adanya.
        </p>
        <ol className="flex list-decimal flex-col gap-1 pl-5 text-muted">
          <li>
            Rumah sakit dikeluarkan bila salah satu layanan yang Anda pilih
            tercatat <strong>tidak tersedia</strong>, bila BPJS wajib tetapi RS
            tercatat tidak menerima BPJS, bila di luar radius/wilayah, atau bila
            tercatat tidak beroperasi. Jumlahnya ditampilkan di hasil.
          </li>
          <li>Sisanya dinilai dari lima komponen:</li>
        </ol>
        <dl className="grid gap-x-6 gap-y-2 rounded-md border border-line bg-surface p-4 sm:grid-cols-[max-content_1fr]">
          <dt className="font-semibold">Layanan yang dibutuhkan · 40%</dt>
          <dd className="text-muted">Tersedia penuh, terbatas sebagian (60%), belum diketahui rendah (20%).</dd>
          <dt className="font-semibold">Tempat tidur · 20%</dt>
          <dd className="text-muted">Ada yang kosong penuh, nol tidak dapat nilai, belum diketahui rendah (30%).</dd>
          <dt className="font-semibold">Jarak · 20%</dt>
          <dd className="text-muted">Makin dekat (garis lurus) makin tinggi; hanya bila Anda memakai lokasi.</dd>
          <dt className="font-semibold">BPJS · 10%</dt>
          <dd className="text-muted">Hanya bila BPJS wajib; belum diketahui rendah (30%).</dd>
          <dt className="font-semibold">Keyakinan data · 10%</dt>
          <dd className="text-muted">Diambil dari skor kualitas data di bawah.</dd>
        </dl>
        <p className="text-muted">
          Komponen yang tidak berlaku (mis. jarak tanpa lokasi) dihapus dan
          bobotnya dibagi ke komponen lain. Nilai layanan dan tempat tidur yang
          berasal dari data <strong>simulasi</strong> dikali 0,8 agar tidak
          mengalahkan data kurasi yang setara. Level: <strong>tinggi</strong>{" "}
          ≥ 75, <strong>sedang</strong> 50–74, <strong>rendah</strong> &lt; 50.
          Setiap kartu hasil punya tombol &ldquo;Kenapa skor ini?&rdquo; berisi
          rincian dan daftar yang belum diketahui.
        </p>
      </section>

      <section id="kualitas-data" className="flex scroll-mt-24 flex-col gap-3">
        <h2 className="text-[24px] font-bold leading-8">Skor kualitas data</h2>
        <p className="text-muted">
          Setiap rumah sakit punya label <strong>Data baik</strong> (≥ 75),{" "}
          <strong>Data cukup</strong> (50–74), atau{" "}
          <strong>Data terbatas</strong> (&lt; 50). Ini menilai{" "}
          <strong>data kami tentang rumah sakit</strong>, bukan rumah sakitnya:
        </p>
        <ul className="flex list-disc flex-col gap-1 pl-5 text-muted">
          <li>
            <strong>Kelengkapan (50%)</strong> — berapa banyak item kunci yang
            diketahui: telepon, koordinat, BPJS, status layanan, dan tempat tidur.
          </li>
          <li>
            <strong>Kesegaran (25%)</strong> — memakai data paling lama: terbaru
            penuh, mulai lama 70%, kedaluwarsa 30%, tidak diketahui 20%.
          </li>
          <li>
            <strong>Asal (25%)</strong> — kurasi tim penuh, SATUSEHAT 80%,
            simulasi 50%.
          </li>
        </ul>
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
        <p className="text-muted">
          Fitur <strong>Cek BPJS</strong> adalah simulasi dengan peserta
          sintetis. Kami tidak menyimpan NIK lengkap Anda; riwayat pengecekan
          disimpan dalam bentuk tersamar selama 30 hari.
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
