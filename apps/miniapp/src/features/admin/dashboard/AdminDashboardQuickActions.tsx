import React from 'react';
import { BarChart3, Bike, ChevronRight, ShoppingBag, Store, UtensilsCrossed } from 'lucide-react';

interface ActionItem {
  label: string;
  description: string;
  route: string;
  icon: React.ReactNode;
  urgent?: boolean;
  badge?: number;
}

interface Props {
  pendingCount: number;
  onNavigate: (route: string) => void;
}

export function AdminDashboardQuickActions({ pendingCount, onNavigate }: Props) {
  const actions: ActionItem[] = [
    {
      label: 'Buyurtmalar',
      description: 'Navbat',
      route: '/admin/orders',
      icon: <ShoppingBag size={22} />,
      urgent: pendingCount > 0,
      badge: pendingCount || undefined,
    },
    {
      label: 'Kuryerlar',
      description: 'Tarkib',
      route: '/admin/couriers',
      icon: <Bike size={22} />,
    },
    {
      label: 'Menyu',
      description: 'Katalog',
      route: '/admin/menu',
      icon: <UtensilsCrossed size={22} />,
    },
    {
      label: 'Hisobot',
      description: 'Tahlil',
      route: '/admin/reports',
      icon: <BarChart3 size={22} />,
    },
    {
      label: 'Restoran',
      description: 'Sozlama',
      route: '/admin/restaurant',
      icon: <Store size={22} />,
    },
  ];

  return (
    <section className="adminx-quick-shell adminx-home-actions-shell p-4">
      <div className="flex items-end justify-between gap-3">
        <div>
          <p className="adminx-kicker text-[var(--adminx-color-faint)]">Bo'limlar</p>
          <h3 className="mt-1 text-[20px] font-black tracking-[-0.04em] text-[var(--adminx-color-ink)]">
            Tezkor o'tish
          </h3>
        </div>
      </div>

      <div className="adminx-home-actions-grid mt-4">
        {actions.map((action, index) => (
          <button
            key={action.route}
            type="button"
            onClick={() => onNavigate(action.route)}
            className="adminx-home-action relative text-left"
            data-urgent={action.urgent ? 'true' : 'false'}
            style={{ ['--i' as string]: index } as React.CSSProperties}
          >
            {action.badge ? (
              <span className="absolute right-2.5 top-2.5 rounded-full bg-[var(--adminx-color-danger)] px-1.5 py-[3px] text-[10px] font-black text-white shadow-[0_10px_20px_rgba(214,69,69,0.24)]">
                {action.badge > 99 ? '99+' : action.badge}
              </span>
            ) : null}
            <div className="flex h-11 w-11 items-center justify-center rounded-[16px] bg-[var(--adminx-color-primary-soft)] text-[var(--adminx-color-primary-dark)] shadow-[0_10px_22px_rgba(245,166,35,0.14)]">
              {action.icon}
            </div>
            <div className="mt-3">
              <p className="text-[14px] font-black leading-tight text-[var(--adminx-color-ink)]">{action.label}</p>
              <p className="mt-1 text-[11px] font-bold uppercase tracking-[0.14em] text-[var(--adminx-color-muted)]">
                {action.description}
              </p>
            </div>
            <ChevronRight size={16} className="mt-3 text-[var(--adminx-color-faint)]" />
          </button>
        ))}
      </div>
    </section>
  );
}
