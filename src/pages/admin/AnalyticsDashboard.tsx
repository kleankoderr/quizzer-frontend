import { useQuery } from '@tanstack/react-query';
import {
  Users,
  BookOpen,
  Activity,
  Trophy,
} from 'lucide-react';
import { adminService } from '../../services/adminService';
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';

const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899'];

export const AnalyticsDashboard = () => {
  const { data: analytics, isLoading } = useQuery({
    queryKey: ['analytics'],
    queryFn: adminService.getAnalytics,
  });

  if (isLoading) {
    return (
      <div className="flex h-96 items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary-600 border-t-transparent"></div>
      </div>
    );
  }

  const userRoleData = analytics?.users?.byRole?.map((r: any) => ({
    name: r.role.replace('_', ' '),
    value: r.count,
  })) || [];

  const engagementData = analytics?.engagement?.byType?.map((e: any) => ({
    name: e.type.charAt(0).toUpperCase() + e.type.slice(1),
    value: e.count,
  })) || [];

  return (
    <div className="space-y-6 p-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
          Analytics Dashboard
        </h1>
        <div className="text-sm text-gray-500 dark:text-gray-400">
          Last 30 days
        </div>
      </div>

      {/* Overview Stats */}
      <div className="grid gap-4 sm:gap-6 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm dark:border-gray-800 dark:bg-gray-900">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-500 dark:text-gray-400">
                Total Users
              </p>
              <p className="mt-2 text-3xl font-bold text-gray-900 dark:text-white">
                {analytics?.users?.total || 0}
              </p>
              <p className="mt-1 text-sm text-green-600">
                +{analytics?.users?.newLast30Days || 0} this month
              </p>
            </div>
            <div className="rounded-lg bg-blue-500 p-3">
              <Users className="h-6 w-6 text-white" />
            </div>
          </div>
        </div>

        <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm dark:border-gray-800 dark:bg-gray-900">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-500 dark:text-gray-400">
                Total Content
              </p>
              <p className="mt-2 text-3xl font-bold text-gray-900 dark:text-white">
                {(analytics?.content?.quizzes || 0) +
                  (analytics?.content?.flashcards || 0) +
                  (analytics?.content?.studyMaterials || 0)}
              </p>
              <p className="mt-1 text-sm text-green-600">
                +{(analytics?.content?.quizzesLast30Days || 0) +
                  (analytics?.content?.flashcardsLast30Days || 0)} this month
              </p>
            </div>
            <div className="rounded-lg bg-purple-500 p-3">
              <BookOpen className="h-6 w-6 text-white" />
            </div>
          </div>
        </div>

        <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm dark:border-gray-800 dark:bg-gray-900">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-500 dark:text-gray-400">
                Total Attempts
              </p>
              <p className="mt-2 text-3xl font-bold text-gray-900 dark:text-white">
                {analytics?.engagement?.totalAttempts || 0}
              </p>
              <p className="mt-1 text-sm text-green-600">
                +{analytics?.engagement?.attemptsLast30Days || 0} this month
              </p>
            </div>
            <div className="rounded-lg bg-orange-500 p-3">
              <Activity className="h-6 w-6 text-white" />
            </div>
          </div>
        </div>

        <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm dark:border-gray-800 dark:bg-gray-900">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-500 dark:text-gray-400">
                Active Challenges
              </p>
              <p className="mt-2 text-3xl font-bold text-gray-900 dark:text-white">
                {analytics?.challenges?.active || 0}
              </p>
              <p className="mt-1 text-sm text-blue-600">
                {analytics?.challenges?.completionRate?.toFixed(1) || 0}% completion rate
              </p>
            </div>
            <div className="rounded-lg bg-green-500 p-3">
              <Trophy className="h-6 w-6 text-white" />
            </div>
          </div>
        </div>
      </div>

      {/* Charts Row 1 */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* User Growth Chart */}
        <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm dark:border-gray-800 dark:bg-gray-900">
          <h2 className="mb-4 text-lg font-semibold text-gray-900 dark:text-white">
            User Growth (Last 30 Days)
          </h2>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={analytics?.users?.growth || []}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis
                dataKey="date"
                tickFormatter={(value) => new Date(value).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
              />
              <YAxis />
              <Tooltip
                labelFormatter={(value) => new Date(value).toLocaleDateString()}
              />
              <Legend />
              <Line
                type="monotone"
                dataKey="count"
                stroke="#3b82f6"
                strokeWidth={2}
                name="New Users"
              />
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* Content Creation Trends */}
        <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm dark:border-gray-800 dark:bg-gray-900">
          <h2 className="mb-4 text-lg font-semibold text-gray-900 dark:text-white">
            Content Creation Trends
          </h2>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={analytics?.content?.trends || []}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis
                dataKey="date"
                tickFormatter={(value) => new Date(value).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
              />
              <YAxis />
              <Tooltip
                labelFormatter={(value) => new Date(value).toLocaleDateString()}
              />
              <Legend />
              <Line
                type="monotone"
                dataKey="quizzes"
                stroke="#3b82f6"
                strokeWidth={2}
                name="Quizzes"
              />
              <Line
                type="monotone"
                dataKey="flashcards"
                stroke="#10b981"
                strokeWidth={2}
                name="Flashcards"
              />
              <Line
                type="monotone"
                dataKey="contents"
                stroke="#f59e0b"
                strokeWidth={2}
                name="Study Materials"
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Charts Row 2 */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* User Distribution by Role */}
        <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm dark:border-gray-800 dark:bg-gray-900">
          <h2 className="mb-4 text-lg font-semibold text-gray-900 dark:text-white">
            User Distribution by Role
          </h2>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={userRoleData}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ name, percent }) => `${name}: ${((percent || 0) * 100).toFixed(0)}%`}
                outerRadius={80}
                fill="#8884d8"
                dataKey="value"
              >
                {userRoleData.map((_entry: any, index: number) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </div>

        {/* Engagement by Type */}
        <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm dark:border-gray-800 dark:bg-gray-900">
          <h2 className="mb-4 text-lg font-semibold text-gray-900 dark:text-white">
            Engagement by Type
          </h2>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={engagementData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Bar dataKey="value" fill="#3b82f6" name="Attempts" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Top Performing Content */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Top Quizzes */}
        <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm dark:border-gray-800 dark:bg-gray-900">
          <h2 className="mb-4 text-lg font-semibold text-gray-900 dark:text-white">
            Top Performing Quizzes
          </h2>
          <div className="space-y-3">
            {analytics?.content?.topQuizzes?.map((quiz: any, index: number) => (
              <div
                key={quiz.id}
                className="flex items-center justify-between rounded-lg border border-gray-200 p-3 dark:border-gray-700"
              >
                <div className="flex items-center gap-3">
                  <div className="flex h-8 w-8 items-center justify-center rounded-full bg-blue-100 text-sm font-bold text-blue-600 dark:bg-blue-900/30 dark:text-blue-400">
                    {index + 1}
                  </div>
                  <div>
                    <p className="font-medium text-gray-900 dark:text-white">
                      {quiz.title}
                    </p>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      {quiz.topic} • by {quiz.creator}
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="font-semibold text-gray-900 dark:text-white">
                    {quiz.attempts}
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">attempts</p>
                </div>
              </div>
            )) || (
              <p className="text-center text-gray-500 dark:text-gray-400">No data available</p>
            )}
          </div>
        </div>

        {/* Top Flashcards */}
        <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm dark:border-gray-800 dark:bg-gray-900">
          <h2 className="mb-4 text-lg font-semibold text-gray-900 dark:text-white">
            Top Performing Flashcard Sets
          </h2>
          <div className="space-y-3">
            {analytics?.content?.topFlashcards?.map((flashcard: any, index: number) => (
              <div
                key={flashcard.id}
                className="flex items-center justify-between rounded-lg border border-gray-200 p-3 dark:border-gray-700"
              >
                <div className="flex items-center gap-3">
                  <div className="flex h-8 w-8 items-center justify-center rounded-full bg-green-100 text-sm font-bold text-green-600 dark:bg-green-900/30 dark:text-green-400">
                    {index + 1}
                  </div>
                  <div>
                    <p className="font-medium text-gray-900 dark:text-white">
                      {flashcard.title}
                    </p>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      {flashcard.topic} • by {flashcard.creator}
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="font-semibold text-gray-900 dark:text-white">
                    {flashcard.attempts}
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">attempts</p>
                </div>
              </div>
            )) || (
              <p className="text-center text-gray-500 dark:text-gray-400">No data available</p>
            )}
          </div>
        </div>
      </div>

      {/* Top Challenges */}
      <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm dark:border-gray-800 dark:bg-gray-900">
        <h2 className="mb-4 text-lg font-semibold text-gray-900 dark:text-white">
          Top Challenges by Participation
        </h2>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {analytics?.challenges?.topChallenges?.map((challenge: any) => (
            <div
              key={challenge.id}
              className="rounded-lg border border-gray-200 p-4 dark:border-gray-700"
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <p className="font-medium text-gray-900 dark:text-white">
                    {challenge.title}
                  </p>
                  <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                    {challenge.type}
                  </p>
                </div>
                <Trophy className="h-5 w-5 text-yellow-500" />
              </div>
              <div className="mt-3 flex items-center gap-2">
                <Users className="h-4 w-4 text-gray-400" />
                <span className="text-sm font-semibold text-gray-900 dark:text-white">
                  {challenge.participants} participants
                </span>
              </div>
            </div>
          )) || (
            <p className="col-span-full text-center text-gray-500 dark:text-gray-400">
              No data available
            </p>
          )}
        </div>
      </div>
    </div>
  );
};
