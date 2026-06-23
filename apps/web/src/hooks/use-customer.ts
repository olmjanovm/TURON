'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiFetch } from '@/lib/api-client';
import { useChatSocket, mergeChatMessage, markChatRead } from '@/lib/use-chat-socket';

// ── Types ────────────────────────────────────────────────────────────────
export interface Address {
  id: string;
  label: string;
  addressText: string;
  landmark?: string | null;
  latitude?: number | null;
  longitude?: number | null;
  isDefault: boolean;
  createdAt: string;
}

export interface CustomerOrderItem {
  id: string;
  productId: string;
  name: string;
  imageUrl?: string;
  price: number;
  quantity: number;
}

export interface CustomerOrder {
  id: string;
  orderNumber: string;
  orderStatus: string;
  paymentMethod: string;
  total: number;
  deliveryFee: number;
  discountAmount?: number;
  items: CustomerOrderItem[];
  customerAddress?: { addressText?: string | null } | null;
  deliveryAddress?: string | null;
  note?: string | null;
  createdAt: string;
  deliveredAt?: string | null;
  courier?: { id: string; fullName: string; phoneNumber?: string | null } | null;
  tracking?: { courierLocation?: { latitude: number; longitude: number } } | null;
}

export type PaymentMethod = 'CASH' | 'MANUAL_TRANSFER' | 'EXTERNAL_PAYMENT';

export interface QuoteInput {
  items: { productId: string; quantity: number }[];
  addressId?: string;
  promoCode?: string;
  paymentMethod: PaymentMethod;
}

export interface QuoteResult {
  subtotal: number;
  deliveryFee: number;
  discountAmount: number;
  total: number;
  promoValid?: boolean;
  promoMessage?: string;
}

export interface CreateOrderInput extends QuoteInput {
  note?: string;
  /** MANUAL_TRANSFER (karta) uchun to'lov cheki — base64 dataURL. */
  receiptImageBase64?: string;
}

export interface NotificationItem {
  id: string;
  title: string;
  body: string;
  type?: string;
  isRead: boolean;
  createdAt: string;
  metadata?: Record<string, unknown>;
}

// ── Addresses ────────────────────────────────────────────────────────────
export function useAddresses() {
  return useQuery<Address[]>({
    queryKey: ['customer', 'addresses'],
    queryFn: () => apiFetch('/addresses'),
    staleTime: 30_000,
  });
}

export interface AddressInput {
  label: string;
  addressText: string;
  landmark?: string | null;
  latitude: number;
  longitude: number;
}

/** Backend `title/address/note/latitude/longitude` kutadi — client field nomlarini map qilamiz. */
function toBackendAddress(input: AddressInput) {
  return {
    title: input.label,
    address: input.addressText,
    note: input.landmark || undefined,
    latitude: input.latitude,
    longitude: input.longitude,
  };
}

export function useCreateAddress() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: AddressInput) =>
      apiFetch<Address>('/addresses', {
        method: 'POST',
        body: JSON.stringify(toBackendAddress(input)),
      }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['customer', 'addresses'] }),
  });
}

export function useUpdateAddress() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, patch }: { id: string; patch: AddressInput }) =>
      apiFetch<Address>(`/addresses/${id}`, {
        method: 'PUT',
        body: JSON.stringify(toBackendAddress(patch)),
      }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['customer', 'addresses'] }),
  });
}

export function useDeleteAddress() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) =>
      apiFetch(`/addresses/${id}`, { method: 'DELETE' }),
    // OPTIMISTIC: ro'yxatdan DARHOL olib tashlaymiz (ekranda osilib qolmasin),
    // xato bo'lsa qaytaramiz, yakunda serverdan tasdiqlaymiz.
    onMutate: async (id: string) => {
      await qc.cancelQueries({ queryKey: ['customer', 'addresses'] });
      const prev = qc.getQueryData<Address[]>(['customer', 'addresses']);
      qc.setQueryData<Address[]>(['customer', 'addresses'], (old) =>
        (old ?? []).filter((a) => a.id !== id),
      );
      return { prev };
    },
    onError: (_e, _id, ctx) => {
      if (ctx?.prev) qc.setQueryData(['customer', 'addresses'], ctx.prev);
    },
    onSettled: () => qc.invalidateQueries({ queryKey: ['customer', 'addresses'] }),
  });
}

// ── Orders ───────────────────────────────────────────────────────────────
export function useMyOrders() {
  return useQuery<CustomerOrder[]>({
    queryKey: ['customer', 'orders'],
    queryFn: () => apiFetch('/orders/my'),
    refetchInterval: 10_000,
  });
}

