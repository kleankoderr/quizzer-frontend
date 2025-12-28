import React, { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Award,
  Calendar,
  RotateCcw,
  TrendingUp,
  BarChart3,
  Brain,
  Layers,
  ArrowLeft,
} from 'lucide-react';
import { format, parseISO } from 'date-fns';
import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from 'recharts';
import { StatCard } from './StatCard';
import { AttemptListItem } from './AttemptListItem';

interface AttemptsAnalyticsViewProps {
  title: string;
  description?: string;
  type: 'quiz' | 'flashcard';
  attempts: any[];
  onRetake: () => void;
  onBack?: () => void;
  // This helps in cases where the attempt object doesn't have totalQuestions
  defaultTotalQuestions?: number;
}

const PERFORMANCE_RANGES = [
  { name: 'Excellent (90-100%)', shortLabel: '90-100%', min: 90, max: 100, color: '#10b981', label: 'Excellent' },
  { name: 'Good (70-89%)', shortLabel: '70-89%', min: 70, max: 89, color: '#3b82f6', label: 'Good' },
  { name: 'Fair (50-69%)', shortLabel: '50-69%', min: 50, max: 69, color: '#f59e0b', label: 'Fair' },
  { name: 'Needs Work (<50%)', shortLabel: '<50%', min: 0, max: 49, color: '#ef4444', label: 'Needs Work' },
];

const getScoreColor = (score: number) => {
  const range = PERFORMANCE_RANGES.find(r => score >= r.min && score <= r.max);
  return range ? range.color : '#ef4444';
};

const CustomChartDot = (props: any) => {
  const { cx, cy, payload } = props;
  return (
    <circle
      cx={cx}
      cy={cy}
      r={5}
      fill={payload.fill}
      stroke="#fff"
      strokeWidth={2}
      className="shadow-sm"
    />
  );
};

