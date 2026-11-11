import Link from "next/link";
import { CoverageNote } from "@/features/home/coverage-note";
import { ButtonLink } from "@/components/ui/button";
import { inputClasses } from "@/components/ui/field";
import { FlagIcon, SearchIcon, SparklesIcon } from "@/components/ui/icons";
import { EmergencyBanner } from "@/components/ui/decision";

// Mulai asisten dengan layanan sudah terpilih (langsung ke langkah lokasi).
const QUICK_LINKS = [
  { href: "/pilih-rs?step=2&services=icu", label: "ICU" },
  { href: "/pilih-rs?step=2&services=nicu", label: "NICU" },
  { href: "/pilih-rs?step=2&services=picu", label: "PICU" },
  { href: "/pilih-rs?step=2&services=igd-24h", label: "IGD 24 jam" },
  { href: "/pilih-rs?step=2&services=rawat-inap", label: "Rawat inap" },
] as const;

const ASSISTANT_SAMPLE_PROMPTS = [
  "Cari RS di Bekasi yang punya NICU dan terima BPJS",
  "RS dengan ICU di Jakarta Selatan",
  "Cari IGD 24 jam dan rawat inap di Depok",
] as const;

const HOW_SCORE_WORKS = [
  {
    title: "Sebutkan kebutuhan",
    body: "Pilih layanan (mis. NICU), lokasi pasien, dan apakah BPJS wajib.",
  },
  {
    title: "Kami saring & beri skor",
    body: "RS yang tercatat tidak menyediakan layanan dikeluarkan. Sisanya diberi skor 0–100 dari kecocokan layanan, tempat tidur, jarak garis lurus, BPJS, dan keyakinan data.",
  },
  {
    title: "Anda memutuskan",
    body: "Setiap skor bisa dibuka alasannya, lengkap dengan yang belum diketahui. Telepon RS, buka rute, atau bandingkan 2–3 pilihan.",
  },
] as const;

const HOW_TO_READ = [
  {
    title: "Setiap informasi punya sumber",
    body: "Label Kurasi Tim, Simulasi, atau SATUSEHAT Sandbox menunjukkan dari mana sebuah nilai berasal — dan seberapa dapat dipercaya sebagai data operasional.",
  },
  {
    title: "Umur data selalu terlihat",
    body: "Setiap status menampilkan waktu pembaruan dari sumber (WIB) dan tingkat kesegarannya. Data lama tidak disembunyikan.",
  },
  {
    title: "“Belum diketahui” bukan nol",
    body: "Bila sumber tidak memberi angka, kami menulis Belum diketahui — bukan 0 dan bukan tidak tersedia.",
  },
] as const;

