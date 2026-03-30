import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { Order, OrderStatus, DeliveryStage, PaymentStatus } from '../data/types';
import { notifyOrderCreated, notifyOrderConfirmed, notifyPaymentVerified, notifyPaymentFailed, notifyCourierAssigned, notifyOrderDelivered, notifyOrderCancelled } from '../features/notifications/notificationTriggers';

interface OrdersState {
  orders: Order[];
  addOrder: (order: Order) => void;
  updateOrderStatus: (orderId: string, status: OrderStatus) => void;
  updateDeliveryStage: (orderId: string, stage: DeliveryStage) => void;
  updatePaymentStatus: (orderId: string, status: PaymentStatus) => void;
  verifyPayment: (orderId: string, adminName: string) => void;
  rejectPayment: (orderId: string) => void;
  assignCourier: (orderId: string, courierId: string, courierName: string) => void;
  getOrderById: (id: string) => Order | undefined;
  clearHistory: () => void;
}

export const useOrdersStore = create<OrdersState>()(
  persist(
    (set, get) => ({
      orders: [],
      addOrder: (order) => set((state) => ({ orders: [order, ...state.orders] })),
      updateOrderStatus: (orderId, status) => {
        set((state) => ({
          orders: state.orders.map((o) => o.id === orderId ? { ...o, orderStatus: status } : o)
        }));
        
        const order = get().orders.find(o => o.id === orderId);
        if (order) {
          if (status === OrderStatus.PREPARING) notifyOrderConfirmed(order.id, order.orderNumber);
          if (status === OrderStatus.DELIVERED) notifyOrderDelivered(order.id, order.orderNumber);
          if (status === OrderStatus.CANCELLED) notifyOrderCancelled(order.id, order.orderNumber, 'Admin tomonidan bekor qilindi');
        }
      },
      updateDeliveryStage: (orderId, stage) => set((state) => ({
        orders: state.orders.map((o) => o.id === orderId ? { ...o, deliveryStage: stage } : o)
      })),
      updatePaymentStatus: (orderId, status) => set((state) => ({
        orders: state.orders.map((o) => o.id === orderId ? { ...o, paymentStatus: status } : o)
      })),
      verifyPayment: (orderId, adminName) => {
        set((state) => ({
          orders: state.orders.map((o) => o.id === orderId ? { 
            ...o, 
            paymentStatus: PaymentStatus.COMPLETED,
            verificationStatus: true,
            verifiedByAdmin: adminName,
            verifiedAt: new Date().toISOString()
          } : o)
        }));
        const order = get().orders.find(o => o.id === orderId);
        if (order) notifyPaymentVerified(order.id, order.orderNumber);
      },
      rejectPayment: (orderId) => {
        set((state) => ({
          orders: state.orders.map((o) => o.id === orderId ? { 
            ...o, 
            paymentStatus: PaymentStatus.FAILED,
            verificationStatus: false
          } : o)
        }));
        const order = get().orders.find(o => o.id === orderId);
        if (order) notifyPaymentFailed(order.id, order.orderNumber, 'To\'lov verifikatsiyadan o\'tmadi');
      },
      assignCourier: (orderId, courierId, courierName) => {
        set((state) => ({
          orders: state.orders.map((o) => o.id === orderId ? { ...o, courierId, courierName, deliveryStage: DeliveryStage.IDLE } : o)
        }));
        const order = get().orders.find(o => o.id === orderId);
        if (order) notifyCourierAssigned(order.id, order.orderNumber, courierName);
      },
      getOrderById: (id) => get().orders.find((o) => o.id === id),
      clearHistory: () => set({ orders: [] }),
    }),
    {
      name: 'turon-orders-storage',
    }
  )
);
