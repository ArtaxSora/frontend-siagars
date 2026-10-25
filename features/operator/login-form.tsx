"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState, type FormEvent } from "react";
import { ApiError, setCsrfToken, toApiError } from "@/lib/api/client";
import { getMe, login } from "@/lib/api/endpoints";
import { Button } from "@/components/ui/button";
import { Field, inputClasses } from "@/components/ui/field";
import { describeApiError } from "@/components/ui/states";

export function LoginForm() {
  const router = useRouter();
  const expired = useSearchParams().get("expired") === "1";
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<ApiError | null>(null);

  // Sesi masih aktif (mis. datang dari tautan "Operator" di header): langsung
  // ke panel. Efek ini juga jalan lagi saat halaman ditampilkan ulang dari
  // cache router (cacheComponents menyimpan state halaman yang pernah dibuka).
  useEffect(() => {
    const controller = new AbortController();
    getMe(controller.signal)
      .then(() => router.replace("/operator/rujukan"))
      .catch(() => {}); // 401 = belum login: tampilkan formulir
    return () => controller.abort();
  }, [router]);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    if (loading) return;
    setLoading(true);
    setError(null);
    try {
      const res = await login(email.trim(), password);
      // csrf_token bisa kosong; bila begitu client mengambilnya via /auth/csrf.
      if (res.data.csrf_token) setCsrfToken(res.data.csrf_token);
      router.replace("/operator/rujukan");
      // State halaman ini disimpan router; tanpa reset, setelah logout tombol
      // masih "Masuk…" (disabled) dan login ulang tidak bisa.
      setPassword("");
      setLoading(false);
    } catch (err) {
      setError(toApiError(err));
      setPassword("");
      setLoading(false);
    }
  }

  const message = !error
    ? null
    : error.status === 401
      ? "Email atau kata sandi salah."
      : error.status === 429
        ? `Terlalu banyak percobaan.${error.retryAfterSeconds ? ` Coba lagi dalam ${error.retryAfterSeconds} detik.` : " Coba lagi nanti."}`
        : describeApiError(error);

  return (
    <form
      onSubmit={onSubmit}
      className="flex max-w-md flex-col gap-4 rounded-md border border-line bg-surface p-4 md:p-6"
    >
      {expired && !error && (
        <p role="status" className="rounded-md bg-warn-bg px-3 py-2 text-warn-fg">
          Sesi Anda berakhir. Silakan masuk kembali.
        </p>
      )}
      <Field id="login-email" label="Email">
        <input
          id="login-email"
          type="email"
          autoComplete="username"
          required
          className={inputClasses}
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />
      </Field>
      <Field id="login-password" label="Kata sandi">
        <input
          id="login-password"
          type="password"
          autoComplete="current-password"
          required
          className={inputClasses}
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />
      </Field>
      {message && (
        <div role="alert" className="rounded-md bg-bad-bg px-3 py-2 text-bad-fg">
          <p>{message}</p>
          {error?.requestId && (
            <p className="mt-1 text-[12px] text-muted">
              Kode referensi: <code className="font-mono">{error.requestId}</code>
            </p>
          )}
        </div>
      )}
      <Button type="submit" loading={loading} loadingLabel="Masuk…">
        Masuk
      </Button>
    </form>
  );
}
