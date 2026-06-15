'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { AlertCircle, Clock3, Loader2, Send, ShieldCheck, X } from 'lucide-react';
import { useOrderChat, useSendOrderChat, type CourierChatMessage } from '@/hooks/use-courier-chat';
import { focusScrollIntoView } from '@/hooks/use-keyboard';
import { haptic } from '@/lib/telegram';

interface AdminContactSheetProps {
  orderId: string;
  orderNumber?: string | null;
  /** Buyurtma yuklanmadi/eskirgan — yuqorida ogohlantirish ko'rsatamiz. */
  expired?: boolean;
  onClose: () => void;
}

/** Birinchi (oldindan tayyor) xabar — vaqtni tejaydi. */
function seedMessage(orderNumber?: string | null): string {
  const ref = orderNumber ? `#${orderNumber}` : 'ushbu';
  return `Assalomu alaykum, menga ${ref} buyurtma haqida ma'lumot kerak.`;
}

function timeLabel(iso: string): string {
  return new Date(iso).toLocaleTimeString('uz-UZ', { hour: '2-digit', minute: '2-digit' });
}

/**
 * Kuryer → admin tezkor bog'lanish (order-chat ustida).
 * Ochilganda, agar thread bo'sh bo'lsa — oldindan tayyor birinchi xabar
 * AVTOMATIK yuboriladi (vaqtni tejash). Keyin kuryer xohlagan xabarini yozadi.
 */
export function AdminContactSheet({ orderId, orderNumber, expired, onClose }: AdminContactSheetProps) {
  const qc = useQueryClient();
  const { data: messages = [], isLoading, isError, isSuccess } = useOrderChat(orderId);
  const send = useSendOrderChat(orderId);
  const [text, setText] = useState('');
  const seededRef = useRef(false);
  const readSyncedRef = useRef(false);
  const scrollRef = useRef<HTMLDivElement | null>(null);

  // Chat ochildi → backend GET inbound xabarlarni "o'qilgan" deb belgiladi.
  // Unread badge'ni darhol tozalash uchun unread query'ni invalidatsiya qilamiz.
  useEffect(() => {
    if (isSuccess && !readSyncedRef.current) {
      readSyncedRef.current = true;
      qc.invalidateQueries({ queryKey: ['courier', 'chat-unread', orderId] });
    }
  }, [isSuccess, orderId, qc]);

  const seed = useMemo(() => seedMessage(orderNumber), [orderNumber]);

  // Auto-seed: thread bo'sh bo'lsa, birinchi tayyor xabarni bir marta yuboramiz.
  useEffect(() => {
    if (seededRef.current) return;
    if (isLoading || isError) return;
    if (messages.length === 0 && !send.isPending) {
      seededRef.current = true;
      haptic.impact('light');
      send.mutate(seed);
    } else if (messages.length > 0) {
      // Allaqachon yozishilgan — qayta seed qilmaymiz.
      seededRef.current = true;
    }
  }, [isLoading, isError, messages.length, seed, send]);

  // Yangi xabarda pastga skroll.
  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' });
  }, [messages.length]);

  const handleSend = () => {
    const value = text.trim();
    if (!value || send.isPending) return;
    haptic.select();
    send.mutate(value);
    setText('');
  };

  return (
    <div className="fixed inset-0 z-[60] flex flex-col justify-end bg-black/50 backdrop-blur-sm">
      {/* tashqariga bosish → yopish */}
      <button type="button" aria-label="Yopish" className="absolute inset-0" onClick={onClose} />

      <div className="relative flex max-h-[82vh] flex-col rounded-t-3xl bg-white shadow-2xl">
        {/* Header */}
        <div className="flex items-center gap-3 border-b border-slate-100 px-4 pb-3 pt-3">
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-[#c62020] to-[#f97316] text-white">
            <ShieldCheck size={18} />
          </span>
          <div className="min-w-0 flex-1">
            <p className="text-sm font-black text-slate-900">Admin bilan bog&apos;lanish</p>
            <p className="truncate text-xs text-slate-500">
              {orderNumber ? `Buyurtma #${orderNumber}` : 'Buyurtma haqida'}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="flex h-9 w-9 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-500 active:scale-95"
            aria-label="Yopish"
          >
            <X size={16} />
          </button>
        </div>

        {expired && (
          <div className="mx-4 mt-3 flex items-start gap-2 rounded-2xl border border-amber-200 bg-amber-50 px-3 py-2.5">
            <AlertCircle size={15} className="mt-0.5 shrink-0 text-amber-600" />
            <p className="text-xs leading-snug text-amber-800">
              Bu buyurtma eskirgan yoki topshirib bo&apos;lmaydi. Kerakli ma&apos;lumotni admindan
              so&apos;rang — quyida tayyor xabar yuborildi.
            </p>
          </div>
        )}

        {/* Messages */}
        <div ref={scrollRef} className="flex-1 space-y-2.5 overflow-y-auto px-4 py-3">
          {isLoading ? (
            <div className="flex justify-center py-8">
              <Loader2 size={22} className="animate-spin text-[#c62020]" />
            </div>
          ) : messages.length === 0 ? (
            <p className="py-8 text-center text-xs text-slate-400">Xabar yuborilmoqda…</p>
          ) : (
            messages.map((m: CourierChatMessage) => {
              const own = m.senderRole === 'COURIER';
              return (
                <div key={m.id} className={`flex ${own ? 'justify-end' : 'justify-start'}`}>
                  <div
                    className={`max-w-[80%] rounded-2xl px-3.5 py-2 text-sm ${
                      own
                        ? 'bg-gradient-to-br from-[#c62020] to-[#f97316] text-white'
                        : 'border border-slate-200 bg-slate-50 text-slate-900'
                    }`}
                  >
                    {!own && (
                      <p className="mb-0.5 text-[10px] font-black uppercase tracking-wider text-slate-400">
                        {m.senderRole === 'ADMIN' ? 'Admin' : m.senderName}
                      </p>
                    )}
                    <p className="whitespace-pre-wrap break-words leading-snug">{m.content}</p>
                    <p className={`mt-0.5 flex items-center justify-end gap-1 text-[10px] ${own ? 'text-white/70' : 'text-slate-400'}`}>
                      {m.status === 'pending' && <Clock3 size={10} />}
                      {m.status === 'failed' && <span className="font-bold text-red-200">Yuborilmadi</span>}
                      {timeLabel(m.createdAt)}
                    </p>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Input */}
        <div
          className="flex items-end gap-2 border-t border-slate-100 px-3 py-2.5"
          style={{ paddingBottom: 'calc(env(safe-area-inset-bottom, 0px) + 10px)' }}
        >
          <textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            onFocus={focusScrollIntoView}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                handleSend();
              }
            }}
            rows={1}
            maxLength={500}
            placeholder="Xabar yozing…"
            className="max-h-28 flex-1 resize-none rounded-2xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-sm text-slate-900 outline-none placeholder:text-slate-400 focus:border-[#c62020]"
          />
          <button
            type="button"
            onClick={handleSend}
            disabled={!text.trim() || send.isPending}
            className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-[#c62020] to-[#f97316] text-white shadow-[0_8px_18px_-6px_rgba(198,32,32,0.5)] active:scale-95 disabled:opacity-40"
            aria-label="Yuborish"
          >
            {send.isPending ? <Loader2 size={18} className="animate-spin" /> : <Send size={18} />}
          </button>
        </div>
      </div>
    </div>
  );
}
