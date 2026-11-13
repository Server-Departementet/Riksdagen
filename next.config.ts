import type { NextConfig } from "next";
import { execSync } from "node:child_process";
import { env } from "node:process";
import packageJson from "./package.json" with { type: "json" };
import type { Json } from "./src/lib/json";

// Compile-time constants replacing bare identifiers in every bundle. Next
// JSON-encodes each value as a literal, so only strings, numbers and booleans
// survive - anything structured travels as a JSON string and is parsed with
// parseJson. The global declarations in src/types/globals.d.ts take their
// types from here.
// The commit being built, for the sidebar footer. CI provides it; elsewhere ask git.
function commitHash(): string {
  if (env.GITHUB_SHA) return env.GITHUB_SHA.slice(0, 7);
  try {
    return execSync("git rev-parse --short=7 HEAD", { stdio: ["ignore", "pipe", "ignore"] }).toString().trim() || "okänd";
  }
  catch {
    return "okänd";
  }
}

const defines = {
  PACKAGE_CONTRIBUTORS: JSON.stringify(packageJson.contributors) as Json<typeof packageJson.contributors>,
  COPYRIGHT_YEAR: new Date().getFullYear(),
  COMMIT_HASH: commitHash(),
};
export type Defines = typeof defines;

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

  compiler: {
    define: defines,
  },
};

export default nextConfig;
