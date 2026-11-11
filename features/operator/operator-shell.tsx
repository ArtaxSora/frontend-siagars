"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { ApiError, clearCsrfToken } from "@/lib/api/client";
import { getMe } from "@/lib/api/endpoints";
import type { Operator } from "@/lib/contracts/types";
import { useApiResource } from "@/lib/hooks/use-api-resource";
import { ErrorState, LoadingBlock } from "@/components/ui/states";

interface OperatorContextValue {
  operator: Operator;
  /**
   * Tangani 401 (sesi habis): bersihkan state sesi dan kembali ke login.
   * Mengembalikan true bila galat tertangani di sini.
   */
  handleAuthError: (error: ApiError) => boolean;
}

const OperatorContext = createContext<OperatorContextValue | null>(null);

export function useOperator(): OperatorContextValue {
  const value = useContext(OperatorContext);
  if (!value) throw new Error("useOperator harus dipakai di dalam OperatorShell");
  return value;
}

const NAV = [
  // { href: "/operator/rujukan", label: "Rujukan" },
  { href: "/operator/layanan", label: "Layanan & tempat tidur" },
  { href: "/operator/riwayat-bpjs", label: "Riwayat BPJS" },
  { href: "/operator/laporan-warga", label: "Laporan warga" },
] as const;

/**
 * Proteksi route di sisi UI (pengalaman pengguna). Otorisasi sebenarnya tetap
 * dilakukan API; jangan mengandalkan komponen ini untuk keamanan.
 */
export function OperatorShell({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const me = useApiResource("auth:me", (signal) => getMe(signal));
  const [menuOpen, setMenuOpen] = useState(false);
  const [menuPath, setMenuPath] = useState(pathname);
  if (menuPath !== pathname) { setMenuPath(pathname); setMenuOpen(false); }

  // Navigasi penuh (bukan router.replace): cacheComponents menyimpan state
  // halaman yang pernah dibuka, sehingga tombol "Keluar…"/"Masuk…" dan data
  // sesi lama bisa tertinggal. Muat ulang membersihkan semuanya.
  const redirectToLogin = useCallback((expired: boolean) => {
    clearCsrfToken();
    window.location.replace(expired ? "/operator/login?expired=1" : "/operator/login");
  }, []);

  const handleAuthError = useCallback(
    (error: ApiError) => {
      if (error.status !== 401) return false;
      redirectToLogin(true);
      return true;
    },
    [redirectToLogin],
  );

  useEffect(() => {
    if (me.error?.status === 401) redirectToLogin(false);
  }, [me.error, redirectToLogin]);

  const operator = me.data?.data ?? null;
  const value = useMemo(
    () => (operator ? { operator, handleAuthError } : null),
    [operator, handleAuthError],
  );

  if (me.error && me.error.status !== 401) {
    return <ErrorState error={me.error} onRetry={me.reload} title="Sesi operator tidak dapat diperiksa" />;
  }
  if (!value) {
    return (
      <LoadingBlock
        label={me.error ? "Mengalihkan ke halaman login…" : "Memeriksa sesi operator…"}
        rows={2}
      />
    );
  }

  return (
    <OperatorContext.Provider value={value}>
      <div className="grid items-start gap-6 lg:grid-cols-[224px_minmax(0,1fr)] lg:gap-8">
        <aside className="min-w-0 rounded-xl border border-line bg-surface p-4 lg:sticky lg:top-6" aria-label="Panel operator">
          <div className="border-b border-line pb-4">
            <p className="text-xs text-muted">Operator demo</p>
            <p className="mt-1 break-all text-sm font-semibold">{value.operator.email}</p>
          </div>
          <button type="button" className="mt-2 flex min-h-11 w-full items-center justify-between text-sm font-semibold text-brand-deep lg:hidden" aria-expanded={menuOpen} aria-controls="operator-navigation" onClick={() => setMenuOpen(!menuOpen)}>
            Menu operator <span>{menuOpen ? "Tutup" : "Buka"}</span>
          </button>
          <nav id="operator-navigation" aria-label="Menu operator" className={`${menuOpen ? "flex" : "hidden"} mt-3 flex-col gap-1 lg:flex`}>
            {NAV.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                aria-current={pathname === item.href ? "page" : undefined}
                onClick={() => setMenuOpen(false)}
                className={`inline-flex min-h-11 items-center rounded-md px-3 py-3 text-sm font-semibold ${
                  pathname === item.href
                    ? "bg-brand text-white"
                    : "text-muted hover:bg-well hover:text-ink"
                }`}
              >
                {item.label}
              </Link>
            ))}
          </nav>
        </aside>
        <div className="flex min-w-0 flex-col gap-4">{children}</div>
      </div>
    </OperatorContext.Provider>
  );
}
