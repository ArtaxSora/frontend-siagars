"use client";

import { useCallback, useEffect, useEffectEvent, useState } from "react";
import { ApiError, isAbortError, toApiError } from "@/lib/api/client";

interface ResourceState<T> {
  /** Kunci permintaan yang menghasilkan state ini. */
  key: string;
  data: T | null;
  error: ApiError | null;
}

export interface ApiResource<T> {
  /** Data terakhir yang berhasil (tetap ada saat memuat ulang). */
  data: T | null;
  error: ApiError | null;
  /** true selama permintaan untuk `key` saat ini belum selesai. */
  loading: boolean;
  reload: () => void;
}

/**
 * Memuat data GET. Permintaan lama dibatalkan saat `key` berubah atau
 * komponen unmount, dan hasilnya diabaikan sehingga tidak menimpa hasil baru.
 * `key` harus mengenkode semua masukan yang dipakai `fetcher`.
 */
export function useApiResource<T>(
  key: string,
  fetcher: (signal: AbortSignal) => Promise<T>,
): ApiResource<T> {
  const [state, setState] = useState<ResourceState<T>>({
    key: "",
    data: null,
    error: null,
  });
  const [reloadCount, setReloadCount] = useState(0);
  const fullKey = `${key}#${reloadCount}`;

  const run = useEffectEvent((signal: AbortSignal) => fetcher(signal));

  useEffect(() => {
    const controller = new AbortController();
    run(controller.signal)
      .then((data) => {
        if (controller.signal.aborted) return;
        setState({ key: fullKey, data, error: null });
      })
      .catch((err: unknown) => {
        if (controller.signal.aborted || isAbortError(err)) return;
        setState((prev) => ({
          key: fullKey,
          data: prev.data,
          error: toApiError(err),
        }));
      });
    return () => controller.abort();
  }, [fullKey]);

  const reload = useCallback(() => setReloadCount((n) => n + 1), []);

  return {
    data: state.data,
    error: state.key === fullKey ? state.error : null,
    loading: state.key !== fullKey,
    reload,
  };
}
