import { useEffect, useRef } from 'react';
import { useTour } from './useTour';
import { type TourConfig } from '../types/tour';

/**
 * Automatically triggers a tour if it hasn't been completed yet.
 * @param tourIdOrConfig The ID or configuration of the tour to trigger.
 * @param delay Optional delay in ms before starting the tour.
 */
export function useAutoTour(tourIdOrConfig: string | TourConfig, delay = 1000) {
  const { startTour, isTourCompleted } = useTour();
  const hasTriggered = useRef(false);

  const tourId =
    typeof tourIdOrConfig === 'string' ? tourIdOrConfig : tourIdOrConfig.id;

  useEffect(() => {
    if (hasTriggered.current) return;

    // Check if on mobile
    const isMobile = window.innerWidth < 1024;
    if (isMobile) return;

    if (!isTourCompleted(tourId)) {
      const timer = setTimeout(() => {
        startTour(tourIdOrConfig);
        hasTriggered.current = true;
      }, delay);

      return () => clearTimeout(timer);
    }
  }, [tourId, tourIdOrConfig, startTour, isTourCompleted, delay]);
}
