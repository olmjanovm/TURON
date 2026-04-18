// filepath: apps/miniapp/src/features/courier/batteryOptimization.ts
/**
 * Battery Optimization System
 * Adaptively adjusts location tracking frequency based on battery level and movement
 */

export interface BatteryStatus {
  level: number; // 0-100
  isCharging: boolean;
  temperature?: number;
}

export interface LocationUpdateConfig {
  intervalMs: number; // Update frequency
  enableHighAccuracy: boolean; // GPS accuracy mode
  enableBackgroundTracking: boolean;
  timeout: number;
  maxAge: number;
}

export class BatteryOptimizedTracking {
  private batteryLevel = 100;
  private isCharging = false;
  private lastUpdateTime = 0;
  private consecutiveStationaryUpdates = 0;
  private isMoving = false;
  private lastPosition: { lat: number; lng: number } | null = null;

  constructor() {
    this.initBatteryListener();
  }

  /**
   * Initialize battery monitoring
   */
  private initBatteryListener() {
    if ('getBattery' in navigator) {
      (navigator as any).getBattery().then((battery: any) => {
        battery.addEventListener('levelchange', () => {
          this.batteryLevel = battery.level * 100;
        });
        battery.addEventListener('chargingchange', () => {
          this.isCharging = battery.charging;
        });
      });
    }
  }

  /**
   * Get adaptive location update config based on battery and movement
   */
  getOptimalConfig(): LocationUpdateConfig {
    const baseConfig: LocationUpdateConfig = {
      intervalMs: 2000,
      enableHighAccuracy: true,
      enableBackgroundTracking: true,
      timeout: 10000,
      maxAge: 0,
    };

    // If charging or battery high, use aggressive tracking
    if (this.isCharging || this.batteryLevel > 80) {
      return {
        ...baseConfig,
        intervalMs: 1000, // Update every second for best accuracy
        enableHighAccuracy: true,
      };
    }

    // Battery between 40-80%, moderate tracking
    if (this.batteryLevel > 40) {
      return {
        ...baseConfig,
        intervalMs: 3000, // Update every 3 seconds
        enableHighAccuracy: true,
      };
    }

    // Battery between 20-40%, power saving
    if (this.batteryLevel > 20) {
      return {
        ...baseConfig,
        intervalMs: 5000, // Update every 5 seconds
        enableHighAccuracy: false,
        timeout: 15000,
        maxAge: 5000,
      };
    }

    // Battery < 20%, extreme power saving
    return {
      ...baseConfig,
      intervalMs: 10000, // Update every 10 seconds
      enableHighAccuracy: false,
      enableBackgroundTracking: false,
      timeout: 30000,
      maxAge: 10000,
    };
  }

  /**
   * Detect if courier is moving based on distance
   */
  updateMovementStatus(lat: number, lng: number): boolean {
    if (!this.lastPosition) {
      this.lastPosition = { lat, lng };
      return false;
    }

    // Calculate distance moved (rough estimation)
    const latDiff = Math.abs(lat - this.lastPosition.lat);
    const lngDiff = Math.abs(lng - this.lastPosition.lng);
    const distanceApprox = Math.sqrt(latDiff * latDiff + lngDiff * lngDiff);

    // If moved more than 0.0001 degrees (~10 meters), consider moving
    const isMoving = distanceApprox > 0.0001;

    if (!isMoving) {
      this.consecutiveStationaryUpdates++;
    } else {
      this.consecutiveStationaryUpdates = 0;
    }

    this.isMoving = isMoving;
    this.lastPosition = { lat, lng };

    return isMoving;
  }

  /**
   * Check if we should skip this update (when stationary with low battery)
   */
  shouldSkipUpdate(): boolean {
    // If moving, never skip
    if (this.isMoving) {
      return false;
    }

    // If battery low and stationary for multiple updates, skip some
    if (this.batteryLevel < 20 && this.consecutiveStationaryUpdates > 2) {
      return Math.random() < 0.5; // Skip 50% of updates when low battery + stationary
    }

    return false;
  }

  /**
   * Get battery status for UI display
   */
  getBatteryStatus(): BatteryStatus {
    return {
      level: this.batteryLevel,
      isCharging: this.isCharging,
    };
  }

  /**
   * Get battery warning message
   */
  getBatteryWarning(): string | null {
    if (this.isCharging) {
      return null; // No warning
    }

    if (this.batteryLevel > 40) {
      return null; // OK
    }

    if (this.batteryLevel > 20) {
      return `🔋 Batareya: ${Math.round(this.batteryLevel)}% - Power saving mode aktiv`;
    }

    return `⚠️ Batareya: ${Math.round(this.batteryLevel)}% - KRITIK! Zaryadka qilishni tavsiya etiladi`;
  }

  /**
   * Estimate battery life remaining
   */
  estimateBatteryLifeMinutes(updateIntervalMs: number = 2000): number {
    // Rough estimate: 1% battery = ~3 minutes at 2s update interval
    const batteryPercentage = this.batteryLevel;
    const updateMultiplier = updateIntervalMs / 2000; // Normalize to 2s intervals
    
    // Charging = infinite life
    if (this.isCharging) {
      return Infinity;
    }

    return Math.round(batteryPercentage * 3 * updateMultiplier);
  }
}

/**
 * Hook for React - Battery optimized tracking
 */
export function useBatteryOptimization() {
  const optimizer = new BatteryOptimizedTracking();

  return {
    getOptimalConfig: () => optimizer.getOptimalConfig(),
    updateMovement: (lat: number, lng: number) => optimizer.updateMovementStatus(lat, lng),
    shouldSkipUpdate: () => optimizer.shouldSkipUpdate(),
    getBatteryStatus: () => optimizer.getBatteryStatus(),
    getBatteryWarning: () => optimizer.getBatteryWarning(),
    estimateBatteryLife: (interval?: number) => optimizer.estimateBatteryLifeMinutes(interval),
  };
}
