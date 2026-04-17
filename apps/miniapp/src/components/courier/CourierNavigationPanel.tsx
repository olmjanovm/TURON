import React from 'react';
import type { RouteStep } from '../../features/maps/MapProvider';

export interface RouteAlternative {
  id: string;
  instruction: string;
  distance: string;
  eta: string;
  isRecommended?: boolean;
  routeIndex: number;
}

export type NavigationStep = RouteStep;

interface CourierNavigationPanelProps {
  routes?: RouteAlternative[];
  selectedRouteId?: string;
  onSelectRoute?: (routeId: string) => void;
  currentStep?: NavigationStep | null;
  allSteps?: NavigationStep[];
  currentStepIndex?: number;
  distance?: string;
  eta?: string;
}

// ── Direction arrow SVGs (Yandex Maps style thick strokes) ────────────────────
function DirectionArrow({ action }: { action?: NavigationStep['action'] }) {
  const s = {
    stroke: 'white',
    strokeWidth: 5.5,
    strokeLinecap: 'round' as const,
    strokeLinejoin: 'round' as const,
    fill: 'none',
  };

  if (action === 'right') {
    return (
      <svg viewBox="0 0 48 48" width="50" height="50" aria-hidden="true">
        <path d="M13 40 L13 22 Q13 10 25 10 L37 10" {...s} />
        <path d="M29 4 L37 10 L29 16" {...s} />
      </svg>
    );
  }

  if (action === 'left') {
    return (
      <svg viewBox="0 0 48 48" width="50" height="50" aria-hidden="true">
        <path d="M35 40 L35 22 Q35 10 23 10 L11 10" {...s} />
        <path d="M19 4 L11 10 L19 16" {...s} />
      </svg>
    );
  }

  return (
    <svg viewBox="0 0 48 48" width="50" height="50" aria-hidden="true">
      <path d="M24 40 L24 10" {...s} />
      <path d="M13 21 L24 10 L35 21" {...s} />
    </svg>
  );
}

// ── Component ─────────────────────────────────────────────────────────────────
const CourierNavigationPanel: React.FC<CourierNavigationPanelProps> = ({
  currentStep,
}) => {
  if (!currentStep) return null;

  const label = currentStep.street || currentStep.instruction || null;

  return (
    <div className="flex items-center gap-3 rounded-[22px] bg-[#1B2341] px-4 py-3 shadow-2xl">
      <div className="flex-shrink-0">
        <DirectionArrow action={currentStep.action} />
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-[26px] font-black leading-none tracking-tight text-white">
          {currentStep.distanceText}
        </p>
        {label ? (
          <p className="mt-1 truncate text-[13px] font-medium leading-snug text-slate-300">
            {label}
          </p>
        ) : null}
      </div>
    </div>
  );
};

export default CourierNavigationPanel;
