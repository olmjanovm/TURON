import React from 'react';
import { TimeRange } from '../types';

interface Props {
  timeRange: TimeRange;
  onChange: (range: TimeRange) => void;
}

export const AnalyticsFilterBar: React.FC<Props> = ({ timeRange, onChange }) => {
  const options: { label: string; value: TimeRange }[] = [
    { label: 'Bugun', value: 'TODAY' },
    { label: 'Shu hafta', value: 'THIS_WEEK' },
    { label: 'Shu oy', value: 'THIS_MONTH' },
    { label: 'Barchasi', value: 'ALL_TIME' },
  ];

  return (
    <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
      {options.map((opt) => (
        <button
          key={opt.value}
          onClick={() => onChange(opt.value)}
          className={`px-4 py-2 rounded-xl text-sm font-bold whitespace-nowrap transition-colors ${
            timeRange === opt.value
              ? 'bg-slate-900 text-white shadow-md'
              : 'bg-white text-slate-500 border border-slate-200 hover:bg-slate-50'
          }`}
        >
          {opt.label}
        </button>
      ))}
    </div>
  );
};
