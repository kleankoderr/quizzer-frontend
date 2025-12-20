import { Sparkles, Target, BookOpen, Crown, X, ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '../services/api';
import { recommendationService, userService } from '../services';

export const RecommendationsPage = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const { data: recommendations = [], isLoading: recommendationsLoading } = useQuery({
    queryKey: ['ai-recommendations'],
    queryFn: recommendationService.getAll,
    staleTime: 1000 * 60 * 10,
  });

  const { data: quotaStatus } = useQuery({
    queryKey: ['user-quota'],
    queryFn: userService.getQuotaStatus,
    staleTime: 1000 * 60 * 5,
  });

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
    navigate('/quiz', { state: { openGenerator: true, topic, cancelRoute: '/recommendations' } });
  };

  const handleStudyClick = (topic: string) => {
    navigate('/study', { state: { openCreator: true, topic, activeTab: 'topic', cancelRoute: '/recommendations' } });
  };

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

  const isPremium = quotaStatus?.isPremium || false;
  const displayedRecommendations = isPremium
    ? recommendations.slice(0, 3)
    : recommendations.slice(0, 1);

  return (
    <div className="space-y-6 pb-8">
      {/* Header */}
      <div className="flex items-center gap-4">
        <button
          onClick={() => navigate('/')}
          className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
        >
          <ArrowLeft className="w-5 h-5 text-gray-600 dark:text-gray-400" />
        </button>
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-gray-900 dark:text-white">
            Smart Recommendations
          </h1>
          <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
            Personalized study suggestions based on your performance
          </p>
        </div>
      </div>

      {/* Premium Badge */}
      {!isPremium && recommendations.length > 1 && (
        <div className="card p-4 bg-gradient-to-r from-yellow-50 to-orange-50 dark:from-yellow-900/20 dark:to-orange-900/20 border-yellow-200 dark:border-yellow-800">
          <div className="flex items-center gap-3">
            <Crown className="w-5 h-5 text-yellow-600 dark:text-yellow-400 flex-shrink-0" />
            <p className="text-sm text-gray-700 dark:text-gray-300 flex-1">
              <span className="font-semibold">Unlock more recommendations!</span>{' '}
              Upgrade to premium to get up to 3 personalized recommendations.
            </p>
            <button
              onClick={() => navigate('/subscription')}
              className="px-4 py-2 bg-gradient-to-r from-yellow-500 to-orange-600 text-white text-sm font-bold rounded-lg hover:shadow-lg transition-all whitespace-nowrap"
            >
              Upgrade Now
            </button>
          </div>
        </div>
      )}

      {/* Loading State */}
      {recommendationsLoading && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              className="card p-6 dark:bg-gray-800 h-48 animate-pulse"
            >
              <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/3 mb-3" />
              <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded w-2/3 mb-4" />
              <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-full mb-2" />
              <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-5/6" />
            </div>
          ))}
        </div>
      )}

      {/* Empty State */}
      {!recommendationsLoading && recommendations.length === 0 && (
        <div className="card p-8 text-center dark:bg-gray-800">
          <Sparkles className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
            No Recommendations Yet
          </h3>
          <p className="text-gray-600 dark:text-gray-400 mb-6">
            Complete some quizzes to get personalized study recommendations based on your performance.
          </p>
          <button
            onClick={() => navigate('/quiz')}
            className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg transition-colors"
          >
            Take a Quiz
          </button>
        </div>
      )}

      {/* Recommendations Grid */}
      {!recommendationsLoading && displayedRecommendations.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {displayedRecommendations.map((rec) => (
            <div
              key={rec.topic}
              className="card p-6 dark:bg-gray-800 relative group hover:shadow-lg transition-shadow flex flex-col"
            >
              {/* Dismiss Button */}
              <button
                onClick={(e) => handleDismiss(rec.id, e)}
                className="absolute top-3 right-3 p-1.5 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 opacity-0 group-hover:opacity-100 transition-opacity"
                aria-label="Dismiss recommendation"
              >
                <X className="w-4 h-4 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300" />
              </button>

              {/* Priority Badge */}
              <span
                className={`inline-block px-2.5 py-1 rounded-full text-xs font-bold mb-3 border ${getPriorityColor(rec.priority)} w-fit`}
              >
                {rec.priority.toUpperCase()} PRIORITY
              </span>

              {/* Topic */}
              <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-2">
                {rec.topic}
              </h3>

              {/* Reason */}
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-6 leading-relaxed flex-1">
                {rec.reason}
              </p>

              {/* Action Buttons - Always at bottom */}
              <div className="flex gap-2 mt-auto">
                <button
                  onClick={() => handleQuizClick(rec.topic)}
                  className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold rounded-lg transition-colors"
                >
                  <Target className="w-4 h-4" />
                  Take Quiz
                </button>
                <button
                  onClick={() => handleStudyClick(rec.topic)}
                  className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-gray-600 hover:bg-gray-700 text-white text-sm font-semibold rounded-lg transition-colors"
                >
                  <BookOpen className="w-4 h-4" />
                  Study
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
