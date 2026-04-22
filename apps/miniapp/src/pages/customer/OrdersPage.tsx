import React, { useCallback, useMemo } from 'react';
import { AlertCircle, RefreshCw } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { LoadingSkeleton } from '../../components/customer/CustomerComponents';
import { OrderCard, OrderTimeline, OrdersEmptyState } from '../../components/customer/OrderHistoryComponents';
import { Order, OrderStatus } from '../../data/types';
import { useMyOrders } from '../../hooks/queries/useOrders';
import { useProducts } from '../../hooks/queries/useMenu';
import { useCartStore } from '../../store/useCartStore';
import { useToast } from '../../components/ui/Toast';
import { initiateCall } from '../../lib/callUtils';

// ============================================================================
// PRESENTATIONAL COMPONENTS (Memoized to prevent unnecessary re-renders)
// ============================================================================

const ActiveOrdersList = React.memo(({ 
  orders, 
  onNavigate, 
  onCall 
}: { 
  orders: Order[]; 
  onNavigate: (id: string) => void; 
  onCall: (phone: string) => void; 
}) => (
  <section>
    <div className="mb-4 flex items-end justify-between">
      <div>
        <p className="text-[12px] font-black uppercase tracking-[0.1em] text-[#8c8c96]">Hozir</p>
        <h2 className="mt-1 text-[22px] font-black tracking-tight text-[#202020]">Faol buyurtmalar</h2>
      </div>
      <span className="rounded-full bg-emerald-50 px-3 py-1.5 text-[11px] font-black uppercase tracking-[0.1em] text-emerald-600">
        {orders.length} ta
      </span>
    </div>
    <div className="space-y-4">
      {orders.map((order) => (
        <div key={order.id} className="space-y-3">
          <div className="flex items-center justify-between px-1">
            <span className="text-[14px] font-black text-[#202020]">Buyurtma #{order.orderNumber}</span>
            <button onClick={() => onNavigate(order.id)} className="text-[13px] font-bold text-[#C62020]">
              Batafsil
            </button>
          </div>
          <OrderTimeline status={order.orderStatus} onCallCourier={() => onCall(order.courierPhone || '+998901234567')} />
        </div>
      ))}
    </div>
  </section>
));

const CompletedOrdersList = React.memo(({ 
  orders, 
  onNavigate, 
  onReorder, 
  onRefetch 
}: { 
  orders: Order[]; 
  onNavigate: (id: string) => void; 
  onReorder: (order: Order) => void; 
  onRefetch: () => void; 
}) => (
  <section>
    <div className="mb-4 flex items-end justify-between">
      <div>
        <p className="text-[12px] font-black uppercase tracking-[0.1em] text-[#8c8c96]">Tarix</p>
        <h2 className="mt-1 text-[22px] font-black tracking-tight text-[#202020]">Oldingi buyurtmalar</h2>
      </div>
      <button onClick={onRefetch} type="button" className="inline-flex items-center gap-2 rounded-full bg-[#f4f4f5] px-3.5 py-2 text-[11px] font-black uppercase tracking-[0.1em] text-[#8c8c96] transition-colors hover:bg-[#e4e4e5]">
        <RefreshCw size={14} />
        <span>Yangilash</span>
      </button>
    </div>
    <div className="space-y-4">
      {orders.map((order) => (
        <OrderCard key={order.id} order={order} onClick={() => onNavigate(order.id)} onReorder={() => onReorder(order)} />
      ))}
    </div>
  </section>
));

// ============================================================================
// CONTAINER COMPONENT (Handles State, Data Fetching, and Logic)
// ============================================================================

