function matchesMedia(query: string) {
  if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') {
    return false;
  }

  return window.matchMedia(query).matches;
}

export function isCoarsePointerDevice() {
  return matchesMedia('(pointer: coarse)') || matchesMedia('(max-width: 768px)');
}

export function shouldReduceMapMotion() {
  return matchesMedia('(prefers-reduced-motion: reduce)') || isCoarsePointerDevice();
}

export function getMapAnimationDuration(defaultDuration = 200) {
  return shouldReduceMapMotion() ? 0 : defaultDuration;
}

export function getMapZoomMargin(defaultMargin = 80) {
  return isCoarsePointerDevice() ? Math.max(36, Math.round(defaultMargin * 0.7)) : defaultMargin;
}

export function getRouteSyncDelay() {
  return isCoarsePointerDevice() ? 120 : 0;
}
