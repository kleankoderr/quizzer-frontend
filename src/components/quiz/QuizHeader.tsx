import { ArrowLeft, Brain, Clock } from 'lucide-react';
import type { Quiz } from '../../types';

interface QuizHeaderProps {
  quiz: Quiz;
  currentQuestionIndex: number;
  totalQuestions: number;
  answeredCount: number;
  progressPercentage: number;
  timeRemaining: number | null;
  onBack: () => void;
}

export const QuizHeader = ({
  quiz,
  currentQuestionIndex,
  totalQuestions,
  answeredCount,
  progressPercentage,
  timeRemaining,
  onBack,
}: QuizHeaderProps) => {
  return (
    <div className="relative overflow-hidden rounded-lg sm:rounded-xl bg-primary-600 dark:bg-primary-700 p-4 sm:p-6 shadow-lg">
      <div className="absolute inset-0 opacity-10">
        <div className="absolute -top-10 -right-10 w-40 h-40 bg-white rounded-full" />
        <div className="absolute -bottom-10 -left-10 w-40 h-40 bg-white rounded-full" />
      </div>

      <div className="relative z-10">
        <button
          onClick={onBack}
          className="flex items-center gap-2 text-white bg-white/10 hover:bg-white/20 px-3 py-1.5 rounded-lg backdrop-blur-sm mb-3 sm:mb-4 transition-all touch-manipulation w-fit"
        >
          <ArrowLeft className="w-4 h-4 sm:w-5 sm:h-5" />
          <span className="text-sm sm:text-base font-medium">
            Back to Quizzes
          </span>
        </button>

        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3 sm:gap-4 mb-3 sm:mb-4">
          <div className="flex items-start gap-2 sm:gap-3 flex-1 min-w-0">
            <div className="p-1.5 sm:p-2 bg-white/20 backdrop-blur-sm rounded-lg flex-shrink-0">
              <Brain className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
            </div>
            <div className="flex-1 min-w-0">
              <h1 className="text-lg sm:text-2xl md:text-3xl font-bold text-white mb-1 sm:mb-2 break-words">
                {quiz.title}
              </h1>
              <div className="flex flex-wrap items-center gap-2 sm:gap-3 text-xs sm:text-sm text-primary-100 dark:text-primary-200">
                <span className="truncate">{quiz.topic}</span>
                {quiz.difficulty && (
                  <>
                    <span className="hidden sm:inline">•</span>
                    <span className="px-2 py-0.5 sm:py-1 bg-white/20 backdrop-blur-sm rounded capitalize font-medium text-xs sm:text-sm">
                      {quiz.difficulty}
                    </span>
                  </>
                )}
              </div>
            </div>
          </div>
          {quiz.quizType === 'timed' && timeRemaining !== null && (
            <div
              className={`flex items-center gap-1.5 sm:gap-2 self-start sm:self-auto ${timeRemaining < 60 ? 'animate-pulse' : ''}`}
            >
              <Clock className="w-5 h-5 sm:w-6 sm:h-6 md:w-8 md:h-8 text-white flex-shrink-0" />
              <span className="font-mono font-bold text-white text-xl sm:text-2xl md:text-4xl">
                {Math.floor(timeRemaining / 60)}:
                {(timeRemaining % 60).toString().padStart(2, '0')}
              </span>
            </div>
          )}
        </div>

        <div className="mt-4 sm:mt-6">
          <div className="flex justify-between text-xs sm:text-sm text-white mb-2">
            <span className="font-medium">
              Q {currentQuestionIndex + 1}/{totalQuestions}
            </span>
            <span className="font-medium">
              {answeredCount}/{totalQuestions} answered
            </span>
          </div>
          <div className="w-full bg-white/20 rounded-full h-2 sm:h-2.5 overflow-hidden">
            <div
              className="bg-green-400 h-2 sm:h-2.5 rounded-full transition-all duration-300 shadow-lg"
              style={{ width: `${progressPercentage}%` }}
            />
          </div>
        </div>
      </div>
    </div>
  );
};
