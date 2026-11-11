import { Suspense } from "react";
import type { Metadata } from "next";
import { AiAssistant } from "@/features/assistant/ai-assistant";
import { LoadingBlock } from "@/components/ui/states";

export const metadata: Metadata = {
  title: "Asisten AI Pencari Rumah Sakit · SiagaRS",
  description:
    "Cari rumah sakit yang sesuai kebutuhan gawat darurat dan rawat inap menggunakan kalimat bebas berbahasa Indonesia. Didukung data ketersediaan riil SiagaRS.",
  openGraph: {
    title: "Asisten AI Pencari Rumah Sakit · SiagaRS",
    description:
      "Cari rumah sakit yang sesuai kebutuhan gawat darurat dan rawat inap menggunakan kalimat bebas berbahasa Indonesia.",
  },
};  

export default function AssistantPage() {
  return (
    <div className="mx-auto max-w-4xl py-4">
      <Suspense fallback={<LoadingBlock label="Memuat Asisten AI…" rows={4} />}>
        <AiAssistant />
      </Suspense>
    </div>
  );
}
