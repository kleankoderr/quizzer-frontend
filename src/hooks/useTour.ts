import { useContext, useCallback } from 'react';
import { TourContext } from '../contexts/TourContext';
import { type Step } from 'react-joyride';

export function useTour() {
  const context = useContext(TourContext);

  if (!context) {
    throw new Error('useTour must be used within a TourProvider');
  }

  const { startTour, stopTour } = context;

  const startIfNotCompleted = useCallback(
    (key: string, steps: Step[]) => {
      const isMobile = window.innerWidth < 1024;
      // Don't run on mobile as per previous implementation logic
      if (isMobile) return;

      if (!localStorage.getItem(`tour_${key}`)) {
        startTour(key, steps);
      }
    },
    [startTour]
  );

  return { startTour, stopTour, startIfNotCompleted };
}
