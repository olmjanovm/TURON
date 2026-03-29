import React from 'react';
import { Clock, MapPin, Navigation } from 'lucide-react';
import { DeliveryStageEnum } from '@turon/shared';

interface RouteInfoCardProps {
  distanceKm: number;
  estimatedMinutes: number;
}

export const RouteInfoCard: React.FC<RouteInfoCardProps> = ({ distanceKm, estimatedMinutes }) => (
  <div className="grid grid-cols-2 gap-3 mb-4">
    <div className="bg-white/90 backdrop-blur pb-3 pt-3 px-4 rounded-2xl shadow-sm border border-gray-100 flex items-center gap-3">
      <div className="w-10 h-10 bg-blue-50 text-blue-600 rounded-full flex items-center justify-center">
        <Navigation size={18} fill="currentColor" />
      </div>
      <div>
        <p className="text-[10px] text-gray-400 uppercase font-bold">Masofa</p>
        <p className="font-bold text-gray-900">{distanceKm} km</p>
      </div>
    </div>
    
    <div className="bg-white/90 backdrop-blur pb-3 pt-3 px-4 rounded-2xl shadow-sm border border-gray-100 flex items-center gap-3">
      <div className="w-10 h-10 bg-amber-50 text-amber-600 rounded-full flex items-center justify-center">
        <Clock size={18} fill="currentColor" />
      </div>
      <div>
        <p className="text-[10px] text-gray-400 uppercase font-bold">Vaqt (ETA)</p>
        <p className="font-bold text-gray-900">{estimatedMinutes} min</p>
      </div>
    </div>
  </div>
);

interface DeliveryStageCardProps {
  stage: DeliveryStageEnum;
}

export const DeliveryStageCard: React.FC<DeliveryStageCardProps> = ({ stage }) => {
  const getStageInfo = () => {
    switch (stage) {
      case DeliveryStageEnum.GOING_TO_RESTAURANT: return { label: 'Restoranga ketmoqdasiz', color: 'bg-blue-500' };
      case DeliveryStageEnum.ARRIVED_AT_RESTAURANT: return { label: 'Restorandasiz', color: 'bg-amber-500' };
      case DeliveryStageEnum.PICKED_UP: return { label: 'Yo’ldasiz (Mijozga)', color: 'bg-green-500' };
      case DeliveryStageEnum.DELIVERING: return { label: 'Yetkazib berilmoqda', color: 'bg-green-600' };
      default: return { label: 'Tayyorlanmoqda', color: 'bg-gray-500' };
    }
  };

  const { label, color } = getStageInfo();

  return (
    <div className="flex items-center gap-2 mb-4">
      <div className={`w-3 h-3 rounded-full ${color} animate-pulse`} />
      <span className="text-sm font-bold text-gray-700 tracking-tight">{label}</span>
    </div>
  );
};