const OrdersPage: React.FC = () => {
  const navigate = useNavigate();
  const { showToast } = useToast();
  // @ts-ignore - useMyOrders hookidan isFetching ni ham olamiz
  const { data: orders = [], isLoading, isFetching, error, refetch } = useMyOrders();
  const { data: products = [] } = useProducts();
  const { setItems } = useCartStore();

  // USE-CALLBACK: Prevent re-allocating function on every render, keeping memoized children pure
  const handleReorder = useCallback((order: Order) => {
    const productMap = new Map(products.map((p) => [p.id, p]));
    const nextItems = order.items
      .map((item) => {
        const menuItemId = (item as any).menuItemId ?? item.id;
        const product = menuItemId ? productMap.get(menuItemId) : undefined;
        if (!product) return null;
        return {
          id: product.id,
          menuItemId: product.id,
          categoryId: product.categoryId,
          name: product.name,
          description: product.description,
          price: product.price,
          image: product.imageUrl,
          isAvailable: true,
          quantity: (item as any).quantity ?? 1,
        };
      })
      .filter((item): item is NonNullable<typeof item> => item !== null);

    if (!nextItems.length) {
      showToast("Bu buyurtmadagi taomlar hozir menyuda mavjud emas.", 'warning');
      return;
    }
    setItems(nextItems);
    navigate('/customer/cart');
  }, [products, setItems, navigate, showToast]);

  const handleNavigate = useCallback((id: string) => navigate(`/customer/orders/${id}`), [navigate]);
  const handleCallCourier = useCallback((phone: string) => initiateCall(phone, 'kuryer'), []);
  const handleRefetch = useCallback(() => { void refetch(); }, [refetch]);

  const { activeOrders, completedOrders } = useMemo(() => {
    return {
      activeOrders: orders.filter((order) => order.orderStatus !== OrderStatus.DELIVERED && order.orderStatus !== OrderStatus.CANCELLED),
      completedOrders: orders.filter((order) => order.orderStatus === OrderStatus.DELIVERED || order.orderStatus === OrderStatus.CANCELLED)
    };
  }, [orders]);

  // 🚨 CRITICAL FIX: Faqatgina kesh umuman bo'sh bo'lsa (birinchi marta) Skeleton ko'rsatamiz.
  // Keyingi safar keshdagi ma'lumot 0ms da chiqadi.
  if (isLoading && !orders.length) {
    return (
      <div className="min-h-screen bg-[#f6f6f7] px-4 pb-6 pt-4 space-y-4">
        <LoadingSkeleton />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex bg-[#f6f6f7] min-h-[70vh] flex-col items-center justify-center px-5 text-center">
        <div className="flex h-20 w-20 items-center justify-center rounded-[20px] bg-rose-50 text-rose-500 shadow-sm">
          <AlertCircle size={34} />
        </div>
        <h2 className="mt-6 text-2xl font-black tracking-tight text-[#202020]">Buyurtmalarni yuklab bo'lmadi</h2>
        <p className="mt-3 max-w-[260px] text-sm leading-6 text-[#8c8c96]">{(error as Error).message}</p>
        <button
          type="button"
          onClick={() => {
            void refetch();
          }}
          className="mt-8 inline-flex items-center gap-2 rounded-full bg-[#f4f4f5] px-6 py-3.5 text-sm font-black text-[#202020] transition-transform active:scale-[0.985]"
        >
          <RefreshCw size={16} />
          <span>Qayta yuklash</span>
        </button>
      </div>
    );
  }

  if (!orders.length) {
    return <OrdersEmptyState onShop={() => navigate('/customer')} />;
  }

  return (
    <div
      className="min-h-screen bg-[#f6f6f7] animate-in fade-in duration-300"
      style={{ paddingBottom: 'calc(var(--customer-nav-top-edge, 78px) + 16px)' }}
    >
      {/* Orqa fonda yangilanayotganini bildiruvchi kichik indikator */}
      {isFetching && orders.length > 0 && (
        <div className="flex justify-center pt-3 pb-1">
          <span className="text-[10px] font-bold text-slate-400 animate-pulse uppercase tracking-widest">Yangilanmoqda...</span>
        </div>
      )}

      <div className="px-4 pb-6 pt-4 space-y-8">
        {activeOrders.length > 0 && (
          <ActiveOrdersList 
            orders={activeOrders} 
            onNavigate={handleNavigate}
            onCall={handleCallCourier}
          />
        )}

        {completedOrders.length > 0 && (
          <CompletedOrdersList 
            orders={completedOrders} 
            onNavigate={handleNavigate}
            onReorder={handleReorder}
            onRefetch={handleRefetch}
          />
        )}
      </div>
    </div>
  );
};

export default OrdersPage;
