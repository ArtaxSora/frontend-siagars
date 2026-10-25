/**
 * Backend tujuan /api/v1 (server-only). Dipakai next.config.ts (rewrite),
 * proxy.ts (header bypass staging), dan halaman /status (label lingkungan).
 * Ganti backend lewat API_BASE_URL di .env.local / env Vercel.
 */

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
