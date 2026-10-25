import type { Metadata } from "next";
import { Suspense } from "react";
import { CompareView } from "@/features/hospitals/compare-view";
import { LoadingBlock } from "@/components/ui/states";

export const metadata: Metadata = {
  title: "Bandingkan rumah sakit",
  description:
    "Bandingkan 2–3 rumah sakit berdampingan: BPJS, tempat tidur, dan layanan, lengkap dengan sumber data.",
};

export default function ComparePage() {
  return (
    <div className="flex flex-col gap-4">
      <h1 className="text-[28px] font-bold leading-9 tracking-[-0.01em] md:text-[36px] md:leading-[44px] md:tracking-[-0.02em]">
        Bandingkan rumah sakit
      </h1>
      <Suspense fallback={<LoadingBlock label="Memuat perbandingan…" />}>
        <CompareView />
      </Suspense>
    </div>
  );
}
