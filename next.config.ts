import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* Options de configuration fusionnées */
  reactCompiler: true,
  output: 'standalone', // <--- Crucial pour Google Cloud Run
};

export default nextConfig;