export function useOrderDetail(orderId: string | undefined) {
  return useQuery<CustomerOrder>({
    queryKey: ['customer', 'order', orderId],
    queryFn: () => apiFetch(`/orders/${orderId}`),
    enabled: !!orderId,
    refetchInterval: 8_000,
  });
}

/** Client → backend: productId→menuItemId, addressId→deliveryAddressId. */
function toBackendQuote(input: QuoteInput) {
  return {
    items: input.items.map((i) => ({ menuItemId: i.productId, quantity: i.quantity })),
    deliveryAddressId: input.addressId,
    promoCode: input.promoCode,
  };
}

export function useQuoteOrder() {
  return useMutation({
    mutationFn: (input: QuoteInput) =>
      apiFetch<QuoteResult>('/orders/quote', {
        method: 'POST',
        body: JSON.stringify(toBackendQuote(input)),
      }),
  });
}

export function useCreateOrder() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: CreateOrderInput) => {
      const idempotencyKey = crypto.randomUUID();
      const body = {
        idempotencyKey,
        items: input.items.map((i) => ({ menuItemId: i.productId, quantity: i.quantity })),
        deliveryAddressId: input.addressId,
        paymentMethod: input.paymentMethod,
        promoCode: input.promoCode,
        note: input.note,
        receiptImageBase64: input.receiptImageBase64,
      };
      return apiFetch<CustomerOrder>('/orders', {
        method: 'POST',
        body: JSON.stringify(body),
      });
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['customer', 'orders'] }),
  });
}

/**
 * Buyurtma manzilini o'zgartirish (ADDRESS_CHANGE modification).
 * Backend AUTO qo'llaydi (kuryer yo'lda bo'lsa ham) → kuryerga real-time reroute.
 */
export function useChangeOrderAddress(orderId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (addressId: string) =>
      apiFetch(`/orders/${orderId}/modifications`, {
        method: 'POST',
        headers: { 'Idempotency-Key': crypto.randomUUID() },
        body: JSON.stringify({ type: 'ADDRESS_CHANGE', payload: { addressId } }),
      }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['customer'] }),
  });
}

/**
 * Buyurtma tarkibini o'zgartirish (ITEMS_CHANGE) — mahsulot qo'shish/o'chirish.
 * Server narxlarni qayta hisoblaydi; delta>0 bo'lsa chek (karta) talab qilinadi.
 * Admin tasdiqlagach buyurtma yangilanadi.
 */
export function useChangeOrderItems(orderId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: {
      items: { menuItemId: string; quantity: number }[];
      receiptImageBase64?: string;
    }) =>
      apiFetch(`/orders/${orderId}/modifications`, {
        method: 'POST',
        headers: { 'Idempotency-Key': crypto.randomUUID() },
        body: JSON.stringify({ type: 'ITEMS_CHANGE', payload: input }),
      }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['customer'] }),
  });
}

/**
 * To'lov usulini naqd → karta o'zgartirish (PAYMENT_METHOD_CHANGE).
 * Chek (base64) + summa yuboriladi. Admin tasdiqlagach order kartaga o'tadi.
 */
export function useChangePaymentMethod(orderId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: { amount: number; receiptImageBase64: string }) =>
      apiFetch(`/orders/${orderId}/modifications`, {
        method: 'POST',
        headers: { 'Idempotency-Key': crypto.randomUUID() },
        body: JSON.stringify({ type: 'PAYMENT_METHOD_CHANGE', payload: input }),
      }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['customer'] }),
  });
}

export function useCancelOrder() {
  const qc = useQueryClient();
  return useMutation({
    // Bekor qilish backend'da "modification request" oqimi orqali ketadi
    // (/orders/:id/modifications, type=CANCEL). Avval mavjud bo'lmagan
    // /orders/:id/cancel chaqirilib 404 olinardi.
    mutationFn: (orderId: string) =>
      apiFetch(`/orders/${orderId}/modifications`, {
        method: 'POST',
        headers: { 'Idempotency-Key': crypto.randomUUID() },
        body: JSON.stringify({ type: 'CANCEL' }),
      }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['customer'] }),
  });
}

// ── Order chat (mijoz ↔ admin) ─────────────────────────────────────────────
export interface OrderChatMessage {
  id: string;
  orderId: string;
  senderId: string;
  senderRole: 'COURIER' | 'CUSTOMER' | 'ADMIN';
  senderName: string;
  content: string;
  isRead: boolean;
  createdAt: string;
  /** Faqat optimistic (klient) holat. Yo'q = serverdan kelgan (yuborilgan). */
  status?: 'pending' | 'failed';
  /** Faqat 'failed' bo'lganda — nima uchun yuborilmaganini ko'rsatamiz. */
  errorMessage?: string;
}

