import React from 'react';
import { ChevronRight, Navigation, PackageCheck, Phone } from 'lucide-react';
import { DeliveryStageEnum } from '@turon/shared';
import { getDeliveryStageAction, getDeliveryStageMeta } from '../../features/courier/deliveryStage';
import { initiateCall } from '../../lib/callUtils';

interface CourierOrderActionBarProps {
  stage: DeliveryStageEnum;
  customerName: string;
  phoneNumber: string;
  address: string;
  orderTotal: number;
  paymentMethod: string;
  onStageChange: (nextStage: DeliveryStageEnum) => void;
}

export const CourierOrderActionBar: React.FC<CourierOrderActionBarProps> = ({
  stage,
  customerName,
  phoneNumber,
  address,
  orderTotal,
  paymentMethod,
  onStageChange,
}) => {
  const action = getDeliveryStageAction(stage);
  const stageMeta = getDeliveryStageMeta(stage);

  return (
    <div className="fixed bottom-0 left-0 right-0 z-40 rounded-t-3xl border-t border-gray-100 bg-white p-4 pb-safe shadow-[0_-10px_30px_rgba(0,0,0,0.1)]">
      <div className="mb-4 flex items-center justify-between">
        <div className="flex-1">
          <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400">Mijoz</p>
          <h3 className="truncate text-lg font-bold text-gray-900">{customerName}</h3>
          <p className="max-w-[200px] truncate text-xs text-gray-500">{address}</p>
        </div>

        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => initiateCall(phoneNumber, customerName)}
            className="flex h-12 w-12 items-center justify-center rounded-full bg-green-50 text-green-600 transition-active hover:bg-green-100"
          >
            <Phone size={22} fill="currentColor" />
          </button>
          <button className="flex h-12 w-12 items-center justify-center rounded-full bg-blue-50 text-blue-600 transition-active hover:bg-blue-100">
            <Navigation size={22} fill="currentColor" />
          </button>
        </div>
      </div>

      <div className="mb-4 grid grid-cols-2 gap-4 border-t border-gray-100 pt-4">
        <div className="rounded-2xl bg-gray-50 p-3">
          <p className="text-[10px] font-bold uppercase text-gray-400">Summa</p>
          <p className="font-bold text-gray-900">{orderTotal.toLocaleString()} so'm</p>
        </div>
        <div className="rounded-2xl bg-gray-50 p-3">
          <p className="text-[10px] font-bold uppercase text-gray-400">To'lov</p>
          <p className="font-bold text-gray-900">{paymentMethod}</p>
        </div>
      </div>

      <button
        onClick={() => action.next && onStageChange(action.next)}
        disabled={!action.next}
        className="flex h-16 w-full items-center justify-center gap-3 rounded-2xl bg-amber-500 text-lg font-bold text-white shadow-lg shadow-amber-200 transition-transform active:scale-95 disabled:opacity-60"
      >
        <PackageCheck size={24} />
        {action.label}
        <ChevronRight size={24} className="opacity-50" />
      </button>

      {stageMeta.label === 'Delivering' && (
        <p className="mt-2 text-center text-[10px] font-bold text-amber-600 animate-pulse">
          Buyurtma topshirilgach yakunlanganini tasdiqlang
        </p>
      )}
    </div>
  );
};
