"use client";

import { useEffect, useState } from "react";
import { getHospital } from "@/lib/api/endpoints";

/**
 * Nama RS untuk daftar ID, termasuk RS tujuan rujukan di luar scope operator
 * (GET /admin/hospitals hanya memuat RS dalam scope). Diambil satu per satu
 * lewat GET /hospitals/{id}; gagal -> nama tidak tersedia dan UI menampilkan ID.
 */
export function useHospitalNames(ids: string[]): Record<string, string> {
  const [names, setNames] = useState<Record<string, string>>({});
  const key = [...new Set(ids)].sort().join(",");

  useEffect(() => {
    const controller = new AbortController();
    for (const id of key ? key.split(",") : []) {
      getHospital(id, controller.signal)
        .then((res) => {
          if (!controller.signal.aborted) {
            setNames((cur) => ({ ...cur, [id]: res.data.name }));
          }
        })
        .catch(() => {});
    }
    return () => controller.abort();
  }, [key]);

  return names;
}
