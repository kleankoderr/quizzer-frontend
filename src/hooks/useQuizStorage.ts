import { useCallback } from 'react';
import type { AnswerValue } from '../types';

interface UseQuizStorage {
  getStorageKey: (key: string) => string;
}

export const useQuizStorage = ({ getStorageKey }: UseQuizStorage) => {
  const saveAnswers = useCallback(
    (answers: (AnswerValue | null)[]) => {
      localStorage.setItem(getStorageKey('answers'), JSON.stringify(answers));
    },
    [getStorageKey]
  );

  const saveQuestionIndex = useCallback(
    (index: number) => {
      localStorage.setItem(getStorageKey('questionIndex'), index.toString());
    },
    [getStorageKey]
  );

  const clearStorage = useCallback(() => {
    localStorage.removeItem(getStorageKey('answers'));
    localStorage.removeItem(getStorageKey('questionIndex'));
    localStorage.removeItem(getStorageKey('timeRemaining'));
    localStorage.removeItem(getStorageKey('timestamp'));
  }, [getStorageKey]);

  return { saveAnswers, saveQuestionIndex, clearStorage };
};
