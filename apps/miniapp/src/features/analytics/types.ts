import { OrderStatus, PaymentStatus } from '../../data/types';

export type TimeRange = 'TODAY' | 'THIS_WEEK' | 'THIS_MONTH' | 'ALL_TIME';

export interface KPIMetrics {
  totalOrders: number;
  activeOrders: number; // Not delivered or cancelled
  deliveredOrders: number;
  cancelledOrders: number;
  totalRevenue: number; // From delivered orders
  averageOrderValue: number;
}

export interface OrderStatusBreakdown {
  status: OrderStatus;
  count: number;
  label: string;
  colorClass: string;
}

export interface TopProductMetric {
  productId: string;
  name: string;
  quantitySold: number;
  revenueGenerated: number;
}

export interface CourierPerformanceMetric {
  courierId: string;
  courierName: string;
  assignedOrders: number;
  deliveredOrders: number;
  activeDeliveries: number;
}

export interface PromoInsightMetric {
  promoCode: string;
  title?: string;
  usageCount: number;
  totalDiscountGenerated: number;
  isActive: boolean;
}

export interface RecentActivityEvent {
  id: string;
  type: 'ORDER_CREATED' | 'PAYMENT_VERIFIED' | 'ORDER_DELIVERED' | 'PROMO_USED';
  title: string;
  description: string;
  timestamp: string;
  orderId?: string;
}
