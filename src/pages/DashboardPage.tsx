import { useMemo, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { quoteService } from '../services/quote.service';
import {
  ArrowRight,
  BookOpen,
  Clock,
  TrendingUp,
  BarChart3,
  Sparkles,
  Target,
  Brain,
  Award,
  Calendar,
} from 'lucide-react';
import { StatCardSkeleton, ChartSkeleton } from '../components/skeletons';
import { StatCard } from '../components/StatCard';
import { useQuery } from '@tanstack/react-query';
import { studyService } from '../services/study.service';
import { contentService, coachingService, recommendationService } from '../services';
import { statisticsService } from '../services/statistics.service';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import { format, subDays, startOfDay } from 'date-fns';
import { useTour } from '../hooks';
import { onboardingTour } from '../tours';


const getScoreColor = (score: number, totalQuestions: number) => {
  const percentage = score / (totalQuestions || 1);
  if (percentage >= 0.7) return 'text-green-600 dark:text-green-400';
  if (percentage >= 0.5) return 'text-yellow-600 dark:text-yellow-400';
  return 'text-red-600 dark:text-red-400';
};

export const DashboardPage = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { startIfNotCompleted } = useTour();

  useEffect(() => {
    startIfNotCompleted('onboarding', onboardingTour);
  }, [startIfNotCompleted]);

  const { data: dailyQuote } = useQuery({
    queryKey: ['daily-quote'],
    queryFn: quoteService.getDailyQuote,
    staleTime: 1000 * 60 * 60, // 1 hour
  });

  const { data: studyInsights, isLoading: insightsLoading } = useQuery({
    queryKey: ['study-insights'],
    queryFn: studyService.getInsights,
  });

  const { data: statistics, isLoading: statsLoading } = useQuery({
    queryKey: ['statistics-overview'],
    queryFn: statisticsService.getOverview,
  });

  const { data: recentAttemptsData, isLoading: attemptsLoading } = useQuery({
    queryKey: ['recent-attempts-dashboard'],
    queryFn: () => statisticsService.getAttempts({ limit: 5, page: 1 }),
  });

  const { data: activityData, isLoading: activityLoading } = useQuery({
    queryKey: ['activity-heatmap'],
    queryFn: () => statisticsService.getActivityHeatmap(),
  });

  // Fetch recent content for activity feed
  const { data: recentContent, isLoading: contentLoading } = useQuery({
    queryKey: ['recent-content'],
    queryFn: async () => {
      const response = await contentService.getAll();
      return response.data.slice(0, 5);
    },
  });

  const { data: coachingTips } = useQuery({
    queryKey: ['coaching-tips'],
    queryFn: coachingService.getTips,
    staleTime: 1000 * 60 * 15, // 15 minutes
  });

  // Fetch AI-powered recommendations
  const { data: recommendations = [], isLoading: recommendationsLoading } = useQuery({
    queryKey: ['ai-recommendations'],
    queryFn: recommendationService.getAll,
    staleTime: 1000 * 60 * 10, // 10 minutes
  });

  // Fetch due reviews count
  const { data: dueReviewsData } = useQuery({
    queryKey: ['due-reviews'],
    queryFn: studyService.getDueForReview,
    refetchInterval: 1000 * 60 * 5, // Refresh every 5 minutes
  });

  // Get the top recommendation (legacy support)
  const topRecommendation = useMemo(() => {
    if (studyInsights?.suggestions && studyInsights.suggestions.length > 0) {
      return studyInsights.suggestions[0];
    }
    return null;
  }, [studyInsights]);

  // Calculate simple stats
  const activeTopics = useMemo(() => {
    if (!recentContent) return 0;
    const uniqueTopics = new Set(recentContent.map((c) => c.topic));
    return uniqueTopics.size;
  }, [recentContent]);

  const retentionLevel = useMemo(() => {
    if (!studyInsights?.retentionDistribution) return 'Getting Started';
    const dist = studyInsights.retentionDistribution;
    const total =
      dist.LEARNING + dist.REINFORCEMENT + dist.RECALL + dist.MASTERY;
    if (total === 0) return 'Getting Started';

    const masteryPercent = (dist.MASTERY / total) * 100;
    if (masteryPercent > 50) return 'Excellent';
    if (masteryPercent > 25) return 'Improving';
    return 'Building';
  }, [studyInsights]);

  // Prepare activity chart data (last 7 days)
  const activityChartData = useMemo(() => {
    if (!activityData) {
      // Generate empty data for last 7 days
      return Array.from({ length: 7 }, (_, i) => {
        const date = startOfDay(subDays(new Date(), 6 - i));
        return {
          date: format(date, 'MMM dd'),
          count: 0,
        };
      });
    }

    // Get last 7 days
    const last7Days = Array.from({ length: 7 }, (_, i) => {
      const date = startOfDay(subDays(new Date(), 6 - i));
      const dateStr = format(date, 'yyyy-MM-dd');
      const activity = activityData.find((a) => a.date === dateStr);
      return {
        date: format(date, 'MMM dd'),
        count: activity?.count || 0,
      };
    });

    return last7Days;
  }, [activityData]);

  const getActionLabel = (action?: string) => {
    switch (action) {
      case 'quiz':
        return 'Take a Quiz';
      case 'flashcards':
        return 'Review Flashcards';
      case 'challenge':
        return 'View Challenges';
      default:
        return 'View Details';
    }
  };

  const isLoading = insightsLoading || statsLoading || contentLoading;

  if (isLoading) {
    return (
      <div className="space-y-6 pb-8">
        <div className="h-48" />
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <StatCardSkeleton count={3} />
        </div>
        <ChartSkeleton />
        <StatCardSkeleton count={1} />
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-8">
      {/* Hero Header */}
      <header className="relative overflow-hidden rounded-xl bg-gradient-to-br from-blue-600 via-indigo-600 to-cyan-600 dark:from-blue-800 dark:via-indigo-800 dark:to-cyan-800 p-4 md:p-8 shadow-lg">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute -top-10 -right-10 w-40 h-40 bg-white rounded-full hidden md:block"></div>
          <div className="absolute -bottom-10 -left-10 w-40 h-40 bg-white rounded-full hidden md:block"></div>
        </div>

        <div className="relative z-10 flex flex-col md:flex-row md:items-end md:justify-between gap-6">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <Sparkles className="w-6 h-6 text-yellow-300" />
              <span className="text-yellow-300 font-semibold text-sm">
                Your Learning Hub
              </span>
            </div>
            <h1 className="text-2xl md:text-4xl font-bold text-white mb-2">
              Welcome back, {user?.name || 'Learner'}! 👋
            </h1>
            <p className="text-blue-100 dark:text-blue-200 text-lg">
              Track your progress and continue your learning journey
            </p>
          </div>

          <div className="flex flex-col sm:flex-row gap-3 w-full md:w-auto">
            <button
              id="start-studying-btn"
              onClick={() => navigate('/study', { state: { openCreator: true } })}
              className="flex items-center justify-center gap-2 px-6 py-3 bg-white text-blue-600 hover:bg-blue-50 rounded-xl font-bold transition-all shadow-lg hover:shadow-xl hover:-translate-y-0.5 w-full sm:w-auto"
            >
              <BookOpen className="w-5 h-5" />
              Start Studying
            </button>
            <button
              id="create-quiz-btn"
              onClick={() => navigate('/quiz', { state: { openGenerator: true } })}
              className="flex items-center justify-center gap-2 px-6 py-3 bg-blue-600/20 text-white hover:bg-blue-600/30 border border-white/20 backdrop-blur-sm rounded-xl font-semibold transition-colors w-full sm:w-auto"
            >
              <Brain className="w-5 h-5" />
              Create Quiz
            </button>
          </div>
        </div>
      </header>

      {/* Daily Inspiration */}
      {dailyQuote && (
        <div className="px-1 py-2">
          <p className="text-gray-600 dark:text-gray-400 text-sm italic text-center">
            "{dailyQuote.text}"{' '}
            <span className="text-gray-400 dark:text-gray-500 not-italic ml-2">
              — {dailyQuote.author}
            </span>
          </p>
        </div>
      )}

      {/* Smart Recommendations CTA */}
      {recommendationsLoading ? null : (
        recommendations.length > 0 && (
          <button
            onClick={() => navigate('/recommendations')}
            className="w-full flex items-center justify-between p-4 rounded-lg border-2 border-blue-200 dark:border-blue-800 bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 hover:border-blue-300 dark:hover:border-blue-700 transition-all group"
          >
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-600 rounded-lg">
                <Sparkles className="w-5 h-5 text-white" />
              </div>
              <div className="text-left">
                <p className="font-semibold text-gray-900 dark:text-white">
                  {recommendations.length} Smart Recommendation{recommendations.length === 1 ? '' : 's'} Available
                </p>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Click to view personalized study suggestions
                </p>
              </div>
            </div>
            <ArrowRight className="w-5 h-5 text-gray-400 group-hover:text-blue-600 dark:group-hover:text-blue-400 group-hover:translate-x-1 transition-all" />
          </button>
        )
      )}

      {/* Review Now Card - Items Due for Review */}
      {dueReviewsData && dueReviewsData.totalDue > 0 && (
        <button
          onClick={() => navigate('/review')}
          className={`w-full flex items-center justify-between p-4 rounded-lg border-2 transition-all group ${
            dueReviewsData.overdueCount > 0
              ? 'border-red-200 dark:border-red-800 bg-gradient-to-r from-red-50 to-orange-50 dark:from-red-900/20 dark:to-orange-900/20 hover:border-red-300 dark:hover:border-red-700'
              : 'border-orange-200 dark:border-orange-800 bg-gradient-to-r from-orange-50 to-yellow-50 dark:from-orange-900/20 dark:to-yellow-900/20 hover:border-orange-300 dark:hover:border-orange-700'
          }`}
        >
          <div className="flex items-center gap-3">
            <div
              className={`p-2 rounded-lg ${
                dueReviewsData.overdueCount > 0
                  ? 'bg-red-600'
                  : 'bg-orange-600'
              }`}
            >
              <Clock className="w-5 h-5 text-white" />
            </div>
            <div className="text-left">
              <p
                className={`font-semibold ${
                  dueReviewsData.overdueCount > 0
                    ? 'text-red-900 dark:text-red-100'
                    : 'text-orange-900 dark:text-orange-100'
                }`}
              >
                {dueReviewsData.totalDue} Item{dueReviewsData.totalDue === 1 ? '' : 's'} Due for Review
                {dueReviewsData.overdueCount > 0 && (
                  <span className="ml-2 text-sm">• {dueReviewsData.overdueCount} Overdue</span>
                )}
              </p>
              <p
                className={`text-sm ${
                  dueReviewsData.overdueCount > 0
                    ? 'text-red-700 dark:text-red-300'
                    : 'text-orange-700 dark:text-orange-300'
                }`}
              >
                {dueReviewsData.overdueCount > 0
                  ? "Don't let your knowledge fade. Review now!"
                  : 'Keep your learning fresh with regular reviews'}
              </p>
            </div>
          </div>
          <ArrowRight
            className={`w-5 h-5 text-gray-400 transition-all group-hover:translate-x-1 ${
              dueReviewsData.overdueCount > 0
                ? 'group-hover:text-red-600 dark:group-hover:text-red-400'
                : 'group-hover:text-orange-600 dark:group-hover:text-orange-400'
            }`}
          />
        </button>
      )}

      {/* Smart Recommendation - High Priority Action (Legacy - Hidden if new recommendations exist) */}
      {recommendations.length ? null : (
        topRecommendation && (
          <div className="card relative overflow-hidden border-0 shadow-lg group">
            <div className="absolute inset-0 bg-blue-600 opacity-100 transition-all duration-300 group-hover:scale-105" />

            {/* Background decoration */}
            <div className="absolute top-0 right-0 -mt-10 -mr-10 w-40 h-40 bg-white/10 rounded-full blur-2xl" />
            <div className="absolute bottom-0 left-0 -mb-10 -ml-10 w-40 h-40 bg-black/10 rounded-full blur-2xl" />

            <div className="relative z-10 p-4 md:p-6 text-white">
              <div className="flex items-center gap-2 mb-3">
                <div className="p-2 bg-white/20 rounded-lg backdrop-blur-sm">
                  <Sparkles className="w-5 h-5 text-yellow-300" />
                </div>
                <h3 className="text-sm font-bold tracking-wider uppercase text-blue-100">
                  Recommended for You
                </h3>
              </div>

              <h4 className="text-xl md:text-2xl font-bold mb-2 text-white">
                {topRecommendation.topic}
              </h4>
              <p className="text-blue-100 mb-6 text-sm leading-relaxed opacity-90">
                {topRecommendation.reason}
              </p>

              <div className="flex flex-col sm:flex-row gap-3">
                {topRecommendation.quizId && (
                  <button
                    onClick={() => navigate(`/quiz/${topRecommendation.quizId}`)}
                    className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-white text-blue-600 hover:bg-blue-50 rounded-xl transition-all duration-200 font-bold shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
                  >
                    <Target className="w-5 h-5" />
                    Take Quiz
                  </button>
                )}

                {topRecommendation.flashcardSetId && (
                  <button
                    onClick={() =>
                      navigate(`/flashcards/${topRecommendation.flashcardSetId}`)
                    }
                    className={`flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-xl transition-all duration-200 font-bold shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 ${
                      topRecommendation.quizId
                        ? 'bg-blue-700/50 text-white hover:bg-blue-700/70 backdrop-blur-sm border border-white/20'
                        : 'bg-white text-blue-600 hover:bg-blue-50'
                    }`}
                  >
                    <Brain className="w-5 h-5" />
                    Review Cards
                  </button>
                )}

                {!topRecommendation.quizId &&
                  !topRecommendation.flashcardSetId && (
                    <button
                      onClick={() => navigate('/study')}
                      className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-white text-blue-600 hover:bg-blue-50 rounded-xl transition-all duration-200 font-bold shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
                    >
                      <BookOpen className="w-5 h-5" />
                      Continue Learning
                    </button>
                  )}
              </div>
            </div>
          </div>
        )
      )}

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <StatCard
          title="Total Practice"
          value={statistics?.totalAttempts || 0}
          icon={BookOpen}
          description={`${statistics?.quizAttempts || 0} quizzes, ${statistics?.flashcardAttempts || 0} flashcards`}
          color="blue"
          variant="gradient"
        />

        <StatCard
          title="Avg. Accuracy"
          value={
            statistics?.averageAccuracy
              ? `${statistics.averageAccuracy.toFixed(1)}%`
              : '0%'
          }
          icon={TrendingUp}
          trend="Keep it up!"
          color="green"
          variant="gradient"
        />

        <StatCard
          title="Current Streak"
          value={statistics?.currentStreak || 0}
          icon={Award}
          description="days"
          color="orange"
          variant="gradient"
        />
      </div>

      {/* Main Content Grid: Recent Attempts & Learning Progress */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Attempts */}
        {!attemptsLoading &&
          recentAttemptsData &&
          recentAttemptsData.attempts.length > 0 && (
            <div className="card p-4 md:p-6 dark:bg-gray-800">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                  Recent Practice History
                </h3>
                <button
                  onClick={() => navigate('/statistics')}
                  className="text-sm text-primary-600 dark:text-primary-400 hover:text-primary-700 dark:hover:text-primary-300 font-medium flex items-center gap-1"
                >
                  View All
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>

              <div className="space-y-2">
                {recentAttemptsData.attempts.slice(0, 3).map((attempt) => (
                  <button
                    key={attempt.id}
                    onClick={() => {
                      if (attempt.type === 'quiz' && attempt.quiz?.id) {
                        navigate(`/attempts?quizId=${attempt.quiz.id}`);
                      } else if (
                        attempt.type === 'flashcard' &&
                        attempt.flashcardSet?.id
                      ) {
                        navigate(
                          `/attempts?flashcardId=${attempt.flashcardSet.id}`
                        );
                      }
                    }}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' || e.key === ' ') {
                        if (attempt.type === 'quiz' && attempt.quiz?.id) {
                          navigate(`/attempts?quizId=${attempt.quiz.id}`);
                        } else if (
                          attempt.type === 'flashcard' &&
                          attempt.flashcardSet?.id
                        ) {
                          navigate(
                            `/attempts?flashcardId=${attempt.flashcardSet.id}`
                          );
                        }
                      }
                    }}
                    className="w-full flex items-center justify-between p-3 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors cursor-pointer group gap-4 text-left border-none bg-transparent"
                  >
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900 dark:text-white truncate group-hover:text-primary-600 dark:group-hover:text-primary-400 transition-colors">
                        {attempt.quiz?.title ||
                          attempt.flashcardSet?.title ||
                          'Untitled'}
                      </p>
                      <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                        <span className="hidden sm:inline">
                          {attempt.type === 'quiz' ? 'Quiz' : 'Flashcards'}{' '}
                          •{' '}
                        </span>
                        {new Date(attempt.completedAt).toLocaleDateString(
                          undefined,
                          { month: 'short', day: 'numeric' }
                        )}
                      </p>
                    </div>
                    {attempt.score !== undefined && attempt.totalQuestions && (
                      <div className="flex items-center gap-2 flex-shrink-0">
                        <span
                          className={`text-sm font-semibold ${getScoreColor(attempt.score, attempt.totalQuestions)}`}
                        >
                          {Math.round(
                            (attempt.score / (attempt.totalQuestions || 1)) * 100
                          )}
                          %
                        </span>
                        <ArrowRight className="w-4 h-4 text-gray-400 group-hover:text-primary-600 dark:group-hover:text-primary-400 opacity-0 group-hover:opacity-100 transition-all" />
                      </div>
                    )}
                  </button>
                ))}
              </div>
            </div>
          )}

        {/* Learning Progress */}
        <div className="card p-4 md:p-6 dark:bg-gray-800">
          <div className="flex items-center gap-2 mb-4">
            <Brain className="w-5 h-5 text-blue-600 dark:text-blue-400" />
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
              Learning Progress
            </h3>
          </div>

          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600 dark:text-gray-400">
                Active Topics
              </span>
              <span className="text-xl font-bold text-gray-900 dark:text-white">
                {activeTopics}
              </span>
            </div>

            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600 dark:text-gray-400">
                Retention Level
              </span>
              <div className="flex items-center gap-2">
                <span className="text-xl font-bold text-gray-900 dark:text-white">
                  {retentionLevel}
                </span>
                {retentionLevel !== 'Getting Started' && (
                  <TrendingUp className="w-4 h-4 text-primary-600 dark:text-primary-400" />
                )}
              </div>
            </div>

            {studyInsights?.retentionDistribution && (
              <div className="pt-2">
                <div className="flex justify-between text-xs text-gray-500 dark:text-gray-400 mb-2">
                  <span>Mastery Progress</span>
                  <span>
                    {Math.round(
                      ((studyInsights.retentionDistribution.RECALL +
                        studyInsights.retentionDistribution.MASTERY) /
                        (studyInsights.retentionDistribution.LEARNING +
                          studyInsights.retentionDistribution.REINFORCEMENT +
                          studyInsights.retentionDistribution.RECALL +
                          studyInsights.retentionDistribution.MASTERY || 1)) *
                        100
                    )}
                    %
                  </span>
                </div>
                <div className="h-3 bg-gray-100 dark:bg-gray-700 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-blue-500 to-indigo-500 rounded-full transition-all duration-500"
                    style={{
                      width: `${
                        ((studyInsights.retentionDistribution.RECALL +
                          studyInsights.retentionDistribution.MASTERY) /
                          (studyInsights.retentionDistribution.LEARNING +
                            studyInsights.retentionDistribution.REINFORCEMENT +
                            studyInsights.retentionDistribution.RECALL +
                            studyInsights.retentionDistribution.MASTERY || 1)) *
                        100
                      }%`,
                    }}
                  />
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Activity Chart */}
      <div className="card p-4 md:p-6 dark:bg-gray-800">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Calendar className="w-5 h-5 text-primary-600 dark:text-primary-400" />
            <h2 className="text-xl font-bold text-gray-900 dark:text-white">
              Activity (Last 7 Days)
            </h2>
          </div>
        </div>

        {activityLoading ? (
          <div className="h-[200px] flex items-center justify-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
          </div>
        ) : (
          <ResponsiveContainer width="100%" height={200}>
            <AreaChart
              data={activityChartData}
              margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
            >
              <defs>
                <linearGradient id="colorActivity" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid
                strokeDasharray="3 3"
                vertical={false}
                stroke="#e5e7eb"
              />
              <XAxis
                dataKey="date"
                tick={{ fontSize: 12, fill: '#6b7280' }}
                axisLine={false}
                tickLine={false}
              />
              <YAxis
                tick={{ fontSize: 12, fill: '#6b7280' }}
                axisLine={false}
                tickLine={false}
                allowDecimals={false}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: 'white',
                  border: '1px solid #e5e7eb',
                  borderRadius: '8px',
                  padding: '8px 12px',
                }}
              />
              <Area
                type="monotone"
                dataKey="count"
                stroke="#3b82f6"
                strokeWidth={2}
                fillOpacity={1}
                fill="url(#colorActivity)"
              />
            </AreaChart>
          </ResponsiveContainer>
        )}
      </div>

      {/* Coaching Tips */}
      {coachingTips && coachingTips.length > 0 && (
        <div className="card p-4 md:p-6 bg-gradient-to-r from-indigo-500 to-purple-600 text-white border-0 shadow-lg">
          <div className="flex items-start gap-4">
            <div className="p-3 bg-white/20 rounded-xl backdrop-blur-sm">
              <Sparkles className="w-6 h-6 text-yellow-300" />
            </div>
            <div className="flex-1">
              <h3 className="text-lg font-bold mb-1">Coach's Tip</h3>
              <div className="space-y-3">
                {coachingTips.map((tip) => (
                  <div
                    key={tip.message}
                    className="bg-white/10 rounded-lg p-3 backdrop-blur-sm border border-white/10"
                  >
                    <p className="text-sm font-medium leading-relaxed">
                      {tip.message}
                    </p>
                    {tip.action && (
                      <div className="mt-2 flex justify-end">
                        <button
                          onClick={() => {
                            if (tip.action === 'quiz') navigate('/quiz');
                            else if (tip.action === 'flashcards')
                              navigate('/study');
                            else if (tip.action === 'challenge')
                              navigate('/challenges');
                          }}
                          className="text-xs bg-white text-indigo-600 px-3 py-1.5 rounded-full font-bold hover:bg-indigo-50 transition-colors"
                        >
                          {getActionLabel(tip.action)}
                        </button>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Link
          to="/study"
          className="card p-4 md:p-6 dark:bg-gray-800 hover:border-primary-500 dark:hover:border-primary-500 transition-all group"
        >
          <div className="flex items-center gap-3">
            <div className="p-3 bg-primary-100 dark:bg-primary-900/30 rounded-lg">
              <BookOpen className="w-5 h-5 text-primary-600 dark:text-primary-400" />
            </div>
            <div className="flex-1">
              <p className="font-semibold text-gray-900 dark:text-white group-hover:text-primary-600 dark:group-hover:text-primary-400 transition-colors">
                Create Content
              </p>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                Start learning
              </p>
            </div>
            <ArrowRight className="w-5 h-5 text-gray-400 group-hover:text-primary-600 dark:group-hover:text-primary-400 group-hover:translate-x-1 transition-all" />
          </div>
        </Link>

        <Link
          to="/statistics"
          className="card p-4 md:p-6 dark:bg-gray-800 hover:border-primary-500 dark:hover:border-primary-500 transition-all group"
        >
          <div className="flex items-center gap-3">
            <div className="p-3 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
              <BarChart3 className="w-5 h-5 text-blue-600 dark:text-blue-400" />
            </div>
            <div className="flex-1">
              <p className="font-semibold text-gray-900 dark:text-white group-hover:text-primary-600 dark:group-hover:text-primary-400 transition-colors">
                Performance
              </p>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                Track progress
              </p>
            </div>
            <ArrowRight className="w-5 h-5 text-gray-400 group-hover:text-primary-600 dark:group-hover:text-primary-400 group-hover:translate-x-1 transition-all" />
          </div>
        </Link>

        <Link
          to="/attempts"
          className="card p-4 md:p-6 dark:bg-gray-800 hover:border-indigo-500 dark:hover:border-indigo-500 transition-all group"
        >
          <div className="flex items-center gap-3">
            <div className="p-3 bg-indigo-100 dark:bg-indigo-900/30 rounded-lg">
              <Clock className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
            </div>
            <div className="flex-1">
              <p className="font-semibold text-gray-900 dark:text-white group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
                Practice History
              </p>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                Review history
              </p>
            </div>
            <ArrowRight className="w-5 h-5 text-gray-400 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 group-hover:translate-x-1 transition-all" />
          </div>
        </Link>
      </div>
    </div>
  );
};
