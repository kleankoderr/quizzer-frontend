import React, { useState, useCallback, useMemo, type ReactNode } from 'react';
import Joyride, {
  type CallBackProps,
  STATUS,
  ACTIONS,
  EVENTS,
} from 'react-joyride';
import { useQueryClient } from '@tanstack/react-query';
import { TourContext } from './TourContext';
import { TourTooltip } from '../components/TourTooltip';
import { getTour } from '../config/tours.config';
import { type TourState, type TourConfig } from '../types/tour';

export const TourProvider: React.FC<{ children: ReactNode }> = ({
  children,
}) => {
  const queryClient = useQueryClient();
  const [state, setState] = useState<TourState>({
    run: false,
    activeTourId: null,
    stepIndex: 0,
  });
  const [activeConfig, setActiveConfig] = useState<TourConfig | null>(null);

  const startTour = useCallback((idOrConfig: string | TourConfig) => {
    let tour: TourConfig | undefined;
    if (typeof idOrConfig === 'string') {
      tour = getTour(idOrConfig);
    } else {
      tour = idOrConfig;
    }

    if (!tour) {
      console.warn('Tour configuration not found.');
      return;
    }

    setActiveConfig(tour);
    setState({
      run: true,
      activeTourId: tour.id,
      stepIndex: 0,
    });
  }, []);

  const stopTour = useCallback(() => {
    setState((prev) => ({ ...prev, run: false }));
    setActiveConfig(null);
  }, []);

  const handleCallback = (data: CallBackProps) => {
    const { status, action, type, index } = data;

    if ([STATUS.FINISHED, STATUS.SKIPPED].includes(status as any)) {
      if (state.activeTourId) {
        localStorage.setItem(`tour_completed_${state.activeTourId}`, 'true');
        // Invalidate onboarding status to trigger assessment popup checks
        if (state.activeTourId === 'onboarding') {
          queryClient.invalidateQueries({ queryKey: ['onboardingStatus'] });
        }
      }
      setState((prev) => ({ ...prev, run: false, activeTourId: null }));
      setActiveConfig(null);
    } else if (
      ([EVENTS.STEP_AFTER, EVENTS.TARGET_NOT_FOUND] as string[]).includes(type)
    ) {
      const nextIndex = index + (action === ACTIONS.PREV ? -1 : 1);
      setState((prev) => ({ ...prev, stepIndex: nextIndex }));
    }
  };

  const value = useMemo(() => ({ startTour, stopTour }), [startTour, stopTour]);

  return (
    <TourContext.Provider value={value}>
      {children}

      <Joyride
        steps={activeConfig?.steps || []}
        run={state.run}
        stepIndex={state.stepIndex}
        continuous
        showSkipButton
        showProgress={false}
        scrollToFirstStep
        disableScrolling={false}
        disableScrollParentFix
        callback={handleCallback}
        tooltipComponent={TourTooltip}
        styles={{
          options: {
            zIndex: 10000,
            overlayColor: 'rgba(0, 0, 0, 0.7)',
            primaryColor: '#2563eb', // Application Blue
            arrowColor: '#ffffff', // Tooltip bg color
          },
          spotlight: {
            borderRadius: '16px',
            boxShadow: '0 0 0 9999px rgba(0, 0, 0, 0.7)', // Ensure dark overlay
          },
          beacon: {
            display: 'flex',
          },
          beaconInner: {
            backgroundColor: '#2563eb',
          },
          beaconOuter: {
            backgroundColor: 'rgba(37, 99, 235, 0.3)',
            border: '2px solid #2563eb',
          },
          tooltip: {
            backgroundColor: '#ffffff',
            borderRadius: '16px',
          },
        }}
        floaterProps={{
          hideArrow: false,
          disableAnimation: false,
        }}
        locale={{
          last: 'End',
          back: 'Back',
          next: 'Next',
          skip: 'Skip',
        }}
      />
    </TourContext.Provider>
  );
};
