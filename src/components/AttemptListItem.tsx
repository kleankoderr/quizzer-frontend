import React from 'react';
import { format, parseISO } from 'date-fns';

interface AttemptListItemProps {
  attempt: any;
  index: number;
  totalCount: number;
  onClick?: () => void;
}

export const AttemptListItem: React.FC<AttemptListItemProps> = ({
  attempt,
  index,
  totalCount,
  onClick,
}) => {
  const isClickable = !!onClick;
  const unitLabel = attempt.type === 'flashcard' ? 'cards' : 'questions';

  return (
    <button
      onClick={isClickable ? onClick : undefined}
      className={`w-full text-left p-6 ${
        isClickable ? 'cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700' : 'cursor-default'
      } transition-colors`}
      disabled={!isClickable}
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className={`flex items-center justify-center w-10 h-10 rounded-full ${attempt.type === 'flashcard' ? 'bg-primary-100 dark:bg-primary-900 text-primary-600 dark:text-primary-400' : 'bg-blue-100 dark:bg-blue-900 text-blue-600 dark:text-blue-400'} font-semibold`}>
            #{totalCount - index}
          </div>
          <div>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              {format(parseISO(attempt.completedAt), 'MMM dd, yyyy • h:mm a')}
            </p>
            {attempt.score !== undefined && attempt.totalQuestions !== undefined && (
              <p className="text-sm text-gray-500 dark:text-gray-500 mt-1">
                {attempt.score} / {attempt.totalQuestions} {unitLabel}
              </p>
            )}
          </div>
        </div>
        {attempt.score !== undefined && attempt.totalQuestions !== undefined && (
          <div className="text-right">
            <p className="text-2xl font-bold text-gray-900 dark:text-white">
              {Math.round(
                Math.max(0, (attempt.score / (attempt.totalQuestions || 1)) * 100)
              )}
              %
            </p>
            <p className="text-sm text-gray-500 dark:text-gray-500">Score</p>
          </div>
        )}
      </div>
    </button>
  );
};
