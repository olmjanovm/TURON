import React from 'react';
import { Clock, Navigation } from 'lucide-react';
import { DeliveryStageEnum } from '@turon/shared';
import { getDeliveryStageMeta } from '../../features/courier/deliveryStage';

interface RouteInfoCardProps {
  distanceKm: number;
  estimatedMinutes: number;
}

export const RouteInfoCard: React.FC<RouteInfoCardProps> = ({ distanceKm, estimatedMinutes }) => (
  <div className="mb-4 grid grid-cols-2 gap-3">
    <div className="flex items-center gap-3 rounded-2xl border border-gray-100 bg-white/90 px-4 pb-3 pt-3 shadow-sm backdrop-blur">
      <div className="flex h-10 w-10 items-center justify-center rounded-full bg-blue-50 text-blue-600">
        <Navigation size={18} fill="currentColor" />
      </div>
      <div>
        <p className="text-[10px] font-bold uppercase text-gray-400">Masofa</p>
        <p className="font-bold text-gray-900">{distanceKm} km</p>
      </div>
    </div>

    <div className="flex items-center gap-3 rounded-2xl border border-gray-100 bg-white/90 px-4 pb-3 pt-3 shadow-sm backdrop-blur">
      <div className="flex h-10 w-10 items-center justify-center rounded-full bg-amber-50 text-amber-600">
        <Clock size={18} fill="currentColor" />
      </div>
      <div>
        <p className="text-[10px] font-bold uppercase text-gray-400">Vaqt (ETA)</p>
        <p className="font-bold text-gray-900">{estimatedMinutes} min</p>
      </div>
    </div>
  </div>
);

interface DeliveryStageCardProps {
  stage: DeliveryStageEnum;
}

export const DeliveryStageCard: React.FC<DeliveryStageCardProps> = ({ stage }) => {
  const meta = getDeliveryStageMeta(stage);
  const color =
    meta.label === 'Accepted'
      ? 'bg-blue-500'
      : meta.label === 'Arrived'
        ? 'bg-amber-500'
        : meta.label === 'Picked Up'
          ? 'bg-orange-500'
          : meta.label === 'Delivering'
            ? 'bg-violet-500'
            : 'bg-emerald-500';

  return (
    <div className="mb-4 flex items-center gap-2">
      <div className={`h-3 w-3 rounded-full ${color} animate-pulse`} />
      <span className="text-sm font-bold tracking-tight text-gray-700">{meta.label}</span>
    </div>
  );
};
