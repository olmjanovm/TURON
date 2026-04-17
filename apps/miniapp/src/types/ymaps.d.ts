/**
 * Yandex Maps API v2.1 Type Definitions
 * Generated for TURON Courier Tracking System
 */

declare global {
  namespace NodeJS {
    interface Timeout {}
  }

  namespace ymaps {
    interface ILatLng {
      lat(): number;
      lng(): number;
    }

    interface IPoint extends ILatLng {}

    interface IBounds {
      contains(point: [number, number]): boolean;
      getCenter(): [number, number];
      getNorthEast(): [number, number];
      getSouthWest(): [number, number];
    }

    type IMapState = {
      center?: [number, number];
      zoom?: number;
      type?: string;
      bounds?: IBounds;
      controls?: any[];
      behaviors?: string[];
    };

    interface IMapOptions {
      center?: [number, number];
      zoom?: number;
      controls?: string[];
      behaviors?: string[];
      type?: string;
    }

    interface IMapEvents {
      add(name: string, handler: (e: any) => void): IMapEvents;
      remove(name: string, handler: (e: any) => void): IMapEvents;
    }

    interface ICollection {
      add(item: any): ICollection;
      remove(item: any): ICollection;
      removeAll(): ICollection;
      each(callback: (item: any, index: number) => void): void;
    }

    interface IPlacemarkOptions {
      iconImageHref?: string;
      iconImageSize?: [number, number];
      iconImageOffset?: [number, number];
      preset?: string;
      openEmptyCenterOnClick?: boolean;
      iconColor?: string;
      zIndex?: number;
    }

    interface IGeoObject {
      geometry: any;
      properties: any;
      events: any;
      getBounds(): IBounds;
      setMap(map: Map | null): void;
    }

    class Placemark {
      constructor(geometry: [number, number], properties?: any, options?: IPlacemarkOptions);
      geometry: any;
      properties: any;
      events: any;
      setMap(map: Map | null): void;
      getMap(): Map | null;
      getBounds(): IBounds;
    }

    class Polyline {
      constructor(geometry: Array<[number, number]>, properties?: any, options?: any);
      geometry: any;
      properties: any;
      events: any;
      setMap(map: Map | null): void;
      getMap(): Map | null;
      getBounds(): IBounds;
    }

    class Polygon {
      constructor(geometry: Array<Array<[number, number]>>, properties?: any, options?: any);
      geometry: any;
      properties: any;
      events: any;
      setMap(map: Map | null): void;
      getMap(): Map | null;
      getBounds(): IBounds;
    }

    class GeoObjectCollection implements ICollection {
      add(item: any): GeoObjectCollection;
      remove(item: any): GeoObjectCollection;
      removeAll(): GeoObjectCollection;
      each(callback: (item: any, index: number) => void): void;
      setMap(map: Map | null): void;
      getBounds(): IBounds;
    }

    interface IMapContainer {
      appendChild(element: HTMLElement): void;
      removeChild(element: HTMLElement): void;
    }

    class Map {
      constructor(container: HTMLElement | string, state?: IMapState, options?: IMapOptions);
      panTo(center: [number, number], options?: { flying?: boolean; duration?: number }): Promise<void>;
      setCenter(center: [number, number], zoom?: number, options?: any): Promise<void>;
      getCenter(): [number, number];
      setZoom(zoom: number, options?: any): Promise<void>;
      getZoom(): number;
      setBounds(bounds: IBounds | [[number, number], [number, number]], options?: any): Promise<void>;
      getBounds(): IBounds;
      setType(type: string): void;
      getType(): string;
      geoObjects: GeoObjectCollection;
      container: IMapContainer;
      events: IMapEvents;
      controls: control.IControlGroup;
      behaviors: any;
      destroy(): void;
    }

    namespace control {
      interface IControlGroup {
        add(control: any, options?: any): IControlGroup;
        remove(control: any): IControlGroup;
      }

      class ZoomControl {
        constructor(options?: any);
      }

      class SearchControl {
        constructor(options?: any);
      }

      class TrafficControl {
        constructor(options?: any);
      }

      class TypeSelector {
        constructor(options?: any);
      }

      class FullscreenControl {
        constructor(options?: any);
      }

      class GeolocationControl {
        constructor(options?: any);
      }
    }

    namespace multiRouter {
      interface IMultiRouteOptions {
        routeMode?: 'auto' | 'masstransit' | 'pedestrian';
        avoidTrafficJams?: boolean;
        routeActiveStrokeColor?: string;
        routeActiveStrokeWidth?: number;
        routeStrokeColor?: string;
        routeStrokeWidth?: number;
        routeActiveOpacity?: number;
        boundsAutoApply?: boolean;
        routeOpacity?: number;
      }

      interface IRouteModel {
        setReferencePoints(points: Array<[number, number] | { position: [number, number] }>): void;
        getReferencePoints(): any[];
        events: any;
      }

      interface IRoute {
        getHumanJittering(): number;
        getHumanReadableDistance(): string;
        getHumanReadableDuration(): string;
        getDistance(): { text: string; value: number };
        getDuration(): { text: string; value: number };
        getWayPoints(): any[];
        getPaths(): any[];
        properties?: any;
      }

      class MultiRoute {
        constructor(referencePoints?: any, params?: any, options?: IMultiRouteOptions);
        model: IRouteModel;
        getRoutes(): IRoute[];
        getWayPoints(): any[];
        getActiveRoute(): IRoute;
        setMap(map: Map | null): void;
        events: any;
        getBounds(): IBounds;
      }
    }

    namespace geocode {
      interface IGeocodeOptions {
        results?: number;
        skip?: number;
        boundedBy?: IBounds;
        strictBounds?: boolean;
        json?: boolean;
      }

      function geocode(request: string, options?: IGeocodeOptions): Promise<any>;
    }

    interface IEvent {
      get(name: string): any;
      originalEvent?: {
        clientX: number;
        clientY: number;
      };
    }

    namespace util {
      function bounds(items: any[]): IBounds;
      function getRegion(region: string): Promise<any>;
    }

    namespace geoQuery {
      function within(boundedBy: IBounds): any;
      function offset([offsetLat, offsetLng]: [number, number]): any;
      function within(circle: any): any;
    }

    function ready(callback: () => void): void;
    function load(modules: string[], onLoad: (...args: any[]) => void, onError?: (err: Error) => void): void;
  }
}

export {};

