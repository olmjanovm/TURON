'use client';

import { use, useState } from 'react';
import Link from 'next/link';
import { ChevronLeft, Phone, User, Truck, Loader2, Check, X, Bike, MessageCircle, MapPin } from 'lucide-react';
import { OrderStatusEnum } from '@turon/shared';
import {
  useAdminOrder,
  useUpdateOrderStatus,
  useCourierOptions,
  useDispatchOrder,
  usePaymentAction,
  useOrderModifications,
  useDecideModification,
} from '@/hooks/use-admin-orders';
import { statusMeta, orderMoney, NEXT_STATUS } from '@/lib/order-status';
import { Skeleton, SkeletonRow } from '@/components/ui/skeleton';

export default function AdminOrderDetailPage({
  params,
}: {
  params: Promise<{ orderId: string }>;
}) {
  const { orderId } = use(params);
  const { data: order, isLoading, isError } = useAdminOrder(orderId);
  const updateStatus = useUpdateOrderStatus(orderId);

  return (
    <div className="space-y-4">
      <Link
        href="/admin/orders"
        className="inline-flex items-center gap-1 text-sm font-medium text-slate-500"
      >
        <ChevronLeft size={18} /> Buyurtmalar
      </Link>

      {isLoading ? (
        <div className="space-y-3">
          <Skeleton className="h-24 w-full" rounded="rounded-2xl" />
          <SkeletonRow />
          <SkeletonRow />
        </div>
      ) : isError || !order ? (
        <div className="rounded-2xl border border-slate-200 bg-white p-6 text-center text-sm text-slate-500">
          Buyurtma topilmadi yoki yuklashda xatolik.
        </div>
      ) : (
        <>
          <ModificationRequests orderId={orderId} />
          <PaymentActions orderId={orderId} order={order} />
          <DispatchActions orderId={orderId} order={order} />
          <OrderBody
            order={order}
            onAdvance={(s) => updateStatus.mutate(s)}
            isUpdating={updateStatus.isPending}
            isError={updateStatus.isError}
          />
        </>
      )}
    </div>
  );
}

type Order = NonNullable<ReturnType<typeof useAdminOrder>['data']>;

