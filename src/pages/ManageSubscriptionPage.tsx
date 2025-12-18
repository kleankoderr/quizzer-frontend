import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  CheckCircle,
  Upload,
  FileText,
  Brain,
  Zap,
  BookOpen,
  Calendar,
  Shield,
  AlertTriangle,
  Crown,
  ArrowRight,
} from 'lucide-react';
import { useCurrentPlan, useCancelSubscription } from '../hooks/useSubscription';
import { format } from 'date-fns';
import { LoadingScreen } from '../components/LoadingScreen';

export const ManageSubscriptionPage = () => {
  const navigate = useNavigate();
  const { data: currentPlan, isLoading, refetch } = useCurrentPlan();
  const { mutate: cancelSubscription, isPending: isCancelling } = useCancelSubscription();

  const [showCancelDialog, setShowCancelDialog] = useState(false);

  if (isLoading) {
    return <LoadingScreen message="Loading subscription details..." />;
  }

  if (!currentPlan) {
    return <LoadingScreen message="Loading subscription details..." />;
  }

  const isPremium = currentPlan.isPremium;

  const handleCancelClick = () => {
    setShowCancelDialog(true);
  };

  const confirmCancel = () => {
    cancelSubscription(undefined, {
      onSuccess: () => {
        setShowCancelDialog(false);
        refetch();
      },
    });
  };

  // Helper to calculate percentage and color
  const getUsageColor = (used: number, limit: number) => {
    const percentage = (used / limit) * 100;
    if (percentage >= 100) return 'bg-red-500';
    if (percentage >= 80) return 'bg-yellow-500';
    return 'bg-primary-600';
  };

  const getPercentage = (used: number, limit: number) => {
    return Math.min(Math.round((used / limit) * 100), 100);
  };

  return (
    <div className="space-y-6 pb-8 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white flex items-center gap-3">
            {isPremium && <Crown className="w-8 h-8 text-amber-500" />}
            Subscription
          </h1>
          <p className="text-gray-500 dark:text-gray-400 mt-2">
            Manage your plan and monitor your usage limits
          </p>
        </div>
        {!isPremium && (
          <button
            onClick={() => navigate('/pricing')}
            className="btn-primary flex items-center gap-2 group"
          >
            <Crown className="w-5 h-5" />
            Upgrade to Premium
            <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
          </button>
        )}
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Current Plan Card */}
        <div className="lg:col-span-1">
          <div className={`card p-6 h-full ${isPremium ? 'border-t-4 border-t-amber-500' : 'border-t-4 border-t-gray-300'}`}>
            <div className="flex justify-between items-start mb-6">
              <div>
                <h2 className="text-sm font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-2">
                  Current Plan
                </h2>
                <p className={`font-bold text-2xl ${isPremium ? 'text-amber-600 dark:text-amber-400' : 'text-gray-900 dark:text-white'}`}>
                  {isPremium ? 'Premium' : 'Free Plan'}
                </p>
              </div>
              <div className={`px-3 py-1.5 rounded-full text-xs font-bold ${
                isPremium 
                  ? 'bg-gradient-to-r from-amber-500 to-orange-500 text-white shadow-lg' 
                  : 'bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-300'
              }`}>
                {isPremium ? 'PREMIUM' : 'FREE'}
              </div>
            </div>

            <div className="space-y-4">
              {isPremium && (
                <>
                  <div className="flex items-center justify-between py-3 border-b border-gray-100 dark:border-gray-800">
                    <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400">
                      <Calendar className="w-4 h-4" />
                      <span className="text-sm">{currentPlan.cancelAtPeriodEnd ? 'Expires On' : 'Renews On'}</span>
                    </div>
                    <span className="font-semibold text-gray-900 dark:text-white text-sm">
                      {format(new Date(currentPlan.currentPeriodEnd), 'MMM dd, yyyy')}
                    </span>
                  </div>
                  
                  <div className="flex items-center justify-between py-3">
                    <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400">
                      <Shield className="w-4 h-4" />
                      <span className="text-sm">Status</span>
                    </div>
                    <span className={`font-semibold text-sm ${
                      currentPlan.status === 'ACTIVE' 
                        ? currentPlan.cancelAtPeriodEnd 
                          ? 'text-yellow-600' 
                          : 'text-green-600'
                        : 'text-red-600'
                    }`}>
                      {currentPlan.status === 'ACTIVE' && currentPlan.cancelAtPeriodEnd 
                        ? 'Cancelling' 
                        : currentPlan.status}
                    </span>
                  </div>
                </>
              )}
            </div>

            {/* Actions */}
            {isPremium && currentPlan.status === 'ACTIVE' && !currentPlan.cancelAtPeriodEnd && (
              <div className="pt-6 mt-6 border-t border-gray-100 dark:border-gray-800">
                <button 
                  onClick={handleCancelClick}
                  className="w-full py-2.5 px-4 border border-red-200 text-red-600 hover:bg-red-50 dark:border-red-900/30 dark:hover:bg-red-900/20 rounded-lg transition-colors text-sm font-medium"
                >
                  Cancel Subscription
                </button>
                <p className="text-xs text-center text-gray-400 mt-2">
                  You'll keep access until {format(new Date(currentPlan.currentPeriodEnd), 'MMM dd')}
                </p>
              </div>
            )}
            
            {isPremium && currentPlan.cancelAtPeriodEnd && (
              <div className="pt-6 mt-6 border-t border-gray-100 dark:border-gray-800">
                 <div className="p-3 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg text-sm text-yellow-800 dark:text-yellow-200 flex items-start gap-2">
                    <AlertTriangle className="w-4 h-4 mt-0.5 flex-shrink-0" />
                    <span>Subscription ends on {format(new Date(currentPlan.currentPeriodEnd), 'MMM dd, yyyy')}</span>
                 </div>
              </div>
            )}

            {!isPremium && (
              <div className="pt-6 mt-6 border-t border-gray-100 dark:border-gray-800">
                <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg">
                  <h4 className="font-bold text-blue-900 dark:text-blue-300 text-sm mb-3 flex items-center gap-2">
                    <Zap className="w-4 h-4" />
                    Why Upgrade?
                  </h4>
                  <ul className="space-y-2 text-sm text-blue-800 dark:text-blue-400">
                    <li className="flex items-center gap-2">
                      <CheckCircle className="w-4 h-4 text-green-500 flex-shrink-0" />
                      15x more AI generations daily
                    </li>
                    <li className="flex items-center gap-2">
                      <CheckCircle className="w-4 h-4 text-green-500 flex-shrink-0" />
                      1GB storage (20x more)
                    </li>
                    <li className="flex items-center gap-2">
                      <CheckCircle className="w-4 h-4 text-green-500 flex-shrink-0" />
                      Priority support
                    </li>
                  </ul>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Usage & Limits Card */}
        <div className="lg:col-span-2">
          <div className="card p-6 h-full">
            <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-6 flex items-center gap-2">
              <Zap className="w-5 h-5 text-yellow-500" />
              Usage & Limits
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {/* AI Features */}
              <div className="space-y-6">
                <h3 className="font-semibold text-gray-700 dark:text-gray-300 text-sm uppercase tracking-wide border-b pb-2 mb-4">
                  AI Features
                </h3>
                
                {/* Quiz Usage */}
                <UsageBar
                  icon={Brain}
                  label="Quizzes Generated"
                  used={currentPlan.quiz.used}
                  limit={currentPlan.quiz.limit}
                  color={getUsageColor(currentPlan.quiz.used, currentPlan.quiz.limit)}
                  percentage={getPercentage(currentPlan.quiz.used, currentPlan.quiz.limit)}
                />

                {/* Flashcard Usage */}
                <UsageBar
                  icon={Layers}
                  label="Flashcard Sets"
                  used={currentPlan.flashcard.used}
                  limit={currentPlan.flashcard.limit}
                  color={getUsageColor(currentPlan.flashcard.used, currentPlan.flashcard.limit)}
                  percentage={getPercentage(currentPlan.flashcard.used, currentPlan.flashcard.limit)}
                />

                {/* Concept Explanations Usage */}
                <UsageBar
                  icon={Brain}
                  label="AI Explanations"
                  used={currentPlan.conceptExplanation.used}
                  limit={currentPlan.conceptExplanation.limit}
                  color={getUsageColor(currentPlan.conceptExplanation.used, currentPlan.conceptExplanation.limit)}
                  percentage={getPercentage(currentPlan.conceptExplanation.used, currentPlan.conceptExplanation.limit)}
                />
                 
                {/* Study Materials Usage */}
                <UsageBar
                  icon={BookOpen}
                  label="Study Materials"
                  used={currentPlan.studyMaterial.used}
                  limit={currentPlan.studyMaterial.limit}
                  color={getUsageColor(currentPlan.studyMaterial.used, currentPlan.studyMaterial.limit)}
                  percentage={getPercentage(currentPlan.studyMaterial.used, currentPlan.studyMaterial.limit)}
                />
              </div>

              {/* Storage & Files */}
              <div className="space-y-6">
                <h3 className="font-semibold text-gray-700 dark:text-gray-300 text-sm uppercase tracking-wide border-b pb-2 mb-4">
                  Storage & Files
                </h3>
                
                {/* File Uploads (Count) */}
                <UsageBar
                  icon={FileText}
                  label="Files Uploaded (Monthly)"
                  used={currentPlan.fileUpload.used}
                  limit={currentPlan.fileUpload.limit}
                  color="bg-blue-500"
                  percentage={getPercentage(currentPlan.fileUpload.used, currentPlan.fileUpload.limit)}
                />

                {/* Storage Space */}
                <UsageBar
                  icon={Upload}
                  label="Storage Used"
                  used={currentPlan.fileStorage.used}
                  limit={currentPlan.fileStorage.limit}
                  color="bg-purple-500"
                  percentage={getPercentage(currentPlan.fileStorage.used, currentPlan.fileStorage.limit)}
                  unit="MB"
                />
              </div>
            </div>
            
            <div className="mt-8 pt-6 border-t border-gray-100 dark:border-gray-800 text-center">
              <p className="text-sm text-gray-500 dark:text-gray-400 flex items-center justify-center gap-2">
                <Calendar className="w-4 h-4" />
                Monthly quotas reset on {format(new Date(currentPlan.monthlyResetAt), 'MMM dd, yyyy')}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Cancel Confirmation Dialog */}
      {showCancelDialog && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl max-w-md w-full p-6 space-y-4 transform transition-all scale-100">
            <div className="flex items-center gap-3 text-red-600 mb-2">
              <div className="p-3 bg-red-100 dark:bg-red-900/30 rounded-full">
                <AlertTriangle className="w-6 h-6" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 dark:text-white">Cancel Subscription?</h3>
            </div>
            
            <p className="text-gray-600 dark:text-gray-300 leading-relaxed">
              Are you sure you want to cancel your Premium subscription? 
              <br /><br />
              You will lose access to premium features at the end of your current billing period ({format(new Date(currentPlan.currentPeriodEnd), 'MMM dd, yyyy')}).
            </p>

            <div className="grid grid-cols-2 gap-3 mt-6">
              <button
                onClick={() => setShowCancelDialog(false)}
                className="px-4 py-2.5 bg-gray-100 hover:bg-gray-200 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-200 rounded-xl font-medium transition-colors"
              >
                Keep Plan
              </button>
              <button
                onClick={confirmCancel}
                disabled={isCancelling}
                className="px-4 py-2.5 bg-red-600 hover:bg-red-700 text-white rounded-xl font-medium transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
              >
                {isCancelling ? 'Cancelling...' : 'Yes, Cancel'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// Reusable Usage Bar Component
interface UsageBarProps {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  used: number;
  limit: number;
  color: string;
  percentage: number;
  unit?: string;
}

const UsageBar: React.FC<UsageBarProps> = ({ icon: Icon, label, used, limit, color, percentage, unit = '' }) => (
  <div className="space-y-2">
    <div className="flex justify-between text-sm">
      <span className="flex items-center gap-2 text-gray-600 dark:text-gray-400">
        <Icon className="w-4 h-4" />
        {label}
      </span>
      <span className="font-medium text-gray-900 dark:text-white">
        {used}{unit} / {limit === -1 ? '∞' : `${limit}${unit}`}
      </span>
    </div>
    <div className="h-2.5 w-full bg-gray-100 dark:bg-gray-700 rounded-full overflow-hidden">
      <div 
        className={`h-full rounded-full transition-all duration-500 ${limit === -1 ? 'bg-primary-600' : color}`}
        style={{ width: limit === -1 ? '100%' : `${percentage}%` }}
      ></div>
    </div>
  </div>
);

// Missing Icon Component
const Layers = (props: any) => (
  <svg
    {...props}
    xmlns="http://www.w3.org/2000/svg"
    width="24"
    height="24"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <rect width="14" height="14" x="8" y="8" rx="2" ry="2" />
    <path d="M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2" />
  </svg>
);
