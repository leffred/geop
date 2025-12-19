import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  reactCompiler: true,
};

export default nextConfig;
/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'standalone', // <--- Cette ligne est CRUCIAL pour GCR
};

export default nextConfig;