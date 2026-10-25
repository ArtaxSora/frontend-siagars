import Link from "next/link";

export function SiteFooter() {
  return (
    <footer className="border-t border-line bg-surface">
      <div className="mx-auto flex max-w-[1280px] flex-col gap-2 px-4 py-6 text-[12px] leading-[18px] text-muted md:px-8">
        <p>
          <strong className="text-ink">Dalam keadaan darurat, hubungi 112</strong>{" "}
          atau layanan darurat setempat. SiagaRS bukan layanan gawat darurat.
        </p>
        <p>
          SiagaRS adalah prototipe lomba. Tidak ada afiliasi resmi dengan
          Kementerian Kesehatan, BPJS Kesehatan, atau penyedia layanan darurat.
          Cakupan data terbatas pada data pilot —{" "}
          <Link href="/tentang-data" className="font-semibold text-trust underline">
            pelajari sumber dan batas data
          </Link>
          .
        </p>
        <p>
          <Link
            href="/status"
            className="inline-flex min-h-11 items-center font-semibold text-trust underline md:min-h-0"
          >
            Status sistem
          </Link>
        </p>
      </div>
    </footer>
  );
}
