import type { NextConfig } from "next";

/**
 * Semua panggilan /api/v1/* diteruskan (rewrite) ke backend online sehingga
 * browser tetap same-origin dan cookie sesi bekerja. Backend hanya menerima
 * Origin yang sama dengan PUBLIC_ORIGIN miliknya: daftarkan origin frontend
 * (mis. http://localhost:3000) di sisi backend. Server-only (tanpa NEXT_PUBLIC_).
 */
const DEFAULT_API_TARGET = "https://siagars-backend.vercel.app";
const apiProxyTarget = (
  process.env.API_PROXY_TARGET || DEFAULT_API_TARGET
).replace(/\/+$/, "");

const nextConfig: NextConfig = {
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
    return {
      beforeFiles: [
        {
          source: "/api/v1/:path*",
          destination: `${apiProxyTarget}/api/v1/:path*`,
        },
      ],
    };
  },
};

export default nextConfig;
