"use client";

import { Button } from "@/components/ui/button";

export function Pagination({
  page,
  totalPages,
  total,
  limit,
  onPageChange,
  disabled = false,
}: {
  page: number;
  totalPages: number;
  total: number;
  limit: number;
  onPageChange: (page: number) => void;
  disabled?: boolean;
}) {
  const from = total === 0 ? 0 : (page - 1) * limit + 1;
  const to = Math.min(page * limit, total);
  return (
    <nav
      aria-label="Halaman hasil"
      className="flex flex-wrap items-center justify-between gap-3"
    >
      <p className="text-muted tabular-nums" aria-live="polite">
        Menampilkan {from}–{to} dari {total} hasil · halaman {page} dari {totalPages}
      </p>
      <div className="flex gap-2">
        <Button
          variant="secondary"
          disabled={disabled || page <= 1}
          onClick={() => onPageChange(page - 1)}
        >
          Sebelumnya
        </Button>
        <Button
          variant="secondary"
          disabled={disabled || page >= totalPages}
          onClick={() => onPageChange(page + 1)}
        >
          Berikutnya
        </Button>
      </div>
    </nav>
  );
}
