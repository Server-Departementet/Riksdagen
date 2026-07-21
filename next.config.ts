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

  // Quote attachments live on the backend server (downloaded there by the quotes
  // crawler); relay requests for files we don't have locally. Local public/ files
  // win because plain rewrites run after the filesystem check.
  ...env.ASSET_SERVER_URL ? {
    rewrites: () => Promise.resolve([
      {
        source: "/quote-attachments/:path*",
        destination: `${env.ASSET_SERVER_URL}/quote-attachments/:path*`,
      },
    ]),
  } : {},
};

export default nextConfig;
