/**
 * Fetch wrapper tunggal untuk /api/v1.
 * - timeout, credentials same-origin (cookie session HttpOnly dari Go)
 * - parsing galat {error:{code,message,details?}, request_id}
 * - CSRF: token dari /auth/csrf disimpan di MEMORI (bukan storage), dikirim
 *   sebagai X-CSRF-Token pada mutasi terautentikasi
 * - TIDAK ada retry otomatis, terutama untuk mutasi.
 * - Tidak pernah melog body/kode/token.
 */
import type {
  ApiErrorBody,
  ApiErrorDetail,
  ApiSuccess,
  CsrfResult,
} from "@/lib/contracts/types";

export const API_BASE_PATH =
  process.env.NEXT_PUBLIC_API_BASE_PATH?.replace(/\/+$/, "") || "/api/v1";

// Backend serverless dapat mengalami cold start; beri waktu lebih longgar.
const DEFAULT_TIMEOUT_MS = 20_000;

export class ApiError extends Error {
  readonly status: number;
  readonly code: string;
  readonly requestId: string | null;
  readonly retryAfterSeconds: number | null;
  /** Rincian per field (422); kosong bila server tidak mengirimnya. */
  readonly details: ApiErrorDetail[];

  constructor(init: {
    status: number;
    code: string;
    message: string;
    requestId?: string | null;
    retryAfterSeconds?: number | null;
    details?: ApiErrorDetail[];
  }) {
    super(init.message);
    this.name = "ApiError";
    this.status = init.status;
    this.code = init.code;
    this.requestId = init.requestId ?? null;
    this.retryAfterSeconds = init.retryAfterSeconds ?? null;
    this.details = init.details ?? [];
  }
}

export function isAbortError(err: unknown): boolean {
  return err instanceof DOMException && err.name === "AbortError";
}

export function toApiError(err: unknown): ApiError {
  if (err instanceof ApiError) return err;
  return new ApiError({
    status: 0,
    code: "unknown_error",
    message: "Terjadi kesalahan yang tidak terduga.",
  });
}

let csrfToken: string | null = null;

export function clearCsrfToken(): void {
  csrfToken = null;
}

/** Simpan CSRF token dari respons login (hanya di memori). */
export function setCsrfToken(token: string): void {
  csrfToken = token;
}

export interface RequestOptions {
  method?: "GET" | "POST" | "PATCH" | "DELETE";
  body?: unknown;
  /** Sinyal pembatalan dari pemanggil (mis. permintaan lama yang digantikan). */
  signal?: AbortSignal;
  timeoutMs?: number;
  /** Sertakan X-CSRF-Token (mutasi terautentikasi). */
  csrf?: boolean;
}

function parseRetryAfter(header: string | null): number | null {
  if (!header) return null;
  const seconds = Number.parseInt(header, 10);
  return Number.isFinite(seconds) && seconds >= 0 ? seconds : null;
}

async function ensureCsrfToken(signal?: AbortSignal): Promise<string> {
  if (csrfToken) return csrfToken;
  const res = await apiRequest<CsrfResult>("/auth/csrf", { signal });
  csrfToken = res.data.csrf_token;
  return csrfToken;
}

export async function apiRequest<T, M = unknown>(
  path: string,
  options: RequestOptions = {},
): Promise<ApiSuccess<T, M>> {
  const { method = "GET", body, signal, timeoutMs = DEFAULT_TIMEOUT_MS } = options;

  const headers: Record<string, string> = { Accept: "application/json" };
  if (body !== undefined) headers["Content-Type"] = "application/json";
  if (options.csrf) headers["X-CSRF-Token"] = await ensureCsrfToken(signal);

  const timeoutSignal = AbortSignal.timeout(timeoutMs);
  const combined = signal ? AbortSignal.any([signal, timeoutSignal]) : timeoutSignal;

  let response: Response;
  try {
    response = await fetch(`${API_BASE_PATH}${path}`, {
      method,
      headers,
      body: body === undefined ? undefined : JSON.stringify(body),
      // Cookie session operator (HttpOnly) harus selalu ikut.
      credentials: "include",
      // Tracking dan operator tidak boleh di-cache; data RS juga selalu segar.
      cache: "no-store",
      signal: combined,
    });
  } catch (err) {
    if (signal?.aborted) throw err; // dibatalkan pemanggil; bukan galat tampilan
    if (timeoutSignal.aborted) {
      throw new ApiError({
        status: 0,
        code: "timeout",
        message: "Permintaan terlalu lama. Periksa koneksi lalu coba lagi.",
      });
    }
    throw new ApiError({
      status: 0,
      code: "network_error",
      message: "Tidak dapat terhubung ke server. Periksa koneksi lalu coba lagi.",
    });
  }

  let payload: unknown = null;
  const text = await response.text();
  if (text) {
    try {
      payload = JSON.parse(text);
    } catch {
      payload = null;
    }
  }

  if (!response.ok) {
    const errBody = payload as Partial<ApiErrorBody> | null;
    const code = errBody?.error?.code ?? "unexpected_response";
    // Sesi habis atau token CSRF tidak valid: buang token agar diminta ulang.
    if (response.status === 401 || code === "invalid_csrf") clearCsrfToken();
    throw new ApiError({
      status: response.status,
      code,
      message: errBody?.error?.message ?? "Permintaan tidak dapat diproses.",
      requestId: errBody?.request_id ?? response.headers.get("X-Request-ID"),
      retryAfterSeconds: parseRetryAfter(response.headers.get("Retry-After")),
      details: Array.isArray(errBody?.error?.details) ? errBody.error.details : [],
    });
  }

  if (payload === null || typeof payload !== "object" || !("data" in payload)) {
    throw new ApiError({
      status: response.status,
      code: "unexpected_response",
      message: "Respons server tidak sesuai format yang diharapkan.",
      requestId: response.headers.get("X-Request-ID"),
    });
  }
  return payload as ApiSuccess<T, M>;
}
