import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { WeakAreaCard } from '../components/WeakAreaCard';
import { AlertTriangle, BarChart3, Filter, Target, TrendingDown } from 'lucide-react';
import toast from 'react-hot-toast';
import { userService, weakAreaService } from '../services';
import { Select } from '../components/ui/Select';
import { Bar, BarChart, CartesianGrid, Cell, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';

type Tab = 'active' | 'resolved' | 'statistics';
type SortBy = 'errors' | 'recent';

const COLORS = ['#3b82f6', '#8b5cf6', '#ec4899', '#f59e0b', '#10b981'];

export const WeakAreasPage = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState<Tab>('active');
  const [sortBy, setSortBy] = useState<SortBy>('errors');
  const [selectedTopic, setSelectedTopic] = useState<string>('all');

  // Fetch user quota to check premium status
  const { data: quota } = useQuery({
    queryKey: ['user-quota'],
    queryFn: userService.getQuotaStatus,
  });

  const isPremium = Boolean(quota?.isPremium);

  // Fetch weak areas
  const { data: weakAreas = [], isLoading: weakAreasLoading } = useQuery({
    queryKey: ['weak-areas'],
    queryFn: weakAreaService.getWeakAreas,
  });

  // Fetch resolved weak areas
  const { data: resolvedWeakAreas = [], isLoading: resolvedLoading } = useQuery(
    {
      queryKey: ['weak-areas', 'resolved'],
      queryFn: weakAreaService.getResolvedWeakAreas,
      enabled: activeTab === 'resolved',
    }
  );

  // Fetch statistics
  const { data: stats, isLoading: statsLoading } = useQuery({
    queryKey: ['weak-areas', 'stats'],
    queryFn: weakAreaService.getWeakAreaStats,
    enabled: activeTab === 'statistics',
  });

  // Resolve weak area mutation
  const resolveMutation = useMutation({
    mutationFn: weakAreaService.resolveWeakArea,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['weak-areas'] });
      toast.success('Focus area marked as resolved!');
    },
    onError: () => {
      toast.error('Failed to resolve focus area');
    },
  });

  // Generate practice quiz mutation
  const practiceMutation = useMutation({
    mutationFn: weakAreaService.generatePracticeQuiz,
    onSuccess: (quiz) => {
      toast.success('Smart practice quiz generated!');
      navigate(`/quiz/${quiz.id}`);
    },
    onError: (error: any) => {
      const message =
        error?.response?.data?.message || 'Failed to generate practice quiz';
      toast.error(message);
    },
  });

  // Get unique topics for filtering
  const topics = useMemo(() => {
    const uniqueTopics = new Set(weakAreas.map((wa) => wa.topic));
    return Array.from(uniqueTopics).sort((a, b) => a.localeCompare(b));
  }, [weakAreas]);

  // Filter and sort weak areas
  const displayedWeakAreas = useMemo(() => {
    let filtered = activeTab === 'active' ? weakAreas : resolvedWeakAreas;

    // Filter by topic
    if (selectedTopic !== 'all') {
      filtered = filtered.filter((wa) => wa.topic === selectedTopic);
    }

    // Sort
    if (sortBy === 'errors') {
      return [...filtered].sort((a, b) => b.errorCount - a.errorCount);
    } else {
      return [...filtered].sort(
        (a, b) =>
          new Date(b.lastErrorAt).getTime() - new Date(a.lastErrorAt).getTime()
      );
    }
  }, [activeTab, weakAreas, resolvedWeakAreas, selectedTopic, sortBy]);

  // Prepare chart data for statistics
  const chartData = useMemo(() => {
    if (!stats?.byTopic) return [];
    return stats.byTopic.slice(0, 10).map((item) => ({
      topic:
        item.topic.length > 20
          ? item.topic.substring(0, 20) + '...'
          : item.topic,
      errors: item.totalErrors,
      count: item.count,
    }));
  }, [stats]);

  const handleResolve = (id: string) => {
    resolveMutation.mutate(id);
  };

  const handlePractice = (id: string) => {
    if (!isPremium) {
      toast.error('Upgrade to Premium to generate smart practice quizzes');
      navigate('/pricing');
      return;
    }
    practiceMutation.mutate(id);
  };

  const isLoading =
    weakAreasLoading ||
    (activeTab === 'resolved' && resolvedLoading) ||
    (activeTab === 'statistics' && statsLoading);

  return (
    <div className="space-y-6 pb-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
            <Target className="w-7 h-7 text-blue-600 dark:text-blue-400" />
            Focus Areas
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            Identify and improve concepts you're struggling with
          </p>
        </div>

        {weakAreas.length > 0 && (
          <div className="flex items-center gap-2 text-sm">
            <TrendingDown className="w-5 h-5 text-red-600 dark:text-red-400" />
            <span className="text-gray-600 dark:text-gray-400">
              <span className="font-bold text-blue-600 dark:text-blue-400">
                {weakAreas.length}
              </span>{' '}
              active focus {weakAreas.length === 1 ? 'area' : 'areas'}
            </span>
          </div>
        )}
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-2 border-b border-gray-200 dark:border-gray-700 overflow-x-auto">
        <button
          onClick={() => setActiveTab('active')}
          className={`px-4 py-2 font-medium text-sm transition-all whitespace-nowrap ${
            activeTab === 'active'
              ? 'text-blue-600 dark:text-blue-400 border-b-2 border-blue-600 dark:border-blue-400'
              : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
          }`}
        >
          Active ({weakAreas.length})
        </button>
        <button
          onClick={() => setActiveTab('resolved')}
          className={`px-4 py-2 font-medium text-sm transition-all whitespace-nowrap ${
            activeTab === 'resolved'
              ? 'text-blue-600 dark:text-blue-400 border-b-2 border-blue-600 dark:border-blue-400'
              : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
          }`}
        >
          Resolved
        </button>
        <button
          onClick={() => setActiveTab('statistics')}
          className={`px-4 py-2 font-medium text-sm transition-all whitespace-nowrap ${
            activeTab === 'statistics'
              ? 'text-blue-600 dark:text-blue-400 border-b-2 border-blue-600 dark:border-blue-400'
              : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
          }`}
        >
          <BarChart3 className="w-4 h-4 inline mr-1" />
          Statistics
        </button>
      </div>

      {/* Filters (Active & Resolved tabs only) */}
      {(activeTab === 'active' || activeTab === 'resolved') &&
        topics.length > 0 && (
          <div className="flex flex-col sm:flex-row gap-3">
            {/* Topic Filter */}
            <div className="flex items-center gap-2">
              <Select
                value={selectedTopic}
                onChange={setSelectedTopic}
                options={[
                  { label: 'All Topics', value: 'all' },
                  ...topics.map((topic) => ({ label: topic, value: topic })),
                ]}
                prefixIcon={<Filter className="h-4 w-4" />}
                className="min-w-[160px]"
              />
            </div>

            <div className="flex items-center gap-2">
              <span className="text-sm text-gray-600 dark:text-gray-400">
                Sort by:
              </span>
              <Select
                value={sortBy}
                onChange={(val) => setSortBy(val as SortBy)}
                options={[
                  { label: 'Error Count', value: 'errors' },
                  { label: 'Most Recent', value: 'recent' },
                ]}
                className="min-w-[140px]"
              />
            </div>
          </div>
        )}

      {/* Content */}
      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        </div>
      ) : (
        <>
          {/* Active/Resolved Tab Content */}
          {(activeTab === 'active' || activeTab === 'resolved') && (
            <div>
              {displayedWeakAreas.length === 0 ? (
                <div className="card p-12 text-center">
                  <AlertTriangle className="w-16 h-16 text-gray-300 dark:text-gray-600 mx-auto mb-4" />
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                    {(() => {
                      if (activeTab === 'active') {
                        return selectedTopic === 'all'
                          ? 'No Focus Areas Found'
                          : `No Focus Areas in ${selectedTopic}`;
                      }
                      return 'No Resolved Weak Areas';
                    })()}
                  </h3>
                  <p className="text-gray-600 dark:text-gray-400 mb-6">
                    {activeTab === 'active'
                      ? "Great job! You don't have any focus areas to work on."
                      : "You haven't resolved any focus areas yet."}
                  </p>
                  {activeTab === 'active' && (
                    <button
                      onClick={() => navigate('/quiz')}
                      className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg transition-colors"
                    >
                      Take a Quiz
                    </button>
                  )}
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {displayedWeakAreas.map((weakArea) => (
                    <WeakAreaCard
                      key={weakArea.id}
                      weakArea={weakArea}
                      isPremium={isPremium}
                      onResolve={handleResolve}
                      onPractice={handlePractice}
                      showActions={activeTab === 'active'}
                    />
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Statistics Tab Content */}
          {activeTab === 'statistics' && (
            <div className="space-y-6">
              {stats?.byTopic && stats.byTopic.length > 0 ? (
                <>
                  {/* Overview Cards */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="card p-6">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">
                            Total Focus Areas
                          </p>
                          <p className="text-3xl font-bold text-gray-900 dark:text-white">
                            {stats.totalWeakAreas}
                          </p>
                        </div>
                        <div className="w-12 h-12 rounded-full bg-blue-50 dark:bg-blue-900/20 flex items-center justify-center">
                          <Target className="w-6 h-6 text-blue-600 dark:text-blue-400" />
                        </div>
                      </div>
                    </div>

                    <div className="card p-6">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">
                            Total Errors
                          </p>
                          <p className="text-3xl font-bold text-red-600 dark:text-red-400">
                            {stats.totalErrors}
                          </p>
                        </div>
                        <div className="w-12 h-12 rounded-full bg-red-50 dark:bg-red-900/20 flex items-center justify-center">
                          <TrendingDown className="w-6 h-6 text-red-600 dark:text-red-400" />
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Bar Chart */}
                  <div className="card p-6">
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                      Errors by Topic
                    </h3>
                    <ResponsiveContainer width="100%" height={400}>
                      <BarChart data={chartData}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                        <XAxis
                          dataKey="topic"
                          tick={{ fontSize: 12, fill: '#6b7280' }}
                          angle={-45}
                          textAnchor="end"
                          height={100}
                        />
                        <YAxis tick={{ fontSize: 12, fill: '#6b7280' }} />
                        <Tooltip
                          contentStyle={{
                            backgroundColor: 'white',
                            border: '1px solid #e5e7eb',
                            borderRadius: '8px',
                          }}
                        />
                        <Bar dataKey="errors" fill="#3b82f6">
                          {chartData.map((_entry, index) => (
                            <Cell
                              key={`cell-${index}`}
                              fill={COLORS[index % COLORS.length]}
                            />
                          ))}
                        </Bar>
                      </BarChart>
                    </ResponsiveContainer>
                  </div>

                  {/* Topic Breakdown */}
                  <div className="card p-6">
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                      Topic Breakdown
                    </h3>
                    <div className="space-y-3">
                      {stats.byTopic.map((topic, index) => (
                        <div
                          key={topic.topic}
                          className="flex items-center justify-between p-3 rounded-lg bg-gray-50 dark:bg-gray-800"
                        >
                          <div className="flex items-center gap-3 flex-1 min-w-0">
                            <div
                              className="w-3 h-3 rounded-full flex-shrink-0"
                              style={{
                                backgroundColor: COLORS[index % COLORS.length],
                              }}
                            />
                            <div className="flex-1 min-w-0">
                              <p className="font-medium text-gray-900 dark:text-white truncate">
                                {topic.topic}
                              </p>
                              <p className="text-sm text-gray-600 dark:text-gray-400">
                                {topic.count}{' '}
                                {topic.count === 1 ? 'concept' : 'concepts'}
                              </p>
                            </div>
                          </div>
                          <div className="text-right flex-shrink-0">
                            <p className="font-bold text-red-600 dark:text-red-400">
                              {topic.totalErrors}
                            </p>
                            <p className="text-xs text-gray-500">errors</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </>
              ) : (
                <div className="card p-12 text-center">
                  <BarChart3 className="w-16 h-16 text-gray-300 dark:text-gray-600 mx-auto mb-4" />
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                    No Statistics Available
                  </h3>
                  <p className="text-gray-600 dark:text-gray-400">
                    Complete some quizzes to generate focus area statistics.
                  </p>
                </div>
              )}
            </div>
          )}
        </>
      )}
    </div>
  );
};
