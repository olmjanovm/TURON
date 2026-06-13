import type { NextConfig } from 'next';

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
  // FAZA A1/A2: /api/* so'rovlar app/api/[...path] route handler orqali
  // eski Fastify backendga proxy qilinadi (cookie -> Bearer). FAZA J'da
  // route handlerlar to'g'ridan-to'g'ri packages/core'ni chaqiradi.

  // Bot rolga qarab /customer, /courier, /admin/dashboard ochadi.
  // /customer → "/" (customer home). /courier endi real sahifa bor.
  async rewrites() {
    return [
      { source: '/customer', destination: '/' },
      { source: '/customer/:path*', destination: '/' },
    ];
  },
};

export default nextConfig;
