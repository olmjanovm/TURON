import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { CourierMapView } from '../../components/courier/CourierMapView';
import { CourierOrderActionBar } from '../../components/courier/CourierOrderActionBar';
import { RouteInfoCard, DeliveryStageCard } from '../../components/courier/DeliveryInfoCards';
import { DeliveryStageEnum } from '@turon/shared';
import axios from 'axios';

export const CourierMapPage: React.FC = () => {
  const { orderId } = useParams<{ orderId: string }>();
  const navigate = useNavigate();
  
  // State for order details (Mocked for now, will connect to API)
  const [order, setOrder] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [courierPos, setCourierPos] = useState({ lat: 41.311081, lng: 69.240562 }); // Default to restaurant

  useEffect(() => {
    async function fetchOrderDetail() {
      try {
        const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:3000';
        const response = await axios.get(`${apiUrl}/courier/order/${orderId}`);
        setOrder(response.data);
      } catch (err: any) {
        setError(err.response?.data?.error || 'Buyurtma ma’lumotlarini yuklab bo’lmadi.');
      } finally {
        setLoading(false);
      }
    }

    fetchOrderDetail();

    // Track courier position
    const watchId = navigator.geolocation.watchPosition(
      (pos) => {
        setCourierPos({ lat: pos.coords.latitude, lng: pos.coords.longitude });
      },
      (err) => console.error('Geolocation error:', err),
      { enableHighAccuracy: true }
    );

    return () => navigator.geolocation.clearWatch(watchId);
  }, [orderId]);

  const handleStageChange = async (nextStage: DeliveryStageEnum) => {
    if (!order) return;
    
    try {
      const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:3000';
      await axios.patch(`${apiUrl}/courier/order/${orderId}/stage`, { stage: nextStage });
      
      // Update local state or re-fetch
      setOrder({ ...order, deliveryStage: nextStage });
      
      if (nextStage === DeliveryStageEnum.DELIVERED) {
        alert('Tashakkur! Buyurtma muvaffaqiyatli yetkazildi.');
        navigate('/courier/orders');
      }
    } catch (err: any) {
      alert(err.response?.data?.error || 'Xatolik yuz berdi. Qaytadan urinib ko’ring.');
    }
  };

  if (loading) return <div className="p-8 text-center">Yuklanmoqda...</div>;
  if (error || !order) return <div className="p-8 text-center text-red-500">{error || 'Buyurtma topilmadi.'}</div>;

  return (
    <div className="h-screen bg-gray-50 flex flex-col overflow-hidden">
      {/* Map Section */}
      <div className="flex-1 relative">
        <CourierMapView
          pickup={{ lat: Number(order.pickupLat), lng: Number(order.pickupLng) }}
          destination={{ lat: Number(order.destinationLat), lng: Number(order.destinationLng) }}
          courierPos={courierPos}
          apiKey={import.meta.env.VITE_YANDEX_MAPS_KEY}
        />
        
        {/* Info Overlays */}
        <div className="absolute top-4 left-4 right-4 z-10">
          <RouteInfoCard 
            distanceKm={order.distanceKm || 2.4} 
            estimatedMinutes={order.estimatedMinutes || 12} 
          />
          <DeliveryStageCard stage={order.deliveryStage} />
        </div>
      </div>

      {/* Bottom Action Panel */}
      <CourierOrderActionBar
        stage={order.deliveryStage}
        customerName={order.customerName}
        phoneNumber={order.customerPhone}
        address={order.destinationAddress}
        orderTotal={Number(order.totalAmount)}
        paymentMethod={order.paymentMethod}
        onStageChange={handleStageChange}
      />
    </div>
  );
};
