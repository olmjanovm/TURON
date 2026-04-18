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
 * Smart direction arrow with color coding
 * Blue=Straight, Orange=Left, Green=Right
 */
function DirectionArrow({ 
  action, 
  distance
}: { 
  action?: NavigationStep['action'];
  distance?: string;
}) {
  // Extract numeric distance
  const distanceNum = distance?.match(/\d+/)?.[0] || '';
  
  // Don't show if distance is 0 or very small
  if (distanceNum && parseInt(distanceNum) < 5) {
    return null;
  }

  // Color coding: Blue (straight), Orange (left), Green (right)
  const colors = {
    straight: '#3B82F6', // Blue
    left: '#F97316',     // Orange
    right: '#10B981',    // Green
  };

  const color = action === 'right' ? colors.right : action === 'left' ? colors.left : colors.straight;

  const strokeStyle = {
    stroke: color,
    strokeWidth: 4,
    strokeLinecap: 'round' as const,
    strokeLinejoin: 'round' as const,
    fill: 'none',
  };

  if (action === 'right') {
    return (
      <svg viewBox="0 0 48 48" width="28" height="28" aria-hidden="true">
        <path d="M13 40 L13 22 Q13 10 25 10 L37 10" {...strokeStyle} />
        <path d="M29 4 L37 10 L29 16" {...strokeStyle} />
      </svg>
    );
  }

  if (action === 'left') {
    return (
      <svg viewBox="0 0 48 48" width="28" height="28" aria-hidden="true">
        <path d="M35 40 L35 22 Q35 10 23 10 L11 10" {...strokeStyle} />
        <path d="M19 4 L11 10 L19 16" {...strokeStyle} />
      </svg>
    );
  }

  // Straight - simple up arrow
  return (
    <svg viewBox="0 0 48 48" width="28" height="28" aria-hidden="true">
      <path d="M24 40 L24 10" {...strokeStyle} />
      <path d="M13 21 L24 10 L35 21" {...strokeStyle} />
    </svg>
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

  // Parse next distance
  const nextDistanceNum = nextTurnDistance?.match(/\d+/)?.[0] || '';
  const shouldShowNextTurn = nextStep && parseInt(nextDistanceNum || '0') >= 5;

  if (!shouldShowNavigation) {
    return null; // Hide when destination reached
  }

  return (
    <div className="flex flex-col gap-1.5 w-fit">
      {/* Main direction indicator - just arrow + distance */}
      <div className="inline-flex items-center gap-1.5 rounded-full bg-gradient-to-r from-amber-400 to-amber-500 px-2.5 py-1.5 shadow-lg">
        <DirectionArrow action={currentStep.action} distance={currentStep.distanceText} />
        <span className="text-sm font-black text-white">{currentStep.distanceText}</span>
      </div>
      
      {/* Next turn instruction - only if valid and far enough */}
      {shouldShowNextTurn && (
        <div className="inline-flex items-center gap-1.5 rounded-full bg-sky-500/90 px-2.5 py-1.5 shadow-lg">
          <DirectionArrow action={nextStep!.action} distance={nextTurnDistance} />
          <span className="text-sm font-bold text-sky-50">{nextTurnDistance}</span>
        </div>
      )}
    </div>
  );
};

export default CourierNavigationPanel;
