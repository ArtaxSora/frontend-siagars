import { NextResponse, type NextRequest } from "next/server";
import { backendBaseUrl, describeBackend } from "@/lib/api/backend";

/**
 * Backend staging terkunci Vercel Authentication, sedangkan rewrite di
 * next.config.ts tidak bisa menambah header. Bila API_BASE_URL menunjuk
 * selain production DAN VERCEL_AUTOMATION_BYPASS_SECRET diisi, permintaan
 * /api/v1 di-rewrite di sini dengan header bypass. Selain itu (production)
 * tidak ada yang diubah: rewrite next.config.ts berjalan tanpa header bypass.
 * Secret hanya hidup di server; tidak pernah dikirim ke browser.
 */
export function proxy(request: NextRequest) {
  const secret = process.env.VERCEL_AUTOMATION_BYPASS_SECRET?.trim();
  const base = backendBaseUrl();
  if (!secret || describeBackend(base).environment === "production") {
    return NextResponse.next();
  }

  const headers = new Headers(request.headers);
  headers.set("x-vercel-protection-bypass", secret);
  const target = new URL(`${base}${request.nextUrl.pathname}${request.nextUrl.search}`);
  return NextResponse.rewrite(target, { request: { headers } });
}

export const config = {
  matcher: "/api/v1/:path*",
};
