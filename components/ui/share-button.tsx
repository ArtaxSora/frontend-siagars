"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { CheckIcon, ShareIcon } from "@/components/ui/icons";

export interface ShareButtonProps {
  title: string;
  text?: string;
  /** Path relatif atau URL penuh; bawaan = window.location.href saat diklik. */
  url?: string;
  label?: string;
}

/**
 * Tombol Bagikan (FE-21, PRD §4.7 & §6):
 * Memakai Web Share API (`navigator.share`) bila tersedia di perangkat,
 * dan jatuh ke salin tautan (`navigator.clipboard.writeText`) lengkap dengan
 * umpan balik `aria-live="polite"`.
 */
export function ShareButton({
  title,
  text,
  url,
  label = "Bagikan",
}: ShareButtonProps) {
  const [notice, setNotice] = useState<string | null>(null);

  useEffect(() => {
    if (!notice) return;
    const timer = setTimeout(() => setNotice(null), 3500);
    return () => clearTimeout(timer);
  }, [notice]);

  async function handleShare() {
    const shareUrl =
      typeof window !== "undefined"
        ? url
          ? new URL(url, window.location.origin).toString()
          : window.location.href
        : (url ?? "");

    if (typeof navigator !== "undefined" && typeof navigator.share === "function") {
      try {
        await navigator.share({ title, text, url: shareUrl });
        setNotice("Tautan dibagikan.");
        return;
      } catch (err) {
        // Pengguna menutup dialog share: bukan galat dan tidak perlu salin paksa.
        if (err instanceof DOMException && err.name === "AbortError") {
          return;
        }
      }
    }

    try {
      if (typeof navigator !== "undefined" && navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(shareUrl);
        setNotice("Tautan berhasil disalin.");
        return;
      }
    } catch {
      // Lanjut ke pesan cadangan di bawah.
    }

    setNotice("Salin tautan langsung dari bilah alamat peramban.");
  }

  return (
    <div className="inline-flex flex-wrap items-center gap-2">
      <Button variant="secondary" onClick={handleShare}>
        <ShareIcon />
        {label}
      </Button>
      <span
        role="status"
        aria-live="polite"
        className={
          notice
            ? "inline-flex items-center gap-1 rounded-md border border-ok-line bg-ok-bg px-2.5 py-1.5 text-[12px] font-semibold leading-4 text-ok-fg"
            : "sr-only"
        }
      >
        {notice && <CheckIcon />}
        {notice ?? ""}
      </span>
    </div>
  );
}
