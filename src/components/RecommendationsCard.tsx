import { Sparkles, Target, BookOpen, Crown, X } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '../services/api';
import type { Recommendation } from '../types';

interface RecommendationsCardProps {
  recommendations: Recommendation[];
  isLoading: boolean;
  isPremium: boolean;
}

export const RecommendationsCard = ({
  recommendations,
  isLoading,
  isPremium,
}: RecommendationsCardProps) => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const dismissMutation = useMutation({
    mutationFn: async (recommendationId: string) => {
      await apiClient.patch(`/recommendations/${recommendationId}/dismiss`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['ai-recommendations'] });
    },
  });

  const handleDismiss = (id: string | undefined, e: React.MouseEvent) => {
    e.stopPropagation();
    if (id) {
      dismissMutation.mutate(id);
    }
  };

  const handleQuizClick = (topic: string) => {
    // Open quiz generator with topic prefilled
    navigate('/quiz', { state: { openGenerator: true, presetTopic: topic } });
  };

  const handleStudyClick = (topic: string) => {
    // Open study material creator with topic prefilled
    navigate('/study', { state: { openCreator: true, presetTopic: topic } });
  };

  if (isLoading) {
    return (
      <div className="py-4">
        <div className="flex items-center gap-2 mb-3">
          <Sparkles className="w-4 h-4 text-blue-600 dark:text-blue-400 animate-pulse" />
          <h3 className="text-sm font-semibold text-gray-900 dark:text-white">
            AI Recommendations
          </h3>
        </div>
        <div className="flex gap-3 overflow-x-auto pb-2">
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              className="flex-shrink-0 w-64 h-32 bg-gray-100 dark:bg-gray-700 rounded-lg animate-pulse"
            />
          ))}
        </div>
      </div>
    );
  }

  if (!recommendations || recommendations.length === 0) {
    return null;
  }

  const getPriorityDot = (priority: string) => {
    switch (priority) {
      case 'high':
        return 'bg-red-500';
      case 'medium':
        return 'bg-yellow-500';
      case 'low':
        return 'bg-blue-500';
      default:
        return 'bg-gray-500';
    }
  };

  const displayedRecommendations = isPremium
    ? recommendations.slice(0, 3)
    : recommendations.slice(0, 1);

  return (
    <div className="py-4 border-t border-gray-200 dark:border-gray-700">
      {/* Compact Header */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-blue-600 dark:text-blue-400" />
          <h3 className="text-sm font-semibold text-gray-900 dark:text-white">
            AI Recommendations
          </h3>
          {!isPremium && recommendations.length > 1 && (
            <button
              onClick={() => navigate('/subscription')}
              className="flex items-center gap-1 px-2 py-0.5 bg-gradient-to-r from-yellow-400 to-orange-500 text-white text-xs font-bold rounded-full hover:shadow-md transition-all"
            >
              <Crown className="w-3 h-3" />
              <span className="hidden sm:inline">Upgrade</span>
            </button>
          )}
        </div>
      </div>

      {/* Horizontal Scrollable Cards */}
      <div className="flex gap-3 overflow-x-auto pb-2 hide-scrollbar">
        {displayedRecommendations.map((rec) => (
          <div
            key={rec.topic}
            className="flex-shrink-0 w-72 relative group p-4 rounded-lg border border-gray-200 dark:border-gray-700 hover:border-blue-400 dark:hover:border-blue-500 transition-all bg-white dark:bg-gray-800 hover:shadow-md"
          >
            {/* Dismiss Button */}
            <button
              onClick={(e) => handleDismiss(rec.id, e)}
              className="absolute top-2 right-2 p-1 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 opacity-0 group-hover:opacity-100 transition-opacity"
              aria-label="Dismiss recommendation"
            >
              <X className="w-3.5 h-3.5 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300" />
            </button>

            {/* Priority Indicator */}
            <div className="flex items-center gap-2 mb-2">
              <div className={`w-2 h-2 rounded-full ${getPriorityDot(rec.priority)}`} />
              <span className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                {rec.priority}
              </span>
            </div>

            {/* Topic */}
            <h4 className="text-sm font-bold text-gray-900 dark:text-white mb-1.5 line-clamp-1">
              {rec.topic}
            </h4>

            {/* Reason */}
            <p className="text-xs text-gray-600 dark:text-gray-400 mb-3 line-clamp-2">
              {rec.reason}
            </p>

            {/* Action Buttons - Compact */}
            <div className="flex gap-2">
              <button
                onClick={() => handleQuizClick(rec.topic)}
                className="flex-1 flex items-center justify-center gap-1.5 px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded transition-colors"
              >
                <Target className="w-3 h-3" />
                Quiz
              </button>
              <button
                onClick={() => handleStudyClick(rec.topic)}
                className="flex-1 flex items-center justify-center gap-1.5 px-3 py-1.5 bg-gray-600 hover:bg-gray-700 text-white text-xs font-semibold rounded transition-colors"
              >
                <BookOpen className="w-3 h-3" />
                Study
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Custom scrollbar hiding */}
      <style dangerouslySetInnerHTML={{ __html: `
        .hide-scrollbar::-webkit-scrollbar {
          display: none;
        }
        .hide-scrollbar {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }
      ` }} />
    </div>
  );
};
