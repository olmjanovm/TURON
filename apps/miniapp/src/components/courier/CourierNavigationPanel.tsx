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

/**
 * Compact turn arrow with integrated distance indicator
 */
function DirectionArrow({ 
  action, 
  distance,
  isCompact = true 
}: { 
  action?: NavigationStep['action'];
  distance?: string;
  isCompact?: boolean;
}) {
  // Extract numeric distance
  const distanceNum = distance?.match(/\d+/)?.[0] || '';
  
  // Don't show if distance is 0 or very small
  if (distanceNum && parseInt(distanceNum) < 5) {
    return null;
  }

  const strokeStyle = {
    stroke: 'white',
    strokeWidth: isCompact ? 4 : 5.5,
    strokeLinecap: 'round' as const,
    strokeLinejoin: 'round' as const,
    fill: 'none',
  };

  const size = isCompact ? 28 : 36;

  if (action === 'right') {
    return (
      <div className="flex items-center gap-1">
        <svg viewBox="0 0 48 48" width={size} height={size} aria-hidden="true">
          <path d="M13 40 L13 22 Q13 10 25 10 L37 10" {...strokeStyle} />
          <path d="M29 4 L37 10 L29 16" {...strokeStyle} />
        </svg>
        {!isCompact && <span className="text-xs font-bold text-white">O'NG</span>}
      </div>
    );
  }

  if (action === 'left') {
    return (
      <div className="flex items-center gap-1">
        <svg viewBox="0 0 48 48" width={size} height={size} aria-hidden="true">
          <path d="M35 40 L35 22 Q35 10 23 10 L11 10" {...strokeStyle} />
          <path d="M19 4 L11 10 L19 16" {...strokeStyle} />
        </svg>
        {!isCompact && <span className="text-xs font-bold text-white">CHAP</span>}
      </div>
    );
  }

  // Straight/Continue
  return (
    <div className="flex items-center gap-1">
      <svg viewBox="0 0 48 48" width={size} height={size} aria-hidden="true">
        <path d="M24 40 L24 10" {...strokeStyle} />
        <path d="M13 21 L24 10 L35 21" {...strokeStyle} />
      </svg>
    </div>
  );
}

const CourierNavigationPanel: React.FC<CourierNavigationPanelProps> = ({
  currentStep,
  allSteps = [],
}) => {
  if (!currentStep) return null;

  // Extract numeric distance
  const distanceNum = currentStep.distanceText?.match(/\d+/)?.[0] || '';
  const shouldShowNavigation = !distanceNum || parseInt(distanceNum) >= 5;

  // Get next turn instruction
  const nextStep = allSteps.find(s => s.action && s.action !== 'straight');
  const nextTurnDistance = nextStep?.distanceText || '';
  
  // Direction descriptions in Uzbek
  const getDirectionLabel = (action?: string): string => {
    if (action === 'right') return "O'NG";
    if (action === 'left') return "CHAP";
    return "TO'G'RI";
  };

  // Parse next distance
  const nextDistanceNum = nextTurnDistance?.match(/\d+/)?.[0] || '';
  const shouldShowNextTurn = nextStep && parseInt(nextDistanceNum || '0') >= 5;

  if (!shouldShowNavigation) {
    return null; // Hide when destination reached
  }

  return (
    <div className="flex flex-col gap-1.5 w-fit">
      {/* Main direction indicator - COMPACT */}
      <div className="inline-flex items-center gap-1.5 rounded-full bg-gradient-to-r from-amber-400 to-amber-500 px-2.5 py-1.5 shadow-lg">
        <DirectionArrow action={currentStep.action} distance={currentStep.distanceText} isCompact={true} />
        <div className="flex items-baseline gap-1">
          <span className="text-xs font-bold text-amber-900 leading-none">{currentStep.distanceText}</span>
          <span className="text-xs font-semibold text-amber-800 leading-none">{getDirectionLabel(currentStep.action)}</span>
        </div>
      </div>
      
      {/* Next turn instruction - only if valid and far enough */}
      {shouldShowNextTurn && (
        <div className="inline-flex items-center gap-1.5 rounded-full bg-sky-500/90 px-2.5 py-1.5 text-xs font-semibold text-sky-50 shadow-lg">
          <DirectionArrow action={nextStep!.action} distance={nextTurnDistance} isCompact={true} />
          <span className="font-bold">{nextTurnDistance}</span>
          <span className="opacity-80">{getDirectionLabel(nextStep!.action)}</span>
        </div>
      )}
    </div>
  );
};

export default CourierNavigationPanel;
