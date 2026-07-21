import type { NextConfig } from "next";
import { env } from "node:process";

const nextConfig: NextConfig = {
  experimental: {
    useCache: true,
  },
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "i.scdn.co",
      },
      {
        protocol: "https",
        hostname: "cdn.discordapp.com",
      },
    ],
  },
  ...env.CI ? { output: "standalone" } : {},
};

export default nextConfig;
