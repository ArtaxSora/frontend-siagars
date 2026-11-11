import Link from "next/link";
import { CoverageNote } from "@/features/home/coverage-note";
import { AssistantTrigger } from "@/features/assistant/assistant-panel";
import { SearchIcon } from "@/components/ui/icons";

const SERVICES = [
  { slug: "icu", name: "ICU", description: "Perawatan intensif" },
  { slug: "nicu", name: "NICU", description: "Perawatan intensif bayi" },
  { slug: "picu", name: "PICU", description: "Perawatan intensif anak" },
  { slug: "igd-24h", name: "IGD 24 jam", description: "Instalasi gawat darurat" },
  { slug: "rawat-inap", name: "Rawat inap", description: "Ketersediaan tempat tidur" },
];
export default function HomePage() {
  return (
    <div className="home-page">
      <section className="home-intro" aria-labelledby="home-title">
        <div className="home-heading">
          <h1 id="home-title">Temukan rumah sakit.<br /><span className="text-brand-deep">Pahami pilihan Anda.</span></h1>
          <p>Lihat layanan, ketersediaan tempat tidur, dan informasi BPJS. Bandingkan pilihan dengan sumber data yang bisa Anda periksa.</p>
          <div className="home-guidance">
            <span className="font-semibold text-ink">Belum tahu harus ke mana?</span>
            <Link href="/rumah-sakit" className="text-brand-deep underline decoration-brand/40 underline-offset-4 hover:decoration-brand">Cari berdasarkan layanan <span aria-hidden="true">→</span></Link>
          </div>
        </div>
        <div className="home-search">
          <h2>Cari rumah sakit</h2>
          <form action="/rumah-sakit" method="get" role="search">
            <label htmlFor="home-q">Nama rumah sakit atau wilayah</label>
            <div className="home-search-field"><SearchIcon className="h-5 w-5 shrink-0 text-muted" /><input id="home-q" name="q" type="search" autoComplete="off" maxLength={100} placeholder="Contoh: Bekasi atau RS Harapan Kita" /></div>
            <button type="submit" className="home-search-submit">Cari rumah sakit <SearchIcon className="h-4 w-4" /></button>
          </form>
          <p className="mt-4 text-[13px] leading-5 text-muted">Punya kebutuhan khusus? <AssistantTrigger className="min-h-11 font-semibold text-brand-deep underline underline-offset-4">Ceritakan ke asisten</AssistantTrigger></p>
        </div>
      </section>
      <section className="home-services" aria-labelledby="service-title">
        <div className="flex flex-wrap items-baseline justify-between gap-2 pb-4"><h2 id="service-title">Mulai dari layanan yang dibutuhkan</h2><span className="text-[13px] text-muted">Selanjutnya, tentukan lokasi Anda</span></div>
        <ul>{SERVICES.map(({ slug, name, description }) => <li key={slug}><Link href={`/rumah-sakit?services=${slug}`}><span className="service-name">{name}</span><span className="text-[13px] text-muted">{description}</span><span className="service-arrow" aria-hidden="true">↗</span></Link></li>)}</ul>
      </section>
      <section className="home-data" aria-labelledby="data-title">
        <div>
          <h2 id="data-title">Keputusan yang baik<br />dimulai dari data yang jelas.</h2>
          <p className="mt-4 max-w-md text-muted leading-7">Angka ketersediaan dapat berubah. Periksa sumber dan waktu pembaruan, lalu hubungi rumah sakit sebelum berangkat.</p>
          <Link href="/tentang-data" className="mt-4 inline-flex min-h-11 items-center font-semibold text-brand-deep underline underline-offset-4">Kenali sumber dan batas data</Link>
        </div>
        <dl className="home-principles">
          <div><dt>Sumbernya terlihat</dt><dd>Label membedakan data kurasi tim, SATUSEHAT Sandbox, dan simulasi.</dd></div>
          <div><dt>Waktu pembaruan tercantum</dt><dd>Periksa umur informasi. Data lama tetap ditandai, bukan disembunyikan.</dd></div>
          <div><dt>Yang belum pasti, ditulis apa adanya</dt><dd>“Belum diketahui” tidak berarti tidak tersedia. Skor kecocokan bukan penilaian kualitas medis.</dd></div>
        </dl>
      </section>
      <div className="home-coverage"><CoverageNote /></div>
    </div>
  );
}