/** Mijoz so'rovlari (bekor / manzil / to'lov usuli) — PENDING bo'lsa tasdiq/rad. */
function ModificationRequests({ orderId }: { orderId: string }) {
  const { data: mods } = useOrderModifications(orderId);
  const decide = useDecideModification(orderId);
  const pending = (mods ?? []).filter((m) => m.status === 'PENDING');
  if (pending.length === 0) return null;

  const typeLabel = (t: string) =>
    t === 'PAYMENT_METHOD_CHANGE'
      ? "To'lov: naqd → karta"
      : t === 'ADDRESS_CHANGE'
        ? "Manzilni o'zgartirish"
        : t === 'ITEMS_CHANGE'
          ? 'Taom tarkibi o\'zgartirish'
          : t === 'CANCEL'
            ? 'Bekor qilish'
            : "So'rov";

  return (
    <div className="admin-card admin-card-accent p-4 pt-5">
      <p className="text-sm font-bold text-slate-900">Mijoz so&apos;rovi</p>
      <div className="mt-3 space-y-3">
        {pending.map((m) => (
          <div key={m.id} className="rounded-2xl border border-amber-200 bg-amber-50/60 p-3">
            <p className="text-sm font-bold text-slate-900">{typeLabel(m.type)}</p>

            {m.type === 'PAYMENT_METHOD_CHANGE' && (
              <>
                {typeof m.payload?.amount === 'number' && (
                  <p className="mt-0.5 text-xs text-slate-500">
                    Summa: {m.payload.amount.toLocaleString('uz-UZ')} so&apos;m
                  </p>
                )}
                {m.payload?.receiptUrl ? (
                  <a href={m.payload.receiptUrl} target="_blank" rel="noopener noreferrer" className="mt-2 block">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={m.payload.receiptUrl}
                      alt="chek"
                      className="max-h-60 w-full rounded-xl bg-white object-contain"
                    />
                    <span className="mt-1 block text-center text-[11px] font-semibold text-sky-600">
                      Chekni ochish
                    </span>
                  </a>
                ) : (
                  <p className="mt-1 text-xs text-rose-500">Chek yuklanmagan</p>
                )}
                <p className="mt-1 text-[11px] text-slate-400">
                  To&apos;lov 100% to&apos;g&apos;ri bo&apos;lsa tasdiqlang — buyurtma karta orqali to&apos;langan bo&apos;ladi.
                </p>
              </>
            )}

            {m.type === 'ITEMS_CHANGE' && (
              <>
                {(m.payload?.items ?? []).length > 0 && (
                  <div className="mt-1.5 space-y-0.5">
                    {m.payload!.items!.map((it, i) => (
                      <p key={i} className="text-xs text-slate-600">
                        {it.quantity}× {it.itemName} — {(it.totalPrice ?? 0).toLocaleString('uz-UZ')} so&apos;m
                      </p>
                    ))}
                  </div>
                )}
                {typeof m.payload?.newTotal === 'number' && (
                  <p className="mt-1 text-xs font-bold text-slate-900">
                    Yangi jami: {m.payload.newTotal.toLocaleString('uz-UZ')} so&apos;m
                  </p>
                )}
                {typeof m.payload?.delta === 'number' && m.payload.delta !== 0 && (
                  <p className={`text-xs font-bold ${m.payload.delta > 0 ? 'text-amber-600' : 'text-emerald-600'}`}>
                    {m.payload.delta > 0
                      ? `Qo'shimcha to'lov: +${m.payload.delta.toLocaleString('uz-UZ')} so'm`
                      : `Kamaydi: ${m.payload.delta.toLocaleString('uz-UZ')} so'm`}
                  </p>
                )}
                {m.payload?.receiptUrl && (
                  <a href={m.payload.receiptUrl} target="_blank" rel="noopener noreferrer" className="mt-2 block">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={m.payload.receiptUrl} alt="chek" className="max-h-52 w-full rounded-xl bg-white object-contain" />
                    <span className="mt-1 block text-center text-[11px] font-semibold text-sky-600">Chekni ochish</span>
                  </a>
                )}
              </>
            )}

            {m.reason && <p className="mt-1 text-xs text-slate-500">Izoh: {m.reason}</p>}

            <div className="mt-3 flex gap-2">
              <button
                type="button"
                disabled={decide.isPending}
                onClick={() => decide.mutate({ reqId: m.id, approve: true })}
                className="flex flex-1 items-center justify-center gap-1.5 rounded-2xl bg-emerald-600 py-2.5 text-sm font-bold text-white active:scale-[0.99] disabled:opacity-60"
              >
                {decide.isPending ? <Loader2 size={14} className="animate-spin" /> : <Check size={14} />} Tasdiqlash
              </button>
              <button
                type="button"
                disabled={decide.isPending}
                onClick={() => decide.mutate({ reqId: m.id, approve: false })}
                className="flex flex-1 items-center justify-center gap-1.5 rounded-2xl border border-rose-200 bg-white py-2.5 text-sm font-bold text-rose-600 active:scale-[0.99] disabled:opacity-60"
              >
                <X size={14} /> Rad etish
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

/** To'lovni tasdiqlash / rad etish (MANUAL_TRANSFER va PENDING bo'lsa). */
function PaymentActions({ orderId, order }: { orderId: string; order: Order }) {
  const { approve, reject } = usePaymentAction(orderId);
  const pending = (order.paymentStatus ?? '').toUpperCase() === 'PENDING';
  const manual = (order.paymentMethod ?? '').toUpperCase().includes('TRANSFER');
  if (!pending || !manual) return null;

  return (
    <div className="admin-card admin-card-accent p-4 pt-5">
      <p className="text-sm font-bold text-slate-900">To'lovni tekshirish</p>
      <p className="mt-0.5 text-xs text-slate-500">Bank o'tkazmasi tasdiqlanishi kutilmoqda</p>
      <div className="mt-3 flex gap-2">
        <button
          type="button"
          disabled={approve.isPending}
          onClick={() => approve.mutate()}
          className="flex flex-1 items-center justify-center gap-1.5 rounded-2xl bg-emerald-600 py-3 text-sm font-bold text-white active:scale-[0.99] disabled:opacity-60"
        >
          {approve.isPending ? <Loader2 size={15} className="animate-spin" /> : <Check size={15} />}
          Tasdiqlash
        </button>
        <button
          type="button"
          disabled={reject.isPending}
          onClick={() => reject.mutate(undefined)}
          className="flex flex-1 items-center justify-center gap-1.5 rounded-2xl border border-rose-200 bg-white py-3 text-sm font-bold text-rose-600 active:scale-[0.99] disabled:opacity-60"
        >
          {reject.isPending ? <Loader2 size={15} className="animate-spin" /> : <X size={15} />}
          Rad etish
        </button>
      </div>
      {(approve.isError || reject.isError) && (
        <p className="mt-2 text-center text-xs text-rose-600">Amal bajarilmadi. Qayta urinib ko'ring.</p>
      )}
    </div>
  );
}

/** Kuryer biriktirish (kuryer yo'q va order faol bo'lsa). */
function DispatchActions({ orderId, order }: { orderId: string; order: Order }) {
  const [open, setOpen] = useState(false);
  const dispatch = useDispatchOrder(orderId);
  const { data: options, isLoading } = useCourierOptions(open);

  const terminal =
    order.orderStatus === OrderStatusEnum.DELIVERED ||
    order.orderStatus === OrderStatusEnum.CANCELLED;
  const assigned = Boolean(order.courierName);
  if (terminal && !assigned) return null;

  return (
    <div className="admin-card admin-card-accent p-4 pt-5">
      {assigned ? (
        <>
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-violet-50 text-violet-600">
              <Bike size={18} />
            </div>
            <div className="flex-1">
              <p className="text-xs text-slate-400">Biriktirilgan kuryer</p>
              <p className="text-sm font-bold text-slate-900">{order.courierName}</p>
            </div>
          </div>
          {!terminal && (
            <div className="mt-3 grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setOpen((o) => !o)}
                className="flex items-center justify-center gap-1.5 rounded-2xl border border-slate-200 bg-white py-2.5 text-xs font-bold text-slate-700 active:scale-[0.99]"
              >
                <Bike size={14} /> Boshqa kuryer
              </button>
              <Link
                href={`/admin/chats/${orderId}?role=courier`}
                className="flex items-center justify-center gap-1.5 rounded-2xl bg-violet-50 py-2.5 text-xs font-bold text-violet-700 active:scale-[0.99]"
              >
                <MessageCircle size={14} /> Kuryerga xabar
              </Link>
            </div>
          )}
        </>
      ) : (
        <>
          <p className="text-sm font-bold text-slate-900">Kuryer biriktirish</p>
          {!open && (
            <button
              type="button"
              onClick={() => setOpen(true)}
              className="mt-3 flex w-full items-center justify-center gap-1.5 rounded-2xl bg-gradient-to-r from-ember to-orange-500 py-3 text-sm font-bold text-white shadow-lg shadow-ember/30 active:scale-[0.99]"
            >
              <Bike size={16} /> Kuryer tanlash
            </button>
          )}
        </>
      )}

      {open &&
        (isLoading ? (
          <div className="mt-3 space-y-2"><SkeletonRow /><SkeletonRow /></div>
        ) : (
          <div className="mt-3 space-y-2">
            {assigned && <p className="text-[11px] font-semibold text-slate-400">Yangi kuryerni tanlang (qayta yo'naltirish):</p>}
            {(options ?? []).length === 0 && (
              <p className="py-3 text-center text-xs text-slate-400">Mavjud kuryer yo'q</p>
            )}
            {(options ?? []).map((c) => (
              <button
                key={c.id}
                type="button"
                disabled={dispatch.isPending}
                onClick={() => dispatch.mutate(c.id, { onSuccess: () => setOpen(false) })}
                className="flex w-full items-center gap-3 rounded-2xl border border-slate-200 bg-white p-3 text-left active:scale-[0.99] disabled:opacity-60"
              >
                <span className={`h-2.5 w-2.5 rounded-full ${c.isOnline ? 'bg-emerald-500' : 'bg-slate-300'}`} />
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-sm font-bold text-slate-900">{c.fullName}</span>
                  <span className="block text-[11px] text-slate-500">
                    {c.activeAssignments} faol{c.etaMinutes ? ` · ~${c.etaMinutes} daq` : ''}
                  </span>
                </span>
                {dispatch.isPending ? <Loader2 size={15} className="animate-spin text-ember" /> : null}
              </button>
            ))}
          </div>
        ))}
      {dispatch.isError && (
        <p className="mt-2 text-xs text-rose-600">Kuryer biriktirib bo'lmadi. Qayta urinib ko'ring.</p>
      )}
    </div>
  );
}

function OrderBody({
  order,
  onAdvance,
  isUpdating,
  isError,
}: {
  order: NonNullable<ReturnType<typeof useAdminOrder>['data']>;
  onAdvance: (s: OrderStatusEnum) => void;
  isUpdating: boolean;
  isError?: boolean;
}) {
  const meta = statusMeta(order.orderStatus);
  const next = NEXT_STATUS[order.orderStatus];
  const terminal =
    order.orderStatus === OrderStatusEnum.DELIVERED ||
    order.orderStatus === OrderStatusEnum.CANCELLED;

  return (
    <>
      {/* Sarlavha karta */}
      <div className="admin-card p-4">
        <div className="flex items-center justify-between">
          <h1 className="text-lg font-bold text-slate-900">
            #{order.orderNumber ?? order.id.slice(0, 6)}
          </h1>
          <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold ${meta.chip}`}>
            <span className={`h-1.5 w-1.5 rounded-full ${meta.dot}`} />
            {meta.label}
          </span>
        </div>
        {order.createdAt && (
          <p className="mt-1 text-xs text-slate-400">
            {new Date(order.createdAt).toLocaleString('uz-UZ')}
          </p>
        )}
        {order.orderStatus === OrderStatusEnum.CANCELLED && order.cancelledByRole && (
          <div className="mt-2 rounded-xl bg-rose-50 px-3 py-2 text-xs font-bold text-rose-600">
            {order.cancelledByRole === 'customer'
              ? '❌ Buyurtmachi tomonidan bekor qilindi'
              : order.cancelledByRole === 'courier'
                ? '❌ Kuryer tomonidan bekor qilindi'
                : '❌ Admin tomonidan bekor qilindi'}
            {order.cancellationReason && (
              <span className="mt-0.5 block font-normal text-rose-400">{order.cancellationReason}</span>
            )}
          </div>
        )}
      </div>

      {/* Mijoz */}
      {(order.customerName || order.customerPhone || order.customerAddress) && (
        <div className="admin-card space-y-2 p-4">
          <div className="flex items-center gap-2 text-sm text-slate-700">
            <User size={16} className="text-slate-400" />
            <span className="font-medium">{order.customerName ?? 'Mijoz'}</span>
          </div>
          {order.customerPhone && (
            <a href={`tel:${order.customerPhone}`} className="flex items-center gap-2 text-sm font-semibold text-sky-600">
              <Phone size={16} /> {order.customerPhone}
            </a>
          )}
          {order.customerAddress?.addressText && (
            <a
              href={
                order.customerAddress.latitude && order.customerAddress.longitude
                  ? `https://yandex.uz/maps/?pt=${order.customerAddress.longitude},${order.customerAddress.latitude}&z=17&l=map`
                  : undefined
              }
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-start gap-2 text-sm text-slate-600"
            >
              <MapPin size={16} className="mt-0.5 shrink-0 text-ember" />
              <span>
                {order.customerAddress.addressText}
                {order.customerAddress.note ? <span className="block text-xs text-slate-400">{order.customerAddress.note}</span> : null}
              </span>
            </a>
          )}
          {order.courierName && (
            <div className="flex items-center gap-2 text-sm text-slate-600">
              <Truck size={16} className="text-slate-400" /> {order.courierName}
            </div>
          )}
        </div>
      )}

      {/* Mahsulotlar */}
      {order.items && order.items.length > 0 && (
        <div className="admin-card p-4">
          <h2 className="mb-2 text-sm font-semibold text-slate-900">Mahsulotlar</h2>
          <div className="space-y-2">
            {order.items.map((it, i) => (
              <div key={i} className="flex items-center justify-between text-sm">
                <span className="text-slate-600">
                  {(it.name ?? it.productName ?? 'Mahsulot')}{' '}
                  <span className="text-slate-400">×{it.quantity ?? 1}</span>
                </span>
                <span className="font-medium text-slate-900">
                  {((it.price ?? 0) * (it.quantity ?? 1)).toLocaleString('uz-UZ')} so'm
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Hisob-kitob */}
      <div className="admin-card p-4">
        <Row label="Mahsulotlar" value={order.subtotal} />
        {order.discount ? <Row label="Chegirma" value={-order.discount} /> : null}
        <Row label="Yetkazish" value={order.deliveryFee} />
        <div className="my-2 h-px bg-slate-100" />
        <div className="flex items-center justify-between">
          <span className="text-sm font-semibold text-slate-900">Jami</span>
          <span className="text-base font-bold text-slate-900">
            {orderMoney(order).toLocaleString('uz-UZ')} so'm
          </span>
        </div>
        {order.paymentMethod && (
          <p className="mt-2 text-xs text-slate-400">
            To'lov: {order.paymentMethod} · {order.paymentStatus ?? '—'}
          </p>
        )}
      </div>

      {/* Harakatlar */}
      {!terminal && (
        <div className="space-y-2">
          {next && (
            <button
              type="button"
              disabled={isUpdating}
              onClick={() => onAdvance(next.next)}
              className="w-full rounded-2xl bg-gradient-to-r from-ember to-orange-500 py-3.5 text-sm font-bold text-white shadow-lg shadow-ember/30 transition active:scale-[0.99] disabled:opacity-60"
            >
              {isUpdating ? 'Bajarilmoqda…' : next.label}
            </button>
          )}
          <button
            type="button"
            disabled={isUpdating}
            onClick={() => onAdvance(OrderStatusEnum.CANCELLED)}
            className="w-full rounded-2xl border border-rose-200 bg-white py-3 text-sm font-semibold text-rose-600 transition active:scale-[0.99] disabled:opacity-60"
          >
            Buyurtmani bekor qilish
          </button>
          {isError && (
            <p className="text-center text-xs text-rose-600">Holatni o'zgartirib bo'lmadi. Qayta urinib ko'ring.</p>
          )}
        </div>
      )}
    </>
  );
}

function Row({ label, value }: { label: string; value?: number }) {
  if (value === undefined || value === null) return null;
  return (
    <div className="flex items-center justify-between py-0.5 text-sm">
      <span className="text-slate-500">{label}</span>
      <span className="text-slate-700">{value.toLocaleString('uz-UZ')} so'm</span>
    </div>
  );
}
