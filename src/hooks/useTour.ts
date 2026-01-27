import { useContext, useCallback } from 'react';
import { TourContext } from '../contexts/TourContext';
import { type TourConfig } from '../types/tour';

export function useTour() {
  const context = useContext(TourContext);

  if (!context) {
    throw new Error('useTour must be used within a TourProvider');
  }

  const { startTour, stopTour } = context;

  const isTourCompleted = useCallback((id: string) => {
    return !!localStorage.getItem(`tour_completed_${id}`);
  }, []);

  const resetTour = useCallback((id: string) => {
    localStorage.removeItem(`tour_completed_${id}`);
  }, []);

  const startDynamicTour = useCallback(
    (config: TourConfig) => {
      startTour(config);
    },
    [startTour]
  );

  return { startTour, stopTour, isTourCompleted, resetTour, startDynamicTour };
}
