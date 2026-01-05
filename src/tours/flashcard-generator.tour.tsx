import type { Step } from 'react-joyride';

export const flashcardGeneratorTour: Step[] = [
  {
    target: '#flashcard-mode-tabs',
    content: (
      <span>
        Generate from a <strong>Topic</strong>, <strong>Content</strong>, or{' '}
        <strong>Documents</strong>. Then set your desired{' '}
        <strong>Card Count</strong> below.
      </span>
    ),
    placement: 'bottom',
    disableBeacon: true,
  },
  {
    target: '#flashcard-generate-btn',
    content: (
      <span>
        Ready? Click <strong>Generate Flashcards</strong> to create your new
        study set!
      </span>
    ),
    placement: 'top',
  },
];
