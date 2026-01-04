import { Target, BookOpen, X } from 'lucide-react';
import type { Recommendation } from '../types';

interface RecommendationCardProps {
  recommendation: Recommendation;
  onDismiss: (id: string) => void;
  onQuizClick: (topic: string) => void;
  onStudyClick: (topic: string) => void;
  className?: string; // Allow custom styling wrapper
}

export const RecommendationCard = ({
  recommendation,
  onDismiss,
  onQuizClick,
  onStudyClick,
  className = '',
}: RecommendationCardProps) => {
  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high':
        return 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400 border-red-200 dark:border-red-800';
      case 'medium':
        return 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400 border-yellow-200 dark:border-yellow-800';
      case 'low':
        return 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400 border-blue-200 dark:border-blue-800';
      default:
        return 'bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-400 border-gray-200 dark:border-gray-700';
    }
  };

  return (
    <div
      className={`relative group hover:shadow-lg transition-shadow flex flex-col ${className}`}
    >
      {/* Dismiss Button */}
      {recommendation.id && (
        <button
          onClick={(e) => {
            e.stopPropagation();
            onDismiss(recommendation.id!);
          }}
          className="absolute top-3 right-3 p-1.5 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors z-10"
          aria-label="Dismiss recommendation"
        >
          <X className="w-4 h-4" />
        </button>
      )}

      {/* Priority Badge */}
      <span
        className={`inline-block px-2.5 py-1 rounded-full text-xs font-bold mb-3 border ${getPriorityColor(
          recommendation.priority
        )} w-fit`}
      >
        {recommendation.priority.toUpperCase()} PRIORITY
      </span>

      {/* Topic */}
      <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-2 line-clamp-1">
        {recommendation.topic}
      </h3>

      {/* Reason */}
      <p className="text-sm text-gray-600 dark:text-gray-400 mb-6 leading-relaxed flex-1 line-clamp-3">
        {recommendation.reason}
      </p>

      {/* Action Buttons */}
      <div className="flex gap-2 mt-auto">
        <button
          onClick={() => onQuizClick(recommendation.topic)}
          className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold rounded-lg transition-colors"
        >
          <Target className="w-4 h-4" />
          Take Quiz
        </button>
        <button
          onClick={() => onStudyClick(recommendation.topic)}
          className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-gray-600 hover:bg-gray-700 text-white text-sm font-semibold rounded-lg transition-colors"
        >
          <BookOpen className="w-4 h-4" />
          Study
        </button>
      </div>
    </div>
  );
};
