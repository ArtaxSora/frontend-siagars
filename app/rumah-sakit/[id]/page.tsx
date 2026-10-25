import type { Metadata } from "next";
import { Suspense } from "react";
import { HospitalDetail } from "@/features/hospitals/hospital-detail";
import { LoadingBlock } from "@/components/ui/states";

export const metadata: Metadata = {
  title: "Detail rumah sakit",
};

async function DetailContent({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <HospitalDetail id={id} />;
}

export default function HospitalDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  // params dibaca di dalam Suspense: shell statis tampil dulu, ID menyusul.
  return (
    <Suspense fallback={<LoadingBlock label="Memuat detail rumah sakit…" rows={4} />}>
      <DetailContent params={params} />
    </Suspense>
  );
}
