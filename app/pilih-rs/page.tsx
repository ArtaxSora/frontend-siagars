import type { Metadata } from "next";
import { Suspense } from "react";
import { PilihRsWizard } from "@/features/recommendations/pilih-rs-wizard";
import { LoadingBlock } from "@/components/ui/states";

export const metadata: Metadata = {
  title: "Bantu saya pilih RS",
  description:
    "Sebutkan layanan yang dibutuhkan dan lokasi pasien; SiagaRS mengurutkan rumah sakit yang paling cocok beserta alasan skornya.",
};

export default function PilihRsPage() {
  return (
    <div className="mx-auto flex max-w-3xl flex-col gap-4">
      <div className="flex flex-col gap-2">
        <h1 className="text-[28px] font-bold leading-9 tracking-[-0.01em] md:text-[36px] md:leading-[44px] md:tracking-[-0.02em]">
          Bantu saya pilih RS
        </h1>
        <p className="text-muted">
          Tiga langkah singkat. Skor menunjukkan kecocokan dengan kebutuhan Anda
          dan seberapa pasti datanya — bukan kualitas medis rumah sakit.
        </p>
      </div>
      <Suspense fallback={<LoadingBlock label="Memuat asisten…" rows={2} />}>
        <PilihRsWizard />
      </Suspense>
    </div>
  );
}
