import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  output: process.env.CI ? "standalone" : undefined,
  experimental: {
    useCache: true,
  },
  allowedDevOrigins: [
    "laptop.tailad6f63.ts.net"
  ],
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "i.scdn.co",
      },
    ],
  },
};

export default nextConfig;
