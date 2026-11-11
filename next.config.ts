import type { NextConfig } from "next";
import { backendBaseUrl } from "./lib/api/backend";

/**
 * /api/v1/* di-rewrite ke backend (arsip docs/archive/HANDOVER_PRODUCTION_v0.2.1.md §2): browser
 * hanya bicara ke origin FE, jadi cookie sesi operator (Path=/api/v1) bekerja
 * dan backend tidak perlu CORS. Server-only (tanpa NEXT_PUBLIC_); bawaan =
 * backend production. Staging (terkunci) ditangani proxy.ts lebih dulu.
 */
const API_BASE_URL = backendBaseUrl();

const nextConfig: NextConfig = {
  // Dev server dibuka lewat IP jaringan lokal (mis. dari HP); tanpa ini HMR diblokir.
  allowedDevOrigins: ["172.26.176.1"],
  cacheComponents: true,
  partialPrefetching: true,
  poweredByHeader: false,
  turbopack: {
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
  async rewrites() {
    return [
      {
        source: "/api/v1/:path*",
        destination: `${API_BASE_URL}/api/v1/:path*`,
      },
    ];
  },
};

export default nextConfig;
