/**
 * FAZA A5 — Device Tier aniqlash.
 *
 * Bitta maqsad: kuchli telefon to'liq sehrni ko'radi, zaif telefon (2GB RAM,
 * 2015-yil) xuddi shunday chiroyli, lekin yengil versiyani oladi. Hech kim
 * "buzilgan" UI ko'rmaydi.
 *
 *   full      — flagman: barcha animatsiya, parallax, 3D tilt, zarralar
 *   balanced  — o'rta: yengilroq animatsiya
 *   lite      — 2GB RAM / sekin tarmoq / reduced-motion: statik, ammo chiroyli
 */
export type DeviceTier = 'full' | 'balanced' | 'lite';

export function detectTier(): DeviceTier {
  if (typeof navigator === 'undefined') return 'full';

  const nav = navigator as Navigator & {
    deviceMemory?: number;
    connection?: { effectiveType?: string; saveData?: boolean };
  };

  const memory = nav.deviceMemory ?? 4;
  const cores = nav.hardwareConcurrency ?? 4;
  const reducedMotion =
    typeof matchMedia === 'function' &&
    matchMedia('(prefers-reduced-motion: reduce)').matches;
  const conn = nav.connection;
  const slowNet =
    conn?.saveData === true ||
    /(^|[^0-9])(2g|slow-2g)$/i.test(conn?.effectiveType ?? '');

  if (reducedMotion || memory <= 2 || cores <= 2 || slowNet) return 'lite';
  if (memory <= 4 || cores <= 4) return 'balanced';
  return 'full';
}

/**
 * SSR'da flash bo'lmasligi uchun <head>ga inline qo'yiladigan skript.
 * Hydration'dan OLDIN <html data-tier="...">ni o'rnatadi.
 * detectTier mantig'i bilan sinxron saqlanishi shart.
 */
export const TIER_INIT_SCRIPT = `(function(){try{
var n=navigator,m=n.deviceMemory||4,c=n.hardwareConcurrency||4,
rm=matchMedia&&matchMedia('(prefers-reduced-motion: reduce)').matches,
cn=n.connection||{},sn=cn.saveData===true||/(^|[^0-9])(2g|slow-2g)$/i.test(cn.effectiveType||''),
t=(rm||m<=2||c<=2||sn)?'lite':((m<=4||c<=4)?'balanced':'full');
document.documentElement.dataset.tier=t;
}catch(e){document.documentElement.dataset.tier='balanced';}})();`;
