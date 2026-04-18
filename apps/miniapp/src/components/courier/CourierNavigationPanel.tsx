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
      <svg viewBox="0 0 48 48" width="36" height="36" aria-hidden="true">
        <path d="M13 40 L13 22 Q13 10 25 10 L37 10" {...s} />
        <path d="M29 4 L37 10 L29 16" {...s} />
      </svg>
    );
  }

  if (action === 'left') {
    return (
      <svg viewBox="0 0 48 48" width="36" height="36" aria-hidden="true">
        <path d="M35 40 L35 22 Q35 10 23 10 L11 10" {...s} />
        <path d="M19 4 L11 10 L19 16" {...s} />
      </svg>
    );
  }

  return (
    <svg viewBox="0 0 48 48" width="36" height="36" aria-hidden="true">
      <path d="M24 40 L24 10" {...s} />
      <path d="M13 21 L24 10 L35 21" {...s} />
    </svg>
  );
}

const CourierNavigationPanel: React.FC<CourierNavigationPanelProps> = ({
  currentStep,
  allSteps = [],
}) => {
  if (!currentStep) return null;

  // Get next turn instruction
  const nextStep = allSteps.find(s => s.action && s.action !== 'straight');
  const nextTurnDistance = nextStep?.distanceText || 'Oxiriga qadar';
  
  // Direction descriptions in Uzbek
  const getDirectionLabel = (action?: string): string => {
    if (action === 'right') return "O'ngga";
    if (action === 'left') return "Chapga";
    return "To'g'ri";
  };

  return (
    <div className="flex flex-col gap-2">
      {/* Main direction indicator */}
      <div className="inline-flex items-center gap-2.5 rounded-[16px] bg-amber-400 px-3 py-2.5 shadow-2xl">
        <DirectionArrow action={currentStep.action} />
        <div className="flex flex-col">
          <span className="text-[11px] font-semibold leading-none text-amber-900">Keyingi qadamigacha</span>
          <span className="whitespace-nowrap text-[20px] font-black leading-none tracking-tight text-white">
            {currentStep.distanceText}
          </span>
        </div>
      </div>
      
      {/* Next turn instruction (if different from current) */}
      {nextStep && nextStep !== currentStep && (
        <div className="inline-flex items-center gap-2 rounded-[12px] bg-sky-500/20 border border-sky-400/30 px-3 py-2 text-[12px] font-semibold text-sky-200 backdrop-blur-sm">
          <span>{getDirectionLabel(nextStep.action)} burilish:</span>
          <span className="font-black text-sky-100">{nextTurnDistance}</span>
        </div>
      )}
    </div>
  );
};

export default CourierNavigationPanel;
