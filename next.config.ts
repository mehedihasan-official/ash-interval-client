import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    // The resort dataset (bulk-imported, 1,700+ resorts) stores image URLs
    // pointing at a variety of external hosts. Since the exact set of
    // domains isn't known ahead of time, any HTTPS host is allowed here;
    // the resort image component still falls back gracefully if a
    // particular URL fails to load.
    remotePatterns: [
      {
        protocol: "https",
        hostname: "**",
      },
    ],
  },
};

export default nextConfig;
