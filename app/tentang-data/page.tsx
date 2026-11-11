import type { Metadata } from "next";
import Link from "next/link";
import { ORIGIN_DESCRIPTION } from "@/lib/contracts/labels";
import {
  DATA_ORIGINS,
  FRESHNESS_LEVELS,
  SERVICE_STATUSES,
} from "@/lib/contracts/types";
import { FreshnessLabel, OriginBadge, StatusBadge } from "@/components/ui/badges";

export const metadata: Metadata = {
  title: "Tentang data & metodologi",
  description:
    "Metodologi skor rekomendasi dan kualitas data dengan bahasa awam, mekanisme sinkronisasi berkala serta crowdsourcing tervalidasi, dan batas layanan SiagaRS.",
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
          Tentang data &amp; metodologi
        </h1>
        <p className="text-[16px] leading-6 text-muted">
          Halaman ini menjelaskan dengan bahasa awam bagaimana SiagaRS memberi
          skor rekomendasi, menilai kualitas data, menjaga informasi agar tidak
          cepat usang, serta apa saja batasan data yang ditampilkan.
        </p>
      </header>

      <section className="flex flex-col gap-2">
        <h2 className="text-[24px] font-bold leading-8">Cakupan pilot</h2>
        <p className="text-muted">
          Antarmuka dirancang untuk skala nasional, tetapi kelengkapan data saat
          ini difokuskan pada wilayah pilot Jabodetabek. Sebagian rumah sakit
          memiliki profil fasilitas terkurasi, sementara sisanya dilengkapi data
          simulasi berlabel untuk keperluan demonstrasi. Jumlah aktual per kota
          dapat dilihat langsung di halaman{" "}
          <Link href="/wawasan" className="font-semibold text-trust underline">
            Wawasan data
          </Link>
          .
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
          oleh tampilan. Data berlabel <strong>Simulasi</strong> selalu diberi
          garis putus-putus dan bukan data operasional rumah sakit.
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
            Kapan tim atau operator memeriksa nilai tersebut secara langsung.
            Kesegaran tidak otomatis membuktikan verifikasi manusia.
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
          Tingkat kesegaran dihitung otomatis oleh server berdasarkan selisih
          waktu sekarang dengan <em>Diperbarui sumber</em>:
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
        <h2 className="text-[24px] font-bold leading-8">
          Status layanan dan tempat tidur
        </h2>
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
          sumber, sedangkan <strong>Belum diketahui</strong> berarti sumber
          belum menyediakan angka. Tempat tidur kosong atau status layanan bukan
          jaminan pasien diterima.
        </p>
      </section>

      <section id="skor-rekomendasi" className="flex scroll-mt-24 flex-col gap-3">
        <h2 className="text-[24px] font-bold leading-8">
          Metodologi skor rekomendasi (bahasa awam)
        </h2>
        <p className="text-muted">
          Di halaman{" "}
          <Link href="/pilih-rs" className="font-semibold text-trust underline">
            Pilih RS
          </Link>
          , setiap rumah sakit diberi skor <strong>0 sampai 100</strong>. Skor
          ini mengukur{" "}
          <strong>
            seberapa cocok fasilitas RS dengan kebutuhan yang Anda pilih dan
            seberapa pasti data yang kami miliki
          </strong>{" "}
          — sama sekali <strong>bukan</strong> penilaian mutu dokter atau
          kualitas medis rumah sakit.
        </p>

        <div className="flex flex-col gap-2 rounded-md border border-line bg-surface p-4">
          <h3 className="text-[16px] font-semibold">
            Langkah 1 — Penyaringan awal (Filter keras)
          </h3>
          <p className="text-muted">
            Sebelum diberi skor, sistem menyisihkan rumah sakit yang jelas tidak
            memenuhi syarat mutlak Anda: (1) salah satu layanan yang Anda
            butuhkan tercatat <strong>Tidak tersedia</strong>, (2) Anda memilih{" "}
            <strong>BPJS wajib</strong> tetapi RS tercatat tidak menerima BPJS,
            (3) lokasi RS berada di luar radius/wilayah pilihan, atau (4) RS
            tercatat tidak beroperasi. Jumlah RS yang disisihkan beserta
            alasannya selalu ditampilkan di bagian atas hasil.
          </p>
        </div>

        <div className="flex flex-col gap-2 rounded-md border border-line bg-surface p-4">
          <h3 className="text-[16px] font-semibold">
            Langkah 2 — Penilaian 5 komponen
          </h3>
          <p className="text-muted">
            Rumah sakit yang lolos penyaringan dinilai dari lima hal berikut:
          </p>
          <dl className="grid gap-x-6 gap-y-2 pt-1 sm:grid-cols-[max-content_1fr]">
            <dt className="font-semibold">1. Kecocokan layanan (40%)</dt>
            <dd className="text-muted">
              Jika layanan tercatat <em>Tersedia</em> mendapat nilai penuh
              (100%), <em>Terbatas</em> mendapat 60%, dan{" "}
              <em>Belum diketahui</em> tetap mendapat 20% (disertai catatan
              bahwa statusnya perlu dikonfirmasi lewat telepon).
            </dd>
            <dt className="font-semibold">2. Tempat tidur relevan (20%)</dt>
            <dd className="text-muted">
              Untuk layanan yang membutuhkan ruang rawat (ICU, NICU, PICU, rawat
              inap): ada tempat tidur kosong (&gt; 0) mendapat 100%, penuh (0
              tersedia) mendapat 0%, dan belum diketahui mendapat 30%.
            </dd>
            <dt className="font-semibold">3. Jarak garis lurus (20%)</dt>
            <dd className="text-muted">
              Makin dekat ke titik lokasi Anda dibanding batas radius, makin
              tinggi nilainya. Hanya dihitung bila Anda memakai lokasi GPS/peta.
            </dd>
            <dt className="font-semibold">4. Kesesuaian BPJS (10%)</dt>
            <dd className="text-muted">
              Dihitung bila Anda mewajibkan BPJS: tercatat menerima BPJS
              mendapat 100%, sedangkan belum diketahui mendapat 30%.
            </dd>
            <dt className="font-semibold">5. Keyakinan data (10%)</dt>
            <dd className="text-muted">
              Diambil dari <em>Skor kualitas data</em> RS tersebut (kelengkapan,
              kesegaran, dan asal sumber).
            </dd>
          </dl>
        </div>

        <div className="flex flex-col gap-2 rounded-md border border-line bg-surface p-4">
          <h3 className="text-[16px] font-semibold">
            Langkah 3 — Penyesuaian bobot &amp; pengurangan untuk data simulasi
          </h3>
          <ul className="flex list-disc flex-col gap-1.5 pl-5 text-muted">
            <li>
              <strong>Pembagian ulang bobot otomatis:</strong> Bila ada komponen
              yang tidak dipakai (misalnya Anda memilih kota tanpa titik lokasi
              sehingga jarak tidak dihitung, atau BPJS tidak wajib), bobotnya
              dibagikan secara adil ke komponen lain agar total tetap 100 poin.
            </li>
            <li>
              <strong>Pengurangan nilai simulasi (×0,8):</strong> Bila status
              layanan atau tempat tidur suatu RS masih berasal dari data{" "}
              <strong>Simulasi</strong>, poin komponen tersebut dikalikan{" "}
              <strong>0,8</strong> (dikurangi 20%). Dengan begitu, data contoh
              tidak akan mengalahkan rumah sakit yang datanya sudah{" "}
              <strong>Kurasi Tim</strong> dengan kondisi setara.
            </li>
            <li>
              <strong>Kategori hasil:</strong> Skor <strong>≥ 75</strong> =
              Kecocokan tinggi, <strong>50–74</strong> = Kecocokan sedang, dan{" "}
              <strong>&lt; 50</strong> = Kecocokan rendah.
            </li>
          </ul>
        </div>

        <div className="flex flex-col gap-1.5 rounded-md border border-line bg-well p-4 text-[13px] leading-5">
          <p className="font-semibold text-ink">Contoh perhitungan sederhana:</p>
          <p className="text-muted">
            Ibu Rina mencari <strong>NICU</strong> dalam radius{" "}
            <strong>20 km</strong> dengan <strong>BPJS wajib</strong>. RS A
            berjarak 6 km, NICU tercatat tersedia (<em>Kurasi Tim</em>), tempat
            tidur NICU kosong 2 unit (<em>Kurasi Tim</em>), menerima BPJS, dan
            skor kualitas datanya 80/100. Perhitungannya: Layanan{" "}
            <strong className="text-ink">40 poin</strong> + Tempat tidur{" "}
            <strong className="text-ink">20 poin</strong> + Jarak{" "}
            <strong className="text-ink">14 poin</strong> + BPJS{" "}
            <strong className="text-ink">10 poin</strong> + Keyakinan data{" "}
            <strong className="text-ink">8 poin</strong> ={" "}
            <strong className="text-ink">92/100 (Kecocokan tinggi)</strong>.
            Seandainya data NICU dan tempat tidur RS tersebut masih berlabel{" "}
            <em>Simulasi</em>, poin layanan turun menjadi 32 dan tempat tidur
            menjadi 16 sehingga skor akhirnya menjadi{" "}
            <strong className="text-ink">80/100</strong>.
          </p>
        </div>
      </section>

      <section id="kualitas-data" className="flex scroll-mt-24 flex-col gap-3">
        <h2 className="text-[24px] font-bold leading-8">
          Metodologi skor kualitas data (bahasa awam)
        </h2>
        <p className="text-muted">
          Pada setiap kartu rumah sakit terdapat lencana{" "}
          <strong>Data baik</strong> (skor ≥ 75), <strong>Data cukup</strong>{" "}
          (50–74), atau <strong>Data terbatas</strong> (&lt; 50). Skor ini
          menjawab pertanyaan:{" "}
          <em>
            &ldquo;Seberapa lengkap dan baru catatan SiagaRS tentang rumah sakit
            ini?&rdquo;
          </em>{" "}
          Rumah sakit besar yang pelaporannya belum lengkap bisa saja memiliki
          label <em>Data terbatas</em> — itu adalah cerminan kelengkapan catatan
          kami, bukan kualitas rumah sakitnya.
        </p>
        <dl className="grid gap-x-6 gap-y-2 rounded-md border border-line bg-surface p-4 sm:grid-cols-[max-content_1fr]">
          <dt className="font-semibold">Kelengkapan · 50%</dt>
          <dd className="text-muted">
            Menghitung berapa banyak dari 12 informasi kunci yang sudah terisi
            (nomor telepon, titik koordinat peta, status BPJS, layanan utama,
            dan kategori tempat tidur). Makin sedikit yang berstatus{" "}
            <em>Belum diketahui</em>, makin tinggi nilainya.
          </dd>
          <dt className="font-semibold">Kesegaran · 25%</dt>
          <dd className="text-muted">
            Diukur dari umur data <strong>paling lama</strong> pada layanan atau
            tempat tidur RS tersebut: Terbaru (&lt; 1 jam) bernilai 100%, Mulai
            lama (1–24 jam) 70%, Kedaluwarsa (&gt; 24 jam) 30%, dan Tidak
            diketahui 20%.
          </dd>
          <dt className="font-semibold">Asal sumber · 25%</dt>
          <dd className="text-muted">
            Menilai ketertelusuran sumber mayoritas data: <em>Kurasi Tim</em>{" "}
            bernilai penuh (100%), <em>SATUSEHAT</em> 80%, dan{" "}
            <em>Simulasi</em> 50%.
          </dd>
        </dl>
      </section>

      <section id="pembaruan-data" className="flex scroll-mt-24 flex-col gap-3">
        <h2 className="text-[24px] font-bold leading-8">
          Menjaga data tidak cepat usang: sinkronisasi berkala &amp;
          crowdsourcing tervalidasi
        </h2>
        <p className="text-muted">
          Ketersediaan layanan dan tempat tidur rumah sakit berubah cepat. Agar
          keluarga pasien tidak mengambil keputusan dari data yang sudah basi,
          SiagaRS menggabungkan tiga lapis pembaruan dan penjagaan mutu data:
        </p>

        <ol className="flex flex-col gap-3">
          <li className="flex flex-col gap-1 rounded-md border border-line bg-surface p-4">
            <h3 className="text-[16px] font-semibold">
              1. Sinkronisasi berkala otomatis &amp; peluruhan kesegaran
            </h3>
            <p className="text-muted">
              Identitas, alamat, dan klasifikasi dasar rumah sakit disinkronkan
              secara berkala dari indeks resmi (SATUSEHAT Master Sarana Index).
              Sistem memisahkan waktu penarikan (<em>synced_at</em>) dari waktu
              pembaruan sumber (<em>source_updated_at</em>). Bila suatu data
              belum diperbarui lebih dari 1 jam atau 24 jam, statusnya otomatis
              turun menjadi <em>Mulai lama</em> atau <em>Kedaluwarsa</em>, dan
              skor kualitas datanya ikut berkurang sehingga pengguna langsung
              waspada. Untuk data berlabel <em>Simulasi</em> pada lingkungan
              demo, penjadwal harian memperbarui sampel tanpa pernah menyentuh
              data <em>Kurasi Tim</em>.
            </p>
          </li>

          <li className="flex flex-col gap-1 rounded-md border border-line bg-surface p-4">
            <h3 className="text-[16px] font-semibold">
              2. Pembaruan operator RS &amp; kurasi sumber resmi berbukti
            </h3>
            <p className="text-muted">
              Petugas operator rumah sakit dapat memperbarui status layanan
              (ICU, NICU, PICU, IGD) dan jumlah tempat tidur secara langsung
              melalui{" "}
              <Link
                href="/operator"
                className="font-semibold text-trust underline"
              >
                Panel Operator
              </Link>
              . Setiap perubahan dilindungi nomor versi (
              <em>optimistic concurrency control</em>) agar pembaruan serentak
              tidak saling menimpa, serta dicatat ke dalam log audit. Di luar
              pembaruan operator, tim kurator memverifikasi informasi dari situs
              resmi RS dan Dinas Kesehatan lengkap dengan tautan sumber yang
              bisa diklik publik.
            </p>
          </li>

          <li className="flex flex-col gap-1 rounded-md border border-line bg-surface p-4">
            <h3 className="text-[16px] font-semibold">
              3. Crowdsourcing tervalidasi (laporan publik berjenjang)
            </h3>
            <p className="text-muted">
              Di lapangan, keluarga pasien yang baru saja menghubungi atau
              mendatangi rumah sakit sering kali paling cepat mengetahui
              perubahan mendadak (misalnya nomor telepon yang berganti atau
              kamar yang baru saja penuh). Agar laporan warga membantu tanpa
              menimbulkan informasi palsu, SiagaRS merancang mekanisme{" "}
              <strong>crowdsourcing tervalidasi</strong>: laporan pengguna{" "}
              <strong>tidak pernah langsung menimpa</strong> status utama.
              Laporan masuk ke antrean moderasi, dibandingkan silang antar
              pelapor independen, lalu diverifikasi oleh operator RS atau
              kurator sebelum disahkan menjadi data <em>Kurasi Tim</em>.
            </p>
          </li>
        </ol>
      </section>

      <section className="flex flex-col gap-2">
        <h2 className="text-[24px] font-bold leading-8">Jarak</h2>
        <p className="text-muted">
          Jarak adalah garis lurus antara lokasi yang Anda berikan dan titik
          koordinat rumah sakit. Itu bukan jarak tempuh jalan raya atau
          perkiraan waktu tiba. Lokasi Anda hanya dipakai pada permintaan
          pencarian dan tidak disimpan permanen.
        </p>
      </section>

      <section className="flex flex-col gap-2">
        <h2 className="text-[24px] font-bold leading-8">BPJS &amp; privasi</h2>
        <p className="text-muted">
          Informasi penerimaan BPJS pada profil RS berasal dari sumber yang
          tertera dan bukan jaminan kelayakan pasien. Konfirmasikan langsung ke
          rumah sakit dan BPJS Kesehatan.
        </p>
        <p className="text-muted">
          Fitur{" "}
          <Link href="/cek-bpjs" className="font-semibold text-trust underline">
            Cek BPJS
          </Link>{" "}
          adalah simulasi dengan peserta sintetis. Sesuai keputusan privasi
          kami, server <strong>tidak menyimpan NIK maupun nama lengkap</strong>{" "}
          Anda; riwayat pengecekan hanya disimpan dalam bentuk tersamar selama
          30 hari dan tidak memiliki fitur pembuka samaran (<em>no reveal</em>).
        </p>
      </section>

      <section className="flex flex-col gap-2 rounded-md border border-line bg-surface p-4">
        <h2 className="text-[18px] font-semibold leading-[26px]">
          Afiliasi dan batas layanan
        </h2>
        <p className="text-muted">
          SiagaRS adalah prototipe pendukung keputusan berbasis data. Tidak ada
          afiliasi resmi dengan Kementerian Kesehatan atau BPJS Kesehatan yang
          diklaim di sini. Kami tidak menyediakan diagnosis, triase, rekam
          medis, pembayaran, atau rujukan medis produksi. Dalam keadaan gawat
          darurat, segera hubungi <strong>112</strong>.
        </p>
      </section>
    </article>
  );
}
