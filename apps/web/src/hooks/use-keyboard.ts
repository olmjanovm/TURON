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
 * Input fokusda ekran tepasiga sudralib scroll qiladi.
 * Klaviatura animatsiyasini kutgan holda (~300ms) ishlatiladi.
 *
 * Misol:
 *   <input onFocus={focusScrollIntoView} ... />
 */
export function focusScrollIntoView(e: React.FocusEvent<HTMLElement>) {
  const el = e.currentTarget;
  // Klaviatura ochilishini kutamiz (animation ~250-300ms)
  setTimeout(() => {
    el.scrollIntoView({ block: 'center', behavior: 'smooth' });
  }, 320);
}
