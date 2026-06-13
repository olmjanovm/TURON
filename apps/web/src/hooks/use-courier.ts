'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
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

export type DeliveryStage =
  | 'IDLE'
  | 'GOING_TO_RESTAURANT'
  | 'ARRIVED_AT_RESTAURANT'
  | 'PICKING_UP'
  | 'DELIVERING'
  | 'DELIVERED';

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

const stageActionPath = (stage: DeliveryStage): string => {
  switch (stage) {
    case 'GOING_TO_RESTAURANT': return 'accept';
    case 'ARRIVED_AT_RESTAURANT': return 'arrived-restaurant';
    case 'PICKING_UP': return 'pickup';
    case 'DELIVERING': return 'start-delivery';
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
    mutationFn: (payload: { fullName?: string; phoneNumber?: string }) =>
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
export const STAGE_FLOW: { key: DeliveryStage; title: string; short: string }[] = [
  { key: 'GOING_TO_RESTAURANT',  title: 'Yo\'ldaman',     short: 'Yo\'l' },
  { key: 'ARRIVED_AT_RESTAURANT', title: 'Yetdim',        short: 'Yetdim' },
  { key: 'PICKING_UP',            title: 'Oldim',         short: 'Oldim' },
  { key: 'DELIVERING',            title: 'Olib boryapman', short: 'Yo\'lda' },
  { key: 'DELIVERED',             title: 'Topshirdim',    short: 'Topshirildi' },
];

export function getStageIndex(stage: DeliveryStage | undefined): number {
  if (!stage || stage === 'IDLE') return 0;
  const idx = STAGE_FLOW.findIndex((s) => s.key === stage);
  return idx >= 0 ? idx : 0;
}

export function getNextStageAction(current: DeliveryStage | undefined): { label: string; next: DeliveryStage } | null {
  const idx = getStageIndex(current);
  if (current === 'DELIVERED') return null;
  const next = STAGE_FLOW[idx];
  if (!next) return null;
  const labels: Record<DeliveryStage, string> = {
    IDLE: 'Buyurtmani qabul qilish',
    GOING_TO_RESTAURANT: 'Restoranga yetib bordim',
    ARRIVED_AT_RESTAURANT: 'Buyurtmani oldim',
    PICKING_UP: 'Yetkazib berishni boshlash',
    DELIVERING: 'Mijozga topshirdim',
    DELIVERED: '',
  };
  return { label: labels[next.key], next: next.key };
}
