import type { Metadata } from "next";
import { InsightsDashboard } from "@/features/insights/insights-dashboard";

export const metadata: Metadata = {
  title: "Wawasan data",
  description:
    "Dashboard agregasi cakupan rumah sakit per kota, kesenjangan layanan tercatat, dan distribusi kesegaran data per asal sumber di SiagaRS.",
};

export default function InsightsPage() {
  return (
    <div className="flex flex-col gap-5">
      <header className="flex max-w-3xl flex-col gap-2">
        <h1 className="text-[28px] font-bold leading-9 tracking-[-0.01em] md:text-[36px] md:leading-[44px] md:tracking-[-0.02em]">
          Wawasan data rumah sakit
        </h1>
        <p className="text-[16px] leading-6 text-muted">
          Gambaran agregat cakupan fasilitas kesehatan, kesenjangan layanan yang
          tercatat per kota/kabupaten, serta tingkat kesegaran informasi menurut
          asal datanya.
        </p>
      </header>
      <InsightsDashboard />
    </div>
  );
}
