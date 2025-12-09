import { useMemo, useCallback, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  BarChart3,
  TrendingUp,
  Clock,
  Flame,
  BookOpen,
  Layers,
  ArrowRight,
} from 'lucide-react';
import {
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  LabelList,
} from 'recharts';
import { format, formatDistanceToNow } from 'date-fns';
import { useStatistics } from '../hooks';
import type {
  Attempt,
  PerformanceByTopic,
} from '../services/statistics.service';
import {
  StatCardSkeleton,
  ChartSkeleton,
  TableSkeleton,
} from '../components/skeletons';

const COLORS = [
  '#3b82f6',
  '#8b5cf6',
  '#ec4899',
  '#f59e0b',
  '#10b981',
  '#6366f1',
];
const ACTIVITY_COLORS = ['#3b82f6', '#10b981', '#ec4899'];

export const StatisticsPage = () => {
  const navigate = useNavigate();
  const [page, setPage] = useState(1);
  const { data, isLoading: loading } = useStatistics(page);

  const overview = useMemo(() => data?.overview ?? null, [data?.overview]);
  const recentAttempts = useMemo(() => data?.attempts ?? [], [data?.attempts]);
  const totalPages = useMemo(() => data?.totalPages ?? 1, [data?.totalPages]);
  const performanceByTopic = useMemo(
    () => data?.performanceByTopic ?? [],
    [data?.performanceByTopic]
  );

  const handleAttemptClick = useCallback(
    (attempt: Attempt) => {
      if (attempt.type === 'quiz' && attempt.quiz?.id) {
        navigate(`/attempts?quizId=${attempt.quiz.id}`);
      } else if (attempt.type === 'flashcard' && attempt.flashcardSet?.id) {
        navigate(`/attempts?flashcardId=${attempt.flashcardSet.id}`);
      } else if (attempt.type === 'challenge' && attempt.challenge?.id) {
        navigate(`/attempts?challengeId=${attempt.challenge.id}`);
      }
    },
    [navigate]
  );

  // Prepare data for charts with memoization - MUST be before conditional returns
  const typeDistributionData = useMemo(
    () => [
      { name: 'Quizzes', value: overview?.quizAttempts || 0 },
      { name: 'Flashcards', value: overview?.flashcardAttempts || 0 },
      { name: 'Challenges', value: overview?.challengeAttempts || 0 },
    ],
    [
      overview?.quizAttempts,
      overview?.flashcardAttempts,
      overview?.challengeAttempts,
    ]
  );

  const performanceChartData = useMemo(
    () =>
      performanceByTopic.slice(0, 5).map((topic: PerformanceByTopic) => ({
        name:
          topic.topic.length > 15
            ? topic.topic.substring(0, 15) + '...'
            : topic.topic,
        accuracy: Math.round(topic.accuracy),
        attempts: topic.attempts,
      })),
    [performanceByTopic]
  );

  if (loading) {
    return (
      <div className="space-y-6 pb-8">
        <div className="card bg-primary-600 dark:bg-primary-900 p-6 md:p-8">
          <div className="h-24" />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCardSkeleton count={4} />
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <ChartSkeleton />
          <ChartSkeleton />
        </div>
        <div className="card dark:bg-gray-800">
          <TableSkeleton rows={10} columns={5} />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-8">
      {/* Header */}
      <header className="relative overflow-hidden rounded-xl bg-gradient-to-br from-violet-600 to-indigo-700 dark:from-violet-800 dark:to-indigo-900 p-6 md:p-8 shadow-lg">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute -top-10 -right-10 w-40 h-40 bg-white rounded-full"></div>
          <div className="absolute -bottom-10 -left-10 w-40 h-40 bg-white rounded-full"></div>
        </div>

        <div className="relative z-10">
          <div className="flex items-center gap-2 mb-2">
            <BarChart3 className="w-6 h-6 text-yellow-300" />
            <span className="text-yellow-300 font-semibold text-sm">
              Analytics
            </span>
          </div>
          <h1 className="text-3xl md:text-4xl font-bold text-white mb-2">
            Your Analytics
          </h1>
          <p className="text-primary-100 dark:text-primary-200 text-lg">
            Track your learning progress and performance
          </p>
        </div>
      </header>

      {/* Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="card bg-gradient-to-br from-violet-50 to-indigo-50 dark:from-violet-900/10 dark:to-indigo-900/10 border-violet-200 dark:border-violet-800 hover:shadow-md transition-all duration-300 hover:-translate-y-1">
          <div className="flex items-center justify-between mb-2">
            <p className="text-sm font-semibold text-gray-600 dark:text-gray-400 uppercase tracking-wide">
              Total Attempts
            </p>
            <div className="p-2 bg-violet-100 dark:bg-violet-900/30 rounded-lg">
              <BookOpen className="w-5 h-5 text-violet-600 dark:text-violet-400" />
            </div>
          </div>
          <p className="text-3xl font-bold text-gray-900 dark:text-white">
            {overview?.totalAttempts || 0}
          </p>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-2 font-medium">
            {overview?.quizAttempts || 0} quizzes •{' '}
            {overview?.flashcardAttempts || 0} flashcards
          </p>
        </div>

        <div className="card bg-gradient-to-br from-emerald-50 to-teal-50 dark:from-emerald-900/10 dark:to-teal-900/10 border-emerald-200 dark:border-emerald-800 hover:shadow-md transition-all duration-300 hover:-translate-y-1">
          <div className="flex items-center justify-between mb-2">
            <p className="text-sm font-semibold text-gray-600 dark:text-gray-400 uppercase tracking-wide">
              Average Accuracy
            </p>
            <div className="p-2 bg-emerald-100 dark:bg-emerald-900/30 rounded-lg">
              <TrendingUp className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
            </div>
          </div>
          <p className="text-3xl font-bold text-gray-900 dark:text-white">
            {overview?.averageAccuracy
              ? `${overview.averageAccuracy.toFixed(1)}%`
              : '0%'}
          </p>
          <p className="text-xs text-emerald-600 dark:text-emerald-400 mt-2 font-medium flex items-center gap-1">
            <TrendingUp className="w-3 h-3" /> Keep it up!
          </p>
        </div>

        <div className="card bg-gradient-to-br from-blue-50 to-cyan-50 dark:from-blue-900/10 dark:to-cyan-900/10 border-blue-200 dark:border-blue-800 hover:shadow-md transition-all duration-300 hover:-translate-y-1">
          <div className="flex items-center justify-between mb-2">
            <p className="text-sm font-semibold text-gray-600 dark:text-gray-400 uppercase tracking-wide">
              Time Spent
            </p>
            <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
              <Clock className="w-5 h-5 text-blue-600 dark:text-blue-400" />
            </div>
          </div>
          <p className="text-3xl font-bold text-gray-900 dark:text-white">
            {overview?.totalTimeSpent
              ? `${Math.floor(overview.totalTimeSpent / 60)}h`
              : '0h'}
          </p>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-2 font-medium">
            {overview?.totalTimeSpent
              ? `${overview.totalTimeSpent % 60}m this month`
              : 'Start studying!'}
          </p>
        </div>

        <div className="card bg-gradient-to-br from-orange-50 to-red-50 dark:from-orange-900/10 dark:to-red-900/10 border-orange-200 dark:border-orange-800 hover:shadow-md transition-all duration-300 hover:-translate-y-1">
          <div className="flex items-center justify-between mb-2">
            <p className="text-sm font-semibold text-gray-600 dark:text-gray-400 uppercase tracking-wide">
              Current Streak
            </p>
            <div className="p-2 bg-orange-100 dark:bg-orange-900/30 rounded-lg">
              <Flame className="w-5 h-5 text-orange-600 dark:text-orange-400" />
            </div>
          </div>
          <p className="text-3xl font-bold text-gray-900 dark:text-white">
            {overview?.currentStreak || 0}
          </p>
          <p className="text-xs text-orange-600 dark:text-orange-400 mt-2 font-medium flex items-center gap-1">
            <Flame className="w-3 h-3" /> days streak
          </p>
        </div>
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Activity Distribution */}
        <div className="card dark:bg-gray-800">
          <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">
            Activity Distribution
          </h2>
          {typeDistributionData.some((d) => d.value > 0) ? (
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={typeDistributionData.filter((d) => d.value > 0)}
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
                  {typeDistributionData
                    .filter((d) => d.value > 0)
                    .map((_, index) => (
                      <Cell
                        key={`cell-${index}`}
                        fill={ACTIVITY_COLORS[index % ACTIVITY_COLORS.length]}
                      />
                    ))}
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
          ) : (
            <div className="h-[300px] flex items-center justify-center text-gray-500">
              No data available yet
            </div>
          )}
        </div>

        {/* Performance by Topic */}
        <div className="card dark:bg-gray-800 [&_.recharts-surface]:outline-none [&_.recharts-wrapper]:outline-none">
          <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">
            Top 5 Topics Performance
          </h2>
          {performanceChartData.length > 0 ? (
            <ResponsiveContainer width="100%" height={300}>
              <BarChart
                data={performanceChartData}
                margin={{ top: 20, right: 30, left: 0, bottom: 5 }}
              >
                <CartesianGrid
                  strokeDasharray="3 3"
                  vertical={false}
                  stroke="#e5e7eb"
                />
                <XAxis
                  dataKey="name"
                  tick={{ fontSize: 12, fill: '#6b7280' }}
                  axisLine={false}
                  tickLine={false}
                  dy={10}
                />
                <YAxis
                  domain={[0, 100]}
                  tick={{ fontSize: 12, fill: '#6b7280' }}
                  axisLine={false}
                  tickLine={false}
                  tickFormatter={(value) => `${value}%`}
                />
                <Tooltip
                  cursor={{ fill: '#f3f4f6' }}
                  contentStyle={{
                    backgroundColor: 'white',
                    border: '1px solid #e5e7eb',
                    borderRadius: '8px',
                    padding: '12px',
                    boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
                  }}
                  formatter={(value: number) => [`${value}%`, 'Accuracy']}
                />
                <Bar dataKey="accuracy" radius={[8, 8, 0, 0]} barSize={40}>
                  {performanceChartData.map((_, index) => (
                    <Cell
                      key={`cell-${index}`}
                      fill={COLORS[index % COLORS.length]}
                    />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-[300px] flex items-center justify-center text-gray-500">
              No data available yet
            </div>
          )}
        </div>
      </div>

      {/* Performance by Topic - Detailed Chart */}
      {performanceByTopic.length > 0 && (
        <div className="card dark:bg-gray-800 hidden md:block">
          <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">
            Performance by Topic
          </h2>
          <ResponsiveContainer
            width="100%"
            height={Math.max(300, performanceByTopic.length * 60)}
          >
            <BarChart
              data={performanceByTopic.map((topic) => ({
                topic:
                  topic.topic.length > 25
                    ? topic.topic.substring(0, 25) + '...'
                    : topic.topic,
                fullTopic: topic.topic,
                accuracy: Math.round(topic.accuracy * 10) / 10,
                attempts: topic.attempts,
              }))}
              layout="vertical"
              margin={{ top: 5, right: 30, left: 150, bottom: 5 }}
            >
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
              <XAxis
                type="number"
                domain={[0, 100]}
                tick={{ fontSize: 12 }}
                label={{
                  value: 'Accuracy (%)',
                  position: 'insideBottom',
                  offset: -5,
                }}
              />
              <YAxis
                type="category"
                dataKey="topic"
                tick={{ fontSize: 12 }}
                width={140}
              />
              <Tooltip
                cursor={false}
                contentStyle={{
                  backgroundColor: 'white',
                  border: '1px solid #e5e7eb',
                  borderRadius: '8px',
                  padding: '12px',
                }}
                formatter={(value: number, name: string) => {
                  if (name === 'accuracy') {
                    return [`${value}%`, 'Accuracy'];
                  }
                  return [value, name];
                }}
                labelFormatter={(label: string, payload: any) => {
                  if (payload && payload.length > 0) {
                    return payload[0].payload.fullTopic;
                  }
                  return label;
                }}
              />
              <Bar dataKey="accuracy" fill="#3b82f6" radius={[0, 4, 4, 0]}>
                <LabelList
                  dataKey="accuracy"
                  position="right"
                  formatter={(val: any) => `${val}%`}
                />
                {performanceByTopic.map((topic, index) => (
                  <Cell
                    key={`cell-${index}`}
                    fill={
                      topic.accuracy >= 80
                        ? '#10b981'
                        : topic.accuracy >= 60
                          ? '#3b82f6'
                          : topic.accuracy >= 40
                            ? '#f59e0b'
                            : '#ef4444'
                    }
                  />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* Recent Attempts */}
      <div className="card dark:bg-gray-800">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold text-gray-900 dark:text-white">
            Recent Attempts
          </h2>
          <div className="flex items-center gap-4">
            <button
              onClick={() => navigate('/attempts')}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors text-sm font-medium"
            >
              View All Attempts
              <ArrowRight className="w-4 h-4" />
            </button>
            <div className="text-sm text-gray-500 dark:text-gray-400">
              Page {page} of {totalPages}
            </div>
          </div>
        </div>

        {recentAttempts.length === 0 ? (
          <div className="text-center py-8">
            <Layers className="w-12 h-12 text-gray-400 dark:text-gray-500 mx-auto mb-3" />
            <p className="text-gray-600 dark:text-gray-400">No attempts yet</p>
            <p className="text-sm text-gray-500 dark:text-gray-500 mt-1">
              Start taking quizzes or studying flashcards!
            </p>
          </div>
        ) : (
          <>
            {/* Desktop Table View */}
            <div className="hidden md:block overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-200 dark:border-gray-700 bg-gray-50/50 dark:bg-gray-800/50">
                    <th className="text-left py-4 px-4 font-semibold text-gray-600 dark:text-gray-400 text-xs uppercase tracking-wider">
                      Type
                    </th>
                    <th className="text-left py-4 px-4 font-semibold text-gray-600 dark:text-gray-400 text-xs uppercase tracking-wider">
                      Title
                    </th>
                    <th className="text-left py-4 px-4 font-semibold text-gray-600 dark:text-gray-400 text-xs uppercase tracking-wider">
                      Topic
                    </th>
                    <th className="text-left py-4 px-4 font-semibold text-gray-600 dark:text-gray-400 text-xs uppercase tracking-wider">
                      Score
                    </th>
                    <th className="text-left py-4 px-4 font-semibold text-gray-600 dark:text-gray-400 text-xs uppercase tracking-wider">
                      Date
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {recentAttempts.map((attempt: Attempt) => (
                    <tr
                      key={attempt.id}
                      onClick={() => handleAttemptClick(attempt)}
                      className="border-b border-gray-100 dark:border-gray-700 hover:bg-primary-50 dark:hover:bg-gray-700/50 cursor-pointer transition-colors group"
                      title="Click to view details"
                    >
                      <td className="py-3 px-4">
                        <span
                          className={`inline-flex items-center gap-1 px-2 py-1 rounded text-xs font-medium ${
                            attempt.type === 'quiz'
                              ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300'
                              : attempt.type === 'challenge'
                                ? 'bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-300'
                                : 'bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300'
                          }`}
                        >
                          {attempt.type === 'quiz' ? (
                            <BookOpen className="w-3 h-3" />
                          ) : attempt.type === 'challenge' ? (
                            <Flame className="w-3 h-3" />
                          ) : (
                            <Layers className="w-3 h-3" />
                          )}
                          {attempt.type}
                        </span>
                      </td>
                      <td className="py-3 px-4 font-medium text-gray-900 dark:text-white group-hover:text-primary-600 dark:group-hover:text-primary-400 transition-colors">
                        {attempt.quiz?.title ||
                          attempt.flashcardSet?.title ||
                          'Untitled'}
                      </td>
                      <td className="py-3 px-4 text-gray-600 dark:text-gray-400">
                        {attempt.quiz?.topic ||
                          attempt.flashcardSet?.topic ||
                          '-'}
                      </td>
                      <td className="py-3 px-4">
                        {attempt.score !== undefined &&
                        attempt.totalQuestions ? (
                          <div className="flex flex-col gap-1 w-32">
                            <div className="flex justify-end text-xs font-medium">
                              <span
                                className={`${
                                  Math.max(0, attempt.score) /
                                    attempt.totalQuestions >=
                                  0.7
                                    ? 'text-green-600'
                                    : Math.max(0, attempt.score) /
                                          attempt.totalQuestions >=
                                        0.5
                                      ? 'text-yellow-600'
                                      : 'text-red-600'
                                }`}
                              >
                                {Math.round(
                                  (Math.max(0, attempt.score) /
                                    attempt.totalQuestions) *
                                    100
                                )}
                                %
                              </span>
                            </div>
                            <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                              <div
                                className={`h-2 rounded-full ${
                                  Math.max(0, attempt.score) /
                                    attempt.totalQuestions >=
                                  0.7
                                    ? 'bg-green-500'
                                    : Math.max(0, attempt.score) /
                                          attempt.totalQuestions >=
                                        0.5
                                      ? 'bg-yellow-500'
                                      : 'bg-red-500'
                                }`}
                                style={{
                                  width: `${Math.round((Math.max(0, attempt.score) / attempt.totalQuestions) * 100)}%`,
                                }}
                              ></div>
                            </div>
                          </div>
                        ) : (
                          <span className="text-gray-500 dark:text-gray-400">
                            -
                          </span>
                        )}
                      </td>
                      <td className="py-3 px-4">
                        <div className="flex flex-col">
                          <span className="text-sm text-gray-900 dark:text-gray-200">
                            {format(
                              new Date(attempt.completedAt),
                              'MMM d, yyyy'
                            )}
                          </span>
                          <span className="text-xs text-gray-500 dark:text-gray-400">
                            {formatDistanceToNow(
                              new Date(attempt.completedAt),
                              { addSuffix: true }
                            )}
                          </span>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Mobile Card View */}
            <div className="md:hidden space-y-4">
              {recentAttempts.map((attempt: Attempt) => (
                <div
                  key={attempt.id}
                  onClick={() => handleAttemptClick(attempt)}
                  className="p-4 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50 active:scale-[0.98] transition-all"
                >
                  <div className="flex items-start justify-between mb-3">
                    <span
                      className={`inline-flex items-center gap-1 px-2 py-1 rounded text-xs font-medium ${
                        attempt.type === 'quiz'
                          ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300'
                          : attempt.type === 'challenge'
                            ? 'bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-300'
                            : 'bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300'
                      }`}
                    >
                      {attempt.type === 'quiz' ? (
                        <BookOpen className="w-3 h-3" />
                      ) : attempt.type === 'challenge' ? (
                        <Flame className="w-3 h-3" />
                      ) : (
                        <Layers className="w-3 h-3" />
                      )}
                      {attempt.type}
                    </span>
                    <span className="text-xs text-gray-500 dark:text-gray-400">
                      {formatDistanceToNow(new Date(attempt.completedAt), {
                        addSuffix: true,
                      })}
                    </span>
                  </div>

                  <h3 className="font-semibold text-gray-900 dark:text-white mb-1">
                    {attempt.quiz?.title ||
                      attempt.flashcardSet?.title ||
                      'Untitled'}
                  </h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
                    {attempt.quiz?.topic || attempt.flashcardSet?.topic || '-'}
                  </p>

                  <div className="flex items-center justify-between pt-3 border-t border-gray-200 dark:border-gray-700">
                    <span className="text-xs text-gray-500 dark:text-gray-400">
                      {format(new Date(attempt.completedAt), 'MMM d, yyyy')}
                    </span>
                    {attempt.score !== undefined && attempt.totalQuestions ? (
                      <div className="flex items-center gap-2">
                        <div className="w-24 bg-gray-200 dark:bg-gray-700 rounded-full h-1.5">
                          <div
                            className={`h-1.5 rounded-full ${
                              Math.max(0, attempt.score) /
                                attempt.totalQuestions >=
                              0.7
                                ? 'bg-green-500'
                                : Math.max(0, attempt.score) /
                                      attempt.totalQuestions >=
                                    0.5
                                  ? 'bg-yellow-500'
                                  : 'bg-red-500'
                            }`}
                            style={{
                              width: `${Math.round((Math.max(0, attempt.score) / attempt.totalQuestions) * 100)}%`,
                            }}
                          ></div>
                        </div>
                        <span
                          className={`text-sm font-bold ${
                            Math.max(0, attempt.score) /
                              attempt.totalQuestions >=
                            0.7
                              ? 'text-green-600'
                              : Math.max(0, attempt.score) /
                                    attempt.totalQuestions >=
                                  0.5
                                ? 'text-yellow-600'
                                : 'text-red-600'
                          }`}
                        >
                          {Math.round(
                            (Math.max(0, attempt.score) /
                              attempt.totalQuestions) *
                              100
                          )}
                          %
                        </span>
                      </div>
                    ) : (
                      <span className="text-gray-500 dark:text-gray-400">
                        -
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>

            {/* Pagination Controls */}
            <div className="flex items-center justify-between mt-4 px-4">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setPage((p) => Math.max(1, p - 1));
                }}
                disabled={page === 1}
                className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-md hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Previous
              </button>
              <div className="flex gap-2">
                {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                  let p = i + 1;
                  if (totalPages > 5 && page > 3) {
                    p = page - 2 + i;
                  }
                  if (p > totalPages) return null;

                  return (
                    <button
                      key={p}
                      onClick={(e) => {
                        e.stopPropagation();
                        setPage(p);
                      }}
                      className={`px-3 py-1 text-sm font-medium rounded-md ${
                        page === p
                          ? 'bg-primary-600 text-white'
                          : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
                      }`}
                    >
                      {p}
                    </button>
                  );
                })}
              </div>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setPage((p) => Math.min(totalPages, p + 1));
                }}
                disabled={page === totalPages}
                className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-md hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Next
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
};
