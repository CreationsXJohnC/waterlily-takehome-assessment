import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Silence Turbopack + webpack config warning by explicitly declaring turbopack config.
  turbopack: {},
  webpack(config) {
    // Fallback for Webpack: load .md files as source strings
    config.module.rules.push({
      test: /\.md$/i,
      type: "asset/source",
    });
    return config;
  },
};

export default nextConfig;
