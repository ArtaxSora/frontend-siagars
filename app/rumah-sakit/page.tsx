import type { Metadata } from "next";
import { Suspense } from "react";
import { HospitalSearch } from "@/features/hospitals/hospital-search";
import { LoadingBlock } from "@/components/ui/states";

export const metadata: Metadata = {
  title: "Cari rumah sakit",
  description:
    "Cari dan saring rumah sakit berdasarkan layanan, BPJS, dan wilayah — lengkap dengan sumber dan umur informasi.",
};

export default function HospitalsPage() {
  return (
    <div className="flex flex-col gap-4">
      <h1 className="text-[28px] font-bold leading-9 tracking-[-0.01em] md:text-[36px] md:leading-[44px] md:tracking-[-0.02em]">
        Cari rumah sakit
      </h1>
      {/* useSearchParams di komponen klien harus berada di dalam Suspense. */}
      <Suspense fallback={<LoadingBlock label="Memuat pencarian…" />}>
        <HospitalSearch />
      </Suspense>
    </div>
  );
}
