'use client';

import { useEffect, useState } from 'react';

/**
 * Mobil klaviatura holatini visualViewport API orqali aniqlaydi.
 * - isOpen: klaviatura ochilganmi
 * - height: klaviatura egallagan vertical piksellar (0 = yopiq)
 *
 * Ishlatish:
 *   const { isOpen, height } = useKeyboard();
 *   // Sticky CTA'ni klaviatura ustiga ko'tarish: bottom: height
 *   // Bottom nav'ni yashirish: translateY(100%) when isOpen
 *
 * Telegram WebApp va iOS Safari'da ishlaydi. Eski brauzerlarda no-op (isOpen=false).
 */
export function useKeyboard() {
  const [state, setState] = useState({ isOpen: false, height: 0 });

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const vv = window.visualViewport;
    if (!vv) return;

    const compute = () => {
      // Klaviatura balandligi = layout viewport − ko'rinadigan viewport.
      //   window.innerHeight = layout viewport (klaviaturadan mustaqil)
      //   visualViewport.height = klaviaturadan keyingi ko'rinadigan qism
      // MUHIM: `offsetTop`ni AYIRMAYMIZ. Aks holda sahifa scroll qilinganda
      // offsetTop o'zgarib, kbHeight ham o'zgaradi → fixed CTA siljiydi va input
      // "chiqib keyin yo'qoladi" (flicker), nav qaytmaydi. offsetTop'siz qiymat
      // scroll'dan mustaqil va barqaror bo'ladi.
      const diff = window.innerHeight - vv.height;
      const height = Math.max(0, Math.round(diff));
      // 150px chegarasi — kichik UI o'zgarishlarni klaviatura deb hisoblamaslik
      const isOpen = height > 150;
      setState((prev) => (prev.isOpen === isOpen && prev.height === height ? prev : { isOpen, height }));
    };

    compute();
    vv.addEventListener('resize', compute);
    vv.addEventListener('scroll', compute);
    return () => {
      vv.removeEventListener('resize', compute);
      vv.removeEventListener('scroll', compute);
    };
  }, []);

  return state;
}

/**
 * Input fokusda — uni klaviatura USTIDAGI ko'rinadigan maydonga olib chiqadi.
 *
 * Nega oddiy `scrollIntoView({block:'center'})` emas: u layout viewport markaziga
 * keltiradi, lekin klaviatura ochiq bo'lganda markaz aynan klaviatura chizig'ida
 * bo'lib, input ortda qolib ketadi. Shuning uchun `visualViewport` (klaviaturadan
 * keyingi ko'rinadigan balandlik) asosida input'ni ko'rinadigan maydonning yuqori
 * ~33%'iga olib kelamiz — klaviatura va sticky CTA ustida aniq ko'rinadi.
 *
 * Klaviatura animatsiyasi bosqichma-bosqich (viewport asta kichrayadi), shuning
 * uchun 2 marta urinamiz.
 *
 *   <input onFocus={focusScrollIntoView} ... />
 */
export function focusScrollIntoView(e: React.FocusEvent<HTMLElement>) {
  const el = e.currentTarget;

  const doScroll = () => {
    const vv = typeof window !== 'undefined' ? window.visualViewport : null;
    if (vv) {
      const rect = el.getBoundingClientRect();
      // Input pastki qirrasini ko'rinadigan maydon pastidan ~110px tepada turg'azamiz —
      // ya'ni klaviatura ustidagi lifted CTA (~88px) ustida aniq ko'rinadi.
      const desiredBottom = vv.height - 110;
      const delta = rect.bottom - desiredBottom;
      if (Math.abs(delta) > 6) window.scrollBy({ top: delta, behavior: 'smooth' });
    } else {
      el.scrollIntoView({ block: 'center', behavior: 'smooth' });
    }
  };

  // Bitta urinish — klaviatura o'rnashgach (flicker bo'lmasligi uchun ikki marta emas)
  setTimeout(doScroll, 340);
}
