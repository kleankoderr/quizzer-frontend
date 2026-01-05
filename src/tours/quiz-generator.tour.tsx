import type { Step } from 'react-joyride';

export const quizGeneratorTour: Step[] = [
  {
    target: '#quiz-mode-tabs',
    content: (
      <span>
        Choose your source: generate from a <strong>Topic</strong>, paste{' '}
        <strong>Content</strong>, or upload <strong>Documents</strong>.
      </span>
    ),
    placement: 'bottom',
    disableBeacon: true,
  },
  {
    target: '#quiz-questions-config',
    content: (
      <span>
        Select the <strong>Number of Questions</strong> you want in your quiz
        (from 3 to 20).
      </span>
    ),
    placement: 'top',
  },
  {
    target: '#quiz-difficulty-config',
    content: (
      <span>
        Set your preferred <strong>Difficulty Level</strong>: Easy, Medium, or
        Hard.
      </span>
    ),
    placement: 'top',
  },
  {
    target: '#quiz-study-set-config',
    content: (
      <span>
        Optionally, <strong>Add to Study Set</strong> to keep your learning
        materials organized.
      </span>
    ),
    placement: 'top',
  },
];
