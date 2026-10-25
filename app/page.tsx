import Link from "next/link";
import { CoverageNote } from "@/features/home/coverage-note";
import { ButtonLink } from "@/components/ui/button";
import { inputClasses } from "@/components/ui/field";
import { SearchIcon } from "@/components/ui/icons";

const QUICK_LINKS = [
  { href: "/rumah-sakit?services=icu", label: "ICU" },
  { href: "/rumah-sakit?services=nicu", label: "NICU" },
  { href: "/rumah-sakit?services=igd-24h", label: "IGD 24 jam" },
  { href: "/rumah-sakit?services=ambulance", label: "Ambulans" },
  { href: "/rumah-sakit?bpjs=true", label: "Menerima BPJS" },
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
            Cari rumah sakit berdasarkan fasilitas yang dinyatakan tersedia
          </h1>
          <p className="text-[16px] leading-6 text-muted">
            Bantu keluarga pasien menyaring rumah sakit, memeriksa sumber dan
            umur informasinya, lalu menghubungi rumah sakit langsung. Ini
            prototipe dengan data pilot terbatas.
          </p>
        </div>

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
            className="inline-flex min-h-10 items-center justify-center gap-2 rounded-md bg-brand px-5 text-[14px] font-semibold text-white hover:bg-brand-deep"
          >
            <SearchIcon /> Cari
          </button>
        </form>

        <div className="flex flex-col gap-2">
          <p className="text-[13px] font-semibold">Pencarian cepat</p>
          <ul className="flex flex-wrap gap-2">
            {QUICK_LINKS.map((l) => (
              <li key={l.href}>
                <Link
                  href={l.href}
                  className="inline-flex min-h-9 items-center rounded-lg border border-line bg-well px-3 text-[13px] font-semibold text-muted hover:border-line-strong"
                >
                  {l.label}
                </Link>
              </li>
            ))}
          </ul>
        </div>

        <CoverageNote />
      </section>

      <section
        aria-labelledby="lacak-title"
        className="flex flex-col gap-3 rounded-md border-[1.5px] border-dashed border-sim-line bg-surface p-5 md:flex-row md:items-center md:justify-between md:p-6"
      >
        <div className="flex max-w-2xl flex-col gap-1">
          <h2 id="lacak-title" className="text-[18px] font-semibold leading-[26px]">
            Punya kode demo rujukan?
          </h2>
          <p className="text-muted">
            Lihat status dan linimasa rujukan <strong>simulasi</strong>. Tidak
            ada rujukan resmi yang dibuat lewat prototipe ini.
          </p>
        </div>
        <ButtonLink href="/lacak-rujukan" variant="secondary">
          Lacak rujukan
        </ButtonLink>
      </section>

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
