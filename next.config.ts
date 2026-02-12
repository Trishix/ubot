import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  reactCompiler: true,
  serverExternalPackages: ["pdf-parse", "sharp"],
  typescript: {
    ignoreBuildErrors: true,
  },
  // Silence warning about multiple lockfiles
  turbopack: {
    root: process.cwd(),
  },
};

export default nextConfig;
