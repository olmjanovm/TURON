import React, { useEffect } from 'react';
import { useMenuStore } from '../../../store/useMenuStore';
import MenuSummaryCards from '../../../features/menu/components/MenuSummaryCards';

const AdminMenuDashboard: React.FC = () => {
  const { ensureSeeded } = useMenuStore();

  useEffect(() => {
    ensureSeeded();
  }, [ensureSeeded]);

  return (
    <div className="space-y-6 animate-in fade-in duration-300 pb-8">
      <div>
        <h1 className="text-2xl font-black text-slate-900 tracking-tight">Menyu boshqaruvi</h1>
        <p className="text-sm text-slate-400 font-medium mt-1">Kategoriyalar va taomlarni boshqaring</p>
      </div>
      <MenuSummaryCards />
    </div>
  );
};

export default AdminMenuDashboard;
