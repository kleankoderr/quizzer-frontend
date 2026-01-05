import { createContext } from 'react';
import { type Step } from 'react-joyride';

export interface TourContextType {
  startTour: (key: string, steps: Step[]) => void;
  stopTour: () => void;
}

export const TourContext = createContext<TourContextType | null>(null);
