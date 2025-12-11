import { ChevronLeft, ChevronRight, Trophy } from 'lucide-react';

interface QuizNavigationProps {
  currentQuestionIndex: number;
  totalQuestions: number;
  submitting: boolean;
  onPrevious: () => void;
  onNext: () => void;
  onSubmit: () => void;
}

export const QuizNavigation = ({
  currentQuestionIndex,
  totalQuestions,
  submitting,
  onPrevious,
  onNext,
  onSubmit,
}: QuizNavigationProps) => {
  return (
    <div className="flex items-center justify-between gap-2 sm:gap-3 pt-4 sm:pt-6 border-t border-gray-200 dark:border-gray-700 mt-4 sm:mt-6">
      <button
        onClick={onPrevious}
        disabled={currentQuestionIndex === 0}
        className="flex items-center gap-1 sm:gap-2 px-3 sm:px-5 py-2.5 sm:py-3 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-200 font-medium rounded-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed touch-manipulation text-sm sm:text-base"
      >
        <ChevronLeft className="w-4 h-4 sm:w-5 sm:h-5 flex-shrink-0" />
        <span className="hidden sm:inline">Previous</span>
        <span className="sm:hidden">Prev</span>
      </button>

      {currentQuestionIndex === totalQuestions - 1 ? (
        <button
          onClick={onSubmit}
          disabled={submitting}
          className="flex items-center gap-1 sm:gap-2 px-4 sm:px-6 py-2.5 sm:py-3 bg-primary-600 hover:bg-primary-700 text-white font-semibold rounded-lg transition-all shadow-md hover:shadow-lg touch-manipulation text-sm sm:text-base disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {submitting ? (
            <>
              <div className="w-4 h-4 sm:w-5 sm:h-5 border-2 border-white border-t-transparent rounded-full animate-spin flex-shrink-0" />
              <span>Submitting...</span>
            </>
          ) : (
            <>
              <Trophy className="w-4 h-4 sm:w-5 sm:h-5 flex-shrink-0" />
              <span>Submit Quiz</span>
            </>
          )}
        </button>
      ) : (
        <button
          onClick={onNext}
          disabled={submitting}
          className="flex items-center gap-1 sm:gap-2 px-4 sm:px-6 py-2.5 sm:py-3 bg-primary-600 hover:bg-primary-700 text-white font-semibold rounded-lg transition-all shadow-md hover:shadow-lg touch-manipulation text-sm sm:text-base disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <span>Next</span>
          <ChevronRight className="w-4 h-4 sm:w-5 sm:h-5 flex-shrink-0" />
        </button>
      )}
    </div>
  );
};
