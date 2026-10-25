import type { NextConfig } from "next";

/**
 * /api/v1/* ditangani route handler app/api/v1/[...path]/route.ts (proxy
 * server-only ke API_PROXY_TARGET + header bypass staging). Jangan tambahkan
 * rewrite /api/v1 di sini: rewrite beforeFiles akan menimpa route handler.
 */
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
};

export default nextConfig;
