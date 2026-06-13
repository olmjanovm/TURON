'use client';

/**
 * 1D Kalman filter — har koordinata (lat va lng) uchun alohida ishlatiladi.
 * GPS jitter yo'qotadi: bino ichida sakrash, qisqa muddatli noise.
 *
 *  estimated = current best estimate
 *  errorEstimated = current uncertainty
 *  errorMeasurement = measurement uncertainty (GPS accuracy)
 *  q = process noise (qancha katta bo'lsa, filter shuncha tezroq adapt qiladi)
 */
export class KalmanFilter1D {
  private estimated: number = NaN;
  private errorEstimated: number = 1;
  private errorMeasurement: number = 5;
  private q: number = 3e-5;

  update(measurement: number, accuracyMeters?: number): number {
    if (Number.isNaN(this.estimated)) {
      this.estimated = measurement;
      return measurement;
    }
    if (typeof accuracyMeters === 'number' && accuracyMeters > 0) {
      this.errorMeasurement = Math.min(50, Math.max(2, accuracyMeters));
    }

    // Prediction (no motion model — estimate stays, uncertainty grows)
    this.errorEstimated += this.q;

    // Kalman gain
    const k = this.errorEstimated / (this.errorEstimated + this.errorMeasurement);

    // Update
    this.estimated = this.estimated + k * (measurement - this.estimated);
    this.errorEstimated = (1 - k) * this.errorEstimated;

    return this.estimated;
  }

  reset(initial?: number): void {
    this.estimated = initial ?? NaN;
    this.errorEstimated = 1;
  }
}

/**
 * 2D position smoother — lat va lng uchun ikkita 1D filter.
 * Output: smoothed [lat, lng]
 */
export class PositionSmoother {
  private latF = new KalmanFilter1D();
  private lngF = new KalmanFilter1D();

  smooth(lat: number, lng: number, accuracyMeters?: number): { lat: number; lng: number } {
    return {
      lat: this.latF.update(lat, accuracyMeters),
      lng: this.lngF.update(lng, accuracyMeters),
    };
  }

  reset(lat?: number, lng?: number): void {
    this.latF.reset(lat);
    this.lngF.reset(lng);
  }
}
