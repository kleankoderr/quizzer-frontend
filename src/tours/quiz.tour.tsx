import type { Step } from 'react-joyride';

export const quizTour: Step[] = [
  {
    target: '#new-quiz-btn',
    content: (
      <span>
        Start by creating your <strong>first quiz</strong>. You can use topics,
        text, or upload documents.
      </span>
    ),
    placement: 'bottom',
  },
  {
    target: '#practice-history-btn',
    content: (
      <span>
        Review your <strong>past attempts</strong> and track your improvement
        over time.
      </span>
    ),
    placement: 'top',
  },
];
