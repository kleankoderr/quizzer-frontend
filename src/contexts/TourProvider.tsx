import React, { useState, useCallback, useMemo, type ReactNode } from 'react';
import Joyride, { type CallBackProps, STATUS, type Step } from 'react-joyride';
import { TourContext } from './TourContext';

interface TourState {
  run: boolean;
  steps: Step[];
  key: string;
}

export const TourProvider: React.FC<{ children: ReactNode }> = ({
  children,
}) => {
  const [tour, setTour] = useState<TourState>({
    run: false,
    steps: [],
    key: '',
  });

  const startTour = useCallback((key: string, steps: Step[]) => {
    // Only start if not already running a tour
    setTour({ run: true, steps, key });
  }, []);

  const stopTour = useCallback(() => {
    setTour((prev) => ({ ...prev, run: false }));
  }, []);

  const handleCallback = (data: CallBackProps) => {
    const { status } = data;

    if ([STATUS.FINISHED, STATUS.SKIPPED].includes(status as any)) {
      localStorage.setItem(`tour_${tour.key}`, 'completed');
      setTour((prev) => ({ ...prev, run: false }));
    }
  };

  const value = useMemo(() => ({ startTour, stopTour }), [startTour, stopTour]);

  return (
    <TourContext.Provider value={value}>
      {children}

      <Joyride
        steps={tour.steps}
        run={tour.run}
        continuous
        showSkipButton
        showProgress
        scrollToFirstStep
        callback={handleCallback}
        styles={{
          options: {
            primaryColor: '#2563eb',
            zIndex: 10000,
            backgroundColor: '#ffffff',
            textColor: '#1e293b',
            overlayColor: 'rgba(0, 0, 0, 0.4)',
          },
          tooltip: {
            borderRadius: '16px',
            padding: '20px',
            boxShadow:
              '0 20px 25px -5px rgb(0 0 0 / 0.1), 0 8px 10px -6px rgb(0 0 0 / 0.1)',
          },
          tooltipContainer: {
            textAlign: 'left',
            fontSize: '15px',
          },
          buttonNext: {
            borderRadius: '10px',
            fontWeight: '700',
            padding: '10px 20px',
            backgroundColor: '#2563eb',
            fontSize: '14px',
          },
          buttonBack: {
            fontWeight: '600',
            marginRight: '12px',
            color: '#64748b',
            fontSize: '14px',
          },
          buttonSkip: {
            color: '#94a3b8',
            fontSize: '14px',
            fontWeight: '500',
          },
          spotlight: {
            borderRadius: '12px',
          },
        }}
        floaterProps={{
          hideArrow: false,
        }}
      />
    </TourContext.Provider>
  );
};
