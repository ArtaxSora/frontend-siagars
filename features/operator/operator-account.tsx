"use client";

import Link from "next/link";
import { useState } from "react";
import { clearCsrfToken, toApiError } from "@/lib/api/client";
import { getMe, logout } from "@/lib/api/endpoints";
import { useApiResource } from "@/lib/hooks/use-api-resource";
import { Button } from "@/components/ui/button";

export function OperatorAccount() {
  const me = useApiResource("auth:me", (signal) => getMe(signal));
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onLogout() {
    if (pending) return;
    setPending(true);
    setError(null);
    try {
      await logout();
    } catch (err) {
      if (toApiError(err).status !== 401) {
        setError("Gagal logout. Coba lagi.");
        setPending(false);
        return;
      }
    }
    clearCsrfToken();
    window.location.replace("/operator/login");
  }

  if (!me.data) return null;
  return (
    <div className="relative ml-auto flex items-center gap-3">
      <Link href="/operator" className="inline-flex min-h-11 items-center text-sm font-semibold text-brand-deep">Operator</Link>
      <Button variant="secondary" onClick={onLogout} loading={pending} loadingLabel="Keluar…">Logout</Button>
      {error && <p role="alert" className="absolute right-0 top-full z-50 mt-2 w-56 rounded-md border border-bad-line bg-surface p-3 text-sm text-bad-fg">{error}</p>}
    </div>
  );
}
