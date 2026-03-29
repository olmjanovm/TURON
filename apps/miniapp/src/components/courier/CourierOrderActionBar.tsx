import React from 'react';
import { Phone, Navigation, PackageCheck, Map as MapIcon, ChevronRight } from 'lucide-react';
import { DeliveryStageEnum } from '@turon/shared';

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
  onStageChange
}) => {
  const getActionLabel = () => {
    switch (stage) {
      case DeliveryStageEnum.IDLE: return 'Buyurtmani qabul qilish';
      case DeliveryStageEnum.GOING_TO_RESTAURANT: return 'Restoranga yetib keldim';
      case DeliveryStageEnum.ARRIVED_AT_RESTAURANT: return 'Buyurtmani oldim';
      case DeliveryStageEnum.PICKED_UP: return 'Yetkazishni boshlash';
      case DeliveryStageEnum.DELIVERING: return 'Mijozga topshirdim';
      case DeliveryStageEnum.ARRIVED_AT_DESTINATION: return 'Buyurtmani yakunlash';
      default: return 'Keyingi bosqich';
    }
  };

  const getNextStage = () => {
    switch (stage) {
      case DeliveryStageEnum.IDLE: return DeliveryStageEnum.GOING_TO_RESTAURANT;
      case DeliveryStageEnum.GOING_TO_RESTAURANT: return DeliveryStageEnum.ARRIVED_AT_RESTAURANT;
      case DeliveryStageEnum.ARRIVED_AT_RESTAURANT: return DeliveryStageEnum.PICKED_UP;
      case DeliveryStageEnum.PICKED_UP: return DeliveryStageEnum.DELIVERING;
      case DeliveryStageEnum.DELIVERING: return DeliveryStageEnum.ARRIVED_AT_DESTINATION;
      case DeliveryStageEnum.ARRIVED_AT_DESTINATION: return DeliveryStageEnum.DELIVERED;
      default: return stage;
    }
  };

  return (
    <div className="fixed bottom-0 left-0 right-0 p-4 bg-white shadow-[0_-10px_30px_rgba(0,0,0,0.1)] rounded-t-3xl z-40 border-t border-gray-100 pb-safe">
      <div className="flex items-center justify-between mb-4">
        <div className="flex-1">
          <p className="text-[10px] text-gray-400 uppercase font-bold tracking-widest">Mijoz</p>
          <h3 className="text-lg font-bold text-gray-900 truncate">{customerName}</h3>
          <p className="text-xs text-gray-500 truncate max-w-[200px]">{address}</p>
        </div>
        
        <div className="flex gap-2">
          <a 
            href={`tel:${phoneNumber}`}
            className="w-12 h-12 flex items-center justify-center bg-green-50 text-green-600 rounded-full transition-active hover:bg-green-100"
          >
            <Phone size={22} fill="currentColor" />
          </a>
          <button className="w-12 h-12 flex items-center justify-center bg-blue-50 text-blue-600 rounded-full transition-active hover:bg-blue-100">
            <Navigation size={22} fill="currentColor" />
          </button>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4 mb-4 pt-4 border-t border-gray-100">
        <div className="bg-gray-50 p-3 rounded-2xl">
          <p className="text-[10px] text-gray-400 uppercase font-bold">Summa</p>
          <p className="font-bold text-gray-900">{orderTotal.toLocaleString()} so'm</p>
        </div>
        <div className="bg-gray-50 p-3 rounded-2xl">
          <p className="text-[10px] text-gray-400 uppercase font-bold">To'lov</p>
          <p className="font-bold text-gray-900">{paymentMethod}</p>
        </div>
      </div>

      <button
        onClick={() => onStageChange(getNextStage())}
        className="w-full h-16 bg-amber-500 text-white rounded-2xl flex items-center justify-center gap-3 shadow-lg shadow-amber-200 font-bold text-lg active:scale-95 transition-transform"
      >
        <PackageCheck size={24} />
        {getActionLabel()}
        <ChevronRight size={24} className="opacity-50" />
      </button>

      {stage === DeliveryStageEnum.DELIVERING && (
          <p className="text-center text-[10px] text-amber-600 font-bold mt-2 animate-pulse">
            ⚠️ Buyurtmani topshirganingizni tasdiqlang
          </p>
      )}
    </div>
  );
};
