import Link from "next/link";
import { CoverageNote } from "@/features/home/coverage-note";
import { AssistantTrigger } from "@/features/assistant/assistant-panel";
import { SearchIcon, SparklesIcon } from "@/components/ui/icons";

const QUICK_SERVICES = [
  { slug: "icu", name: "ICU" },
  { slug: "nicu", name: "NICU" },
  { slug: "picu", name: "PICU" },
  { slug: "igd-24h", name: "IGD 24 jam" },
  { slug: "rawat-inap", name: "Rawat inap" },
] as const;

const SERVICES = [
  { slug: "icu", name: "ICU", description: "Perawatan intensif dewasa & umum" },
  { slug: "nicu", name: "NICU", description: "Perawatan intensif bayi baru lahir" },
  { slug: "picu", name: "PICU", description: "Perawatan intensif anak & pediatrik" },
  { slug: "igd-24h", name: "IGD 24 jam", description: "Instalasi gawat darurat siaga" },
  { slug: "rawat-inap", name: "Rawat inap", description: "Ketersediaan tempat tidur RS" },
];

export default function HomePage() {
  return (
    <div className="home-page">
      {/* Hero Section: 2 Kolom (Kiri: Headline & Panduan Tindakan; Kanan: Pencarian Langsung yang dipindahkan) */}
      <section className="home-intro" aria-labelledby="home-title">
        <div className="home-heading flex flex-col gap-5">
          <div className="flex flex-col gap-3">
            <h1
              id="home-title"
              className="text-[32px] font-extrabold leading-tight tracking-[-0.035em] text-ink sm:text-[38px] lg:text-[44px]"
            >
              Temukan rumah sakit.{" "}
              <span className="text-brand-deep">Pahami pilihan Anda.</span>.
            </h1>
            <p className="max-w-[48ch] text-[15px] leading-relaxed text-muted sm:text-base">
              Lihat layanan, ketersediaan tempat tidur, dan informasi BPJS.
              Bandingkan pilihan dengan sumber data yang bisa Anda periksa.
            </p>
          </div>

          {/* Tombol Tindakan Utama */}
          <div className="flex flex-wrap items-center gap-3 pt-1">
            <Link
              href="/rumah-sakit"
              className="inline-flex min-h-12 items-center justify-center gap-2 rounded-xl bg-brand px-6 text-sm font-bold text-white shadow-xs transition-colors hover:bg-brand-deep"
            >
              <SparklesIcon className="h-4 w-4" />
              <span>Bantu saya cari RS</span>
            </Link>
            <AssistantTrigger className="inline-flex min-h-12 items-center justify-center gap-2 rounded-xl border border-line-strong bg-surface px-5 text-sm font-bold text-brand-deep shadow-xs transition-colors hover:border-brand hover:bg-brand-tint">
              <SparklesIcon className="h-4 w-4 text-brand" />
              <span>Tanya Asisten AI</span>
            </AssistantTrigger>
          </div>

          {/* 5 Chip Layanan Cepat */}
          <div className="flex flex-col gap-2 pt-2">
            <span className="text-xs font-semibold text-muted">
              Atau mulai dari layanan
            </span>
            <ul className="flex flex-wrap gap-2" role="list">
              {QUICK_SERVICES.map((s) => (
                <li key={s.slug}>
                  <Link
                    href={`/rumah-sakit?services=${s.slug}`}
                    className="inline-flex min-h-10 items-center rounded-lg border border-line bg-surface px-3.5 py-1.5 text-xs font-semibold text-ink shadow-xs transition-colors hover:border-brand hover:bg-brand-tint hover:text-brand-deep"
                  >
                    {s.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Banner Peringatan Medis Gawat Darurat */}
          <div className="rounded-xl border border-bad-line bg-bad-tint/60 p-3.5 text-xs leading-5 text-bad-fg">
            <span className="font-bold text-bad">Darurat? Hubungi 112.</span>{" "}
            Skor ini tentang kecocokan kebutuhan & kepastian data, bukan
            kualitas medis.
          </div>
        </div>

        {/* Kolom Kanan: Card Pencarian Langsung ("pindahkan") */}
        <div className="home-search">
          <span className="text-xs font-bold uppercase tracking-wider text-trust">
            Pencarian Langsung
          </span>
          <h2 className="mt-1 text-xl font-bold tracking-tight text-ink">
            Sudah tahu nama rumah sakitnya?
          </h2>
          <p className="mt-1 text-xs leading-5 text-muted">
            Ketik nama rumah sakit, kota, atau provinsi untuk langsung mengecek
            tempat tidur, IGD, dan BPJS.
          </p>

          <form
            action="/rumah-sakit"
            method="get"
            role="search"
            className="mt-4"
          >
            <label htmlFor="home-q" className="sr-only">
              Nama rumah sakit, kota, atau provinsi
            </label>
            <div className="home-search-field">
              <SearchIcon className="h-5 w-5 shrink-0 text-muted" />
              <input
                id="home-q"
                name="q"
                type="search"
                autoComplete="off"
                maxLength={100}
                placeholder="Nama rumah sakit, kota, atau provinsi"
              />
            </div>
            <button type="submit" className="home-search-submit">
              <span>Cari rumah sakit</span>
              <SearchIcon className="h-4 w-4" />
            </button>
          </form>

          <p className="mt-3 text-xs text-muted">
            Ingin filter lebih spesifik?{" "}
            <Link
              href="/rumah-sakit"
              className="font-semibold text-brand-deep underline underline-offset-4"
            >
              Buka katalog & peta faskes →
            </Link>
          </p>
        </div>
      </section>

      {/* Seksi Layanan Unggulan */}
      <section className="home-services" aria-labelledby="service-title">
        <div className="flex flex-wrap items-baseline justify-between gap-2 pb-4">
          <h2 id="service-title">Mulai dari layanan yang dibutuhkan</h2>
          <span className="text-[13px] text-muted">
            Selanjutnya, tentukan lokasi Anda
          </span>
        </div>
        <ul>
          {SERVICES.map(({ slug, name, description }) => (
            <li key={slug}>
              <Link href={`/rumah-sakit?services=${slug}`}>
                <span className="service-name">{name}</span>
                <span className="text-[13px] text-muted">{description}</span>
                <span className="service-arrow" aria-hidden="true">
                  ↗
                </span>
              </Link>
            </li>
          ))}
        </ul>
      </section>

      {/* Seksi Transparansi Data & Prinsip Kepercayaan */}
      <section className="home-data" aria-labelledby="data-title">
        <div>
          <h2 id="data-title">
            Keputusan yang baik
            <br />
            dimulai dari data yang jelas.
          </h2>
          <p className="mt-4 max-w-md text-muted leading-7">
            Angka ketersediaan dapat berubah. Periksa sumber dan waktu
            pembaruan, lalu hubungi rumah sakit sebelum berangkat.
          </p>
          <div className="mt-4 flex flex-wrap gap-4">
            <Link
              href="/tentang-data"
              className="inline-flex min-h-11 items-center font-semibold text-brand-deep underline underline-offset-4"
            >
              Kenali sumber dan batas data →
            </Link>
            <Link
              href="/wawasan"
              className="inline-flex min-h-11 items-center font-semibold text-trust underline underline-offset-4"
            >
              Lihat dashboard wawasan faskes →
            </Link>
          </div>
        </div>

        <dl className="home-principles">
          <div>
            <dt>Sumbernya terlihat</dt>
            <dd>
              Label membedakan data kurasi tim, SATUSEHAT Sandbox, dan simulasi.
            </dd>
          </div>
          <div>
            <dt>Waktu pembaruan tercantum</dt>
            <dd>
              Periksa umur informasi dalam WIB. Data lama tetap ditandai, bukan
              disembunyikan.
            </dd>
          </div>
          <div>
            <dt>Yang belum pasti, ditulis apa adanya</dt>
            <dd>
              “Belum diketahui” tidak berarti tidak tersedia. Skor kecocokan
              bukan penilaian kualitas medis.
            </dd>
          </div>
        </dl>
      </section>

      {/* Seksi Liputan Wilayah / Status Data Terkini */}
      <div className="home-coverage">
        <CoverageNote />
      </div>
    </div>
  );
}
