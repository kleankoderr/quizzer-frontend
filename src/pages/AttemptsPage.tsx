import { useState, useMemo, useEffect } from 'react';
import { useNavigate, useSearchParams, useParams } from 'react-router-dom';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from 'recharts';
import {
  Calendar,
  Filter,
  TrendingUp,
  Award,
  BookOpen,
  Layers,
  ChevronRight,
  ArrowLeft,
} from 'lucide-react';
import { format, parseISO } from 'date-fns';
import { Toast as toast } from '../utils/toast';
import type { Attempt } from '../types';
import { useAttempts } from '../hooks';
import {
  CardSkeleton,
  ChartSkeleton,
  StatCardSkeleton,
} from '../components/skeletons';
import { StatCard } from '../components/StatCard';
import { AttemptListItem } from '../components/AttemptListItem';

const COLORS = ['#3b82f6', '#10b981', 'rgb(236, 72, 153)'];

// Custom dot component for the line chart
interface CustomDotProps {
  cx?: number;
  cy?: number;
  payload?: {
    fill: string;
  };
}

function CustomDot({ cx, cy, payload }: Readonly<CustomDotProps>) {
  if (!cx || !cy || !payload) return null;
  
  return (
    <circle
      cx={cx}
      cy={cy}
      r={5}
      fill={payload.fill}
      stroke="#fff"
      strokeWidth={2}
    />
  );
}

