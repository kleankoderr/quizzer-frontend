import { useQuery } from '@tanstack/react-query';
import { studyService } from '../services/study.service';
import { ReviewCard } from '../components/ReviewCard';
import {
  BookOpen,
  Brain,
  Clock,
  CheckCircle2,
} from 'lucide-react';
import { format, isToday, parseISO } from 'date-fns';
import { CardSkeleton } from '../components/skeletons';

export const ReviewPage = () => {
  const { data: reviewData, isLoading } = useQuery({
    queryKey: ['due-for-review'],
    queryFn: studyService.getDueForReview,
  });

  const dueQuizzes = reviewData?.dueQuizzes || [];
  const dueFlashcards = reviewData?.dueFlashcards || [];
  const totalDue = reviewData?.totalDue || 0;
  const overdueCount = reviewData?.overdueCount || 0;
  const upcomingReviews = reviewData?.upcomingReviews || [];

  const allItems = [
    ...dueQuizzes.map(q => ({ ...q, type: 'quiz' as const })),
    ...dueFlashcards.map(f => ({ ...f, type: 'flashcard' as const }))
  ];

  // Empty state
  if (!isLoading && totalDue === 0) {
    return (
      <div className="space-y-6 pb-8">
        {/* Hero Header */}
        <header className="relative overflow-hidden rounded-xl bg-primary-600 dark:bg-primary-700 p-6 md:p-8 shadow-lg">
          <div className="absolute inset-0 opacity-10">
            <div className="absolute -top-10 -right-10 w-40 h-40 bg-white rounded-full" />
            <div className="absolute -bottom-10 -left-10 w-40 h-40 bg-white rounded-full" />
          </div>
          <div className="relative z-10 text-center">
            <CheckCircle2 className="w-16 h-16 text-white mx-auto mb-4" />
            <h1 className="text-3xl md:text-4xl font-bold text-white mb-2">
              All Caught Up!
            </h1>
            <p className="text-primary-100">
              No items need review right now
            </p>
          </div>
        </header>

        {/* Upcoming Reviews */}
        {upcomingReviews.some(day => day.count > 0) && (
          <div className="card p-6">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              Upcoming Reviews (Next 7 Days)
            </h2>
            <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-7 gap-2">
              {upcomingReviews.map((day) => {
                const date = parseISO(day.date);
                const today = isToday(date);
                return (
                  <div
                    key={day.date}
                    className={`p-3 rounded-lg text-center ${
                      today
                        ? 'bg-primary-100 dark:bg-primary-900/30 border-2 border-primary-500'
                        : 'bg-gray-50 dark:bg-gray-800'
                    }`}
                  >
                    <div className={`text-xs font-medium mb-1 ${
                      today ? 'text-primary-700 dark:text-primary-300' : 'text-gray-500 dark:text-gray-400'
                    }`}>
                      {format(date, 'EEE')}
                    </div>
                    <div className={`text-sm font-bold ${
                      today ? 'text-primary-900 dark:text-primary-100' : 'text-gray-900 dark:text-white'
                    }`}>
                      {format(date, 'd')}
                    </div>
                    {day.count > 0 && (
                      <div className="mt-1">
                        <span className={`inline-block px-2 py-0.5 rounded-full text-xs font-bold ${
                          today
                            ? 'bg-primary-600 text-white'
                            : 'bg-primary-100 text-primary-700 dark:bg-primary-900/30 dark:text-primary-300'
                        }`}>
                          {day.count}
                        </span>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-8">
      {/* Hero Header */}
      <header className="relative overflow-hidden rounded-xl bg-primary-600 dark:bg-primary-700 p-6 md:p-8 shadow-lg">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute -top-10 -right-10 w-40 h-40 bg-white rounded-full" />
          <div className="absolute -bottom-10 -left-10 w-40 h-40 bg-white rounded-full" />
        </div>
        <div className="relative z-10">
          <div className="flex items-center gap-2 mb-2">
            <Clock className="w-6 h-6 text-primary-200" />
            <span className="text-primary-100 font-semibold text-sm">
              Spaced Repetition System
            </span>
          </div>
          <h1 className="text-3xl md:text-4xl font-bold text-white mb-2 flex items-center gap-3">
            <Brain className="w-10 h-10" />
            Review Your Learning
          </h1>
          <p className="text-primary-100 text-lg mb-4">
            Review these items to strengthen your memory and retain knowledge longer
          </p>

          {/* Quick Stats */}
          <div className="flex flex-wrap gap-4 text-white">
            <div className="flex items-center gap-2 bg-white/10 px-4 py-2 rounded-lg">
              <span className="font-semibold">{totalDue}</span>
              <span className="text-primary-100">Items Ready</span>
            </div>
            {overdueCount > 0 && (
              <div className="flex items-center gap-2 bg-orange-500/20 px-4 py-2 rounded-lg border border-orange-300/30">
                <span className="font-semibold">{overdueCount}</span>
                <span className="text-orange-100">Overdue</span>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* Explanation Card */}
      <div className="card p-6 bg-blue-50 dark:bg-blue-900/10 border border-blue-200 dark:border-blue-800">
        <h3 className="font-semibold text-gray-900 dark:text-white mb-2">
          💡 Why Review?
        </h3>
        <p className="text-sm text-gray-700 dark:text-gray-300">
          Regular reviews help move information from short-term to long-term memory. 
          Click on any item below to start reviewing. Reviewing on time strengthens retention and prevents forgetting.
        </p>
      </div>

      {/* Items to Review */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-bold text-gray-900 dark:text-white">
            Items Ready for Review
          </h2>
          <span className="text-sm text-gray-500 dark:text-gray-400">
            {totalDue} total
          </span>
        </div>

        {/* Loading State */}
        {isLoading && (
          <div className="space-y-3">
            <CardSkeleton count={3} />
          </div>
        )}

        {/* Empty State */}
        {!isLoading && allItems.length === 0 && (
          <div className="card p-8 text-center">
            <p className="text-gray-500 dark:text-gray-400">
              No items due for review
            </p>
          </div>
        )}

        {/* Items List */}
        {!isLoading && allItems.length > 0 && (
          <>
            {/* Quizzes Section */}
            {dueQuizzes.length > 0 && (
              <div className="space-y-3">
                <div className="flex items-center gap-2 text-sm font-medium text-gray-700 dark:text-gray-300">
                  <BookOpen className="w-4 h-4" />
                  <span>Quizzes ({dueQuizzes.length})</span>
                </div>
                {dueQuizzes.map((quiz) => (
                  <ReviewCard
                    key={quiz.id}
                    item={quiz}
                    type="quiz"
                    nextReviewAt={quiz.createdAt}
                    lastReviewedAt={quiz.createdAt}
                    retentionLevel="LEARNING"
                    strength={50}
                  />
                ))}
              </div>
            )}

            {/* Flashcards Section */}
            {dueFlashcards.length > 0 && (
              <div className="space-y-3">
                <div className="flex items-center gap-2 text-sm font-medium text-gray-700 dark:text-gray-300">
                  <Brain className="w-4 h-4" />
                  <span>Flashcards ({dueFlashcards.length})</span>
                </div>
                {dueFlashcards.map((flashcard) => (
                  <ReviewCard
                    key={flashcard.id}
                    item={flashcard}
                    type="flashcard"
                    nextReviewAt={flashcard.createdAt}
                    lastReviewedAt={flashcard.createdAt}
                    retentionLevel="LEARNING"
                    strength={50}
                  />
                ))}
              </div>
            )}
          </>
        )}
      </div>

      {/* Schedule Preview - Only if there are upcoming reviews */}
      {upcomingReviews.some(day => day.count > 0) && (
        <div className="card p-6">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            Review Schedule (Next 7 Days)
          </h2>
          <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-7 gap-2">
            {upcomingReviews.map((day) => {
              const date = parseISO(day.date);
              const today = isToday(date);
              return (
                <div
                  key={day.date}
                  className={`p-3 rounded-lg text-center ${
                    today
                      ? 'bg-primary-100 dark:bg-primary-900/30 border-2 border-primary-500'
                      : 'bg-gray-50 dark:bg-gray-800'
                  }`}
                >
                  <div className={`text-xs font-medium mb-1 ${
                    today ? 'text-primary-700 dark:text-primary-300' : 'text-gray-500 dark:text-gray-400'
                  }`}>
                    {format(date, 'EEE')}
                  </div>
                  <div className={`text-sm font-bold ${
                    today ? 'text-primary-900 dark:text-primary-100' : 'text-gray-900 dark:text-white'
                  }`}>
                    {format(date, 'd')}
                  </div>
                  {day.count > 0 && (
                    <div className="mt-1">
                      <span className={`inline-block px-2 py-0.5 rounded-full text-xs font-bold ${
                        today
                          ? 'bg-primary-600 text-white'
                          : 'bg-primary-100 text-primary-700 dark:bg-primary-900/30 dark:text-primary-300'
                      }`}>
                        {day.count}
                      </span>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};
