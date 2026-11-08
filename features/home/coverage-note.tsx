"use client";

import Link from "next/link";
import { getInsightsSummary, listHospitals } from "@/lib/api/endpoints";
import { useApiResource } from "@/lib/hooks/use-api-resource";
import { EMPTY_QUERY } from "@/lib/hospitals/query";

/**
 * Cakupan aktual dari API (/insights/summary di v0.5, fallback ke /hospitals
 * bila endpoint belum aktif), dipisah per dataset agar data simulasi tidak
 * terbaca sebagai cakupan nyata.
 */
export function CoverageNote() {
  const summary = useApiResource("coverage:summary", async (signal) => {
    try {
      const res = await getInsightsSummary({ dataset: "real" }, signal);
      return {
        realTotal: res.data.hospital_count,
        curatedCount: res.data.curated_count,
        cityCount: res.data.city_count,
      };
    } catch {
      const real = await listHospitals(
        { ...EMPTY_QUERY, dataset: "real", limit: 1 },
        signal,
      );
      return {
        realTotal: real.meta?.total ?? real.data.length,
        curatedCount: null,
        cityCount: null,
      };
    }
  });
  const sim = useApiResource("coverage:simulation", (signal) =>
    listHospitals({ ...EMPTY_QUERY, dataset: "simulation", limit: 1 }, signal),
  );

  const realTotal = summary.data?.realTotal;
  const curatedCount = summary.data?.curatedCount;
  const simTotal = sim.data?.meta?.total;
  const failed = summary.error && sim.error;

  return (
    <p className="text-muted" aria-live="polite">
      {typeof realTotal === "number" && typeof simTotal === "number"
        ? `Cakupan saat ini: ${realTotal} rumah sakit data sandbox/nyata${
            typeof curatedCount === "number" && curatedCount > 0
              ? ` (${curatedCount} kurasi tim)`
              : ""
          } dan ${simTotal} rumah sakit simulasi (fiktif). Rumah sakit di luar data pilot tidak muncul.`
        : failed
          ? "Cakupan data terbatas pada data pilot. Jumlah saat ini tidak dapat dimuat."
          : "Memuat cakupan data pilot…"}{" "}
      <Link href="/wawasan" className="font-semibold text-trust underline">
        Wawasan data
      </Link>
      {" · "}
      <Link href="/tentang-data" className="font-semibold text-trust underline">
        Tentang data
      </Link>
    </p>
  );
}
