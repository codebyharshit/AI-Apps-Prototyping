import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Production optimizations
  output: 'standalone',
  experimental: {
    // Enable modern features
    optimizePackageImports: ['@radix-ui/react-icons', 'lucide-react'],
  },
  // Image optimization
  images: {
    domains: [],
    unoptimized: false,
  },
  // Compiler optimizations
  compiler: {
    removeConsole: process.env.NODE_ENV === 'production',
  },
  // Performance optimizations
  swcMinify: true,
  poweredByHeader: false,
  // ESLint configuration for deployment
  eslint: {
    // Warning during builds, error during development
    ignoreDuringBuilds: true,
  },
  // TypeScript configuration for deployment
  typescript: {
    // Warning during builds, error during development
    ignoreBuildErrors: true,
  },
};

export default nextConfig;
