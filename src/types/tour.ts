import { type Step } from 'react-joyride';

export interface TourConfig {
  id: string;
  steps: Step[];
  onComplete?: () => void;
  onStart?: () => void;
}

export type TourRegistry = Record<string, TourConfig>;

export interface TourState {
  run: boolean;
  activeTourId: string | null;
  stepIndex: number;
}
