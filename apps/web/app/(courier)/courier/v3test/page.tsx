'use client';

import { useEffect, useRef, useState } from 'react';
import { loadYandexMapsV3, RESTAURANT_DEFAULT } from '@/lib/yandex-maps';

/**
 * VAQTINCHALIK test sahifasi — Yandex Maps v3 (VEKTOR) kalit bilan ishlaydimi
 * tekshirish uchun. `/courier/v3test` ni brauzerда oching:
 *  - Zamonaviy vektor xarita ko'rinsa → v3 ishlaydi, to'liq ko'chiramiz.
 *  - "XATO" yoki bo'sh bo'lsa → kalit v3/vektorni qo'llamaydi, v2.1'da qolamiz.
 */
export default function V3TestPage() {
  const ref = useRef<HTMLDivElement>(null);
  const [status, setStatus] = useState('v3 yuklanmoqda…');

  useEffect(() => {
    let cancelled = false;
    let map: { destroy?: () => void } | null = null;

    loadYandexMapsV3()
      .then((ymaps3) => {
        if (cancelled || !ref.current) return;
        const y = ymaps3 as unknown as {
          YMap: new (el: HTMLElement, p: Record<string, unknown>) => { addChild: (c: unknown) => void; destroy?: () => void };
          YMapDefaultSchemeLayer: new (p?: Record<string, unknown>) => unknown;
          YMapDefaultFeaturesLayer: new (p?: Record<string, unknown>) => unknown;
        };
        const m = new y.YMap(ref.current, {
          location: { center: [RESTAURANT_DEFAULT.lng, RESTAURANT_DEFAULT.lat], zoom: 15 },
          mode: 'vector',
        });
        m.addChild(new y.YMapDefaultSchemeLayer({}));
        m.addChild(new y.YMapDefaultFeaturesLayer({}));
        map = m;
        setStatus('✅ v3 VEKTOR xarita yuklandi — ko‘rinyaptimi?');
      })
      .catch((e: unknown) => {
        const msg = e instanceof Error ? e.message : String(e);
        setStatus('❌ XATO: ' + msg + ' (kalit v3/vektorni qo‘llamasligi mumkin)');
      });

    return () => {
      cancelled = true;
      try { map?.destroy?.(); } catch {/* */}
    };
  }, []);

  return (
    <div className="fixed inset-0 bg-[#0a0a0c]">
      <div ref={ref} className="h-full w-full" />
      <div className="absolute left-3 right-3 top-3 z-10 rounded-xl bg-white/95 px-3 py-2 text-center text-sm font-black text-slate-900 shadow-xl">
        {status}
      </div>
    </div>
  );
}
