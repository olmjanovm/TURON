import type { NextConfig } from 'next';

const API_URL = process.env.NEXT_PUBLIC_API_URL?.trim() || 'https://turonkafe.duckdns.org';

const nextConfig: NextConfig = {
  reactStrictMode: true,
  // Allow @turon/shared (workspace TS source) to be transpiled by Next.
  transpilePackages: ['@turon/shared'],
  images: {
    remotePatterns: [{ protocol: 'https', hostname: '**' }],
  },
  // @turon/shared NodeNext uslubida '.js' kengaytma bilan import qiladi
  // (masalan './constants.js'). Webpack'ga uni TS manbasiga yechishni o'rgatamiz.
  webpack(config) {
    config.resolve.extensionAlias = {
      '.js': ['.ts', '.tsx', '.js'],
      '.mjs': ['.mts', '.mjs'],
    };
    return config;
  },

  // FAZA A1: barcha /api/* so'rovlar hozircha eski Fastify backendga proxy qilinadi.
  // FAZA J'da bu route handlerlar bilan almashtiriladi.
  async rewrites() {
    return [
      {
        source: '/api/:path*',
        destination: `${API_URL}/api/:path*`,
      },
    ];
  },
};

export default nextConfig;
