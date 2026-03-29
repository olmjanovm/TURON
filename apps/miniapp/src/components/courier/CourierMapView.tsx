import React, { useEffect, useRef } from 'react';

interface Location {
  lat: number;
  lng: number;
}

interface CourierMapViewProps {
  pickup: Location;
  destination: Location;
  courierPos?: Location;
  apiKey?: string;
  onMapReady?: (map: any) => void;
}

export const CourierMapView: React.FC<CourierMapViewProps> = ({
  pickup,
  destination,
  courierPos,
  apiKey,
  onMapReady
}) => {
  const mapContainer = useRef<HTMLDivElement>(null);
  const mapInstance = useRef<any>(null);

  useEffect(() => {
    // Load Yandex Maps script if not already present
    const scriptId = 'yandex-maps-script';
    if (!document.getElementById(scriptId)) {
      const script = document.createElement('script');
      script.id = scriptId;
      script.src = `https://api-maps.yandex.ru/2.1/?apikey=${apiKey}&lang=uz_UZ`;
      script.type = 'text/javascript';
      script.onload = initMap;
      document.head.appendChild(script);
    } else if (window.ymaps) {
      window.ymaps.ready(initMap);
    }

    function initMap() {
      if (!mapContainer.current || !window.ymaps) return;

      window.ymaps.ready(() => {
        if (!mapInstance.current) {
          mapInstance.current = new window.ymaps.Map(mapContainer.current, {
            center: [pickup.lat, pickup.lng],
            zoom: 13,
            controls: ['zoomControl', 'fullscreenControl']
          });

          // Add Pickup Marker (Restaurant)
          const pickupPlacemark = new window.ymaps.Placemark([pickup.lat, pickup.lng], {
            balloonContent: 'Restoran (Olish manzili)',
            hintContent: 'Restoran'
          }, {
            preset: 'islands#redFoodIcon'
          });

          // Add Destination Marker (Customer)
          const destPlacemark = new window.ymaps.Placemark([destination.lat, destination.lng], {
            balloonContent: 'Mijoz (Yetkazish manzili)',
            hintContent: 'Mijoz'
          }, {
            preset: 'islands#blueHomeIcon'
          });

          mapInstance.current.geoObjects.add(pickupPlacemark);
          mapInstance.current.geoObjects.add(destPlacemark);

          // Center map to show both points
          mapInstance.current.setBounds(mapInstance.current.geoObjects.getBounds(), {
            checkZoomRange: true,
            zoomMargin: 50
          });

          if (onMapReady) onMapReady(mapInstance.current);
        }
      });
    }

    return () => {
      if (mapInstance.current) {
        // Cleanup if necessary
      }
    };
  }, [apiKey, pickup, destination, onMapReady]);

  // Update courier position marker
  useEffect(() => {
    if (mapInstance.current && courierPos && window.ymaps) {
      // Remove old courier marker if exists
      const oldCourier = mapInstance.current.geoObjects.get(2); // Simple index check or use a ref
      if (oldCourier) mapInstance.current.geoObjects.remove(oldCourier);

      const courierPlacemark = new window.ymaps.Placemark([courierPos.lat, courierPos.lng], {
        hintContent: 'Sizning joylashuvingiz'
      }, {
        preset: 'islands#geolocationIcon'
      });
      
      mapInstance.current.geoObjects.add(courierPlacemark);
    }
  }, [courierPos]);

  return (
    <div className="relative w-full h-[60vh] rounded-2xl overflow-hidden shadow-inner bg-gray-100">
      <div ref={mapContainer} className="w-full h-full" />
      
      {/* Map Overlay info (Yandex Style) */}
      <div className="absolute top-4 left-4 right-4 flex justify-between pointer-events-none">
        <div className="bg-white/90 backdrop-blur pb-2 pt-2 px-4 rounded-xl shadow-lg pointer-events-auto border border-white/20">
          <p className="text-[10px] text-gray-500 uppercase font-bold tracking-wider">Hozirgi Holat</p>
          <p className="text-sm font-bold text-amber-600">Yo'nalishda</p>
        </div>
      </div>
    </div>
  );
};

declare global {
  interface Window {
    ymaps: any;
  }
}