const ORDER_CHAT_KEY = (orderId: string) => ['customer', 'order-chat', orderId] as const;

export function useOrderChat(orderId: string) {
  const qc = useQueryClient();

  const query = useQuery<OrderChatMessage[]>({
    queryKey: ORDER_CHAT_KEY(orderId),
    queryFn: () => apiFetch(`/orders/${orderId}/chat`),
    enabled: !!orderId,
    // Socket.io real-time → 30s xavfsizlik fallback (socket tushsa). Avval 5s edi.
    refetchInterval: 30_000,
  });

  // Real-time: mijoz ulanganda o'z `user:` xonasiga avtomatik qo'shiladi →
  // backend admin javobini darhol shu xonaga yuboradi. Flicker yo'q (faqat
  // birinchi yuklashda loading, fon refetch sekin).
  useChatSocket(orderId, {
    onMessage: (msg) => {
      qc.setQueryData<OrderChatMessage[]>(ORDER_CHAT_KEY(orderId), (old) =>
        mergeChatMessage(old, msg as OrderChatMessage),
      );
    },
    onRead: (read) => {
      qc.setQueryData<OrderChatMessage[]>(ORDER_CHAT_KEY(orderId), (old) =>
        markChatRead(old, read.readerRole),
      );
    },
    onReconnect: () => {
      qc.invalidateQueries({ queryKey: ORDER_CHAT_KEY(orderId) });
    },
  });

  return query;
}

/**
 * Xabar yuborish — OPTIMISTIC (Telegram singari): xabar darhol ko'rinadi
 * (soat = yuborilmoqda), server tasdiqlasa almashtiriladi, xato bo'lsa "failed".
 * Mijozning o'z xabari isRead=true bo'lsa → admin o'qigan (2✓), aks holda 1✓.
 */
export function useSendOrderMessage(orderId: string) {
  const qc = useQueryClient();
  const key = ORDER_CHAT_KEY(orderId);
  return useMutation({
    mutationFn: (content: string) =>
      apiFetch(`/orders/${orderId}/chat`, {
        method: 'POST',
        body: JSON.stringify({ content }),
      }),
    onMutate: async (content: string) => {
      await qc.cancelQueries({ queryKey: key });
      const tempId = `temp-${Date.now()}`;
      const optimistic: OrderChatMessage = {
        id: tempId,
        orderId,
        senderId: 'me',
        senderRole: 'CUSTOMER',
        senderName: 'Siz',
        content,
        isRead: false,
        createdAt: new Date().toISOString(),
        status: 'pending',
      };
      // Qayta yuborishda: shu matnli avvalgi "failed" xabarni olib tashlaymiz
      // (dublikat bo'lmasin) → yangi pending qo'shamiz.
      qc.setQueryData<OrderChatMessage[]>(key, (old) => [
        ...(old ?? []).filter((m) => !(m.status === 'failed' && m.content === content)),
        optimistic,
      ]);
      return { tempId };
    },
    onError: (err, _content, ctx) => {
      if (ctx?.tempId) {
        const reason = err instanceof Error ? err.message : 'Yuborilmadi';
        qc.setQueryData<OrderChatMessage[]>(key, (old) =>
          (old ?? []).map((m) => (m.id === ctx.tempId ? { ...m, status: 'failed', errorMessage: reason } : m)),
        );
      }
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: key }),
  });
}

// ── Promo ────────────────────────────────────────────────────────────────
export interface PromoValidationResult {
  /** Backend `isValid` qaytaradi (avval FE `valid` o'qigan — mos emas edi). */
  isValid: boolean;
  message?: string;
  discountAmount?: number;
  promo?: { id: string; code: string; discountType: string; discountValue: number; minOrderValue: number };
  /** "Did you mean?" — noto'g'ri/muddati tugagan bo'lsa taklif qilingan kod. */
  suggestion?: string | null;
}

export function useValidatePromo() {
  return useMutation({
    // MUHIM: subtotal YUBORILADI — aks holda backend 400 berardi (har promo fail).
    mutationFn: ({ code, subtotal }: { code: string; subtotal: number }) =>
      apiFetch<PromoValidationResult>('/promos/validate', {
        method: 'POST',
        body: JSON.stringify({ code, subtotal }),
      }),
  });
}

// ── Notifications ────────────────────────────────────────────────────────
export function useNotifications() {
  return useQuery<NotificationItem[]>({
    queryKey: ['customer', 'notifications'],
    queryFn: () => apiFetch('/notifications/my'),
    refetchInterval: 30_000,
  });
}

