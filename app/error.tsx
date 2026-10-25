"use client";

import { Button } from "@/components/ui/button";

/** Batas galat tingkat rute: pesan generik, tanpa stack trace atau detail internal. */
export default function GlobalRouteError({
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div
      role="alert"
      className="mx-auto flex max-w-xl flex-col items-start gap-4 py-10"
    >
      <h1 className="text-[28px] font-bold leading-9">Terjadi kesalahan</h1>
      <p className="text-muted">
        Halaman ini tidak dapat ditampilkan. Silakan coba lagi.
      </p>
      <Button onClick={reset}>Coba lagi</Button>
    </div>
  );
}