export const AttemptsAnalyticsView: React.FC<AttemptsAnalyticsViewProps> = ({
  title,
  description = 'Track your progress and analyze your scores.',
  type,
  attempts,
  onRetake,
  onBack,
  defaultTotalQuestions,
}) => {
  const navigate = useNavigate();

  const stats = useMemo(() => {
    if (!attempts || attempts.length === 0) {
      return { total: 0, averageScore: 0 };
    }

    const total = attempts.length;
    const percentages = attempts.map((a) => {
      const qCount = a.totalQuestions || defaultTotalQuestions || 1;
      return Math.round((a.score / qCount) * 100);
    });
    const averageScore = Math.round(
      percentages.reduce((sum, p) => sum + p, 0) / total
    );

    return { total, averageScore };
  }, [attempts, defaultTotalQuestions]);

  const sortedAttempts = useMemo(() => {
    return [...attempts].sort(
      (a, b) =>
        new Date(b.completedAt).getTime() - new Date(a.completedAt).getTime()
    );
  }, [attempts]);

  // Prepare chart data - Score trend over time
  const scoreTrendData = useMemo(() => {
    return [...attempts]
      .sort(
        (a, b) =>
          new Date(a.completedAt).getTime() - new Date(b.completedAt).getTime()
      )
      .slice(-20) // Most recent 20
      .map((attempt, index) => {
        const qCount = attempt.totalQuestions || defaultTotalQuestions || 1;
        const scorePercent = Math.round((attempt.score / qCount) * 100);
        return {
          name: format(parseISO(attempt.completedAt), 'MMM dd'),
          fullDate: format(
            parseISO(attempt.completedAt),
            'MMM dd, yyyy h:mm a'
          ),
          score: scorePercent,
          fill: getScoreColor(scorePercent),
          attemptNumber: index + 1,
        };
      });
  }, [attempts, defaultTotalQuestions]);

  const scoreDistributionData = useMemo(() => {
    // Ordering: Low to High for the bar chart X-axis
    const data = PERFORMANCE_RANGES.map(range => ({ ...range, count: 0 })).reverse();

    attempts.forEach((attempt) => {
      const qCount = attempt.totalQuestions || defaultTotalQuestions || 1;
      const scorePercent = Math.round((attempt.score / qCount) * 100);

      const range = data.find((r) => scorePercent >= r.min && scorePercent <= r.max);
      if (range) range.count++;
    });

    return data;
  }, [attempts, defaultTotalQuestions]);

  const Icon = type === 'quiz' ? Brain : Layers;
  const reportLabel = type === 'quiz' ? 'Quiz Report' : 'Flashcard Report';
  const buttonLabel = type === 'quiz' ? 'Retake Quiz' : 'Study Again';

  return (
    <div className="max-w-6xl mx-auto space-y-6 sm:space-y-8 pb-12 px-4 sm:px-6">
      {/* Hero Header */}
      <header className={`relative overflow-hidden rounded-2xl ${type === 'quiz' ? 'bg-blue-600 dark:bg-blue-700' : 'bg-primary-600 dark:bg-primary-700'} shadow-lg border border-white/10`}>
        {onBack && (
          <div className="absolute top-6 left-6 z-20">
            <button
              onClick={onBack}
              className="flex items-center gap-2 text-white bg-white/10 hover:bg-white/20 px-3 py-1.5 rounded-lg backdrop-blur-sm transition-all shadow-sm"
            >
              <ArrowLeft className="w-4 h-4" />
              <span className="text-sm font-medium">Back</span>
            </button>
          </div>
        )}
        <div className={`relative z-10 px-6 ${onBack ? 'pt-16 pb-8 sm:pt-20 sm:pb-10' : 'py-8 sm:p-10'} flex flex-col md:flex-row md:items-center justify-between gap-6`}>
          <div className="space-y-3">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/20 text-white text-xs font-bold uppercase tracking-wider">
              <Icon className="w-4 h-4" />
              {reportLabel}
            </div>
            <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight leading-tight">
              {title}
            </h1>
            <p className="text-white/80 text-sm sm:text-base font-medium max-w-xl">
              {description}
            </p>
          </div>

          <button
            onClick={onRetake}
            className={`flex items-center justify-center gap-3 px-8 py-4 bg-white ${type === 'quiz' ? 'text-blue-600' : 'text-primary-600'} font-bold rounded-xl transition-all hover:scale-[1.02] active:scale-95 shadow-md whitespace-nowrap w-full md:w-auto`}
          >
            <RotateCcw className="w-5 h-5 transition-transform group-hover:rotate-180" />
            <span>{buttonLabel}</span>
          </button>
        </div>
      </header>

      {/* Stats Cards - Responsive Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
        <StatCard
          title="Total Attempts"
          value={stats.total}
          icon={Calendar}
          color="blue"
          variant="minimal"
          className="rounded-xl border-gray-100 dark:border-gray-800"
        />
        <StatCard
          title="Average Performance"
          value={`${stats.averageScore}%`}
          icon={Award}
          color="yellow"
          variant="minimal"
          className="rounded-xl border-gray-100 dark:border-gray-800"
        />
      </div>

      {/* Charts Section - Responsive Grid */}
      {attempts.length > 0 && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 sm:gap-8">
          {/* Performance Trend Chart */}
          <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 sm:p-8 border border-gray-100 dark:border-gray-700 shadow-sm transition-all hover:shadow-md">
            <div className="mb-6">
              <div className="flex items-center gap-3 mb-2">
                <div className={`p-2.5 ${type === 'quiz' ? 'bg-blue-50 dark:bg-blue-900/30' : 'bg-primary-50 dark:bg-primary-900/30'} rounded-xl`}>
                  <TrendingUp className={`w-5 h-5 ${type === 'quiz' ? 'text-blue-600 dark:text-blue-400' : 'text-primary-600 dark:text-primary-400'}`} />
                </div>
                <h2 className="text-xl font-extrabold text-gray-900 dark:text-white tracking-tight">
                  Performance Trend
                </h2>
              </div>
              <p className="text-sm text-gray-500 dark:text-gray-400 font-medium ml-1">
                Score progression (last {scoreTrendData.length} sessions)
              </p>
              
              <div className="flex flex-wrap items-center gap-x-4 gap-y-2 mt-4 text-[10px] sm:text-xs font-bold uppercase tracking-wider">
                {[...PERFORMANCE_RANGES].reverse().map(range => (
                  <div key={range.name} className="flex items-center gap-1.5" style={{ color: range.color }}>
                    <div className="w-2 h-2 rounded-full" style={{ backgroundColor: range.color }} />
                    <span>{range.shortLabel}</span>
                  </div>
                ))}
              </div>
            </div>
            <ResponsiveContainer width="100%" height={300}>
              <AreaChart data={scoreTrendData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="scoreColor" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor={type === 'quiz' ? '#3b82f6' : '#6366f1'} stopOpacity={0.2} />
                    <stop offset="95%" stopColor={type === 'quiz' ? '#3b82f6' : '#6366f1'} stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid
                  strokeDasharray="3 3"
                  stroke="#f1f5f9"
                  vertical={false}
                />
                <XAxis
                  dataKey="name"
                  stroke="#94a3b8"
                  style={{ fontSize: '11px', fontWeight: 600 }}
                  axisLine={false}
                  tickLine={false}
                  dy={10}
                />
                <YAxis
                  stroke="#94a3b8"
                  style={{ fontSize: '11px', fontWeight: 600 }}
                  domain={[0, 100]}
                  axisLine={false}
                  tickLine={false}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#0f172a',
                    border: 'none',
                    borderRadius: '16px',
                    color: '#fff',
                    padding: '12px 16px',
                    boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.2)',
                  }}
                  itemStyle={{ color: '#fff' }}
                  labelStyle={{ color: '#94a3b8', marginBottom: '4px' }}
                />
                <Area
                  type="monotone"
                  dataKey="score"
                  stroke={type === 'quiz' ? '#3b82f6' : '#6366f1'}
                  strokeWidth={4}
                  fillOpacity={1}
                  fill="url(#scoreColor)"
                  dot={<CustomChartDot />}
                  activeDot={{ r: 8, strokeWidth: 0 }}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>

          {/* Score Distribution Chart */}
          <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 sm:p-8 border border-gray-100 dark:border-gray-700 shadow-sm transition-all hover:shadow-md">
            <div className="mb-6">
              <div className="flex items-center gap-3 mb-2">
                <div className={`p-2.5 ${type === 'quiz' ? 'bg-blue-50 dark:bg-blue-900/30' : 'bg-primary-50 dark:bg-primary-900/30'} rounded-xl`}>
                  <BarChart3 className={`w-5 h-5 ${type === 'quiz' ? 'text-blue-600 dark:text-blue-400' : 'text-primary-600 dark:text-primary-400'}`} />
                </div>
                <h2 className="text-xl font-extrabold text-gray-900 dark:text-white tracking-tight">
                  Score Distribution
                </h2>
              </div>
              <p className="text-sm text-gray-500 dark:text-gray-400 font-medium ml-1">
                Number of sessions per score range
              </p>

              <div className="flex flex-wrap items-center gap-x-4 gap-y-2 mt-4 text-[10px] sm:text-xs font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400">
                {scoreDistributionData.map((range) => (
                  <div key={range.name} className="flex items-center gap-1.5">
                    <div className="w-2.5 h-2.5 rounded-sm" style={{ backgroundColor: range.color }} />
                    <span>{range.shortLabel} ({range.count})</span>
                  </div>
                ))}
              </div>
            </div>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={scoreDistributionData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid
                  strokeDasharray="3 3"
                  stroke="#f1f5f9"
                  vertical={false}
                />
                <XAxis
                  dataKey="shortLabel"
                  stroke="#94a3b8"
                  style={{ fontSize: '10px', fontWeight: 600 }}
                  axisLine={false}
                  tickLine={false}
                  dy={10}
                />
                <YAxis
                  stroke="#94a3b8"
                  style={{ fontSize: '11px', fontWeight: 600 }}
                  axisLine={false}
                  tickLine={false}
                  allowDecimals={false}
                />
                <Tooltip
                  cursor={{ fill: '#f8fafc', opacity: 0.4 }}
                  contentStyle={{
                    backgroundColor: '#0f172a',
                    border: 'none',
                    borderRadius: '16px',
                    color: '#fff',
                    padding: '12px 16px',
                    boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.2)',
                  }}
                  itemStyle={{ color: '#fff' }}
                  labelStyle={{ color: '#94a3b8', marginBottom: '4px' }}
                  formatter={(value: number | undefined) => [value || 0, 'Sessions']}
                  labelFormatter={(label) => `Range: ${label}`}
                />
                <Bar dataKey="count" radius={[8, 8, 0, 0]}>
                  {scoreDistributionData.map((entry) => (
                    <Cell key={entry.name} fill={entry.color} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {/* Attempts List */}
      <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 overflow-hidden shadow-sm">
        <div className="p-6 sm:p-8 border-b border-gray-50 dark:border-gray-700/50">
          <h2 className="text-xl sm:text-2xl font-black text-gray-900 dark:text-white tracking-tight">
            Historical Records
          </h2>
          <p className="text-gray-500 dark:text-gray-400 font-bold mt-1 text-sm flex items-center gap-2">
            <span className={`w-2 h-2 rounded-full ${type === 'quiz' ? 'bg-blue-500' : 'bg-primary-500'}`} />
            {attempts.length} Total Sessions Found
          </p>
        </div>
        <div className="divide-y divide-gray-50 dark:divide-gray-700/30">
          {sortedAttempts.map((attempt, index) => (
            <AttemptListItem
              key={attempt.id}
              attempt={{
                ...attempt,
                type: type,
                totalQuestions: attempt.totalQuestions || defaultTotalQuestions,
              }}
              index={index}
              totalCount={sortedAttempts.length}
              onClick={() => {
                if (type === 'quiz') {
                  navigate(`/quiz/attempt/${attempt.id}/review`);
                } else {
                  // Flashcards don't have a dedicated review page, so we load it in the study page
                  const setId = attempt.flashcardSetId || attempt.flashcardSet?.id || attempt.quizId;
                  navigate(`/flashcards/${setId}?view=history&attemptId=${attempt.id}`);
                }
              }}
            />
          ))}
        </div>
      </div>
    </div>
  );
};
