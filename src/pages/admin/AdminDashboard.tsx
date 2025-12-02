import { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { 
  Users, 
  BookOpen, 
  Activity, 
  TrendingUp, 
  UserPlus, 
  FileText,
  Layers,
  SettingsIcon,
  Brain,
  Trophy,
} from 'lucide-react';
import { adminService } from '../../services/adminService';
import toast from 'react-hot-toast';
import { Link } from 'react-router-dom';

export const AdminDashboard = () => {
  const { data: stats, isLoading } = useQuery({
    queryKey: ['systemStats'],
    queryFn: adminService.getSystemStats,
  });
  
  const queryClient = useQueryClient();

  const ChallengeGenerateButton = ({ type, label, description }: { type: string; label: string; description: string }) => {
    const [isGenerating, setIsGenerating] = useState(false);

    const handleGenerate = async () => {
      setIsGenerating(true);
      try {
        let result;
        if (type === 'daily') result = await adminService.generateDailyChallenges();
        else if (type === 'weekly') result = await adminService.generateWeeklyChallenges();
        else if (type === 'monthly') result = await adminService.generateMonthlyChallenges();
        else if (type === 'hot') result = await adminService.generateHotChallenges();
        
        toast.success(result.message || 'Challenges generated successfully');
        queryClient.invalidateQueries({ queryKey: ['systemStats'] });
      } catch (error: any) {
        toast.error(error.response?.data?.message || 'Failed to generate challenges');
      } finally {
        setIsGenerating(false);
      }
    };

    return (
      <button
        onClick={handleGenerate}
        disabled={isGenerating}
        className="flex flex-col items-center gap-2 rounded-lg border border-gray-200 p-4 transition-colors hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50 dark:border-gray-700 dark:hover:bg-gray-800"
        title={description}
      >
        {isGenerating ? (
          <div className="h-5 w-5 animate-spin rounded-full border-2 border-primary-600 border-t-transparent"></div>
        ) : (
          <Trophy className="h-5 w-5 text-primary-600 dark:text-primary-400" />
        )}
        <div className="text-center">
          <p className="font-medium text-gray-900 dark:text-white">{label}</p>
          <p className="text-xs text-gray-500 dark:text-gray-400">{isGenerating ? 'Generating...' : 'Generate'}</p>
        </div>
      </button>
    );
  };

  if (isLoading) {
    return (
      <div className="flex h-96 items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary-600 border-t-transparent"></div>
      </div>
    );
  }

  const statCards = [
    {
      title: 'Total Users',
      value: stats?.users.total || 0,
      icon: Users,
      color: 'bg-blue-500',
      trend: `+${stats?.users.newLast7Days || 0} this week`,
    },
    {
      title: 'Active Users',
      value: stats?.users.active || 0,
      icon: Activity,
      color: 'bg-green-500',
      trend: 'Currently active',
    },
    {
      title: 'Total Quizzes',
      value: stats?.content.quizzes || 0,
      icon: BookOpen,
      color: 'bg-purple-500',
      trend: 'Platform wide',
    },
    {
      title: 'Total Attempts',
      value: stats?.engagement.totalAttempts || 0,
      icon: TrendingUp,
      color: 'bg-orange-500',
      trend: `+${stats?.engagement.attemptsLast7Days || 0} this week`,
    },
  ];

  return (
    <div className="space-y-6 p-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Admin Dashboard</h1>
        <div className="text-sm text-gray-500 dark:text-gray-400">
          Last updated: {new Date().toLocaleTimeString()}
        </div>
      </div>

      <div className="grid gap-4 sm:gap-6 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
        {statCards.map((stat, index) => (
          <div
            key={index}
            className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm dark:border-gray-800 dark:bg-gray-900"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-500 dark:text-gray-400">
                  {stat.title}
                </p>
                <p className="mt-2 text-3xl font-bold text-gray-900 dark:text-white">
                  {stat.value}
                </p>
              </div>
              <div className={`rounded-lg p-3 ${stat.color}`}>
                <stat.icon className="h-6 w-6 text-white" />
              </div>
            </div>
            <div className="mt-4 flex items-center text-sm">
              <span className="font-medium text-green-600">{stat.trend}</span>
            </div>
          </div>
        ))}
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm dark:border-gray-800 dark:bg-gray-900">
          <h2 className="mb-4 text-lg font-semibold text-gray-900 dark:text-white">
            Quick Actions
          </h2>
          <div className="grid gap-3 sm:gap-4 grid-cols-1 sm:grid-cols-2">
            <Link
              to="/admin/users"
              className="flex items-center gap-3 rounded-lg border border-gray-200 p-4 transition-colors hover:bg-gray-50 dark:border-gray-700 dark:hover:bg-gray-800"
            >
              <div className="rounded-full bg-blue-100 p-2 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400">
                <UserPlus className="h-5 w-5" />
              </div>
              <div>
                <p className="font-medium text-gray-900 dark:text-white">Manage Users</p>
                <p className="text-sm text-gray-500 dark:text-gray-400">View and edit users</p>
              </div>
            </Link>
            <Link
              to="/admin/content"
              className="flex items-center gap-3 rounded-lg border border-gray-200 p-4 transition-colors hover:bg-gray-50 dark:border-gray-700 dark:hover:bg-gray-800"
            >
              <div className="rounded-full bg-purple-100 p-2 text-purple-600 dark:bg-purple-900/30 dark:text-purple-400">
                <Layers className="h-5 w-5" />
              </div>
              <div>
                <p className="font-medium text-gray-900 dark:text-white">Manage Content</p>
                <p className="text-sm text-gray-500 dark:text-gray-400">Review platform content</p>
              </div>
            </Link>
            <Link
              to="/admin/ai-analytics"
              className="flex items-center gap-3 rounded-lg border border-gray-200 p-4 transition-colors hover:bg-gray-50 dark:border-gray-700 dark:hover:bg-gray-800"
            >
              <div className="rounded-full bg-purple-100 p-2 text-purple-600 dark:bg-purple-900/30 dark:text-purple-400">
                <Brain className="h-5 w-5" />
              </div>
              <div>
                <p className="font-medium text-gray-900 dark:text-white">AI Management</p>
                <p className="text-sm text-gray-500 dark:text-gray-400">AI stats & prompts</p>
              </div>
            </Link>
            <Link
              to="/admin/analytics"
              className="flex items-center gap-3 rounded-lg border border-gray-200 p-4 transition-colors hover:bg-gray-50 dark:border-gray-700 dark:hover:bg-gray-800"
            >
              <div className="rounded-full bg-indigo-100 p-2 text-indigo-600 dark:bg-indigo-900/30 dark:text-indigo-400">
                <Activity className="h-5 w-5" />
              </div>
              <div>
                <p className="font-medium text-gray-900 dark:text-white">Analytics</p>
                <p className="text-sm text-gray-500 dark:text-gray-400">Insights & metrics</p>
              </div>
            </Link>
            <Link
              to="/admin/settings"
              className="flex items-center gap-3 rounded-lg border border-gray-200 p-4 transition-colors hover:bg-gray-50 dark:border-gray-700 dark:hover:bg-gray-800"
            >
              <div className="rounded-full bg-gray-100 p-2 text-gray-600 dark:bg-gray-800 dark:text-gray-400">
                <SettingsIcon className="h-5 w-5" />
              </div>
              <div>
                <p className="font-medium text-gray-900 dark:text-white">Settings</p>
                <p className="text-sm text-gray-500 dark:text-gray-400">Platform configuration</p>
              </div>
            </Link>
          </div>
        </div>

        <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm dark:border-gray-800 dark:bg-gray-900">
          <h2 className="mb-4 text-lg font-semibold text-gray-900 dark:text-white">
            Content Overview
          </h2>
          <div className="space-y-4">
            <div className="flex items-center justify-between border-b border-gray-100 pb-4 dark:border-gray-800">
              <div className="flex items-center gap-3">
                <div className="rounded-lg bg-indigo-100 p-2 text-indigo-600 dark:bg-indigo-900/30 dark:text-indigo-400">
                  <BookOpen className="h-5 w-5" />
                </div>
                <div>
                  <p className="font-medium text-gray-900 dark:text-white">Quizzes</p>
                  <p className="text-sm text-gray-500 dark:text-gray-400">Total created</p>
                </div>
              </div>
              <span className="text-xl font-bold text-gray-900 dark:text-white">
                {stats?.content.quizzes || 0}
              </span>
            </div>
            <div className="flex items-center justify-between border-b border-gray-100 pb-4 dark:border-gray-800">
              <div className="flex items-center gap-3">
                <div className="rounded-lg bg-pink-100 p-2 text-pink-600 dark:bg-pink-900/30 dark:text-pink-400">
                  <Layers className="h-5 w-5" />
                </div>
                <div>
                  <p className="font-medium text-gray-900 dark:text-white">Flashcards</p>
                  <p className="text-sm text-gray-500 dark:text-gray-400">Total sets</p>
                </div>
              </div>
              <span className="text-xl font-bold text-gray-900 dark:text-white">
                {stats?.content.flashcards || 0}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="rounded-lg bg-yellow-100 p-2 text-yellow-600 dark:bg-yellow-900/30 dark:text-yellow-400">
                  <FileText className="h-5 w-5" />
                </div>
                <div>
                  <p className="font-medium text-gray-900 dark:text-white">Study Materials</p>
                  <p className="text-sm text-gray-500 dark:text-gray-400">Generated content</p>
                </div>
              </div>
              <span className="text-xl font-bold text-gray-900 dark:text-white">
                {stats?.content.studyMaterials || 0}
              </span>
            </div>
          </div>
        </div>

        {/* Challenge Generation */}
        <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm dark:border-gray-800 dark:bg-gray-900">
          <h2 className="mb-4 text-lg font-semibold text-gray-900 dark:text-white">
            Generate Challenges
          </h2>
          <p className="mb-4 text-sm text-gray-600 dark:text-gray-400">
            Manually trigger the creation of different types of challenges
          </p>
          <div className="grid gap-3 sm:gap-4 grid-cols-2 sm:grid-cols-4">
            <ChallengeGenerateButton
              type="daily"
              label="Daily"
              description="Generate today's challenges"
            />
            <ChallengeGenerateButton
              type="weekly"
              label="Weekly"
              description="Generate this week's challenges"
            />
            <ChallengeGenerateButton
              type="monthly"
              label="Monthly"
              description="Generate this month's challenges"
            />
            <ChallengeGenerateButton
              type="hot"
              label="Hot"
              description="Generate hot challenges"
            />
          </div>
        </div>
      </div>
    </div>
  );
};
