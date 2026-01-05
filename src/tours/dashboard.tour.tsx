import type { Step } from 'react-joyride';

export const dashboardTour: Step[] = [
  {
    target: '.recharts-responsive-container',
    content: (
      <span>
        Monitor your <strong>study activity</strong> over the last 7 days.
      </span>
    ),
    placement: 'top',
  },
  {
    target: '#start-studying-btn',
    content: (
      <span>
        Ready to learn? <strong>Jump back in</strong> right here.
      </span>
    ),
    placement: 'bottom',
  },
];
