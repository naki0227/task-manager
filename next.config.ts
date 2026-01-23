import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: 'export',
  images: {
    unoptimized: true,
  },
  // Note: rewrites() are ignored in static export mode.
  // API calls must use absolute URLs (handled by NEXT_PUBLIC_API_URL).
  // async rewrites() { ... } 
};

export default nextConfig;
