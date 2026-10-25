import type { NextConfig } from "next";

/**
 * /api/v1/* di-rewrite ke backend (HANDOVER_PRODUCTION_v0.2.1 §2): browser
 * hanya bicara ke origin FE, jadi cookie sesi operator (Path=/api/v1) bekerja
 * dan backend tidak perlu CORS. Tanpa header bypass: production publik.
 * Server-only (tanpa NEXT_PUBLIC_); bawaan = backend production.
 */
const API_BASE_URL = (
  process.env.API_BASE_URL || "https://siagars-backend.vercel.app"
).replace(/\/+$/, "");

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
