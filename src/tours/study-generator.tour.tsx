import type { Step } from 'react-joyride';

export const studyGeneratorTour: Step[] = [
  {
    target: '#study-mode-tabs',
    content: (
      <span>
        Choose your study source: <strong>Topic</strong>, <strong>Text</strong>,
        or <strong>Documents</strong>.
      </span>
    ),
    placement: 'bottom',
    disableBeacon: true,
  },
  {
    target: '#study-generator-study-set',
    content: (
      <span>
        Optionally, organize your new materials by adding them to a{' '}
        <strong>Study Set</strong>.
      </span>
    ),
    placement: 'top',
  },
  {
    target: '#study-generate-btn',
    content: (
      <span>
        Click <strong>Generate Study Content</strong> to create a comprehensive
        learning guide!
      </span>
    ),
    placement: 'top',
  },
];
