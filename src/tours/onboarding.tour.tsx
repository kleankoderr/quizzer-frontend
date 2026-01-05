import type { Step } from 'react-joyride';

export const onboardingTour: Step[] = [
  {
    target: 'body',
    placement: 'center',
    content: (
      <div className="text-left space-y-2">
        <h3 className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
          Welcome to Quizzer! 👋
        </h3>
        <p className="text-gray-600 dark:text-gray-400 leading-relaxed">
          Let's take a quick 1-minute tour to show you how to supercharge your
          learning experience.
        </p>
      </div>
    ),
    disableBeacon: true,
  },
  {
    target: '[href="/study"]',
    content: (
      <span>
        The <strong>powerhouse</strong>. Upload your materials here to generate
        comprehensive learning guides and summaries.
      </span>
    ),
    placement: 'right',
  },
  {
    target: '[href="/quiz"]',
    content: (
      <span>
        <strong>Test your knowledge</strong>. Generate quizzes from your
        documents or any topic to reinforce what you've learned.
      </span>
    ),
    placement: 'right',
  },
  {
    target: '[href="/flashcards"]',
    content: (
      <span>
        Master complex concepts using our{' '}
        <strong>spaced-repetition flashcard system</strong>.
      </span>
    ),
    placement: 'right',
  },
  {
    target: '[href="/study-pack"]',
    content: (
      <span>
        Keep everything <strong>organized</strong>. Group your documents,
        quizzes, and flashcards into custom study sets.
      </span>
    ),
    placement: 'right',
  },
  {
    target: '#start-studying-btn',
    content: (
      <span>
        <strong>Begin your journey here!</strong> Click this to start creating
        your first study set or learning guide.
      </span>
    ),
    placement: 'top',
  },
  {
    target: '#create-quiz-btn',
    content: (
      <span>
        Ready for a <strong>challenge</strong>? Jump straight into creating a
        quiz to test your mastery.
      </span>
    ),
    placement: 'top',
  },
];
