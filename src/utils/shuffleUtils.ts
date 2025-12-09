import type { QuizQuestion } from '../types';

const hasWebCrypto = typeof crypto !== 'undefined' && crypto.getRandomValues;

const getRandomInt = (max: number): number => {
  if (hasWebCrypto) {
    const buffer = new Uint32Array(1);
    crypto.getRandomValues(buffer);
    return buffer[0] % max;
  }
  return Math.floor(Math.random() * max);
};

export const shuffleArray = <T>(array: T[]): T[] => {
  const shuffled = [...array];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = getRandomInt(i + 1);
    const temp = shuffled[i];
    shuffled[i] = shuffled[j];
    shuffled[j] = temp;
  }
  return shuffled;
};

export const shuffleQuestions = (questions: QuizQuestion[]): QuizQuestion[] => {
  return shuffleArray(questions);
};

export const shuffleMatchingOptions = (
  question: QuizQuestion
): QuizQuestion => {
  if (question.questionType !== 'matching') {
    return question;
  }

  const leftColumn = question.leftColumn || [];
  const rightColumn = question.rightColumn || [];

  return {
    ...question,
    leftColumn: shuffleArray(leftColumn),
    rightColumn: shuffleArray(rightColumn),
  };
};

const NORMALIZE_CACHE = new Map<string, string>();
const MAX_CACHE_SIZE = 1000;

export const normalizeAnswer = (answer: string): string => {
  if (NORMALIZE_CACHE.has(answer)) {
    return NORMALIZE_CACHE.get(answer)!;
  }

  const normalized = answer.toLowerCase().trim();

  if (NORMALIZE_CACHE.size >= MAX_CACHE_SIZE) {
    const firstKey = NORMALIZE_CACHE.keys().next().value!;
    NORMALIZE_CACHE.delete(firstKey);
  }

  NORMALIZE_CACHE.set(answer, normalized);
  return normalized;
};

export const isAcceptableFillBlankAnswer = (
  userAnswer: string,
  correctAnswer: string
): boolean => {
  const normalizedUser = normalizeAnswer(userAnswer);
  const normalizedCorrect = normalizeAnswer(correctAnswer);

  if (normalizedUser === normalizedCorrect) {
    return true;
  }

  if (normalizedUser.includes(normalizedCorrect)) {
    return true;
  }

  if (normalizedCorrect.includes(normalizedUser)) {
    return true;
  }

  return false;
};
