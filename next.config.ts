import type { NextConfig } from "next";
import os from "os";

const isDev = process.env.NODE_ENV === 'development';
import { getSupabaseHostname } from '@/lib/supabase/url';

const supabaseHost = getSupabaseHostname();

const getDevOrigins = () => {
  const ips = ['localhost:3000', 'localhost', '127.0.0.1'];
  try {
    const interfaces = os.networkInterfaces();
    for (const devName in interfaces) {
      const iface = interfaces[devName];
      if (!iface) continue;
      for (const alias of iface) {
        if (alias.family === 'IPv4' && !alias.internal) {
          ips.push(alias.address);
          ips.push(`${alias.address}:3000`);
        }
      }
    }
  } catch {
    // fallback
  }
  return ips;
};

const nextConfig: NextConfig = {
  reactStrictMode: true,
  poweredByHeader: false,
  allowedDevOrigins: isDev ? getDevOrigins() : [],
  experimental: {
    optimizePackageImports: ['@supabase/supabase-js'],
  },
  images: {
    qualities: [60, 70, 75, 80, 85],
    minimumCacheTTL: 60 * 60 * 24 * 7,
    formats: ['image/avif', 'image/webp'],
    remotePatterns: [
      {
        // Supabase Storage CDN — locked to specific project to prevent cross-project image optimization
        protocol: 'https' as const,
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
      // Prevent browsers from caching admin pages — always fetch latest from server
      {
        source: '/admin/:path*',
        headers: [
          {
            key: 'Cache-Control',
            value: 'no-store, no-cache, must-revalidate',
          },
        ],
      },
      {
        source: '/api/:path*',
        headers: [
          {
            key: 'Cache-Control',
            value: 'no-store, no-cache, must-revalidate',
          },
        ],
      },
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
              value: isDev ? 'max-age=31536000; includeSubDomains' : 'max-age=63072000; includeSubDomains; preload',
            },
            // Note: Content-Security-Policy is set dynamically in proxy.ts
            // with per-request nonces. The static config cannot support nonces.
        ],
      },
    ];
  },
};

export default nextConfig;
