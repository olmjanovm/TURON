import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  ChevronRight, 
  Filter, 
  ShoppingBag,
  RefreshCw,
  AlertCircle
} from 'lucide-react';
import { useAdminOrders } from '../../hooks/queries/useOrders';
import { AdminOrderCard } from '../../components/admin/AdminComponents';
import { LoadingSkeleton } from '../../components/customer/CustomerComponents';
import { OrderStatusEnum } from '@turon/shared';

const AdminOrdersPage: React.FC = () => {
  const navigate = useNavigate();
  const { data: orders = [], isLoading, error, refetch } = useAdminOrders();
  const [activeTab, setActiveTab] = useState<OrderStatusEnum | 'ALL'>('ALL');

  if (isLoading) return <LoadingSkeleton />;

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center p-12 text-center space-y-4">
        <AlertCircle size={48} className="text-red-500" />
        <h3 className="font-bold text-slate-900 uppercase">Xatolik yuz berdi</h3>
        <p className="text-sm text-slate-500">{(error as Error).message}</p>
        <button onClick={() => refetch()} className="px-6 py-2 bg-slate-900 text-white rounded-xl font-bold">Yangilash</button>
      </div>
    );
  }

  // Filter based on Tab
  const getTabOrders = (tabId: OrderStatusEnum | 'ALL') => {
    if (tabId === 'ALL') return orders;
    return orders.filter((o: any) => o.status === tabId);
  };

  const filteredOrders = getTabOrders(activeTab);

  const tabs: { id: OrderStatusEnum | 'ALL'; label: string; count: number }[] = [
    { id: 'ALL', label: 'Barchasi', count: orders.length },
    { id: OrderStatusEnum.PENDING, label: 'Yangi', count: getTabOrders(OrderStatusEnum.PENDING).length },
    { id: OrderStatusEnum.PREPARING, label: 'Tayyorlov', count: getTabOrders(OrderStatusEnum.PREPARING).length },
    { id: OrderStatusEnum.READY_FOR_PICKUP, label: 'Tayyor', count: getTabOrders(OrderStatusEnum.READY_FOR_PICKUP).length },
  ];

  return (
    <div className="space-y-6 pb-24 animate-in fade-in duration-500">
      {/* Page Header */}
      <div className="flex justify-between items-center px-1">
        <div>
          <h2 className="text-2xl font-black text-slate-900 tracking-tighter italic uppercase leading-none">Buyurtmalar</h2>
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-1">Boshqaruv paneli</p>
        </div>
        <button 
          onClick={() => refetch()}
          className="w-10 h-10 bg-white border border-slate-100 rounded-xl flex items-center justify-center text-slate-400 active:scale-95 transition-all"
        >
          <RefreshCw size={18} />
        </button>
      </div>

      {/* Navigation Tabs */}
      <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-hide -mx-6 px-6">
        {tabs.map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`
              whitespace-nowrap px-5 h-11 rounded-2xl font-black uppercase tracking-widest text-[10px] transition-all flex items-center gap-2
              ${activeTab === tab.id 
                ? 'bg-blue-600 text-white shadow-lg shadow-blue-100' 
                : 'bg-white text-slate-400 border border-slate-100'}
            `}
          >
            <span>{tab.label}</span>
            <span className={`
              w-5 h-5 rounded-lg flex items-center justify-center text-[10px] font-bold
              ${activeTab === tab.id ? 'bg-white/20' : 'bg-slate-50'}
            `}>
              {tab.count}
            </span>
          </button>
        ))}
      </div>

      {/* Orders Board / List */}
      <div className="space-y-4">
        {filteredOrders.length > 0 ? (
          filteredOrders.map((order: any) => (
            <AdminOrderCard 
              key={order.id} 
              order={order} 
              onClick={() => navigate(`/admin/orders/${order.id}`)} 
            />
          ))
        ) : (
          <div className="flex flex-col items-center justify-center py-24 text-center">
            <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center text-slate-200 mb-4">
              <ShoppingBag size={32} />
            </div>
            <h3 className="text-xl font-black text-slate-900 uppercase tracking-tighter italic italic">Hech narsa topilmadi</h3>
            <p className="text-slate-400 text-[10px] font-bold uppercase tracking-widest mt-1">Ushbu holatda buyurtmalar yo'q</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminOrdersPage;
