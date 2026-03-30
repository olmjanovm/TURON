import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { TrendingUp, Plus, Users, ArrowUpRight } from 'lucide-react';
import { useOrdersStore } from '../../store/useOrdersStore';
import { usePromoStore } from '../../store/usePromoStore';

import { TimeRange } from '../../features/analytics/types';
import { 
  filterOrdersByTimeRange, 
  calculateKPIMetrics, 
  getOrderStatusBreakdown, 
  getTopProducts,
  getCourierPerformance,
  getPromoInsights,
  getRecentActivity
} from '../../features/analytics/analyticsHelpers';

import { AnalyticsFilterBar } from '../../features/analytics/components/AnalyticsFilterBar';
import { KPIStatCards } from '../../features/analytics/components/KPIStatCards';
import { StatusBreakdownCard } from '../../features/analytics/components/StatusBreakdownCard';
import { TopProductsCard } from '../../features/analytics/components/TopProductsCard';
import { CourierPerformanceCard } from '../../features/analytics/components/CourierPerformanceCard';
import { PromoInsightsCard } from '../../features/analytics/components/PromoInsightsCard';
import { RecentActivityCard } from '../../features/analytics/components/RecentActivityCard';

const AdminDashboardPage: React.FC = () => {
  const navigate = useNavigate();
  const { orders } = useOrdersStore();
  const { promos } = usePromoStore();

  const [timeRange, setTimeRange] = useState<TimeRange>('TODAY');

  // Compute analytics based on timeRange
  const analyticsData = useMemo(() => {
    const filteredOrders = filterOrdersByTimeRange(orders, timeRange);

    return {
      kpi: calculateKPIMetrics(filteredOrders),
      statusBreakdown: getOrderStatusBreakdown(filteredOrders),
      topProducts: getTopProducts(filteredOrders),
      courierPerformance: getCourierPerformance(filteredOrders),
      promoInsights: getPromoInsights(filteredOrders, promos),
      recentActivity: getRecentActivity(filteredOrders),
    };
  }, [orders, promos, timeRange]);

  return (
    <div className="space-y-6 animate-in fade-in duration-500 pb-20">
      {/* Header */}
      <div className="flex justify-between items-start">
        <div>
          <h2 className="text-3xl font-black text-slate-900 tracking-tighter uppercase leading-none">Tahlillar</h2>
          <p className="text-[11px] font-black text-slate-400 uppercase tracking-widest mt-1">Biznes ko'rsatkichlari</p>
        </div>
        <button 
          onClick={() => navigate('/admin/orders')}
          className="w-12 h-12 bg-blue-600 text-white rounded-2xl flex items-center justify-center shadow-xl shadow-blue-200 active:scale-90 transition-transform"
        >
          <TrendingUp size={24} />
        </button>
      </div>

      {/* Filter */}
      <AnalyticsFilterBar timeRange={timeRange} onChange={setTimeRange} />

      {/* KPI Stats */}
      <KPIStatCards metrics={analyticsData.kpi} />

      {/* Charts / Complex Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <StatusBreakdownCard breakdown={analyticsData.statusBreakdown} totalOrders={analyticsData.kpi.totalOrders} />
        <RecentActivityCard activities={analyticsData.recentActivity} />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <TopProductsCard products={analyticsData.topProducts} />
        <PromoInsightsCard insights={analyticsData.promoInsights} />
      </div>

      <CourierPerformanceCard performance={analyticsData.courierPerformance} />

      {/* Quick Actions (Preserved from legacy design) */}
      <div className="space-y-3 pt-4">
        <h3 className="text-[12px] font-black uppercase tracking-widest text-slate-400 px-1">Tezkor amallar</h3>
        <div className="grid grid-cols-2 gap-4">
          <button 
            onClick={() => navigate('/admin/menu/products/new')}
            className="h-16 bg-white border border-slate-100 rounded-2xl flex items-center justify-center gap-3 text-slate-600 font-bold active:bg-slate-50 transition-colors shadow-sm"
          >
            <Plus size={20} className="text-blue-500" />
            <span className="text-xs uppercase tracking-tight">Yangi mahsulot</span>
          </button>
          <button 
            onClick={() => navigate('/admin/promos/new')}
            className="h-16 bg-white border border-slate-100 rounded-2xl flex items-center justify-center gap-3 text-slate-600 font-bold active:bg-slate-50 transition-colors shadow-sm"
          >
            <Plus size={20} className="text-indigo-500" />
            <span className="text-xs uppercase tracking-tight">Yangi promokod</span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboardPage;
