import type { Step } from 'react-joyride';

export const onboardingTour: Step[] = [
  {
    target: 'body',
    placement: 'center',
    title: 'Welcome to Quizzer! 👋',
    content: (
      <div className="space-y-3">
        <p className="text-gray-600 dark:text-gray-400">
          Let's take a quick tour to show you how to get the most out of your
          learning journey.
        </p>
      </div>
    ),
    disableBeacon: true,
  },
  {
    target: '#start-studying-btn',
    title: 'Start Learning',
    content:
      'Begin your journey here! Click this to generate your first study material from topics, text, or documents.',
    placement: 'bottom',
  },
  {
    target: '#create-quiz-btn',
    title: 'Practice & Test',
    content:
      'Ready to challenge yourself? Jump straight into creating an intelligent quiz to test your mastery.',
    placement: 'bottom',
  },
  {
    target: '.recharts-responsive-container',
    title: 'Track Your Growth',
    content:
      'Monitor your study activity and performance over the last 7 days to see your progress in real-time.',
    placement: 'top',
  },
  {
    target: '#sidebar-collapse-btn',
    title: 'Maximize Your View',
    content:
      'Collapse the sidebar to focus on your content, or expand it for quick navigation across the platform.',
    placement: 'right',
  },
  {
    target: '#sidebar-study-btn',
    title: 'Your Study Hub',
    content:
      'Access all your generated study materials, lecture notes, and summaries in one centralized place.',
    placement: 'right',
  },
];
