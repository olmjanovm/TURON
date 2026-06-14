'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import type { DeliveryStageEnum } from '@turon/shared';
import { apiFetch } from '@/lib/api-client';

// ── Types ────────────────────────────────────────────────────────────────
export type AssignmentStatus =
  | 'ASSIGNED'
  | 'ACCEPTED'
  | 'PICKED_UP'
  | 'DELIVERING'
  | 'DELIVERED'
  | 'DECLINED'
  | 'CANCELLED';

// Yagona manba — @turon/shared DeliveryStageEnum. Qo'lda union yozmaymiz (drift bo'lmasin).
export type DeliveryStage = `${DeliveryStageEnum}`;

export interface CourierOrderPreview {
  id: string;
  orderNumber: string;
  orderStatus: string;
  total: number;
  deliveryFee: number;
  customerName?: string | null;
  customerPhone?: string | null;
  customerAddress?: { addressText?: string | null; latitude?: number; longitude?: number } | null;
  deliveryAddress?: string | null;
  paymentMethod?: string;
  courierAssignmentStatus?: AssignmentStatus;
  deliveryStage?: DeliveryStage;
  itemsCount?: number;
  assignedAt?: string;
  createdAt: string;
}

export interface CourierOrderItem {
  id: string;
  name: string;
  price: number;
  quantity: number;
}

export interface CourierOrderDetail extends Omit<CourierOrderPreview, 'itemsCount'> {
  items: CourierOrderItem[];
  note?: string | null;
  pickupLat?: number;
  pickupLng?: number;
  destinationLat?: number;
  destinationLng?: number;
  tracking?: {
    courierLocation?: { latitude: number; longitude: number; updatedAt?: string };
  } | null;
}

export interface CourierStatus {
  courierId: string;
  isOnline: boolean;
  isAcceptingOrders: boolean;
  lastOnlineAt?: string | null;
  lastOfflineAt?: string | null;
  activeAssignments: number;
  completedToday: number;
  activeAssignment?: {
    assignmentId: string;
    orderId: string;
    orderNumber: string;
    assignmentStatus: AssignmentStatus;
    orderStatus: string;
  } | null;
}

export interface CourierTodayStats {
  completedCount: number;
  activeCount: number;
  deliveredOrderAmountTotal: number;
  deliveryFeesTotal: number;
  averageFulfillmentMinutes?: number | null;
  recentCompletedOrders?: Array<{
    assignmentId: string;
    orderId: string;
    orderNumber: string;
    deliveredAt: string;
    total: number;
    deliveryFee: number;
    paymentMethod?: string;
  }>;
}

export type CourierVehicle = 'auto' | 'bicycle' | 'pedestrian';

export interface CourierProfileDetail {
  courierId: string;
  fullName: string;
  phoneNumber?: string | null;
  telegramUsername?: string | null;
  isOnline: boolean;
  isAcceptingOrders: boolean;
  totalDeliveredCount: number;
  activeAssignments: number;
  completedToday: number;
  deliveryFeesToday?: number;
  vehicleMode?: CourierVehicle;
  createdAt: string;
}

export interface CourierHistoryItem {
  id: string;
  orderNumber: string;
  orderStatus: string;
  total: number;
  deliveryFee: number;
  paymentMethod?: string;
  customerName?: string | null;
  deliveryAddress?: string | null;
  deliveredAt?: string | null;
  createdAt: string;
}

// ── Queries ──────────────────────────────────────────────────────────────
export function useCourierOrders() {
  return useQuery<CourierOrderPreview[]>({
    queryKey: ['courier', 'orders'],
    queryFn: () => apiFetch('/courier/orders'),
    refetchInterval: 8_000,
    refetchIntervalInBackground: true,
  });
}

export function useCourierStatus() {
  return useQuery<CourierStatus>({
    queryKey: ['courier', 'status'],
    queryFn: () => apiFetch('/courier/me/status'),
    refetchInterval: 20_000,
  });
}

export function useCourierStats() {
  return useQuery<CourierTodayStats>({
    queryKey: ['courier', 'stats'],
    queryFn: () => apiFetch('/courier/stats/today'),
    refetchInterval: 30_000,
  });
}

export function useCourierOrder(orderId: string | undefined) {
  return useQuery<CourierOrderDetail>({
    queryKey: ['courier', 'order', orderId],
    queryFn: () => apiFetch(`/courier/order/${orderId}`),
    enabled: !!orderId,
    refetchInterval: 8_000,
  });
}

export function useCourierProfile() {
  return useQuery<CourierProfileDetail>({
    queryKey: ['courier', 'profile'],
    queryFn: () => apiFetch('/couriers/me/profile'),
  });
}

export function useCourierHistory() {
  return useQuery<CourierHistoryItem[]>({
    queryKey: ['courier', 'history'],
    queryFn: () => apiFetch('/couriers/me/history'),
  });
}

// ── Mutations ────────────────────────────────────────────────────────────
export function useUpdateCourierStatus() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload: { isOnline?: boolean; isAcceptingOrders?: boolean }) =>
      apiFetch<CourierStatus>('/courier/me/status', {
        method: 'PATCH',
        body: JSON.stringify(payload),
      }),
    onSuccess: (data) => {
      qc.setQueryData(['courier', 'status'], data);
      qc.invalidateQueries({ queryKey: ['courier'] });
    },
  });
}

