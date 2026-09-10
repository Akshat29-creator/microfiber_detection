import type { NextConfig } from "next";

const isProd = process.env.NODE_ENV === 'production' || !!process.env.VERCEL;
const mode = process.env.NEXT_PUBLIC_MODE || 'demo';

const nextConfig: NextConfig = {
  // Use standard .next for production and Vercel deployments
  // In local development, use separate folders to allow running demo (3000) & real (3001) concurrently
  distDir: isProd ? undefined : (mode === 'real' ? '.next-real' : '.next-demo'),
  devIndicators: false,
};

export default nextConfig;
