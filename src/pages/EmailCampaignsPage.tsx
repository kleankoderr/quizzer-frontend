import { useQuery } from '@tanstack/react-query';
import { Mail, CheckCircle, XCircle, SkipForward, RefreshCw } from 'lucide-react';
import { apiClient } from '../services/api';
import { format } from 'date-fns';

interface CampaignStats {
  totalUsers: number;
  emailsSent: number;
  emailsSkipped: number;
  emailsFailed: number;
  lastUpdated: string;
}

interface CampaignData {
  campaignId: string;
  stats: CampaignStats;
}

const EmailCampaignsPage = () => {
  const { data: campaigns, isLoading, error, refetch } = useQuery<CampaignData[]>({
    queryKey: ['email-campaigns'],
    queryFn: async () => {
      const response = await apiClient.get('/email/campaigns/stats');
      // Handle both unwrapped (by interceptor) and wrapped responses
      const data = response.data;
      if (Array.isArray(data)) return data;
      if (data && Array.isArray(data.data)) return data.data;
      return [];
    },
  });

  const formatCampaignId = (id: string) => {
    return id
      .split('-')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  };

  const calculateSuccessRate = (sent: number, total: number) => {
    if (total === 0) return 0;
    return ((sent / total) * 100).toFixed(1);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-8">
      {/* Header */}
      <header className="relative overflow-hidden rounded-xl bg-gradient-to-br from-purple-600 to-indigo-700 dark:from-purple-800 dark:to-indigo-900 p-6 md:p-8 shadow-lg">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute -top-10 -right-10 w-40 h-40 bg-white rounded-full"></div>
          <div className="absolute -bottom-10 -left-10 w-40 h-40 bg-white rounded-full"></div>
        </div>

        <div className="relative z-10 flex items-center justify-between">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <Mail className="w-6 h-6 text-yellow-300" />
              <span className="text-yellow-300 font-semibold text-sm">
                Campaign Analytics
              </span>
            </div>
            <h1 className="text-3xl md:text-4xl font-bold text-white mb-2">
              Email Campaign Statistics
            </h1>
            <p className="text-purple-100 dark:text-purple-200 text-lg">
              Track and monitor your email campaign performance
            </p>
          </div>
          <button
            onClick={() => refetch()}
            className="flex items-center gap-2 px-4 py-2 bg-white/20 hover:bg-white/30 text-white rounded-lg transition-colors backdrop-blur-sm border border-white/20"
          >
            <RefreshCw className="w-4 h-4" />
            Refresh
          </button>
        </div>
      </header>

      {error && (
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
          <p className="text-red-800 dark:text-red-200">
            {error instanceof Error ? error.message : 'Failed to fetch campaign statistics'}
          </p>
        </div>
      )}

      {campaigns?.length === 0 ? (
        <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-6 text-center">
          <Mail className="w-12 h-12 text-blue-500 mx-auto mb-3" />
          <p className="text-blue-800 dark:text-blue-200 font-medium">
            No campaign data available
          </p>
          <p className="text-blue-600 dark:text-blue-300 text-sm mt-1">
            Campaigns will appear here after they run
          </p>
        </div>
      ) : (
        campaigns?.map((campaign) => (
          <div key={campaign.campaignId} className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                  {formatCampaignId(campaign.campaignId)}
                </h2>
                <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                  Last updated: {format(new Date(campaign.stats.lastUpdated), 'PPpp')}
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {/* Total Users Card */}
              <div className="card dark:bg-gray-800 p-6">
                <div className="flex items-center gap-3 mb-3">
                  <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
                    <Mail className="w-6 h-6 text-blue-600 dark:text-blue-400" />
                  </div>
                  <h3 className="text-sm font-semibold text-gray-600 dark:text-gray-400 uppercase tracking-wide">
                    Total Users
                  </h3>
                </div>
                <p className="text-3xl font-bold text-gray-900 dark:text-white">
                  {campaign.stats.totalUsers.toLocaleString()}
                </p>
                <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">
                  Eligible for campaign
                </p>
              </div>

              {/* Emails Sent Card */}
              <div className="card bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800 p-6">
                <div className="flex items-center gap-3 mb-3">
                  <div className="p-2 bg-green-100 dark:bg-green-900/30 rounded-lg">
                    <CheckCircle className="w-6 h-6 text-green-600 dark:text-green-400" />
                  </div>
                  <h3 className="text-sm font-semibold text-green-700 dark:text-green-400 uppercase tracking-wide">
                    Sent
                  </h3>
                </div>
                <p className="text-3xl font-bold text-green-700 dark:text-green-300">
                  {campaign.stats.emailsSent.toLocaleString()}
                </p>
                <p className="text-sm text-green-600 dark:text-green-400 mt-2">
                  {calculateSuccessRate(campaign.stats.emailsSent, campaign.stats.totalUsers)}% success rate
                </p>
              </div>

              {/* Emails Skipped Card */}
              <div className="card bg-yellow-50 dark:bg-yellow-900/20 border-yellow-200 dark:border-yellow-800 p-6">
                <div className="flex items-center gap-3 mb-3">
                  <div className="p-2 bg-yellow-100 dark:bg-yellow-900/30 rounded-lg">
                    <SkipForward className="w-6 h-6 text-yellow-600 dark:text-yellow-400" />
                  </div>
                  <h3 className="text-sm font-semibold text-yellow-700 dark:text-yellow-400 uppercase tracking-wide">
                    Skipped
                  </h3>
                </div>
                <p className="text-3xl font-bold text-yellow-700 dark:text-yellow-300">
                  {campaign.stats.emailsSkipped.toLocaleString()}
                </p>
                <p className="text-sm text-yellow-600 dark:text-yellow-400 mt-2">
                  Already received
                </p>
              </div>

              {/* Emails Failed Card */}
              <div className="card bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800 p-6">
                <div className="flex items-center gap-3 mb-3">
                  <div className="p-2 bg-red-100 dark:bg-red-900/30 rounded-lg">
                    <XCircle className="w-6 h-6 text-red-600 dark:text-red-400" />
                  </div>
                  <h3 className="text-sm font-semibold text-red-700 dark:text-red-400 uppercase tracking-wide">
                    Failed
                  </h3>
                </div>
                <p className="text-3xl font-bold text-red-700 dark:text-red-300">
                  {campaign.stats.emailsFailed.toLocaleString()}
                </p>
                <p className="text-sm text-red-600 dark:text-red-400 mt-2">
                  {campaign.stats.totalUsers > 0 
                    ? ((campaign.stats.emailsFailed / campaign.stats.totalUsers) * 100).toFixed(1)
                    : 0}% failure rate
                </p>
              </div>
            </div>
          </div>
        ))
      )}
    </div>
  );
};

export default EmailCampaignsPage;