// Target bosqich → o'sha bosqichga KIRADIGAN endpoint (backend mapStageToCourierAction bilan bir xil).
const stageActionPath = (stage: DeliveryStage): string => {
  switch (stage) {
    case 'GOING_TO_RESTAURANT': return 'accept';
    case 'ARRIVED_AT_RESTAURANT': return 'arrived-restaurant';
    case 'PICKED_UP': return 'pickup';
    case 'DELIVERING': return 'start-delivery';
    case 'ARRIVED_AT_DESTINATION': return 'arrive-destination';
    case 'DELIVERED': return 'deliver';
    default: return 'accept';
  }
};

export function useAdvanceStage() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ orderId, nextStage }: { orderId: string; nextStage: DeliveryStage }) => {
      const idempotencyKey = crypto.randomUUID();
      return apiFetch<CourierOrderDetail>(`/courier/order/${orderId}/${stageActionPath(nextStage)}`, {
        method: 'POST',
        headers: { 'Idempotency-Key': idempotencyKey },
      });
    },
    onSuccess: (data, { orderId }) => {
      qc.setQueryData(['courier', 'order', orderId], data);
      qc.invalidateQueries({ queryKey: ['courier'] });
    },
  });
}

export function useAcceptOrder() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (orderId: string) =>
      apiFetch(`/courier/order/${orderId}/accept`, {
        method: 'POST',
        headers: { 'Idempotency-Key': crypto.randomUUID() },
      }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['courier'] }),
  });
}

export function useDeclineOrder() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (orderId: string) =>
      apiFetch(`/courier/order/${orderId}/decline`, {
        method: 'POST',
        headers: { 'Idempotency-Key': crypto.randomUUID() },
      }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['courier'] }),
  });
}

export function useReportProblem() {
  return useMutation({
    mutationFn: ({ orderId, text }: { orderId: string; text: string }) =>
      apiFetch(`/courier/order/${orderId}/problem`, {
        method: 'POST',
        body: JSON.stringify({ text }),
      }),
  });
}

export function useUpdateProfile() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload: { fullName?: string; phoneNumber?: string; vehicleMode?: CourierVehicle }) =>
      apiFetch<CourierProfileDetail>('/couriers/me/profile', {
        method: 'PATCH',
        body: JSON.stringify(payload),
      }),
    onSuccess: (data) => {
      qc.setQueryData(['courier', 'profile'], data);
    },
  });
}

// ── Stage flow helpers ───────────────────────────────────────────────────
// Kuryer ko'radigan 5 ta bosqich. ARRIVED_AT_DESTINATION — alohida tugma yo'q,
// u DELIVERING ichida (getStageIndex'da normalizatsiya qilinadi).
export const STAGE_FLOW: { key: DeliveryStage; title: string; short: string }[] = [
  { key: 'GOING_TO_RESTAURANT',  title: 'Yo\'ldaman',     short: 'Yo\'l' },
  { key: 'ARRIVED_AT_RESTAURANT', title: 'Yetdim',        short: 'Yetdim' },
  { key: 'PICKED_UP',            title: 'Oldim',         short: 'Oldim' },
  { key: 'DELIVERING',            title: 'Olib boryapman', short: 'Yo\'lda' },
  { key: 'DELIVERED',             title: 'Topshirdim',    short: 'Topshirildi' },
];

export function getStageIndex(stage: DeliveryStage | undefined): number {
  if (!stage || stage === 'IDLE') return 0;
  // ARRIVED_AT_DESTINATION — kuryer eshik oldida, hali DELIVERING qadamida hisoblanadi
  const normalized = stage === 'ARRIVED_AT_DESTINATION' ? 'DELIVERING' : stage;
  const idx = STAGE_FLOW.findIndex((s) => s.key === normalized);
  return idx >= 0 ? idx : 0;
}

// Joriy bosqichdan keyingi amal: label = hozirgi qadamni yakunlash, next = KIRILADIGAN bosqich.
const NEXT_STAGE_ACTION: Partial<Record<DeliveryStage, { label: string; next: DeliveryStage }>> = {
  IDLE:                   { label: 'Buyurtmani qabul qilish',    next: 'GOING_TO_RESTAURANT' },
  GOING_TO_RESTAURANT:    { label: 'Restoranga yetib bordim',    next: 'ARRIVED_AT_RESTAURANT' },
  ARRIVED_AT_RESTAURANT:  { label: 'Buyurtmani oldim',           next: 'PICKED_UP' },
  PICKED_UP:              { label: 'Yetkazib berishni boshlash', next: 'DELIVERING' },
  DELIVERING:             { label: 'Mijozga topshirdim',         next: 'DELIVERED' },
  ARRIVED_AT_DESTINATION: { label: 'Mijozga topshirdim',         next: 'DELIVERED' },
};

export function getNextStageAction(current: DeliveryStage | undefined): { label: string; next: DeliveryStage } | null {
  return NEXT_STAGE_ACTION[current ?? 'IDLE'] ?? null;
}
