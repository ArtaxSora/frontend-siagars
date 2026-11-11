/**
 * Backend tujuan /api/v1 (server-only). Dipakai next.config.ts (rewrite),
 * proxy.ts (header bypass staging), halaman /status (label lingkungan),
 * dan generateMetadata detail RS (FE-21).
 * Ganti backend lewat API_BASE_URL di .env.local / env Vercel.
 */
import type { ApiSuccess, DetailMeta, Hospital } from "@/lib/contracts/types";

export const PRODUCTION_API_URL = "https://siagars-backend.vercel.app";

export type BackendEnvironment = "production" | "staging" | "custom";

export interface BackendInfo {
  environment: BackendEnvironment;
  /** Hostname saja (tanpa path/secret) untuk ditampilkan. */
  host: string;
}

export function backendBaseUrl(): string {
  return (process.env.API_BASE_URL?.trim() || PRODUCTION_API_URL).replace(/\/+$/, "");
}

export function describeBackend(baseUrl: string): BackendInfo {
  let host = baseUrl;
  try {
    host = new URL(baseUrl).host;
  } catch {
    return { environment: "custom", host };
  }
  if (host === new URL(PRODUCTION_API_URL).host) return { environment: "production", host };
  // Deploy Vercel Preview branch develop backend: siagars-backend-git-develop-*.vercel.app
  if (/^siagars-backend-git-[\w-]+\.vercel\.app$/.test(host)) {
    return { environment: "staging", host };
  }
  return { environment: "custom", host };
}

/**
 * Ambil detail RS dari server untuk SSR generateMetadata (FE-21).
 * Mengembalikan null bila tidak ditemukan (404) atau server sedang tidak
 * terjangkau agar halaman tetap dapat dirender tanpa galat.
 */
export async function fetchHospitalServer(id: string): Promise<Hospital | null> {
  const trimmed = id.trim();
  if (!trimmed) return null;

  const base = backendBaseUrl();
  const headers: Record<string, string> = { Accept: "application/json" };
  const secret = process.env.VERCEL_AUTOMATION_BYPASS_SECRET?.trim();
  if (secret && describeBackend(base).environment !== "production") {
    headers["x-vercel-protection-bypass"] = secret;
  }

  try {
    const res = await fetch(
      `${base}/api/v1/hospitals/${encodeURIComponent(trimmed)}`,
      {
        method: "GET",
        headers,
        cache: "no-store",
        signal: AbortSignal.timeout(8_000),
      },
    );
    if (!res.ok) return null;
    const payload = (await res.json()) as Partial<ApiSuccess<Hospital, DetailMeta>> | null;
    if (!payload || typeof payload !== "object" || !payload.data) return null;
    return payload.data;
  } catch {
    return null;
  }
}
