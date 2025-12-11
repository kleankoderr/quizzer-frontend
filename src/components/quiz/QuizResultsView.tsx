import type { Quiz, QuizResult, AnswerValue } from '../../types';
import { QuizScoreCard } from './QuizScoreCard';
import { ChallengeProgressCard } from './ChallengeProgressCard';
import { QuizReview } from './QuizReview';

interface QuizResultsViewProps {
  quiz: Quiz;
  result: QuizResult;
  selectedAnswers: (AnswerValue | null)[];
  challengeId: string | null;
  challengeResult: any;
  onBack: () => void;
}

export const QuizResultsView = ({
  quiz,
  result,
  selectedAnswers,
  challengeId,
  challengeResult,
  onBack,
}: QuizResultsViewProps) => {
  return (
    <div className="max-w-4xl mx-auto space-y-4 sm:space-y-6 pb-6 sm:pb-8">
      <QuizScoreCard
        result={result}
        onBack={onBack}
        backLabel={challengeId ? 'Back to Challenge' : 'Back to Quizzes'}
      />

      {challengeId && challengeResult && !challengeResult.completed && (
        <ChallengeProgressCard
          challengeId={challengeId}
          challengeResult={challengeResult}
        />
      )}

      <QuizReview
        quiz={quiz}
        result={result}
        selectedAnswers={selectedAnswers}
        challengeId={challengeId || undefined}
      />
    </div>
  );
};
