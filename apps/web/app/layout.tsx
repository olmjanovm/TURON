import type { Metadata, Viewport } from 'next';
import Script from 'next/script';
import { AppProviders } from '@/providers/app-providers';
import { TIER_INIT_SCRIPT } from '@/lib/device-tier';
import './globals.css';

export const metadata: Metadata = {
  title: 'TURON',
  description: 'TURON — tandir taomlari yetkazib berish',
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  viewportFit: 'cover',
  themeColor: '#0b1220',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="uz">
      <head>
        {/* Device tier'ni paint'dan OLDIN o'rnatadi (flash yo'q) */}
        <script dangerouslySetInnerHTML={{ __html: TIER_INIT_SCRIPT }} />
        {/* Theme — paint'dan OLDIN .dark klassini qo'yadi (flash yo'q). */}
        <script
          dangerouslySetInnerHTML={{
            __html: `(function(){try{var t=localStorage.getItem('turon-theme')||'light';var d=t==='dark'||(t==='system'&&matchMedia('(prefers-color-scheme: dark)').matches);document.documentElement.classList.toggle('dark',d);}catch(e){}})();`,
          }}
        />
        {/* Telegram WebApp SDK — interaktivlikdan oldin yuklanadi */}
        <Script
          src="https://telegram.org/js/telegram-web-app.js"
          strategy="beforeInteractive"
        />
      </head>
      <body>
        <AppProviders>{children}</AppProviders>
      </body>
    </html>
  );
}
