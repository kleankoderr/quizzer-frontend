import { useState, useEffect, useCallback } from 'react';
import type { Quiz } from '../types';

interface UseQuizTimerProps {
  quiz: Quiz | undefined;
  getStorageKey: (key: string) => string;
  onTimeUp: () => void;
  showResults: boolean;
}

export const useQuizTimer = ({
  quiz,
  getStorageKey,
  onTimeUp,
  showResults,
}: UseQuizTimerProps) => {
  const [timeRemaining, setTimeRemaining] = useState<number | null>(null);

  const startTimer = useCallback(
    (savedTimeRemaining?: string | null, savedTimestamp?: string | null) => {
      if (quiz?.quizType !== 'timed' || !quiz.timeLimit) return;

      if (savedTimeRemaining && savedTimestamp) {
        const timeRemaining = parseInt(savedTimeRemaining, 10);
        const timestamp = parseInt(savedTimestamp, 10);
        const now = Date.now();
        const elapsedSeconds = Math.floor((now - timestamp) / 1000);
        const adjustedTime = Math.max(0, timeRemaining - elapsedSeconds);
        setTimeRemaining(adjustedTime);
      } else {
        setTimeRemaining(quiz.timeLimit);
      }
    },
    [quiz]
  );

  useEffect(() => {
    if (timeRemaining === null || timeRemaining <= 0 || showResults) return;

    const timer = setInterval(() => {
      setTimeRemaining((prev) => {
        if (prev === null || prev <= 1) {
          onTimeUp();
          return 0;
        }
        const newTime = prev - 1;
        localStorage.setItem(
          getStorageKey('timeRemaining'),
          newTime.toString()
        );
        localStorage.setItem(getStorageKey('timestamp'), Date.now().toString());
        return newTime;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [timeRemaining, showResults, getStorageKey, onTimeUp]);

  return { timeRemaining, startTimer };
};
