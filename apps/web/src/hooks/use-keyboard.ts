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
      // window.innerHeight = layout viewport (klaviaturadan oldingi)
      // visualViewport.height = ko'rinadigan qism (klaviaturadan keyingi)
      const diff = window.innerHeight - vv.height - vv.offsetTop;
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
      const targetTop = vv.height * 0.33; // ko'rinadigan maydonning yuqori uchdan biri
      const delta = rect.top - targetTop;
      if (Math.abs(delta) > 8) window.scrollBy({ top: delta, behavior: 'smooth' });
    } else {
      el.scrollIntoView({ block: 'center', behavior: 'smooth' });
    }
  };

  // Klaviatura animatsiyasini kutib, 2 bosqichда aniqlaymiz
  setTimeout(doScroll, 200);
  setTimeout(doScroll, 430);
}
