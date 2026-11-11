import Link from "next/link";
import { SiteLogo } from "@/components/site-logo";
export function SiteFooter() {
  return (
    <footer className="site-footer">
      <div className="mx-auto max-w-[1280px] px-5 py-9 md:px-8">
        <div className="flex flex-col justify-between gap-7 md:flex-row md:gap-12">
          <div className="max-w-xl">
            <Link href="/" className="inline-flex items-center gap-1 text-xl font-bold tracking-tight text-brand-deep"><SiteLogo />SiagaRS</Link>
            <p className="mt-3 text-sm leading-6 text-muted">Prototipe pencarian rumah sakit dengan sumber dan batas data yang terbuka. Tidak berafiliasi dengan Kementerian Kesehatan atau BPJS Kesehatan.</p>
          </div>
          <nav aria-label="Informasi dan bantuan" className="grid grid-cols-2 gap-x-8 text-sm">
            <Link href="/tentang-data">Tentang data</Link>
            {/* <Link href="/cek-bpjs">Cek BPJS (simulasi)</Link> */}
            <Link href="/lapor-data">Koreksi data</Link>
            <Link href="/status">Status sistem</Link>
          </nav>
        </div>
        <div className="mt-7 flex flex-wrap items-center justify-between gap-x-8 gap-y-2 border-t border-line pt-4 text-xs text-muted">
          <p>Darurat? Hubungi <a className="font-bold text-ink underline" href="tel:112">112</a> atau layanan darurat setempat. SiagaRS bukan layanan gawat darurat.</p>
          <Link href="/operator" className="inline-flex min-h-11 items-center underline underline-offset-4 hover:text-ink">Masuk operator</Link>
        </div>
      </div>
    </footer>
  );
}
