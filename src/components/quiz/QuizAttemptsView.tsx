import React from 'react';
import { AttemptsAnalyticsView } from '../AttemptsAnalyticsView';
import type { Quiz } from '../../types';

interface QuizAttemptsViewProps {
  quiz: Quiz;
  attempts: any[];
  onRetake: () => void;
  onBack?: () => void;
}

export const QuizAttemptsView: React.FC<QuizAttemptsViewProps> = ({
  quiz,
  attempts,
  onRetake,
  onBack,
}) => {
  return (
    <AttemptsAnalyticsView
      title={quiz.title}
      type="quiz"
      attempts={attempts}
      onRetake={onRetake}
      onBack={onBack}
      defaultTotalQuestions={quiz.questionCount || quiz.questions?.length}
    />
  );
};
