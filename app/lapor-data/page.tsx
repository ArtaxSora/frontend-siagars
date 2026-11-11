import { Suspense } from "react";
import type { Metadata } from "next";
import { CrowdsourceForm } from "@/features/crowdsource/crowdsource-form";
import { LoadingBlock } from "@/components/ui/states";

export const metadata: Metadata = {
  title: "Lapor Koreksi Data Rumah Sakit · SiagaRS",
  description:
    "Formulir pelaporan koreksi data fasilitas dan ketersediaan layanan rumah sakit. Didukung validasi berjenjang oleh tim operator demi menjaga data tetap segar.",
  openGraph: {
    title: "Lapor Koreksi Data Rumah Sakit · SiagaRS",
    description:
      "Formulir pelaporan koreksi data fasilitas dan ketersediaan layanan rumah sakit.",
  },
};

export default function LaporDataPage() {
  return (
    <div className="mx-auto max-w-3xl py-4">
      <Suspense fallback={<LoadingBlock label="Memuat formulir koreksi data…" rows={4} />}>
        <CrowdsourceForm />
      </Suspense>
    </div>
  );
}
