import { ArrowLeft } from 'lucide-react';
import type { QuizResult } from '../../types';

interface QuizScoreCardProps {
  result: QuizResult;
  title?: string;
  onBack?: () => void;
  backLabel?: string;
}

export const QuizScoreCard = ({
  result,
  title,
  onBack,
  backLabel = 'Back',
}: QuizScoreCardProps) => {
  const isPerfect = result.percentage === 100;
  const isExcellent = result.percentage >= 80;
  const isGood = result.percentage >= 60;

  return (
    <div className="relative overflow-hidden rounded-lg sm:rounded-xl bg-primary-600 dark:bg-primary-700 p-6 sm:p-8 shadow-lg">
      <div className="absolute inset-0 opacity-10">
        <div className="absolute -top-10 -right-10 w-40 h-40 bg-white rounded-full" />
        <div className="absolute -bottom-10 -left-10 w-40 h-40 bg-white rounded-full" />
      </div>

      <div className="relative z-10">
        {onBack && (
          <button
            onClick={onBack}
            className="flex items-center gap-2 text-white hover:text-blue-100 dark:hover:text-blue-200 mb-4 sm:mb-6 transition-colors touch-manipulation"
          >
            <ArrowLeft className="w-4 h-4 sm:w-5 sm:h-5" />
            <span className="text-sm sm:text-base">{backLabel}</span>
          </button>
        )}

        <div className="text-center py-4 sm:py-8">
          <div className="inline-flex items-center justify-center w-32 h-32 sm:w-40 sm:h-40 md:w-44 md:h-44 rounded-full bg-white dark:bg-gray-800 shadow-2xl mb-4 sm:mb-6 relative">
            <div className="text-center">
              <div className="text-4xl sm:text-5xl md:text-6xl font-bold text-gray-900 dark:text-white mb-1">
                {result.percentage}%
              </div>
              <div className="text-gray-500 dark:text-gray-400 text-xs sm:text-sm font-medium">
                {result.score} of {result.totalQuestions} correct
              </div>
            </div>
            <div
              className={`absolute inset-0 rounded-full border-3 sm:border-4 ${
                isPerfect
                  ? 'border-yellow-400'
                  : isExcellent
                    ? 'border-green-400'
                    : isGood
                      ? 'border-blue-400'
                      : 'border-gray-300'
              }`}
            />
          </div>

          {title && (
            <h1 className="text-xl sm:text-2xl md:text-3xl font-bold text-white mb-2">
              {title}
            </h1>
          )}

          {!title && (
            <h1 className="text-xl sm:text-2xl md:text-3xl font-bold text-white mb-2">
              {isPerfect
                ? '🎉 Perfect Score!'
                : isExcellent
                  ? '🌟 Excellent Work!'
                  : isGood
                    ? '👍 Good Job!'
                    : '💪 Keep Practicing!'}
            </h1>
          )}

          <p className="text-blue-100 dark:text-blue-200 text-sm sm:text-base md:text-lg px-4">
            {(() => {
              const message =
                result.feedback?.message ||
                (isPerfect
                  ? 'You got every question right!'
                  : isExcellent
                    ? 'You really know your stuff!'
                    : isGood
                      ? 'Nice work, keep it up!'
                      : 'Review the answers and try again!');
              // Simple parsing of bold text marked with **
              return message.split('**').map((part, index) =>
                index % 2 === 1 ? (
                  <strong key={index} className="font-bold text-white">
                    {part}
                  </strong>
                ) : (
                  part
                )
              );
            })()}
          </p>
        </div>
      </div>
    </div>
  );
};
