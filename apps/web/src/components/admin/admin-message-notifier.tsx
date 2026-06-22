'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useQueryClient } from '@tanstack/react-query';
import { MessageCircle, X } from 'lucide-react';
import { useAdminInbox } from '@/hooks/use-admin-chats';
import { getSocket } from '@/lib/socket';

/**
 * App-wide admin "yangi xabar" bildirishnomasi (Telegram uslubi).
 * - Manba: mavjud `useAdminInbox` poll'i (12s) — kimdan/nima allaqachon bor.
 * - Yangi xabar (unread oshsa / yangi thread) → yuqoridan banner tushadi:
 *   KIMDAN (Mijoz/Kuryer + #order) + NIMA (preview) + ovoz (ding).
 * - Bosilsa → o'sha chatga o'tadi. Bir vaqtda ko'p kelса — eng so'nggi 3 ta
 *   ko'rinadi, qolгани "+N" bilan jamlanadi (ko'p mijoz yozsa ham toza).
 * - Birinchi yuklashda JIM (seed) — app ochilishida eski unreadlarга signal bermaydi.
 */

interface InboxEntry {
  orderId: string;
  orderNumber: string;
  unreadCount: number;
  lastMessage: string;
  lastAt: string;
}
type Role = 'courier' | 'customer';
interface Toast {
  id: string;
  chatId: string;
  role: Role;
  who: string;
  preview: string;
}

const MAX_VISIBLE = 3;
const AUTO_DISMISS_MS = 7_000;

