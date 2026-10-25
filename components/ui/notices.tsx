import { AlertIcon, FlaskIcon } from "@/components/ui/icons";

/**
 * Banner prototipe permanen (tidak dapat ditutup), dilekatkan di atas navigasi.
 * Teks mengikuti DESIGN.md §Komponen 1.
 */
export function PrototypeBanner() {
  return (
    <div
      role="note"
      className="sticky top-0 z-40 border-b border-banner-line bg-banner-bg"
    >
      <p className="mx-auto flex max-w-[1280px] items-start gap-2 px-4 py-2 text-[12px] font-semibold leading-[18px] text-banner-fg md:px-8">
        <AlertIcon className="mt-0.5 shrink-0" />
        <span>Prototipe — data pilot terbatas, bukan layanan resmi gawat darurat.</span>
      </p>
    </div>
  );
}

/**
 * Penanda halaman yang menampilkan data simulasi. Data ini fiktif dan bukan
 * fakta layanan rumah sakit nyata.
 */
export function SimulationNotice() {
  return (
    <p
      role="note"
      className="flex items-start gap-2 rounded-md border-[1.5px] border-dashed border-sim-line bg-sim-bg px-3 py-2 text-[12px] leading-[18px] text-sim-fg"
    >
      <FlaskIcon className="mt-0.5 shrink-0" />
      <span>
        <strong>Data simulasi.</strong> Rumah sakit, layanan, dan angka yang
        berlabel Simulasi bersifat fiktif untuk demo — bukan fakta layanan
        rumah sakit nyata.
      </span>
    </p>
  );
}

/** Pengingat yang harus dekat dengan data kapasitas. */
export function CapacityDisclaimer() {
  return (
    <p className="text-[12px] leading-[18px] text-muted">
      Status layanan dan tempat tidur kosong adalah informasi dari sumber
      pada waktu yang tertera. Ini bukan jaminan pasien akan diterima —
      hubungi rumah sakit untuk memastikan.
    </p>
  );
}
