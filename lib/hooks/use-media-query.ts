"use client";

import { useSyncExternalStore } from "react";

/**
 * Cocokkan media query di client. Snapshot server = false sehingga SSR dan
 * hidrasi konsisten; nilai sebenarnya dipakai setelah hidrasi.
 */
export function useMediaQuery(query: string): boolean {
  return useSyncExternalStore(
    (onChange) => {
      const mql = window.matchMedia(query);
      mql.addEventListener("change", onChange);
      return () => mql.removeEventListener("change", onChange);
    },
    () => window.matchMedia(query).matches,
    () => false,
  );
}
