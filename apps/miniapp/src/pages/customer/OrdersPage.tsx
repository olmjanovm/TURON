import React from 'react';
import { AlertCircle, RefreshCw } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { LoadingSkeleton } from '../../components/customer/CustomerComponents';
import { OrderCard, OrdersEmptyState } from '../../components/customer/OrderHistoryComponents';
import { OrderStatus } from '../../data/types';
import { useMyOrders } from '../../hooks/queries/useOrders';

const OrdersPage: React.FC = () => {
  const navigate = useNavigate();
  const { data: orders = [], isLoading, error, refetch } = useMyOrders();

  const activeOrders = orders.filter(
    (order) => order.orderStatus !== OrderStatus.DELIVERED && order.orderStatus !== OrderStatus.CANCELLED,
  );
  const completedOrders = orders.filter(
    (order) => order.orderStatus === OrderStatus.DELIVERED || order.orderStatus === OrderStatus.CANCELLED,
  );

  if (isLoading) {
    return <LoadingSkeleton />;
  }

  if (error) {
    return (
      <div className="flex min-h-[70vh] flex-col items-center justify-center px-5 text-center">
        <div className="flex h-20 w-20 items-center justify-center rounded-[12px] border border-rose-300/18 bg-rose-400/10 text-rose-200">
          <AlertCircle size={34} />
        </div>
        <h2 className="mt-6 text-2xl font-black tracking-tight text-white">Buyurtmalarni yuklab bo'lmadi</h2>
        <p className="mt-3 max-w-[260px] text-sm leading-6 text-white/56">{(error as Error).message}</p>
        <button
          type="button"
          onClick={() => {
            void refetch();
          }}
          className="mt-8 inline-flex items-center gap-2 rounded-[12px] bg-white px-5 py-3 text-sm font-black text-slate-950 transition-transform active:scale-[0.985]"
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
      className="min-h-screen animate-in fade-in duration-300"
      style={{ paddingBottom: 'calc(var(--customer-nav-top-edge, 78px) + 16px)' }}
    >
      <section className="space-y-5 px-4 pb-6 pt-4">
        {activeOrders.length ? (
          <section>
            <div className="mb-3 flex items-end justify-between">
              <div>
                <p className="text-[10px] font-black uppercase tracking-[0.16em] text-white/34">Hozir</p>
                <h2 className="mt-1.5 text-[1.45rem] font-black tracking-[-0.04em] text-white">Faol buyurtmalar</h2>
              </div>
              <span className="rounded-full border border-emerald-300/18 bg-emerald-400/10 px-3 py-1.5 text-[10px] font-black uppercase tracking-[0.14em] text-emerald-100">
                {activeOrders.length} ta
              </span>
            </div>

            <div className="space-y-3">
              {activeOrders.map((order) => (
                <OrderCard key={order.id} order={order} onClick={() => navigate(`/customer/orders/${order.id}`)} />
              ))}
            </div>
          </section>
        ) : null}

        {completedOrders.length ? (
          <section>
            <div className="mb-3 flex items-end justify-between">
              <div>
                <p className="text-[10px] font-black uppercase tracking-[0.16em] text-white/34">Tarix</p>
                <h2 className="mt-1.5 text-[1.45rem] font-black tracking-[-0.04em] text-white">Oldingi buyurtmalar</h2>
              </div>
              <button
                type="button"
                onClick={() => {
                  void refetch();
                }}
                className="inline-flex items-center gap-2 rounded-full border border-white/8 bg-white/[0.05] px-3 py-2 text-[10px] font-black uppercase tracking-[0.14em] text-white/62"
              >
                <RefreshCw size={12} />
                <span>Yangilash</span>
              </button>
            </div>

            <div className="space-y-3">
              {completedOrders.map((order) => (
                <div key={order.id} className="opacity-80 transition-opacity hover:opacity-100">
                  <OrderCard order={order} onClick={() => navigate(`/customer/orders/${order.id}`)} />
                </div>
              ))}
            </div>
          </section>
        ) : null}
      </section>
    </div>
  );
};

export default OrdersPage;