export default function HomePage() {
  return (
    <div className="flex flex-col gap-10">
      <section className="flex flex-col gap-5 rounded-md border border-line bg-surface p-5 md:p-10">
        <div className="flex max-w-3xl flex-col gap-3">
          <h1 className="text-[28px] font-bold leading-9 tracking-[-0.01em] md:text-[36px] md:leading-[44px] md:tracking-[-0.02em]">
            Putuskan rumah sakit yang tepat dengan data yang jujur.
          </h1>
          <p className="text-[16px] leading-6 text-muted">
            Sebutkan layanan yang dibutuhkan dan lokasi pasien. SiagaRS
            mengurutkan rumah sakit yang paling cocok, menjelaskan alasan
            skornya, dan selalu menunjukkan sumber, umur, serta kepastian
            datanya.
          </p>
        </div>

        <div className="flex flex-col gap-4">
          <div className="flex flex-wrap items-center gap-3">
            <ButtonLink href="/pilih-rs" className="px-6 text-[16px]">
              Bantu saya pilih RS
            </ButtonLink>
            <ButtonLink
              href="/asisten"
              variant="secondary"
              className="px-5 text-[15px] font-bold text-brand-deep hover:border-brand"
            >
              <SparklesIcon className="text-brand" /> Tanya Asisten AI
            </ButtonLink>
          </div>

          <div className="flex flex-col gap-2">
            <p className="text-[13px] font-semibold">Atau mulai dari layanan</p>
            <ul className="flex flex-wrap gap-2">
              {QUICK_LINKS.map((l) => (
                <li key={l.href}>
                  <Link
                    href={l.href}
                    className="inline-flex min-h-11 items-center rounded-lg border md:min-h-9 border-line bg-well px-3 text-[13px] font-semibold text-muted hover:border-line-strong"
                  >
                    {l.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>

        <EmergencyBanner />
      </section>

      {/* Fitur Baru: Asisten AI Box */}
      <section
        aria-labelledby="asisten-title"
        className="flex flex-col gap-3.5 rounded-md border border-brand/30 bg-brand-tint/40 p-5 md:p-6"
      >
        <div className="flex items-center gap-2 text-brand-deep">
          <SparklesIcon className="h-5 w-5 text-brand" />
          <h2 id="asisten-title" className="text-[18px] font-bold leading-[26px]">
            Cari lebih cepat dengan kalimat bebas
          </h2>
        </div>
        <p className="text-[14px] leading-5 text-muted">
          Punya kebutuhan spesifik? Tanyakan langsung ke Asisten AI SiagaRS tanpa mengisi formulir bertingkat:
        </p>
        <div className="flex flex-wrap gap-2 pt-1">
          {ASSISTANT_SAMPLE_PROMPTS.map((p) => (
            <Link
              key={p}
              href={`/asisten?prompt=${encodeURIComponent(p)}`}
              className="inline-flex min-h-11 items-center rounded-lg border border-brand/20 bg-surface px-3 py-1.5 text-[13px] font-medium text-ink hover:border-brand hover:text-brand-deep"
            >
              &ldquo;{p}&rdquo; →
            </Link>
          ))}
        </div>
      </section>

      <section aria-labelledby="cari-nama" className="flex flex-col gap-3 rounded-md border border-line bg-surface p-5 md:p-6">
        <h2 id="cari-nama" className="text-[18px] font-semibold leading-[26px]">
          Sudah tahu nama rumah sakitnya?
        </h2>

        {/* Form GET biasa: tetap berfungsi tanpa JavaScript. */}
        <form
          action="/rumah-sakit"
          method="get"
          role="search"
          className="flex max-w-3xl flex-col gap-2 sm:flex-row"
        >
          <label htmlFor="home-q" className="sr-only">
            Cari nama rumah sakit, kota, atau provinsi
          </label>
          <input
            id="home-q"
            name="q"
            type="search"
            autoComplete="off"
            maxLength={100}
            placeholder="Nama rumah sakit, kota, atau provinsi"
            className={`${inputClasses} sm:flex-1`}
          />
          <button
            type="submit"
            className="inline-flex min-h-11 items-center justify-center gap-2 rounded-md bg-brand md:min-h-10 px-5 text-[14px] font-semibold text-white hover:bg-brand-deep"
          >
            <SearchIcon /> Cari
          </button>
        </form>

        <CoverageNote />
      </section>

      <section aria-labelledby="cara-skor" className="flex flex-col gap-4">
        <h2 id="cara-skor" className="text-[24px] font-bold leading-8 tracking-[-0.01em]">
          Cara kerja skor
        </h2>
        <ol className="grid gap-4 md:grid-cols-3">
          {HOW_SCORE_WORKS.map((item, i) => (
            <li
              key={item.title}
              className="flex flex-col gap-2 rounded-md border border-line bg-surface p-4"
            >
              <span
                aria-hidden="true"
                className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-brand-tint font-bold text-brand-deep"
              >
                {i + 1}
              </span>
              <h3 className="text-[16px] font-semibold">{item.title}</h3>
              <p className="text-muted">{item.body}</p>
            </li>
          ))}
        </ol>
        <p className="text-muted">
          Skor adalah tentang kecocokan kebutuhan dan kepastian data — bukan
          kualitas medis.{" "}
          <Link href="/tentang-data#skor-rekomendasi" className="font-semibold text-trust underline">
            Baca metodologinya
          </Link>
        </p>
      </section>

      {/* Demo Rujukan & Koreksi Data Warga */}
      <div className="grid gap-4 md:grid-cols-2">
        <section
          aria-labelledby="lacak-title"
          className="flex flex-col justify-between gap-3 rounded-md border-[1.5px] border-dashed border-sim-line bg-surface p-5 md:p-6"
        >
          <div className="flex flex-col gap-1">
            <h2 id="lacak-title" className="text-[18px] font-semibold leading-[26px]">
              Punya kode demo rujukan?
            </h2>
            <p className="text-muted">
              Lihat status dan linimasa rujukan <strong>simulasi</strong>. Tidak
              ada rujukan resmi yang dibuat lewat prototipe ini.
            </p>
          </div>
          <ButtonLink href="/lacak-rujukan" variant="secondary" className="self-start">
            Lacak rujukan
          </ButtonLink>
        </section>

        <section
          aria-labelledby="lapor-title"
          className="flex flex-col justify-between gap-3 rounded-md border border-line bg-surface p-5 md:p-6"
        >
          <div className="flex flex-col gap-1">
            <div className="flex items-center gap-1.5 text-trust">
              <FlagIcon />
              <h2 id="lapor-title" className="text-[18px] font-semibold leading-[26px] text-ink">
                Koreksi Data dari Lapangan
              </h2>
            </div>
            <p className="text-muted">
              Melihat ketersediaan ranap/IGD atau nomor telepon yang berbeda di RS?
              Laporkan koreksi untuk divalidasi operator demi menjaga kesegaran data publik.
            </p>
          </div>
          <ButtonLink href="/lapor-data" variant="secondary" className="self-start">
            Laporkan koreksi data
          </ButtonLink>
        </section>
      </div>

      <section aria-labelledby="cara-baca" className="flex flex-col gap-4">
        <h2 id="cara-baca" className="text-[24px] font-bold leading-8 tracking-[-0.01em]">
          Cara membaca informasi di sini
        </h2>
        <ul className="grid gap-4 md:grid-cols-3">
          {HOW_TO_READ.map((item) => (
            <li
              key={item.title}
              className="flex flex-col gap-2 rounded-md border border-line bg-surface p-4"
            >
              <h3 className="text-[16px] font-semibold">{item.title}</h3>
              <p className="text-muted">{item.body}</p>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}
