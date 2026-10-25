"use client";

import type { ReactNode } from "react";
import { ApiError } from "@/lib/api/client";
import { Button } from "@/components/ui/button";
import { AlertIcon } from "@/components/ui/icons";

/** Pesan galat generik untuk pengguna — tanpa stack trace atau detail internal. */
export function describeApiError(error: ApiError): string {
  switch (error.code) {
    case "network_error":
    case "timeout":
      return error.message;
    case "rate_limited":
      return "Terlalu banyak permintaan. Coba lagi beberapa saat lagi.";
    default:
      break;
  }
  if (error.status >= 500 || error.status === 0) {
    return "Terjadi gangguan pada server. Silakan coba lagi.";
  }
  return error.message || "Permintaan tidak dapat diproses.";
}

export function LoadingBlock({
  label = "Memuat…",
  rows = 3,
}: {
  label?: string;
  rows?: number;
}) {
  return (
    <div role="status" aria-live="polite" className="flex flex-col gap-3">
      <span className="sr-only">{label}</span>
      {Array.from({ length: rows }, (_, i) => (
        <div
          key={i}
          aria-hidden="true"
          className="skeleton h-24 w-full rounded-md border border-line"
        />
      ))}
    </div>
  );
}

export function EmptyState({
  title,
  description,
  action,
}: {
  title: string;
  description?: string;
  action?: ReactNode;
}) {
  return (
    <div className="flex flex-col items-start gap-3 rounded-md border border-line bg-surface p-6">
      <h2 className="text-[18px] font-semibold leading-[26px]">{title}</h2>
      {description && <p className="max-w-prose text-muted">{description}</p>}
      {action}
    </div>
  );
}

export function ErrorState({
  error,
  onRetry,
  title = "Data tidak dapat dimuat",
}: {
  error: ApiError;
  onRetry?: () => void;
  title?: string;
}) {
  return (
    <div
      role="alert"
      className="flex flex-col items-start gap-3 rounded-md border border-bad-line bg-bad-bg p-5"
    >
      <h2 className="inline-flex items-center gap-2 text-[16px] font-semibold text-bad-fg">
        <AlertIcon />
        {title}
      </h2>
      <p className="max-w-prose text-ink">{describeApiError(error)}</p>
      {error.requestId && (
        <p className="text-[12px] text-muted">
          Kode referensi untuk laporan:{" "}
          <code className="rounded bg-surface px-1 py-0.5 font-mono">
            {error.requestId}
          </code>
        </p>
      )}
      {onRetry && (
        <Button variant="secondary" onClick={onRetry}>
          Coba lagi
        </Button>
      )}
    </div>
  );
}
