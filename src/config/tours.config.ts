import {
  onboardingTour,
  quizTour,
  dashboardTour,
  quizGeneratorTour,
  flashcardGeneratorTour,
  studyGeneratorTour,
} from '../tours';
import { type TourConfig } from '../types/tour';

export const TOURS: Record<string, TourConfig> = {
  onboarding: {
    id: 'onboarding',
    steps: onboardingTour,
  },
  dashboard: {
    id: 'dashboard',
    steps: dashboardTour,
  },
  quiz: {
    id: 'quiz',
    steps: quizTour,
  },
  'quiz-generator': {
    id: 'quiz-generator',
    steps: quizGeneratorTour,
  },
  'flashcard-generator': {
    id: 'flashcard-generator',
    steps: flashcardGeneratorTour,
  },
  'study-generator': {
    id: 'study-generator',
    steps: studyGeneratorTour,
  },
  'assessment-location': {
    id: 'assessment-location',
    steps: [
      {
        target: '#sidebar-quiz-btn',
        title: 'Find Your Assessment',
        content:
          'No worries! You can always find your pending onboarding assessment here in the Quizzes section whenever you are ready.',
        placement: 'right',
      },
    ],
  },
};

export const getTour = (id: string): TourConfig | undefined => TOURS[id];
