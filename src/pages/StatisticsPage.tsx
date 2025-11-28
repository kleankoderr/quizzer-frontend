import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { BarChart3, TrendingUp, Clock, Flame, BookOpen, Layers } from 'lucide-react';
import { BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LabelList } from 'recharts';
import { format, formatDistanceToNow } from 'date-fns';
import { statisticsService } from '../services/statistics.service';
import type { StatisticsOverview, Attempt, PerformanceByTopic } from '../services/statistics.service';

const COLORS = ['#3b82f6', '#8b5cf6', '#ec4899', '#f59e0b', '#10b981', '#6366f1'];

export const StatisticsPage = () => {
  const navigate = useNavigate();
  const [overview, setOverview] = useState<StatisticsOverview | null>(null);
  const [recentAttempts, setRecentAttempts] = useState<Attempt[]>([]);
  const [performanceByTopic, setPerformanceByTopic] = useState<PerformanceByTopic[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const [overviewData, attemptsData, performanceData] = await Promise.all([
          statisticsService.getOverview(),
          statisticsService.getAttempts({ limit: 10, page }),
          statisticsService.getPerformanceByTopic(),
        ]);
        
        setOverview(overviewData);
        setRecentAttempts(attemptsData.attempts);
        setTotalPages(attemptsData.totalPages);
        setPerformanceByTopic(performanceData);
      } catch (error) {
        console.error('Failed to fetch statistics:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [page]);

  const handleAttemptClick = (attempt: Attempt) => {
    if (attempt.type === 'quiz' && attempt.quiz?.id) {
      navigate(`/quiz/${attempt.quiz.id}/results/${attempt.id}`);
    } else if (attempt.type === 'flashcard' && attempt.flashcardSet?.id) {
      navigate(`/flashcards/${attempt.flashcardSet.id}`);
    }
  };

  if (loading && !overview) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading statistics...</p>
        </div>
      </div>
    );
  }

  // Prepare data for charts
  const typeDistributionData = [
    { name: 'Quizzes', value: overview?.quizAttempts || 0 },
    { name: 'Flashcards', value: overview?.flashcardAttempts || 0 },
  ];

  const performanceChartData = performanceByTopic.slice(0, 5).map((topic: PerformanceByTopic) => ({
    name: topic.topic.length > 15 ? topic.topic.substring(0, 15) + '...' : topic.topic,
    accuracy: Math.round(topic.accuracy),
    attempts: topic.attempts,
  }));

  return (
    <div className="space-y-6 pb-8">
      {/* Header */}
      <header className="relative overflow-hidden rounded-xl bg-primary-600 p-6 md:p-8 shadow-lg">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute -top-10 -right-10 w-40 h-40 bg-white rounded-full"></div>
          <div className="absolute -bottom-10 -left-10 w-40 h-40 bg-white rounded-full"></div>
        </div>
        
        <div className="relative z-10">
          <div className="flex items-center gap-2 mb-2">
            <BarChart3 className="w-6 h-6 text-yellow-300" />
            <span className="text-yellow-300 font-semibold text-sm">Analytics</span>
          </div>
          <h1 className="text-3xl md:text-4xl font-bold text-white mb-2">
            Your Analytics
          </h1>
          <p className="text-primary-100 text-lg">
            Track your learning progress and performance
          </p>
        </div>
      </header>

      {/* Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="card bg-primary-50 border border-primary-200">
          <div className="flex items-center justify-between mb-2">
            <p className="text-sm font-semibold text-gray-600">Total Attempts</p>
            <BookOpen className="w-5 h-5 text-primary-600" />
          </div>
          <p className="text-3xl font-bold text-gray-900">{overview?.totalAttempts || 0}</p>
          <p className="text-sm text-gray-600 mt-1">
            {overview?.quizAttempts || 0} quizzes, {overview?.flashcardAttempts || 0} flashcards
          </p>
        </div>

        <div className="card bg-green-50 border border-green-200">
          <div className="flex items-center justify-between mb-2">
            <p className="text-sm font-semibold text-gray-600">Average Accuracy</p>
            <TrendingUp className="w-5 h-5 text-green-600" />
          </div>
          <p className="text-3xl font-bold text-gray-900">
            {overview?.averageAccuracy ? `${overview.averageAccuracy.toFixed(1)}%` : '0%'}
          </p>
          <p className="text-sm text-green-600 mt-1">Keep it up!</p>
        </div>

        <div className="card bg-blue-50 border border-blue-200">
          <div className="flex items-center justify-between mb-2">
            <p className="text-sm font-semibold text-gray-600">Time Spent</p>
            <Clock className="w-5 h-5 text-blue-600" />
          </div>
          <p className="text-3xl font-bold text-gray-900">
            {overview?.totalTimeSpent ? `${Math.floor(overview.totalTimeSpent / 60)}h` : '0h'}
          </p>
          <p className="text-sm text-gray-600 mt-1">
            {overview?.totalTimeSpent ? `${overview.totalTimeSpent % 60}m this month` : 'Start studying!'}
          </p>
        </div>

        <div className="card bg-orange-50 border border-orange-200">
          <div className="flex items-center justify-between mb-2">
            <p className="text-sm font-semibold text-gray-600">Current Streak</p>
            <Flame className="w-5 h-5 text-orange-600" />
          </div>
          <p className="text-3xl font-bold text-gray-900">{overview?.currentStreak || 0}</p>
          <p className="text-sm text-gray-600 mt-1">days</p>
        </div>
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Activity Distribution */}
        <div className="card">
          <h2 className="text-xl font-bold text-gray-900 mb-4">Activity Distribution</h2>
          {typeDistributionData.some(d => d.value > 0) ? (
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={typeDistributionData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }) => `${name}: ${((percent || 0) * 100).toFixed(0)}%`}
                  outerRadius={100}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {typeDistributionData.map((_, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-[300px] flex items-center justify-center text-gray-500">
              No data available yet
            </div>
          )}
        </div>

        {/* Performance by Topic */}
        <div className="card [&_.recharts-surface]:outline-none [&_.recharts-wrapper]:outline-none">
          <h2 className="text-xl font-bold text-gray-900 mb-4">Top 5 Topics Performance</h2>
          {performanceChartData.length > 0 ? (
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={performanceChartData} margin={{ top: 20, right: 30, left: 0, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e5e7eb" />
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
                    boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
                  }}
                  formatter={(value: number) => [`${value}%`, 'Accuracy']}
                />
                <Bar dataKey="accuracy" radius={[8, 8, 0, 0]} barSize={40}>
                  {performanceChartData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
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
        <div className="card">
          <h2 className="text-xl font-bold text-gray-900 mb-4">Performance by Topic</h2>
          <ResponsiveContainer width="100%" height={Math.max(300, performanceByTopic.length * 60)}>
            <BarChart 
              data={performanceByTopic.map(topic => ({
                topic: topic.topic.length > 25 ? topic.topic.substring(0, 25) + '...' : topic.topic,
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
                label={{ value: 'Accuracy (%)', position: 'insideBottom', offset: -5 }}
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
                  padding: '12px'
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
              <Bar 
                dataKey="accuracy" 
                fill="#3b82f6" 
                radius={[0, 4, 4, 0]}
              >
                <LabelList dataKey="accuracy" position="right" formatter={(val: any) => `${val}%`} />
                {performanceByTopic.map((topic, index) => (
                  <Cell 
                    key={`cell-${index}`} 
                    fill={
                      topic.accuracy >= 80 ? '#10b981' : 
                      topic.accuracy >= 60 ? '#3b82f6' : 
                      topic.accuracy >= 40 ? '#f59e0b' : 
                      '#ef4444'
                    } 
                  />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* Recent Attempts */}
      <div className="card">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold text-gray-900">Recent Attempts</h2>
          <div className="text-sm text-gray-500">
            Page {page} of {totalPages}
          </div>
        </div>
        
        {recentAttempts.length === 0 ? (
          <div className="text-center py-8">
            <Layers className="w-12 h-12 text-gray-400 mx-auto mb-3" />
            <p className="text-gray-600">No attempts yet</p>
            <p className="text-sm text-gray-500 mt-1">Start taking quizzes or studying flashcards!</p>
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-200">
                    <th className="text-left py-3 px-4 font-semibold text-gray-700">Type</th>
                    <th className="text-left py-3 px-4 font-semibold text-gray-700">Title</th>
                    <th className="text-left py-3 px-4 font-semibold text-gray-700">Topic</th>
                    <th className="text-left py-3 px-4 font-semibold text-gray-700">Score</th>
                    <th className="text-left py-3 px-4 font-semibold text-gray-700">Date</th>
                  </tr>
                </thead>
                <tbody>
                  {recentAttempts.map((attempt: Attempt) => (
                    <tr 
                      key={attempt.id} 
                      onClick={() => handleAttemptClick(attempt)}
                      className="border-b border-gray-100 hover:bg-primary-50 cursor-pointer transition-colors"
                    >
                      <td className="py-3 px-4">
                        <span className={`inline-flex items-center gap-1 px-2 py-1 rounded text-xs font-medium ${
                          attempt.type === 'quiz' 
                            ? 'bg-blue-100 text-blue-700' 
                            : 'bg-purple-100 text-purple-700'
                        }`}>
                          {attempt.type === 'quiz' ? <BookOpen className="w-3 h-3" /> : <Layers className="w-3 h-3" />}
                          {attempt.type}
                        </span>
                      </td>
                      <td className="py-3 px-4 font-medium text-gray-900">
                        {attempt.quiz?.title || attempt.flashcardSet?.title || 'Untitled'}
                      </td>
                      <td className="py-3 px-4 text-gray-600">
                        {attempt.quiz?.topic || attempt.flashcardSet?.topic || '-'}
                      </td>
                      <td className="py-3 px-4">
                        {attempt.score !== undefined && attempt.totalQuestions ? (
                          <div className="flex flex-col gap-1 w-32">
                            <div className="flex justify-between text-xs font-medium">
                              <span className="text-gray-900">{attempt.score}/{attempt.totalQuestions}</span>
                              <span className={`${
                                (attempt.score / attempt.totalQuestions) >= 0.7 
                                  ? 'text-green-600' 
                                  : (attempt.score / attempt.totalQuestions) >= 0.5 
                                  ? 'text-yellow-600' 
                                  : 'text-red-600'
                              }`}>
                                {Math.round((attempt.score / attempt.totalQuestions) * 100)}%
                              </span>
                            </div>
                            <div className="w-full bg-gray-200 rounded-full h-2">
                              <div 
                                className={`h-2 rounded-full ${
                                  (attempt.score / attempt.totalQuestions) >= 0.7 
                                    ? 'bg-green-500' 
                                    : (attempt.score / attempt.totalQuestions) >= 0.5 
                                    ? 'bg-yellow-500' 
                                    : 'bg-red-500'
                                }`}
                                style={{ width: `${Math.round((attempt.score / attempt.totalQuestions) * 100)}%` }}
                              ></div>
                            </div>
                          </div>
                        ) : (
                          <span className="text-gray-500">-</span>
                        )}
                      </td>
                      <td className="py-3 px-4">
                        <div className="flex flex-col">
                          <span className="text-sm text-gray-900">
                            {format(new Date(attempt.completedAt), 'MMM d, yyyy')}
                          </span>
                          <span className="text-xs text-gray-500">
                            {formatDistanceToNow(new Date(attempt.completedAt), { addSuffix: true })}
                          </span>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            
            {/* Pagination Controls */}
            <div className="flex items-center justify-between mt-4 px-4">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setPage(p => Math.max(1, p - 1));
                }}
                disabled={page === 1}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
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
                          : 'text-gray-700 hover:bg-gray-100'
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
                  setPage(p => Math.min(totalPages, p + 1));
                }}
                disabled={page === totalPages}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
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
