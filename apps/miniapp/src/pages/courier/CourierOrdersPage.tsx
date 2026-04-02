import React from 'react';
import { useNavigate } from 'react-router-dom';
import { AlertCircle, Loader2, Map, Navigation, Package, RefreshCw, Route } from 'lucide-react';
import { CourierOrderCard } from '../../components/courier/CourierComponents';
import { useCourierOrders } from '../../hooks/queries/useOrders';
import { isActiveDeliveryStage } from '../../features/courier/deliveryStage';

const CourierOrdersPage: React.FC = () => {
  const navigate = useNavigate();
  const { data: courierOrders = [], isLoading, error, refetch, isFetching } = useCourierOrders();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center px-6 py-24">
        <div className="rounded-[28px] border border-slate-200 bg-white px-6 py-5 shadow-sm">
          <Loader2 size={28} className="mx-auto animate-spin text-sky-600" />
          <p className="mt-4 text-sm font-black uppercase tracking-[0.22em] text-slate-500">
            Vazifalar yuklanmoqda
          </p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="px-6 py-10">
        <div className="rounded-[32px] border border-red-100 bg-white p-8 text-center shadow-sm">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-red-50 text-red-500">
            <AlertCircle size={30} />
          </div>
          <h3 className="mt-5 text-xl font-black tracking-tight text-slate-900">Buyurtmalar yuklanmadi</h3>
          <p className="mt-2 text-sm font-semibold leading-relaxed text-slate-500">{(error as Error).message}</p>
          <button
            type="button"
            onClick={() => {
              void refetch();
            }}
            className="mt-6 inline-flex h-12 items-center justify-center gap-2 rounded-full bg-slate-900 px-5 text-xs font-black uppercase tracking-[0.18em] text-white"
          >
            <RefreshCw size={15} />
            <span>Qayta urinish</span>
          </button>
        </div>
      </div>
    );
  }

  const activeOrder = courierOrders.find((order) => isActiveDeliveryStage(order.deliveryStage));
  const queuedOrders = activeOrder
    ? courierOrders.filter((order) => order.id !== activeOrder.id)
    : courierOrders;

  return (
    <div className="space-y-6 px-6 py-6 pb-36 animate-in fade-in duration-500">
      <section className="relative overflow-hidden rounded-[36px] bg-[radial-gradient(circle_at_top_right,rgba(59,130,246,0.3),transparent_30%),radial-gradient(circle_at_bottom_left,rgba(14,165,233,0.22),transparent_24%),linear-gradient(135deg,#0f172a_0%,#111827_100%)] p-6 text-white shadow-[0_30px_80px_rgba(15,23,42,0.24)]">
        <div className="absolute -right-10 top-6 h-28 w-28 rounded-full bg-white/10 blur-3xl" />
        <div className="absolute -left-8 bottom-0 h-24 w-24 rounded-full bg-sky-300/10 blur-3xl" />

        <div className="relative z-10">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-[10px] font-black uppercase tracking-[0.26em] text-white/50">
                Courier ops
              </p>
              <h2 className="mt-3 text-3xl font-black tracking-[-0.04em] text-white">
                Bugungi topshiriqlar
              </h2>
              <p className="mt-3 max-w-[270px] text-sm font-semibold leading-relaxed text-white/72">
                Biriktirilgan buyurtmalarni boshqaring, faol marshrutni kuzating va bosqichlarni shu yerdan davom ettiring.
              </p>
            </div>

            <button
              type="button"
              onClick={() => {
                void refetch();
              }}
              className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl border border-white/10 bg-white/10 text-white backdrop-blur-md transition-transform active:scale-95"
            >
              <RefreshCw size={18} className={isFetching ? 'animate-spin' : ''} />
            </button>
          </div>

          <div className="mt-5 grid grid-cols-3 gap-3">
            <div className="rounded-[22px] border border-white/10 bg-white/10 px-4 py-4">
              <p className="text-[10px] font-black uppercase tracking-[0.2em] text-white/45">Jami</p>
              <p className="mt-2 text-2xl font-black text-white">{courierOrders.length}</p>
            </div>
            <div className="rounded-[22px] border border-white/10 bg-white/10 px-4 py-4">
              <p className="text-[10px] font-black uppercase tracking-[0.2em] text-white/45">Faol</p>
              <p className="mt-2 text-2xl font-black text-white">{activeOrder ? 1 : 0}</p>
            </div>
            <div className="rounded-[22px] border border-white/10 bg-white/10 px-4 py-4">
              <p className="text-[10px] font-black uppercase tracking-[0.2em] text-white/45">Navbat</p>
              <p className="mt-2 text-2xl font-black text-white">{queuedOrders.length}</p>
            </div>
          </div>

          {activeOrder ? (
            <button
              type="button"
              onClick={() => navigate(`/courier/map/${activeOrder.id}`)}
              className="mt-5 flex w-full items-center justify-between rounded-[24px] border border-emerald-300/20 bg-emerald-400/14 px-5 py-4 text-left shadow-[0_18px_40px_rgba(16,185,129,0.18)] transition-transform active:scale-[0.985]"
            >
              <div className="flex items-center gap-4">
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-400/18 text-emerald-100">
                  <Navigation size={22} />
                </div>
                <div>
                  <p className="text-[10px] font-black uppercase tracking-[0.22em] text-emerald-100/70">
                    Faol marshrut
                  </p>
                  <p className="mt-2 text-base font-black text-white">#{activeOrder.orderNumber}</p>
                </div>
              </div>
              <div className="flex items-center gap-2 text-[11px] font-black uppercase tracking-[0.18em] text-white">
                <span>Xaritani ochish</span>
                <Map size={16} />
              </div>
            </button>
          ) : null}
        </div>
      </section>

      {activeOrder ? (
        <section className="space-y-3">
          <div className="flex items-center justify-between px-1">
            <h3 className="text-[11px] font-black uppercase tracking-[0.2em] text-slate-400">
              Hozir ishlayotgan buyurtma
            </h3>
            <button
              type="button"
              onClick={() => navigate(`/courier/order/${activeOrder.id}`)}
              className="inline-flex items-center gap-1 text-[11px] font-black uppercase tracking-[0.18em] text-slate-900"
            >
              <span>Batafsil</span>
              <Route size={14} />
            </button>
          </div>
          <CourierOrderCard order={activeOrder} onClick={() => navigate(`/courier/order/${activeOrder.id}`)} />
        </section>
      ) : null}

      <section className="space-y-3">
        <div className="flex items-center justify-between px-1">
          <h3 className="text-[11px] font-black uppercase tracking-[0.2em] text-slate-400">
            Biriktirilgan buyurtmalar
          </h3>
          <div className="inline-flex items-center gap-2 rounded-full bg-slate-100 px-3 py-2 text-[10px] font-black uppercase tracking-[0.18em] text-slate-500">
            <Package size={14} />
            <span>{queuedOrders.length || courierOrders.length} ta</span>
          </div>
        </div>

        {courierOrders.length > 0 ? (
          <div className="space-y-4">
            {(activeOrder ? queuedOrders : courierOrders).map((order) => (
              <CourierOrderCard
                key={order.id}
                order={order}
                onClick={() => navigate(`/courier/order/${order.id}`)}
              />
            ))}
          </div>
        ) : (
          <div className="rounded-[32px] border border-slate-200 bg-white px-6 py-12 text-center shadow-sm">
            <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-slate-100 text-slate-300">
              <Package size={34} />
            </div>
            <h4 className="mt-6 text-2xl font-black tracking-tight text-slate-900">Hozircha topshiriq yo'q</h4>
            <p className="mt-2 text-sm font-semibold leading-relaxed text-slate-500">
              Yangi buyurtma biriktirilganda shu ekranda ko'rinadi.
            </p>
          </div>
        )}
      </section>
    </div>
  );
};

export default CourierOrdersPage;
