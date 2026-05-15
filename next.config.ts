import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  distDir: process.env.NEXT_DIST_DIR ?? ".next",
  experimental: {
    staleTimes: {
      dynamic: 300,
      static: 300,
    },
  },
  typedRoutes: true,
};

export default nextConfig;
