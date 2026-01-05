import { useState, useEffect } from 'react';
import Joyride, { type Step, type CallBackProps, STATUS } from 'react-joyride';
import { useLocation } from 'react-router-dom';

export const ProductTour = () => {
  const [run, setRun] = useState(false);
  const location = useLocation();

  useEffect(() => {
    const isMobile = window.innerWidth < 1024;
    const hasSeenTour = localStorage.getItem('hasSeenTour');
    
    // Only run the tour if the user is on the dashboard, hasn't seen it yet, and is NOT on mobile
    if (!hasSeenTour && location.pathname === '/dashboard' && !isMobile) {
      setRun(true);
    }
  }, [location.pathname]);

  const steps: Step[] = [
    {
      target: 'body',
      placement: 'center',
      content: (
        <div className="text-left space-y-2">
          <h3 className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
            Welcome to Quizzer! 👋
          </h3>
          <p className="text-gray-600 dark:text-gray-400 leading-relaxed">
            Let's take a quick 1-minute tour to show you how to supercharge your learning experience.
          </p>
        </div>
      ),
      disableBeacon: true,
    },
    {
      target: '[href="/dashboard"]',
      content: 'Your central hub. Track your streaks, see your progress, and get AI-powered study recommendations.',
      placement: 'right',
    },
    {
      target: '[href="/study"]',
      content: 'The powerhouse. Upload your materials here to generate comprehensive learning guides and summaries.',
      placement: 'right',
    },
    {
      target: '[href="/quiz"]',
      content: 'Test your knowledge. Generate quizzes from your documents or any topic to reinforce what you\'ve learned.',
      placement: 'right',
    },
    {
      target: '[href="/flashcards"]',
      content: 'Master complex concepts using our spaced-repetition flashcard system.',
      placement: 'right',
    },
    {
      target: '[href="/study-pack"]',
      content: 'Keep everything organized. Group your documents, quizzes, and flashcards into custom study sets.',
      placement: 'right',
    },
    {
      target: '[href="/files"]',
      content: 'Your digital library. Access and manage all your uploaded documents in one place.',
      placement: 'right',
    },
    {
      target: '[href="/statistics"]',
      content: 'Data-driven insights. Visualize your performance and identify areas that need more focus.',
      placement: 'right',
    },
    {
      target: '#sidebar-collapse-btn',
      content: 'Need more space? Collapse the sidebar to focus entirely on your notes and quizzes.',
      placement: 'right',
    },
    {
      target: '#start-studying-btn',
      content: 'Begin your journey here! Click this to start creating your first study set or learning guide.',
      placement: 'top',
    },
    {
      target: '#create-quiz-btn',
      content: 'Ready for a challenge? Jump straight into creating a quiz to test your mastery.',
      placement: 'top',
    },
  ];

  const handleJoyrideCallback = (data: CallBackProps) => {
    const { status } = data;
    const finishedStatuses: string[] = [STATUS.FINISHED, STATUS.SKIPPED];

    if (finishedStatuses.includes(status)) {
      setRun(false);
      localStorage.setItem('hasSeenTour', 'true');
    }
  };

  return (
    <Joyride
      callback={handleJoyrideCallback}
      continuous
      hideCloseButton
      run={run}
      scrollToFirstStep
      showProgress
      showSkipButton
      steps={steps}
      styles={{
        options: {
          primaryColor: '#2563eb', // Matches primary-600
          zIndex: 10000,
          backgroundColor: '#ffffff',
          textColor: '#1e293b', // slate-800
          overlayColor: 'rgba(0, 0, 0, 0.4)',
        },
        tooltip: {
          borderRadius: '16px',
          padding: '20px',
          boxShadow: '0 20px 25px -5px rgb(0 0 0 / 0.1), 0 8px 10px -6px rgb(0 0 0 / 0.1)',
        },
        tooltipContainer: {
          textAlign: 'left',
          fontSize: '15px',
        },
        buttonNext: {
          borderRadius: '10px',
          fontWeight: '700',
          padding: '10px 20px',
          backgroundColor: '#2563eb',
          fontSize: '14px',
          transition: 'all 0.2s ease',
        },
        buttonBack: {
          fontWeight: '600',
          marginRight: '12px',
          color: '#64748b',
          fontSize: '14px',
        },
        buttonSkip: {
          color: '#94a3b8',
          fontSize: '14px',
          fontWeight: '500',
        },
        spotlight: {
          borderRadius: '12px',
        },
      }}
      floaterProps={{
        hideArrow: false,
      }}
    />
  );
};
