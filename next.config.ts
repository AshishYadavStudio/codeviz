import type { NextConfig } from "next";

/**
 * GitHub Pages serves a project site at username.github.io/codeviz, so every
 * asset and route needs that prefix. Only applied when building for Pages
 * (set by the deploy workflow) — local dev and `next start` stay at `/`.
 */
const basePath = process.env.GITHUB_PAGES === "true" ? "/codeviz" : "";

const nextConfig: NextConfig = {
  output: "export",
  basePath,
  assetPrefix: basePath,
  images: {
    unoptimized: true,
  },
};

export default nextConfig;
