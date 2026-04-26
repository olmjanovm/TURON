import React from 'react';
import { ArrowUpRight, CheckCircle2, Clock3, Truck, Wallet } from 'lucide-react';
import type { DashboardMetric } from './dashboardUtils';

interface Props {
  metrics: DashboardMetric[];
  onNavigate: (route: string) => void;
}

const iconMap = {
  revenue: Wallet,
  active: Truck,
  pending: Clock3,
  done: CheckCircle2,
} as const;

export function AdminDashboardStatRail({ metrics, onNavigate }: Props) {
  return (
    <section className="space-y-3">
      <div className="flex items-center justify-between gap-3 px-1">
        <div>
          <p className="adminx-kicker text-[var(--adminx-color-faint)]">Asosiy ko'rsatkichlar</p>
          <h3 className="mt-2 text-[22px] font-black tracking-[-0.04em] text-[var(--adminx-color-ink)]">
            Tezkor ko'rinish
          </h3>
        </div>
      </div>

      <div className="adminx-stat-rail">
        {metrics.map((metric, index) => {
          const Icon = iconMap[metric.tone];
          return (
            <button
              key={metric.key}
              type="button"
              onClick={() => onNavigate(metric.route)}
              className="adminx-stat-pill text-left"
              data-tone={metric.tone}
              style={{ ['--i' as string]: index } as React.CSSProperties}
            >
              <div className="flex items-center justify-between gap-3">
                <span className="adminx-chip border-black/5 bg-white/80 text-[var(--adminx-color-ink)]">
                  <Icon size={14} />
                  {metric.label}
                </span>
                <ArrowUpRight size={17} className="text-[var(--adminx-color-faint)]" />
              </div>
              <p className="mt-5 text-[34px] font-black leading-none tracking-[-0.05em] text-[var(--adminx-color-ink)]">
                {metric.value}
              </p>
              <p className="mt-3 text-sm font-semibold text-[var(--adminx-color-muted)]">{metric.description}</p>
            </button>
          );
        })}
      </div>
    </section>
  );
}
