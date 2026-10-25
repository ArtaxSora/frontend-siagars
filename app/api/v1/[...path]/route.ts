/**
 * Proxy server-only /api/v1/* -> backend (API_PROXY_TARGET).
 *
 * - Browser tetap same-origin, jadi cookie sesi operator bekerja.
 * - Backend staging terkunci Vercel Authentication: header bypass dipasang di
 *   sini dari VERCEL_AUTOMATION_BYPASS_SECRET dan tidak pernah sampai ke browser.
 * - Tidak ada fallback ke production: target kosong -> galat eksplisit.
 * - Header diteruskan lewat whitelist; body dan status diteruskan apa adanya.
 */
import type { NextRequest } from "next/server";

const REQUEST_HEADERS = [
  "accept",
  "content-type",
  "cookie",
  "origin",
  "x-csrf-token",
  "x-forwarded-for",
] as const;

const RESPONSE_HEADERS = [
  "content-type",
  "cache-control",
  "retry-after",
  "x-request-id",
] as const;

function errorResponse(status: number, code: string, message: string) {
  return Response.json(
    { error: { code, message }, request_id: null },
    { status, headers: { "Cache-Control": "no-store" } },
  );
}

async function proxy(
  request: NextRequest,
  ctx: RouteContext<"/api/v1/[...path]">,
): Promise<Response> {
  const target = process.env.API_PROXY_TARGET?.replace(/\/+$/, "");
  if (!target) {
    return errorResponse(
      500,
      "proxy_not_configured",
      "API_PROXY_TARGET belum diatur. Lihat .env.example.",
    );
  }

  const { path } = await ctx.params;
  const upstreamPath = path.map(encodeURIComponent).join("/");
  const url = `${target}/api/v1/${upstreamPath}${request.nextUrl.search}`;

  const headers = new Headers();
  for (const name of REQUEST_HEADERS) {
    const value = request.headers.get(name);
    if (value !== null) headers.set(name, value);
  }
  const bypass = process.env.VERCEL_AUTOMATION_BYPASS_SECRET;
  if (bypass) headers.set("x-vercel-protection-bypass", bypass);

  const hasBody = request.method !== "GET" && request.method !== "HEAD";

  let upstream: Response;
  try {
    upstream = await fetch(url, {
      method: request.method,
      headers,
      body: hasBody ? await request.arrayBuffer() : undefined,
      // Redirect = staging menolak bypass (dialihkan ke login Vercel).
      redirect: "manual",
      cache: "no-store",
      signal: request.signal,
    });
  } catch {
    return errorResponse(502, "upstream_unreachable", "Backend tidak dapat dihubungi.");
  }

  if (upstream.status >= 300 && upstream.status < 400) {
    return errorResponse(
      502,
      "upstream_locked",
      "Backend menolak akses proxy. Periksa VERCEL_AUTOMATION_BYPASS_SECRET.",
    );
  }

  const out = new Headers();
  for (const name of RESPONSE_HEADERS) {
    const value = upstream.headers.get(name);
    if (value !== null) out.set(name, value);
  }
  for (const cookie of upstream.headers.getSetCookie()) {
    out.append("set-cookie", cookie);
  }

  return new Response(upstream.body, { status: upstream.status, headers: out });
}

export { proxy as GET, proxy as POST, proxy as PATCH };
