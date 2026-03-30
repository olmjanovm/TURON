import React from 'react';
import { ProductAvailabilityEnum } from '@turon/shared';

const labels: Record<ProductAvailabilityEnum, string> = {
  [ProductAvailabilityEnum.AVAILABLE]: 'Mavjud',
  [ProductAvailabilityEnum.TEMPORARILY_UNAVAILABLE]: 'Vaqtincha yo\'q',
  [ProductAvailabilityEnum.OUT_OF_STOCK]: 'Tugagan',
};

const colors: Record<ProductAvailabilityEnum, string> = {
  [ProductAvailabilityEnum.AVAILABLE]: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  [ProductAvailabilityEnum.TEMPORARILY_UNAVAILABLE]: 'bg-amber-50 text-amber-700 border-amber-200',
  [ProductAvailabilityEnum.OUT_OF_STOCK]: 'bg-red-50 text-red-700 border-red-200',
};

const AvailabilityBadge: React.FC<{ availability: ProductAvailabilityEnum }> = ({ availability }) => (
  <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-1 rounded-lg border ${colors[availability]}`}>
    {labels[availability]}
  </span>
);

export default AvailabilityBadge;