export function useMarkNotificationRead() {
  const qc = useQueryClient();
  return useMutation({
    // Backend route PATCH (POST emas edi — 404 berardi)
    mutationFn: (id: string) =>
      apiFetch(`/notifications/${id}/read`, { method: 'PATCH' }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['customer', 'notifications'] }),
  });
}

export function useMarkAllNotificationsRead() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: () => apiFetch('/notifications/read-all', { method: 'POST' }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['customer', 'notifications'] }),
  });
}

// ── Admin chat (support thread — buyurtmaga bog'liq emas, doimiy) #5 ─────────
export interface SupportMessage {
  id: string;
  senderRole: 'CUSTOMER' | 'ADMIN' | 'COURIER';
  senderLabel: string;
  text: string;
  channel: 'MINI_APP' | 'TELEGRAM';
  createdAt: string;
}
export interface SupportThread {
  id: string;
  orderId?: string | null;
  status: string;
  createdAt: string;
  updatedAt: string;
  lastMessageAt: string;
  messages: SupportMessage[];
}

export function useSupportThread() {
  return useQuery<SupportThread>({
    queryKey: ['customer', 'support-thread'],
    queryFn: () => apiFetch('/support/thread'),
    refetchInterval: 20_000,
  });
}

export function useSendSupportMessage() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (text: string) =>
      apiFetch<SupportThread>('/support/messages', {
        method: 'POST',
        body: JSON.stringify({ text }),
      }),
    onSuccess: (thread) => qc.setQueryData(['customer', 'support-thread'], thread),
  });
}

// ── Kuryer chatlar (KURYER bo'yicha guruhlangan, barcha buyurtmalar bo'ylab) #5 ─
export interface CourierThreadSummary {
  courierId: string;
  courierName: string;
  courierPhone: string | null;
  lastMessage: string;
  lastAt: string;
  unreadCount: number;
  activeOrderId: string | null;
}
export interface CourierThread {
  courierId: string;
  courierName: string;
  courierPhone: string | null;
  activeOrderId: string | null;
  messages: OrderChatMessage[];
}

export function useCourierThreads() {
  return useQuery<CourierThreadSummary[]>({
    queryKey: ['customer', 'courier-threads'],
    queryFn: () => apiFetch('/support/courier-threads'),
    refetchInterval: 20_000,
  });
}

export function useCourierThread(courierId: string) {
  return useQuery<CourierThread>({
    queryKey: ['customer', 'courier-thread', courierId],
    queryFn: () => apiFetch(`/support/courier-threads/${courierId}/messages`),
    enabled: !!courierId,
    refetchInterval: 15_000,
  });
}

// ── Profile ──────────────────────────────────────────────────────────────
export function useUpdateMyProfile() {
  const qc = useQueryClient();
  return useMutation({
    // Backend: PATCH /users/me (avval mavjud bo'lmagan /customers/me/profile edi → 404)
    mutationFn: (patch: { fullName?: string; phoneNumber?: string }) =>
      apiFetch('/users/me', {
        method: 'PATCH',
        body: JSON.stringify(patch),
      }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['customer'] }),
  });
}

// ── Status helpers ───────────────────────────────────────────────────────
export const ORDER_STATUS_META: Record<
  string,
  { dot: string; chip: string; bar: string }
> = {
  PENDING:          { dot: 'bg-amber-500',   chip: 'bg-amber-50 text-amber-700 dark:bg-amber-500/15 dark:text-amber-300',     bar: 'bg-amber-400' },
  PREPARING:        { dot: 'bg-sky-500',     chip: 'bg-sky-50 text-sky-700 dark:bg-sky-500/15 dark:text-sky-300',             bar: 'bg-sky-400' },
  READY_FOR_PICKUP: { dot: 'bg-violet-500',  chip: 'bg-violet-50 text-violet-700 dark:bg-violet-500/15 dark:text-violet-300', bar: 'bg-violet-400' },
  DELIVERING:       { dot: 'bg-blue-500',    chip: 'bg-blue-50 text-blue-700 dark:bg-blue-500/15 dark:text-blue-300',         bar: 'bg-blue-400' },
  DELIVERED:        { dot: 'bg-emerald-500', chip: 'bg-emerald-50 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-300', bar: 'bg-emerald-400' },
  CANCELLED:        { dot: 'bg-red-500',     chip: 'bg-red-50 text-red-600 dark:bg-red-500/15 dark:text-red-300',             bar: 'bg-red-400' },
};
