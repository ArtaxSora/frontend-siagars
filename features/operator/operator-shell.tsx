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
import { ApiError, clearCsrfToken, toApiError } from "@/lib/api/client";
import { getMe, logout } from "@/lib/api/endpoints";
import type { Operator } from "@/lib/contracts/types";
import { useApiResource } from "@/lib/hooks/use-api-resource";
import { Button } from "@/components/ui/button";
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
  { href: "/operator/rujukan", label: "Rujukan" },
  { href: "/operator/layanan", label: "Layanan & tempat tidur" },
] as const;

/**
 * Proteksi route di sisi UI (pengalaman pengguna). Otorisasi sebenarnya tetap
 * dilakukan API; jangan mengandalkan komponen ini untuk keamanan.
 */
export function OperatorShell({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const me = useApiResource("auth:me", (signal) => getMe(signal));
  const [loggingOut, setLoggingOut] = useState(false);
  const [logoutError, setLogoutError] = useState<ApiError | null>(null);

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

  async function onLogout() {
    setLoggingOut(true);
    setLogoutError(null);
    try {
      await logout();
      redirectToLogin(false);
    } catch (err) {
      const apiError = toApiError(err);
      if (apiError.status === 401) {
        redirectToLogin(false);
        return;
      }
      setLogoutError(apiError);
      setLoggingOut(false);
    }
  }

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
      <div className="flex flex-col gap-4">
        <div className="flex flex-wrap items-center justify-between gap-3 rounded-md border border-line bg-surface p-3">
          <div>
            <p className="text-[12px] text-muted">Masuk sebagai operator demo</p>
            <p className="font-semibold">{value.operator.email}</p>
          </div>
          <nav aria-label="Menu operator" className="flex flex-wrap gap-2">
            {NAV.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                aria-current={pathname === item.href ? "page" : undefined}
                className={`inline-flex min-h-11 items-center rounded-md px-3 font-semibold md:min-h-10 ${
                  pathname === item.href
                    ? "bg-brand text-white"
                    : "bg-well text-muted hover:bg-line"
                }`}
              >
                {item.label}
              </Link>
            ))}
          </nav>
          <Button
            variant="secondary"
            onClick={onLogout}
            loading={loggingOut}
            loadingLabel="Keluar…"
          >
            Keluar
          </Button>
        </div>
        {logoutError && (
          <ErrorState error={logoutError} title="Gagal keluar" />
        )}
        {children}
      </div>
    </OperatorContext.Provider>
  );
}
