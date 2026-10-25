"use client";

import Link from "next/link";
import { listHospitals } from "@/lib/api/endpoints";
import { useApiResource } from "@/lib/hooks/use-api-resource";
import { EMPTY_QUERY } from "@/lib/hospitals/query";

/**
 * Cakupan aktual dari API (meta.total), dipisah per dataset agar data
 * simulasi tidak terbaca sebagai cakupan nyata.
 */
export function CoverageNote() {
  const real = useApiResource("coverage:real", (signal) =>
    listHospitals({ ...EMPTY_QUERY, dataset: "real", limit: 1 }, signal),
  );
  const sim = useApiResource("coverage:simulation", (signal) =>
    listHospitals({ ...EMPTY_QUERY, dataset: "simulation", limit: 1 }, signal),
  );
  const realTotal = real.data?.meta?.total;
  const simTotal = sim.data?.meta?.total;
  const failed = real.error || sim.error;

  return (
    <p className="text-muted" aria-live="polite">
      {typeof realTotal === "number" && typeof simTotal === "number"
        ? `Cakupan saat ini: ${realTotal} rumah sakit data sandbox/nyata dan ${simTotal} rumah sakit simulasi (fiktif). Rumah sakit di luar data pilot tidak muncul.`
        : failed
          ? "Cakupan data terbatas pada data pilot. Jumlah saat ini tidak dapat dimuat."
          : "Memuat cakupan data pilot…"}{" "}
      <Link href="/tentang-data" className="font-semibold text-trust underline">
        Tentang data
      </Link>
    </p>
  );
}
