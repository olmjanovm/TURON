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
    <section className="adminx-home-stat-shell space-y-3">
      <div className="flex items-center justify-between gap-3 px-1">
        <div>
          <p className="adminx-kicker text-[var(--adminx-color-faint)]">Ko'rsatkichlar</p>
          <h3 className="mt-1 text-[20px] font-black tracking-[-0.04em] text-[var(--adminx-color-ink)]">
            Tezkor ko'rinish
          </h3>
        </div>
      </div>

      <div className="adminx-home-stat-grid">
        {metrics.map((metric, index) => {
          const Icon = iconMap[metric.tone];
          return (
            <button
              key={metric.key}
              type="button"
              onClick={() => onNavigate(metric.route)}
              className="adminx-home-stat-card text-left"
              data-tone={metric.tone}
              style={{ ['--i' as string]: index } as React.CSSProperties}
            >
              <div className="flex items-center justify-between gap-2">
                <span className="adminx-home-stat-badge">
                  <Icon size={14} />
                </span>
                <ArrowUpRight size={15} className="text-[var(--adminx-color-faint)]" />
              </div>
              <p className="mt-4 text-[11px] font-black uppercase tracking-[0.16em] text-[var(--adminx-color-faint)]">
                {metric.label}
              </p>
              <p className="mt-2 text-[28px] font-black leading-none tracking-[-0.05em] text-[var(--adminx-color-ink)]">
                {metric.value}
              </p>
              <p className="mt-2 text-[12px] font-semibold leading-5 text-[var(--adminx-color-muted)]">
                {metric.description}
              </p>
            </button>
          );
        })}
      </div>
    </section>
  );
}
