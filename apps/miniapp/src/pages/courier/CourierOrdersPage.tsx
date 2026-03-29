import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Package, Map as MapIcon, ChevronRight, Clock } from 'lucide-react';
import axios from 'axios';
import { DeliveryStageEnum, OrderStatusEnum } from '@turon/shared';

export const CourierOrdersPage: React.FC = () => {
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    async function fetchOrders() {
      try {
        const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:3000';
        const response = await axios.get(`${apiUrl}/courier/orders`);
        setOrders(response.data);
      } catch (err: any) {
        setError(err.response?.data?.error || 'Buyurtmalarni yuklab bo’lmadi.');
      } finally {
        setLoading(false);
      }
    }

    fetchOrders();
  }, []);

  if (loading) return <div className="p-8 text-center text-gray-500">Buyurtmalar yuklanmoqda...</div>;
  if (error) return <div className="p-8 text-center text-red-500">{error}</div>;

  return (
    <div className="min-h-screen bg-gray-50 p-4 pb-20">
      <header className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-black text-gray-900">Mening Buyurtmalarim</h1>
          <p className="text-xs text-gray-500 font-medium">Hozirgi va yangi buyurtmalar</p>
        </div>
        <div className="bg-amber-100 text-amber-600 px-3 py-1 rounded-full text-xs font-bold">
          {orders.length} ta faol
        </div>
      </header>

      <div className="space-y-4">
        {orders.length === 0 ? (
          <div className="bg-white p-12 rounded-3xl text-center border-2 border-dashed border-gray-100 flex flex-col items-center">
            <Package size={48} className="text-gray-200 mb-4" />
            <p className="text-gray-400 font-medium">Hozircha buyurtmalar yo’q</p>
          </div>
        ) : (
          orders.map((order) => (
            <div 
              key={order.id}
              onClick={() => navigate(`/courier/map/${order.id}`)}
              className="bg-white p-5 rounded-3xl shadow-sm border border-gray-100 active:scale-98 transition-transform cursor-pointer"
            >
              <div className="flex justify-between items-start mb-4">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-amber-50 text-amber-600 rounded-2xl flex items-center justify-center">
                    <Package size={24} />
                  </div>
                  <div>
                    <h3 className="font-bold text-gray-900">#{order.orderNumber}</h3>
                    <div className="flex items-center gap-1 text-[10px] text-gray-400 font-bold uppercase tracking-wider">
                      <Clock size={10} />
                      {new Date(order.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </div>
                  </div>
                </div>
                <span className={`px-2 py-1 rounded-lg text-[10px] font-bold uppercase ${
                  order.deliveryStage === DeliveryStageEnum.PICKED_UP ? 'bg-green-100 text-green-600' : 'bg-blue-100 text-blue-600'
                }`}>
                  {order.deliveryStage}
                </span>
              </div>

              <div className="space-y-2 mb-4">
                <p className="text-xs text-gray-500 flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-red-400" />
                  Restoran: <span className="font-bold text-gray-700">Turon Kafesi</span>
                </p>
                <p className="text-xs text-gray-500 flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-blue-400" />
                  Mijoz: <span className="font-bold text-gray-700">{order.customerName}</span>
                </p>
              </div>

              <div className="pt-4 border-t border-gray-50 flex items-center justify-between">
                <div>
                  <p className="text-[10px] text-gray-400 font-bold uppercase mb-1">Manzil</p>
                  <p className="text-xs font-bold text-gray-800 truncate max-w-[180px]">{order.destinationAddress}</p>
                </div>
                <button 
                  className="bg-amber-500 text-white p-2 px-4 rounded-xl flex items-center gap-2 text-xs font-bold shadow-md shadow-amber-200"
                >
                  <MapIcon size={14} />
                  Xaritani ochish
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};
