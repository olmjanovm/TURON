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
      description: 'Tushgan navbatni ochish',
      route: '/admin/orders',
      icon: <ShoppingBag size={22} />,
      urgent: pendingCount > 0,
      badge: pendingCount || undefined,
    },
    {
      label: 'Kuryerlar',
      description: 'Faol tarkibni ko\'rish',
      route: '/admin/couriers',
      icon: <Bike size={22} />,
    },
    {
      label: 'Menyu',
      description: 'Mahsulotlarni boshqarish',
      route: '/admin/menu',
      icon: <UtensilsCrossed size={22} />,
    },
    {
      label: 'Hisobot',
      description: 'Kunlik natijani tekshirish',
      route: '/admin/reports',
      icon: <BarChart3 size={22} />,
    },
    {
      label: 'Restoran',
      description: 'Sozlamalarni yangilash',
      route: '/admin/restaurant',
      icon: <Store size={22} />,
    },
  ];

  return (
    <section className="adminx-quick-shell p-5">
      <div className="flex items-end justify-between gap-3">
        <div>
          <p className="adminx-kicker text-[var(--adminx-color-faint)]">Tezkor o'tish</p>
          <h3 className="mt-2 text-[24px] font-black tracking-[-0.04em] text-[var(--adminx-color-ink)]">
            Ishchi bo'limlar
          </h3>
        </div>
      </div>

      <div className="adminx-action-grid mt-5">
        {actions.map((action, index) => (
          <button
            key={action.route}
            type="button"
            onClick={() => onNavigate(action.route)}
            className="adminx-action-tile relative text-left"
            data-urgent={action.urgent ? 'true' : 'false'}
            style={{ ['--i' as string]: index } as React.CSSProperties}
          >
            {action.badge ? (
              <span className="absolute right-3 top-3 rounded-full bg-[var(--adminx-color-danger)] px-2 py-1 text-[11px] font-black text-white shadow-[0_10px_20px_rgba(214,69,69,0.24)]">
                {action.badge > 99 ? '99+' : action.badge}
              </span>
            ) : null}
            <div className="flex h-12 w-12 items-center justify-center rounded-[18px] bg-[var(--adminx-color-primary-soft)] text-[var(--adminx-color-primary-dark)] shadow-[0_10px_22px_rgba(245,166,35,0.14)]">
              {action.icon}
            </div>
            <div className="mt-4">
              <p className="text-[16px] font-black text-[var(--adminx-color-ink)]">{action.label}</p>
              <p className="mt-2 text-sm font-semibold leading-6 text-[var(--adminx-color-muted)]">{action.description}</p>
            </div>
            <ChevronRight size={18} className="mt-4 text-[var(--adminx-color-faint)]" />
          </button>
        ))}
      </div>
    </section>
  );
}