export function AdminMessageNotifier() {
  const router = useRouter();
  const qc = useQueryClient();
  const { data } = useAdminInbox();
  const [toasts, setToasts] = useState<Toast[]>([]);
  const [overflow, setOverflow] = useState(0);

  // ── Realtime: socket 'chat:message' kelganda inbox'ni DARHOL yangilaymiz
  //    (12s poll'ni kutmasdan → lahzali banner). Admin role:ADMIN xonasida.
  useEffect(() => {
    const socket = getSocket();
    const onMsg = () => qc.invalidateQueries({ queryKey: ['admin', 'chat-inbox'] });
    socket.on('chat:message', onMsg);
    return () => { socket.off('chat:message', onMsg); };
  }, [qc]);

  // key (`role:orderId`) → oxirgi ko'rilgan {count, at}. null = hali seed bo'lmagan.
  const seenRef = useRef<Map<string, { count: number; at: string }> | null>(null);
  const audioCtxRef = useRef<AudioContext | null>(null);
  const unlockedRef = useRef(false);
  const timersRef = useRef<Record<string, ReturnType<typeof setTimeout>>>({});

  // ── Ovozni user gesture'да unlock (WebView/brauzer autoplay siyosati) ──
  useEffect(() => {
    const unlock = () => {
      if (unlockedRef.current) return;
      try {
        const Ctx = window.AudioContext || (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
        if (Ctx) {
          audioCtxRef.current = new Ctx();
          void audioCtxRef.current.resume();
          unlockedRef.current = true;
        }
      } catch {/* ovoz ixtiyoriy */}
    };
    window.addEventListener('pointerdown', unlock);
    window.addEventListener('touchstart', unlock);
    return () => {
      window.removeEventListener('pointerdown', unlock);
      window.removeEventListener('touchstart', unlock);
    };
  }, []);

  const beep = useCallback(() => {
    const ctx = audioCtxRef.current;
    if (!ctx) return;
    try {
      void ctx.resume();
      const now = ctx.currentTime;
      // Ikki-tonli yumshoq "ding-dong" (Telegram his)
      [ [880, 0], [1175, 0.13] ].forEach(([freq, offset]) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'sine';
        osc.frequency.value = freq;
        gain.gain.setValueAtTime(0.0001, now + offset);
        gain.gain.exponentialRampToValueAtTime(0.18, now + offset + 0.02);
        gain.gain.exponentialRampToValueAtTime(0.0001, now + offset + 0.22);
        osc.connect(gain).connect(ctx.destination);
        osc.start(now + offset);
        osc.stop(now + offset + 0.24);
      });
    } catch {/* ignore */}
  }, []);

  const dismiss = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
    const tm = timersRef.current[id];
    if (tm) { clearTimeout(tm); delete timersRef.current[id]; }
  }, []);

  // ── Yangi xabarlarni aniqlash ──
  useEffect(() => {
    if (!data) return;
    const entries: Array<InboxEntry & { key: string; role: Role }> = [
      ...data.courierMessages.map((m) => ({ ...m, key: `courier:${m.orderId}`, role: 'courier' as Role })),
      ...data.customerMessages.map((m) => ({ ...m, key: `customer:${m.orderId}`, role: 'customer' as Role })),
    ];

    // Birinchi yuklash — JIM seed (app ochilishida signal bermaymiz)
    if (seenRef.current === null) {
      seenRef.current = new Map(entries.map((e) => [e.key, { count: e.unreadCount, at: e.lastAt }]));
      return;
    }

    const seen = seenRef.current;
    const fresh: Array<InboxEntry & { key: string; role: Role }> = [];
    for (const e of entries) {
      const prev = seen.get(e.key);
      const isNew = !prev || e.unreadCount > prev.count || (e.lastAt > prev.at && e.unreadCount > 0);
      if (isNew) fresh.push(e);
      seen.set(e.key, { count: e.unreadCount, at: e.lastAt });
    }
    if (fresh.length === 0) return;

    const newToasts: Toast[] = fresh.map((e) => ({
      id: `${e.key}:${e.lastAt}`,
      chatId: e.orderId,
      role: e.role,
      who: `${e.role === 'courier' ? '🛵 Kuryer' : '👤 Mijoz'} · №${e.orderNumber}`,
      preview: e.lastMessage || 'Yangi xabar',
    }));

    setToasts((prev) => {
      // Dublikatlarni (bir xil id) chiqarib, eng so'nggilarini tepaga
      const merged = [...newToasts, ...prev.filter((p) => !newToasts.some((n) => n.id === p.id))];
      const visible = merged.slice(0, MAX_VISIBLE);
      setOverflow(Math.max(0, merged.length - MAX_VISIBLE));
      return visible;
    });
    beep();
  }, [data, beep]);

  // ── Har toast uchun auto-dismiss ──
  useEffect(() => {
    for (const t of toasts) {
      if (timersRef.current[t.id]) continue;
      timersRef.current[t.id] = setTimeout(() => dismiss(t.id), AUTO_DISMISS_MS);
    }
  }, [toasts, dismiss]);

  useEffect(() => () => { Object.values(timersRef.current).forEach(clearTimeout); }, []);

  if (toasts.length === 0) return null;

  const open = (t: Toast) => {
    dismiss(t.id);
    setOverflow(0);
    router.push(`/admin/chats/${encodeURIComponent(t.chatId)}?role=${t.role}`);
  };

  return (
    <div
      className="pointer-events-none fixed inset-x-0 top-0 z-[60] mx-auto flex w-full max-w-[480px] flex-col gap-2 px-3"
      style={{ paddingTop: 'calc(env(safe-area-inset-top, 0px) + 8px)' }}
    >
      {toasts.map((t) => (
        <button
          key={t.id}
          type="button"
          onClick={() => open(t)}
          className="pointer-events-auto flex w-full items-start gap-3 rounded-2xl border border-slate-200 bg-white/95 p-3 text-left shadow-lg shadow-slate-900/10 backdrop-blur-xl transition active:scale-[0.98]"
        >
          <span className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-ember to-orange-500 text-white">
            <MessageCircle size={18} />
          </span>
          <span className="min-w-0 flex-1">
            <span className="block truncate text-[13px] font-black text-slate-900">{t.who}</span>
            <span className="block truncate text-xs text-slate-500">{t.preview}</span>
          </span>
          <span
            role="button"
            tabIndex={0}
            onClick={(e) => { e.stopPropagation(); dismiss(t.id); }}
            className="-mr-1 -mt-1 flex h-7 w-7 shrink-0 items-center justify-center rounded-lg text-slate-400 active:scale-90"
            aria-label="Yopish"
          >
            <X size={15} />
          </span>
        </button>
      ))}
      {overflow > 0 && (
        <button
          type="button"
          onClick={() => router.push('/admin/chats')}
          className="pointer-events-auto self-center rounded-full bg-slate-900/90 px-3 py-1 text-[11px] font-bold text-white shadow-lg active:scale-95"
        >
          +{overflow} yangi xabar — hammasi
        </button>
      )}
    </div>
  );
}
