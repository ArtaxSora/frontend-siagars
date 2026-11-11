import type { Metadata } from "next";
import { Suspense } from "react";
import { fetchHospitalServer } from "@/lib/api/backend";
import { describeHospitalMetadata } from "@/lib/insights/aggregate";
import { HospitalDetail } from "@/features/hospitals/hospital-detail";
import { LoadingBlock } from "@/components/ui/states";

const FALLBACK_TITLE = "Detail rumah sakit";
const FALLBACK_DESCRIPTION =
  "Profil fasilitas, ketersediaan tempat tidur, layanan, status BPJS, dan sumber data rumah sakit di SiagaRS.";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id } = await params;
  const hospital = await fetchHospitalServer(id);
  if (!hospital) {
    return {
      title: FALLBACK_TITLE,
      description: FALLBACK_DESCRIPTION,
    };
  }

  const { title, description } = describeHospitalMetadata(hospital);
  const ogTitle = `${title} · SiagaRS`;

  return {
    title,
    description,
    openGraph: {
      title: ogTitle,
      description,
      type: "website",
      locale: "id_ID",
      siteName: "SiagaRS",
    },
    twitter: {
      card: "summary",
      title: ogTitle,
      description,
    },
  };
}

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
