import { createContext } from 'react';
import { type TourConfig } from '../types/tour';

export interface TourContextType {
  startTour: (idOrConfig: string | TourConfig) => void;
  stopTour: () => void;
}

export const TourContext = createContext<TourContextType | null>(null);