export function AttemptsPage() {
  const navigate = useNavigate();
  const { id: routeChallengeId } = useParams(); // Get ID from URL path if present
  const [searchParams, setSearchParams] = useSearchParams();
  const [filterType, setFilterType] = useState<
    'all' | 'quiz' | 'flashcard' | 'challenge'
  >('all');
  const [selectedItem, setSelectedItem] = useState<{
    id: string;
    title: string;
    type: 'quiz' | 'flashcard' | 'challenge';
  } | null>(null);

  // Get URL params for filtering
  const quizId = searchParams.get('quizId');
  const flashcardId = searchParams.get('flashcardId');
  // PRIORITIZE route params for challenges:
  const challengeId = routeChallengeId || searchParams.get('challengeId');
  const typeParam = searchParams.get('type');

  // Sync filter type with URL params or Route params
  useEffect(() => {
    if (routeChallengeId) {
      setFilterType('challenge');
      return;
    }

    if (
      typeParam === 'quiz' ||
      typeParam === 'flashcard' ||
      typeParam === 'challenge' ||
      typeParam === 'all'
    ) {
      setFilterType(typeParam);
    }
  }, [typeParam, routeChallengeId]);

  // Use React Query hook with filters
  const {
    data: attemptsData,
    isLoading: loading,
    error,
  } = useAttempts({
    quizId: quizId || undefined,
    flashcardSetId: flashcardId || undefined,
    challengeId: challengeId || undefined,
  });

  // Extract attempts array from paginated response (memoized to prevent dependency issues)
  const attempts = useMemo(
    () => attemptsData?.attempts || [],
    [attemptsData?.attempts]
  );

  // Handle errors
  if (error) {
    toast.error('Failed to load practice history');
  }

  // Sync selected item with URL params
  useEffect(() => {
    if (!quizId && !flashcardId && !challengeId) {
      setSelectedItem(null);
      return;
    }

    if (attempts.length > 0) {
      if (quizId) {
        const attempt =
          attempts.find((a) => a.quizId === quizId) || attempts[0];
        setSelectedItem({
          id: quizId,
          title: attempt.quiz?.title || 'Quiz',
          type: 'quiz',
        });
      } else if (challengeId) {
        const attempt =
          attempts.find((a) => a.challengeId === challengeId) || attempts[0];
        setSelectedItem({
          id: challengeId,
          title: attempt.challenge?.title || 'Challenge',
          type: 'challenge',
        });
      } else if (flashcardId) {
        const attempt =
          attempts.find((a) => a.flashcardSetId === flashcardId) || attempts[0];
        setSelectedItem({
          id: flashcardId,
          title: attempt.flashcardSet?.title || 'Flashcard Set',
          type: 'flashcard',
        });
      }
    }
  }, [quizId, flashcardId, challengeId, attempts]);

  // Use useMemo for filtering instead of useEffect
  const filteredAttempts = useMemo(() => {
    if (filterType === 'all') return attempts;
    return attempts.filter((attempt) => attempt.type === filterType);
  }, [attempts, filterType]);

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <div className="mb-4">
            <div className="h-8 w-48 bg-gray-200 dark:bg-gray-700 rounded mb-2 animate-pulse"></div>
            <div className="h-4 w-64 bg-gray-200 dark:bg-gray-700 rounded animate-pulse"></div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
            <StatCardSkeleton count={4} />
          </div>
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          <ChartSkeleton />
          <ChartSkeleton />
        </div>
        <div className="space-y-4">
          <CardSkeleton count={3} />
        </div>
      </div>
    );
  }

  const handleClearSelection = () => {
    setSelectedItem(null);
    setSearchParams({});
  };

  // Calculate statistics
  const attemptStats = {
    total: filteredAttempts.length,
    quizzes: filteredAttempts.filter((a) => a.type === 'quiz').length,
    flashcards: filteredAttempts.filter((a) => a.type === 'flashcard').length,
    challenges: filteredAttempts.filter((a) => a.type === 'challenge').length,
    averageScore:
      filteredAttempts.length > 0
        ? Math.round(
            filteredAttempts
              .filter(
                (a) =>
                  a.score !== undefined &&
                  a.totalQuestions &&
                  a.totalQuestions > 0
              )
              .reduce(
                (sum, a) =>
                  sum + Math.max(0, (a.score! / a.totalQuestions!) * 100),
                0
              ) /
              filteredAttempts.filter(
                (a) =>
                  a.score !== undefined &&
                  a.totalQuestions &&
                  a.totalQuestions > 0
              ).length
          )
        : 0,
  };

  // Prepare chart data - Score trend over time
  const scoreTrendData = filteredAttempts
    .filter(
      (a) => a.score !== undefined && a.totalQuestions && a.totalQuestions > 0
    )
    .slice(0, 20)
    .reverse()
    .map((attempt, index) => {
      const rawPercent = (attempt.score! / attempt.totalQuestions!) * 100;
      const scorePercent = Math.round(Math.max(0, rawPercent));
      
      // Determine color based on performance
      let performanceColor: string;
      if (scorePercent >= 70) {
        performanceColor = '#10b981'; // Green - Good performance
      } else if (scorePercent >= 50) {
        performanceColor = '#f59e0b'; // Yellow - Fair performance
      } else {
        performanceColor = '#ef4444'; // Red - Needs improvement
      }
      
      return {
        name: format(parseISO(attempt.completedAt), 'MMM dd'),
        fullDate: format(parseISO(attempt.completedAt), 'MMM dd, yyyy h:mm a'),
        score: scorePercent,
        type: attempt.type,
        fill: performanceColor,
        attemptNumber: filteredAttempts.length - index,
      };
    });

  // Prepare pie chart data - Quiz vs Flashcard distribution
  const typeDistributionData = [
    { name: 'Quizzes', value: attemptStats.quizzes },
    { name: 'Flashcards', value: attemptStats.flashcards },
    { name: 'Challenges', value: attemptStats.challenges },
  ].filter((item) => item.value > 0);

  // Group attempts by item (quiz or flashcard)
  const groupedAttempts = filteredAttempts.reduce(
    (acc, attempt) => {
      let key = '';
      let id = '';
      let title = '';
      let topic = '';
      let quizId = '';

      if (attempt.type === 'quiz') {
        key = `quiz-${attempt.quizId}`;
        id = attempt.quizId!;
        title = attempt.quiz?.title || 'Untitled Quiz';
        topic = attempt.quiz?.topic || 'General';
      } else if (attempt.type === 'flashcard') {
        key = `flashcard-${attempt.flashcardSetId}`;
        id = attempt.flashcardSetId!;
        title = attempt.flashcardSet?.title || 'Untitled Flashcard Set';
        topic = attempt.flashcardSet?.topic || 'General';
      } else if (attempt.type === 'challenge') {
        key = `challenge-${attempt.challengeId}`;
        id = attempt.challengeId!;
        quizId = attempt.quizId!;
        title = attempt.challenge?.title || 'Untitled Challenge';
        topic = attempt.quiz?.topic || 'Challenge';
      }

      if (!acc[key]) {
        acc[key] = {
          id,
          quizId,
          title,
          topic,
          type: attempt.type,
          attempts: [],
        };
      }
      acc[key].attempts.push(attempt);
      return acc;
    },
    {} as Record<string, any>
  );

  const handleItemClick = (item: any) => {
    if (item.type === 'quiz') {
      setSearchParams({ quizId: item.id });
    } else if (item.type === 'challenge') {
      setSearchParams({ challengeId: item.id });
    } else {
      setSearchParams({ flashcardId: item.id });
    }
  };

  const handleAttemptClick = (attempt: Attempt) => {
    if (
      (attempt.type === 'quiz' || attempt.type === 'challenge') &&
      attempt.quizId
    ) {
      navigate(`/quiz/attempt/${attempt.id}/review`, {
        state: {
          breadcrumb: [
            { label: 'Practice History', path: '/attempts' },
            {
              label:
                attempt.quiz?.title || attempt.challenge?.title || 'Unknown',
              path: null,
            },
            { label: 'Attempt', path: null },
          ],
        },
      });
    } else if (attempt.type === 'flashcard') {
      const setId = attempt.flashcardSetId || (attempt as any).flashcardSet?.id;
      if (!setId) {
        toast.error('Flashcard set not found');
        return;
      }
      navigate(`/flashcards/${setId}?view=history&attemptId=${attempt.id}`, {
        state: {
          breadcrumb: [
            { label: 'Practice History', path: '/attempts' },
            {
              label: (attempt as any).flashcardSet?.title || 'Unknown',
              path: null,
            },
            { label: 'Attempt', path: null },
          ],
        },
      });
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="mb-8 bg-gradient-to-br from-blue-600 to-indigo-700 dark:from-blue-800 dark:to-indigo-900 rounded-xl p-6 md:p-8 shadow-lg text-white">
        <div className="flex items-center justify-between mb-2">
          <div>
            <h1 className="text-3xl font-bold text-white">Practice History</h1>
            <p className="text-blue-100 dark:text-blue-200 mt-1 text-lg">
              Track your progress across all quizzes and flashcards
            </p>
          </div>
        </div>
      </div>

      {/* Breadcrumb */}
      {selectedItem && (
        <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400 mb-4">
          <button
            onClick={handleClearSelection}
            className="flex items-center gap-1 hover:text-blue-600 dark:hover:text-blue-400"
          >
            <ArrowLeft className="w-4 h-4" />
            All Practice History
          </button>
          <ChevronRight className="w-4 h-4" />
          <span className="text-gray-900 dark:text-white font-medium">
            {selectedItem.title}
          </span>
        </div>
      )}

      {/* Stats Cards */}
      <div className={`grid gap-3 md:gap-4 mb-6 ${
        filterType === 'all' 
          ? 'grid-cols-2 md:grid-cols-5' 
          : 'grid-cols-2 md:grid-cols-2'
      }`}>
        <StatCard
          title="Total"
          value={attemptStats.total}
          icon={Calendar}
          color="blue"
          variant="minimal"
        />

        {filterType === 'all' && (
          <>
            <StatCard
              title="Quizzes"
              value={attemptStats.quizzes}
              icon={BookOpen}
              color="indigo"
              variant="minimal"
            />

            <StatCard
              title="Flashcards"
              value={attemptStats.flashcards}
              icon={Layers}
              color="emerald"
              variant="minimal"
            />

            <StatCard
              title="Challenges"
              value={attemptStats.challenges}
              icon={TrendingUp}
              color="pink"
              variant="minimal"
            />
          </>
        )}

        <StatCard
          title="Avg Score"
          value={`${attemptStats.averageScore}%`}
          icon={Award}
          color="yellow"
          variant="minimal"
          className={filterType === 'all' ? 'col-span-2 md:col-span-1' : ''}
        />
      </div>

      {/* Filters */}
      {!selectedItem && (
        <div className="flex flex-col sm:flex-row sm:items-center gap-4 mb-6">
          <div className="flex items-center gap-2">
            <Filter className="w-5 h-5 text-gray-600 dark:text-gray-400" />
            <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
              Filter:
            </span>
          </div>
          <div className="flex flex-wrap gap-2">
            {(['all', 'quiz', 'flashcard', 'challenge'] as const).map(
              (type) => (
                <button
                  key={type}
                  onClick={() => {
                    setFilterType(type);
                    setSearchParams((prev) => {
                      const newParams = new URLSearchParams(prev);
                      newParams.set('type', type);
                      return newParams;
                    });
                  }}
                  className={`px-3 py-1.5 sm:px-4 sm:py-2 rounded-lg text-sm font-medium transition-colors ${
                    filterType === type
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700'
                  }`}
                >
                  {type.charAt(0).toUpperCase() + type.slice(1)}
                </button>
              )
            )}
          </div>
        </div>
      )}

      {/* Charts Section */}
      {filteredAttempts.length > 0 && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          {/* Score Trend Chart */}
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 border border-gray-200 dark:border-gray-700">
            <div className="mb-4">
              <div className="flex items-center gap-2 mb-2">
                <TrendingUp className="w-5 h-5 text-blue-600" />
                <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                  Performance Over Time
                </h2>
              </div>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Your score progression (most recent {scoreTrendData.length}{' '}
                attempts)
              </p>
              <div className="flex items-center gap-4 mt-2 text-xs">
                <div className="flex items-center gap-1">
                  <div className="w-3 h-3 rounded-full bg-green-500"></div>
                  <span className="text-gray-600 dark:text-gray-400">
                    Good (≥70%)
                  </span>
                </div>
                <div className="flex items-center gap-1">
                  <div className="w-3 h-3 rounded-full bg-yellow-500"></div>
                  <span className="text-gray-600 dark:text-gray-400">
                    Fair (50-69%)
                  </span>
                </div>
                <div className="flex items-center gap-1">
                  <div className="w-3 h-3 rounded-full bg-red-500"></div>
                  <span className="text-gray-600 dark:text-gray-400">
                    Needs Work (&lt;50%)
                  </span>
                </div>
              </div>
            </div>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={scoreTrendData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                <XAxis
                  dataKey="name"
                  stroke="#9ca3af"
                  style={{ fontSize: '11px' }}
                  angle={-45}
                  textAnchor="end"
                  height={60}
                />
                <YAxis
                  stroke="#9ca3af"
                  style={{ fontSize: '12px' }}
                  domain={[0, 100]}
                  label={{
                    value: 'Score (%)',
                    angle: -90,
                    position: 'insideLeft',
                    style: { fill: '#9ca3af' },
                  }}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#1f2937',
                    border: '1px solid #374151',
                    borderRadius: '8px',
                    color: '#fff',
                  }}
                  formatter={(value: number | undefined) => [`${value}%`, 'Score']}
                  labelFormatter={(label, payload) => {
                    if (payload && payload.length > 0) {
                      return `${payload[0].payload.fullDate} (Attempt #${payload[0].payload.attemptNumber})`;
                    }
                    return label;
                  }}
                />
                {/* Reference line at 70% */}
                <line
                  x1="0"
                  y1="30%"
                  x2="100%"
                  y2="30%"
                  stroke="#10b981"
                  strokeDasharray="5 5"
                  strokeWidth={1}
                  opacity={0.3}
                />
                <Line
                  type="monotone"
                  dataKey="score"
                  stroke="#3b82f6"
                  strokeWidth={2}
                  dot={<CustomDot />}
                  activeDot={{ r: 7, strokeWidth: 2 }}
                  name="Score (%)"
                />
              </LineChart>
            </ResponsiveContainer>
          </div>

          {/* Type Distribution Chart */}
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 border border-gray-200 dark:border-gray-700">
            <div className="flex items-center gap-2 mb-4">
              <Layers className="w-5 h-5 text-blue-600" />
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                Attempt Distribution
              </h2>
            </div>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={typeDistributionData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }) =>
                    `${name}: ${((percent || 0) * 100).toFixed(0)}%`
                  }
                  outerRadius={100}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {typeDistributionData.map((entry, index) => {
                    let color = COLORS[0]; // Default
                    if (entry.name === 'Quizzes') color = '#3b82f6'; // Blue
                    if (entry.name === 'Flashcards') color = '#10b981'; // Green
                    if (entry.name === 'Challenges')
                      color = 'rgb(236, 72, 153)'; // Pink
                    return <Cell key={`cell-${index}`} fill={color} />;
                  })}
                </Pie>
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#ffffff',
                    border: '1px solid #e5e7eb',
                    borderRadius: '8px',
                    color: '#111827',
                    padding: '8px 12px',
                    boxShadow:
                      '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
                  }}
                  itemStyle={{
                    color: '#111827',
                    fontWeight: 500,
                  }}
                  labelStyle={{
                    color: '#111827',
                    fontWeight: 600,
                  }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {/* Attempts List or Grouped View */}
      {selectedItem ? (
        // Detailed view for a specific quiz/flashcard
        <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
          <div className="p-6 border-b border-gray-200 dark:border-gray-700">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
              Practice history for {selectedItem.title}
            </h2>
            <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
              {filteredAttempts.length} total sessions
            </p>
          </div>
          <div className="divide-y divide-gray-200 dark:divide-gray-700">
            {filteredAttempts.map((attempt, index) => (
              <AttemptListItem
                key={attempt.id}
                attempt={attempt}
                index={index}
                totalCount={filteredAttempts.length}
                onClick={() => handleAttemptClick(attempt)}
              />
            ))}
          </div>
        </div>
      ) : (
        // Grouped view by quiz/flashcard
        <div className="space-y-4">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
            Practice History by Item
          </h2>
          {Object.values(groupedAttempts).map((item: any) => (
            <button
              key={`${item.type}-${item.id}`}
              onClick={() => handleItemClick(item)}
              className="w-full text-left bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6 cursor-pointer hover:border-blue-500 dark:hover:border-blue-500 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 dark:focus:ring-offset-gray-900"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  {(() => {
                    let iconBgClass: string;
                    let IconComponent: React.ReactNode;
                    
                    if (item.type === 'quiz') {
                      iconBgClass = 'bg-blue-100 dark:bg-blue-900';
                      IconComponent = <BookOpen className="w-6 h-6 text-blue-600 dark:text-blue-400" />;
                    } else if (item.type === 'challenge') {
                      iconBgClass = 'bg-pink-100 dark:bg-pink-900';
                      IconComponent = <TrendingUp className="w-6 h-6 text-pink-600 dark:text-pink-400" />;
                    } else {
                      iconBgClass = 'bg-green-100 dark:bg-green-900';
                      IconComponent = <Layers className="w-6 h-6 text-green-600 dark:text-green-400" />;
                    }
                    
                    return (
                      <div
                        className={`flex items-center justify-center w-12 h-12 rounded-lg ${iconBgClass}`}
                      >
                        {IconComponent}
                      </div>
                    );
                  })()}
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                      {item.title || 'Untitled'}
                    </h3>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      {item.topic} • {item.attempts.length} attempts
                    </p>
                  </div>
                </div>
                <ChevronRight className="w-5 h-5 text-gray-400" />
              </div>

              {/* Mini chart for this item */}
              {item.attempts.length > 1 && (() => {
                // Determine stroke color based on item type
                let lineStrokeColor: string;
                if (item.type === 'quiz') {
                  lineStrokeColor = '#3b82f6'; // Blue
                } else if (item.type === 'challenge') {
                  lineStrokeColor = 'rgb(236, 72, 153)'; // Pink
                } else {
                  lineStrokeColor = '#10b981'; // Green
                }
                
                return (
                  <div className="mt-4">
                    <ResponsiveContainer width="100%" height={80}>
                      <LineChart
                        data={item.attempts
                          .slice(0, 10)
                          .reverse()
                          .map((a: Attempt, i: number) => ({
                            name: `#${i + 1}`,
                            score:
                              a.score && a.totalQuestions
                                ? Math.round(
                                    Math.max(
                                      0,
                                      (a.score / a.totalQuestions) * 100
                                    )
                                  )
                                : 0,
                          }))}
                      >
                        <Line
                          type="monotone"
                          dataKey="score"
                          stroke={lineStrokeColor}
                          strokeWidth={2}
                          dot={false}
                        />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                );
              })()}
            </button>
          ))}
        </div>
      )}

      {/* Empty State */}
      {filteredAttempts.length === 0 && (
        <div className="text-center py-12">
          <Calendar className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
            No practice history found
          </h3>
          <p className="text-gray-600 dark:text-gray-400">
            {filterType === 'all'
              ? "You haven't practiced with any quizzes or flashcards yet."
              : `You haven't completed any ${filterType}es yet.`}
          </p>
        </div>
      )}
    </div>
  );
}
