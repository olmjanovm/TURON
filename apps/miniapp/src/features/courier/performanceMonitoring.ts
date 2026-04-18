// filepath: apps/miniapp/src/features/courier/performanceMonitoring.ts
/**
 * Production Performance Monitoring & Analytics
 * Tracks metrics for production debugging and optimization
 */

export interface PerformanceMetric {
  name: string;
  value: number;
  timestamp: number;
  tags?: Record<string, string>;
}

export interface CourierMetrics {
  gpsUpdateLatency: number[]; // milliseconds
  locationAccuracy: number[]; // meters
  batteryConsumption: number[]; // % per hour
  networkErrors: number;
  syncFailures: number;
  mapLoadTime: number;
  routeCalculationTime: number;
}

class PerformanceMonitor {
  private metrics: PerformanceMetric[] = [];
  private courierMetrics: CourierMetrics = {
    gpsUpdateLatency: [],
    locationAccuracy: [],
    batteryConsumption: [],
    networkErrors: 0,
    syncFailures: 0,
    mapLoadTime: 0,
    routeCalculationTime: 0,
  };

  /**
   * Record a performance metric
   */
  recordMetric(name: string, value: number, tags?: Record<string, string>) {
    const metric: PerformanceMetric = {
      name,
      value,
      timestamp: Date.now(),
      tags,
    };

    this.metrics.push(metric);

    // Keep only last 1000 metrics in memory
    if (this.metrics.length > 1000) {
      this.metrics = this.metrics.slice(-1000);
    }

    // Send to backend if critical
    if (value > 5000) { // If any metric > 5 seconds
      this.reportCriticalMetric(metric);
    }
  }

  /**
   * Record GPS update latency
   */
  recordGpsUpdateLatency(latencyMs: number) {
    this.courierMetrics.gpsUpdateLatency.push(latencyMs);
    if (this.courierMetrics.gpsUpdateLatency.length > 100) {
      this.courierMetrics.gpsUpdateLatency = this.courierMetrics.gpsUpdateLatency.slice(-100);
    }

    this.recordMetric('gps_update_latency', latencyMs);
  }

  /**
   * Record location accuracy
   */
  recordLocationAccuracy(accuracyMeters: number) {
    this.courierMetrics.locationAccuracy.push(accuracyMeters);
    if (this.courierMetrics.locationAccuracy.length > 100) {
      this.courierMetrics.locationAccuracy = this.courierMetrics.locationAccuracy.slice(-100);
    }

    this.recordMetric('location_accuracy', accuracyMeters);
  }

  /**
   * Record network error
   */
  recordNetworkError(errorType: string) {
    this.courierMetrics.networkErrors++;
    this.recordMetric('network_error', 1, { type: errorType });
  }

  /**
   * Record sync failure
   */
  recordSyncFailure(reason: string) {
    this.courierMetrics.syncFailures++;
    this.recordMetric('sync_failure', 1, { reason });
  }

  /**
   * Record map load time
   */
  recordMapLoadTime(timeMs: number) {
    this.courierMetrics.mapLoadTime = timeMs;
    this.recordMetric('map_load_time', timeMs);
  }

  /**
   * Record route calculation time
   */
  recordRouteCalculationTime(timeMs: number) {
    this.courierMetrics.routeCalculationTime = timeMs;
    this.recordMetric('route_calculation_time', timeMs);
  }

  /**
   * Get courier performance summary
   */
  getSummary() {
    const avgLatency =
      this.courierMetrics.gpsUpdateLatency.length > 0
        ? this.courierMetrics.gpsUpdateLatency.reduce((a, b) => a + b, 0) /
          this.courierMetrics.gpsUpdateLatency.length
        : 0;

    const avgAccuracy =
      this.courierMetrics.locationAccuracy.length > 0
        ? this.courierMetrics.locationAccuracy.reduce((a, b) => a + b, 0) /
          this.courierMetrics.locationAccuracy.length
        : 0;

    return {
      avgGpsLatency: Math.round(avgLatency),
      avgLocationAccuracy: Math.round(avgAccuracy),
      networkErrorCount: this.courierMetrics.networkErrors,
      syncFailureCount: this.courierMetrics.syncFailures,
      mapLoadTime: this.courierMetrics.mapLoadTime,
      routeCalcTime: this.courierMetrics.routeCalculationTime,
      healthScore: this.calculateHealthScore(),
    };
  }

  /**
   * Calculate overall health score (0-100)
   */
  private calculateHealthScore(): number {
    let score = 100;

    // Deduct for latency
    const avgLatency =
      this.courierMetrics.gpsUpdateLatency.length > 0
        ? this.courierMetrics.gpsUpdateLatency.reduce((a, b) => a + b, 0) /
          this.courierMetrics.gpsUpdateLatency.length
        : 0;
    if (avgLatency > 5000) score -= 30; // >5s is bad
    else if (avgLatency > 2000) score -= 15;

    // Deduct for accuracy
    const avgAccuracy =
      this.courierMetrics.locationAccuracy.length > 0
        ? this.courierMetrics.locationAccuracy.reduce((a, b) => a + b, 0) /
          this.courierMetrics.locationAccuracy.length
        : 0;
    if (avgAccuracy > 100) score -= 20; // >100m is bad
    else if (avgAccuracy > 50) score -= 10;

    // Deduct for errors
    score -= Math.min(this.courierMetrics.networkErrors * 2, 20);
    score -= Math.min(this.courierMetrics.syncFailures * 3, 25);

    return Math.max(0, Math.min(100, score));
  }

  /**
   * Report critical metric to backend
   */
  private reportCriticalMetric(metric: PerformanceMetric) {
    // Would integrate with error tracking service (Sentry, etc)
    console.warn('🚨 Critical metric:', metric);

    // Example: Send to backend logging
    // api.post('/metrics/critical', { metric }).catch(() => {});
  }

  /**
   * Export metrics for analysis
   */
  exportMetrics() {
    return {
      allMetrics: this.metrics,
      summary: this.getSummary(),
      timestamp: new Date().toISOString(),
    };
  }

  /**
   * Clear old metrics
   */
  clearOldMetrics(olderThanMs: number = 3600000) {
    const cutoffTime = Date.now() - olderThanMs;
    this.metrics = this.metrics.filter((m) => m.timestamp > cutoffTime);
  }
}

// Global instance
export const performanceMonitor = new PerformanceMonitor();

/**
 * React hook for performance monitoring
 */
export function usePerformanceMonitoring() {
  React.useEffect(() => {
    // Report health score periodically
    const interval = setInterval(() => {
      const summary = performanceMonitor.getSummary();
      if (summary.healthScore < 50) {
        console.warn('⚠️ System health degraded:', summary);
      }
    }, 60000); // Every minute

    return () => clearInterval(interval);
  }, []);

  return {
    recordGpsLatency: (ms: number) => performanceMonitor.recordGpsUpdateLatency(ms),
    recordAccuracy: (meters: number) => performanceMonitor.recordLocationAccuracy(meters),
    recordError: (type: string) => performanceMonitor.recordNetworkError(type),
    recordSyncFailure: (reason: string) => performanceMonitor.recordSyncFailure(reason),
    getSummary: () => performanceMonitor.getSummary(),
    exportMetrics: () => performanceMonitor.exportMetrics(),
  };
}

import React from 'react';
