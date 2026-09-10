import type { NextConfig } from "next";

const mode = process.env.NEXT_PUBLIC_MODE || 'demo';

const nextConfig: NextConfig = {
  distDir: mode === 'real' ? '.next-real' : '.next-demo',
  devIndicators: false,
};

export default nextConfig;
