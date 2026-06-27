import type { NextConfig } from "next";

const isDev = process.env.NODE_ENV === 'development';
import { getSupabaseHostname } from '@/lib/supabase-url';

const supabaseHost = getSupabaseHostname();

const nextConfig: NextConfig = {
  compress: true,
  reactStrictMode: true,
  poweredByHeader: false,
  allowedDevOrigins: isDev ? ['192.168.1.13', 'localhost:3000'] : [],
  experimental: {
    optimizePackageImports: ['@supabase/supabase-js'],
  },
  images: {
    qualities: [70, 75, 80, 85],
    minimumCacheTTL: 60 * 60 * 24 * 7,
    formats: ['image/avif', 'image/webp'],
    remotePatterns: [
      {
        // Supabase Storage CDN — locked to specific project to prevent cross-project image optimization
        protocol: 'https',
        hostname: supabaseHost,
        pathname: '/storage/v1/object/public/**',
      },
      ...(isDev
        ? [
            {
              protocol: 'http' as const,
              hostname: 'localhost',
              pathname: '/**',
            },
            {
              protocol: 'http' as const,
              hostname: '127.0.0.1',
              pathname: '/**',
            },
          ]
        : []),
    ],
  },
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          {
            key: 'X-Frame-Options',
            value: 'DENY',
          },
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff',
          },
          {
            key: 'Referrer-Policy',
            value: 'strict-origin-when-cross-origin',
          },
          {
            key: 'Permissions-Policy',
            value: 'camera=(), microphone=(), geolocation=()',
          },
           {
             key: 'Strict-Transport-Security',
             value: isDev ? 'max-age=31536000; includeSubDomains' : 'max-age=31536000; includeSubDomains; preload',
            },
            // Note: Content-Security-Policy is set dynamically in proxy.ts
            // with per-request nonces. The static config cannot support nonces.
        ],
      },
    ];
  },
};

export default nextConfig;
