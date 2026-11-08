"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { ApiError, isAbortError, toApiError } from "@/lib/api/client";
import {
  getInsightsCoverage,
  getInsightsFreshness,
  getInsightsServiceGaps,
  getInsightsSummary,
  listHospitals,
} from "@/lib/api/endpoints";
import type {
  Dataset,
  Hospital,
  InsightsCoverageRow,
  InsightsFreshnessRow,
  InsightsMeta,
  InsightsServiceGapRow,
  InsightsSummary,
} from "@/lib/contracts/types";
import { EMPTY_QUERY } from "@/lib/hospitals/query";
import {
  aggregateInsightsCoverage,
  aggregateInsightsFreshness,
  aggregateInsightsServiceGaps,
  aggregateInsightsSummary,
} from "@/lib/insights/aggregate";

export interface InsightsBundle {
  summary: InsightsSummary;
  coverage: InsightsCoverageRow[];
  serviceGaps: InsightsServiceGapRow[];
  freshness: InsightsFreshnessRow[];
  meta: InsightsMeta;
  /** true bila server belum punya /insights/* (v0.5.0) dan agregasi dihitung dari /hospitals. */
  usingFallback: boolean;
}

function isUnmergedEndpointError(err: unknown): boolean {
  return (
    err instanceof ApiError &&
    (err.status === 404 || err.status === 405 || err.status === 501)
  );
}

const MAX_FALLBACK_PAGES = 12;
const PAGE_LIMIT = 50;

const fallbackHospitalCache = new Map<
  string,
  { hospitals: Hospital[]; asOf: string }
>();

async function fetchHospitalsForAggregation(
  opts: { province_code: string; dataset: Dataset },
  signal: AbortSignal,
): Promise<{ hospitals: Hospital[]; asOf: string }> {
  const cacheKey = `${opts.dataset}|${opts.province_code}`;
  const cached = fallbackHospitalCache.get(cacheKey);
  if (cached) return cached;

  const baseQuery = {
    ...EMPTY_QUERY,
    dataset: opts.dataset,
    province_code: opts.province_code,
    limit: PAGE_LIMIT,
    page: 1,
  };

  const first = await listHospitals(baseQuery, signal);
  const totalPages = Math.min(
    MAX_FALLBACK_PAGES,
    Math.max(1, first.meta?.total_pages ?? 1),
  );
  const asOf = first.meta?.as_of ?? "";

  if (totalPages <= 1) {
    const entry = { hospitals: first.data, asOf };
    fallbackHospitalCache.set(cacheKey, entry);
    return entry;
  }

  const restPages = await Promise.all(
    Array.from({ length: totalPages - 1 }, (_, i) =>
      listHospitals({ ...baseQuery, page: i + 2 }, signal),
    ),
  );
  const hospitals = [first.data, ...restPages.map((p) => p.data)].flat();
  const entry = { hospitals, asOf };
  fallbackHospitalCache.set(cacheKey, entry);
  return entry;
}

export function useInsightsData(filters: {
  province_code: string;
  dataset: Dataset;
  service: string;
}) {
  const [reloadNonce, setReloadNonce] = useState(0);
  const requestKey = `${filters.province_code}|${filters.dataset}|${filters.service}|${reloadNonce}`;
  const [result, setResult] = useState<{
    key: string;
    data: InsightsBundle | null;
    error: ApiError | null;
  }>({ key: "", data: null, error: null });
  const controllerRef = useRef<AbortController | null>(null);

  const reload = useCallback(() => {
    fallbackHospitalCache.clear();
    setReloadNonce((n) => n + 1);
  }, []);

  useEffect(() => {
    controllerRef.current?.abort();
    const ac = new AbortController();
    controllerRef.current = ac;

    const queryOpts = {
      province_code: filters.province_code || undefined,
      dataset: filters.dataset,
    };

    Promise.all([
      getInsightsSummary(queryOpts, ac.signal),
      getInsightsCoverage(queryOpts, ac.signal),
      getInsightsServiceGaps(
        { ...queryOpts, service: filters.service },
        ac.signal,
      ),
      getInsightsFreshness(queryOpts, ac.signal),
    ])
      .then(([sumRes, covRes, gapRes, freshRes]) => {
        if (ac.signal.aborted) return;
        setResult({
          key: requestKey,
          data: {
            summary: sumRes.data,
            coverage: covRes.data,
            serviceGaps: gapRes.data,
            freshness: freshRes.data,
            meta: sumRes.meta ??
              covRes.meta ??
              gapRes.meta ??
              freshRes.meta ?? { generated_at: "" },
            usingFallback: false,
          },
          error: null,
        });
      })
      .catch(async (err: unknown) => {
        if (ac.signal.aborted || isAbortError(err)) return;
        if (!isUnmergedEndpointError(err)) {
          setResult({
            key: requestKey,
            data: null,
            error: toApiError(err),
          });
          return;
        }

        try {
          const { hospitals, asOf } = await fetchHospitalsForAggregation(
            {
              province_code: filters.province_code,
              dataset: filters.dataset,
            },
            ac.signal,
          );
          if (ac.signal.aborted) return;
          setResult({
            key: requestKey,
            data: {
              summary: aggregateInsightsSummary(hospitals),
              coverage: aggregateInsightsCoverage(hospitals),
              serviceGaps: aggregateInsightsServiceGaps(
                hospitals,
                filters.service,
              ),
              freshness: aggregateInsightsFreshness(hospitals),
              meta: {
                generated_at: asOf,
                sources: [
                  "Agregasi langsung GET /hospitals (SATUSEHAT Sandbox, Kurasi Tim, Simulasi berlabel)",
                ],
                dataset: filters.dataset,
                province_code: filters.province_code || null,
                service: filters.service,
              },
              usingFallback: true,
            },
            error: null,
          });
        } catch (fallbackErr: unknown) {
          if (ac.signal.aborted || isAbortError(fallbackErr)) return;
          setResult({
            key: requestKey,
            data: null,
            error: toApiError(fallbackErr),
          });
        }
      });

    return () => ac.abort();
  }, [
    requestKey,
    filters.province_code,
    filters.dataset,
    filters.service,
    reloadNonce,
  ]);

  const loading = result.key !== requestKey;
  const error = result.key === requestKey ? result.error : null;

  return { data: result.data, loading, error, reload };
}
