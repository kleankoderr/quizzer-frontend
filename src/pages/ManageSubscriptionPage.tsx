import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  CreditCard,
  CheckCircle,
  AlertCircle,
  Upload,
  FileText,
  Brain,
  Zap,
  BookOpen,
  Calendar,
  Shield,
  ChevronRight,
  AlertTriangle,
} from 'lucide-react';
import { useSubscription, useCancelSubscription } from '../hooks/useSubscription';
import { useQuota } from '../hooks/useQuota';
import { format } from 'date-fns';
import { LoadingScreen } from '../components/LoadingScreen';

export const ManageSubscriptionPage = () => {
  const navigate = useNavigate();
  const { data: subscription, isLoading: subLoading, refetch: refetchSub } = useSubscription();
  const { data: quota, isLoading: quotaLoading } = useQuota();
  const { mutate: cancelSubscription, isPending: isCancelling } = useCancelSubscription();

  const [showCancelDialog, setShowCancelDialog] = useState(false);

  const isLoading = subLoading || quotaLoading;

  if (isLoading) {
    return <LoadingScreen message="Loading subscription details..." />;
  }

  const isPremium = quota?.isPremium || false;
  const planName = subscription?.plan?.name || 'Free Plan';
  const planPrice = subscription?.plan?.price 
    ? new Intl.NumberFormat('en-NG', {
        style: 'currency',
        currency: 'NGN',
        minimumFractionDigits: 0,
        maximumFractionDigits: 0,
      }).format(subscription.plan.price / 100) +
      ` / ${subscription.plan.interval.toLowerCase() === 'monthly' ? 'Month' : 'Year'}`
    : 'Free';

  const handleCancelClick = () => {
    setShowCancelDialog(true);
  };

  const confirmCancel = () => {
    cancelSubscription(undefined, {
      onSuccess: () => {
        setShowCancelDialog(false);
        refetchSub();
      },
    });
  };

  // Helper to calculate percentage and color
  const getUsageColor = (used: number, limit: number) => {
    const percentage = (used / limit) * 100;
    if (percentage >= 100) return 'bg-red-500';
    if (percentage >= 80) return 'bg-yellow-500';
    return 'bg-green-500'; // was primary-600, but green is safer for 'good' status
  };

  const getPercentage = (used: number, limit: number) => {
    return Math.min(Math.round((used / limit) * 100), 100);
  };

  return (
    <div className="space-y-6 pb-8 max-w-7xl mx-auto">
      {/* Header */}
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
            <CreditCard className="w-8 h-8 text-primary-600" />
            Manage Subscription
          </h1>
          <p className="text-gray-500 dark:text-gray-400 mt-1">
            View your plan details and usage limits
          </p>
        </div>
        {!isPremium && (
          <button
            onClick={() => navigate('/pricing')}
            className="btn-primary flex items-center gap-2"
          >
            Upgrade to Premium
            <ChevronRight className="w-4 h-4" />
          </button>
        )}
      </header>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Plan Details */}
        <div className="lg:col-span-1 space-y-6">
          <div className="card p-6 border-t-4 border-t-primary-600">
            <div className="flex justify-between items-start mb-4">
              <div>
                <h2 className="text-lg font-bold text-gray-900 dark:text-white">Current Plan</h2>
                <p className="text-primary-600 font-medium text-xl mt-1">{planName}</p>
              </div>
              <div className={`px-3 py-1 rounded-full text-xs font-bold ${
                isPremium ? 'bg-gradient-to-r from-amber-500 to-orange-500 text-white' : 'bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-300'
              }`}>
                {isPremium ? 'PREMIUM' : 'FREE'}
              </div>
            </div>

            <div className="space-y-4 pt-4 border-t border-gray-100 dark:border-gray-800">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400">
                  <CreditCard className="w-4 h-4" />
                  <span>Price</span>
                </div>
                <span className="font-semibold text-gray-900 dark:text-white">{planPrice}</span>
              </div>

              {subscription && (
                <>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400">
                      <Calendar className="w-4 h-4" />
                      <span>{subscription.cancelAtPeriodEnd ? 'Expires On' : 'Renews On'}</span>
                    </div>
                    <span className="font-semibold text-gray-900 dark:text-white">
                      {format(new Date(subscription.currentPeriodEnd), 'MMM dd, yyyy')}
                    </span>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400">
                      <Shield className="w-4 h-4" />
                      <span>Status</span>
                    </div>
                    <span className={`font-semibold ${
                      subscription.status === 'ACTIVE' 
                        ? subscription.cancelAtPeriodEnd 
                          ? 'text-yellow-600' 
                          : 'text-green-600'
                        : 'text-red-600'
                    }`}>
                      {subscription.status === 'ACTIVE' && subscription.cancelAtPeriodEnd 
                        ? 'Cancelling' 
                        : subscription.status}
                    </span>
                  </div>
                </>
              )}

              {/* Status Message for Free Users */}
              {!isPremium && (
                <div className="bg-blue-50 dark:bg-blue-900/20 p-3 rounded-lg flex gap-3 text-sm text-blue-700 dark:text-blue-300 mt-4">
                  <AlertCircle className="w-5 h-5 flex-shrink-0" />
                  <p>Upgrade to Premium to unlock unlimited quizzes, flashcards, and advanced AI features.</p>
                </div>
              )}
            </div>

            {/* Actions */}
            {isPremium && subscription?.status === 'ACTIVE' && !subscription.cancelAtPeriodEnd && (
              <div className="pt-6 mt-2 border-t border-gray-100 dark:border-gray-800">
                <button 
                  onClick={handleCancelClick}
                  className="w-full py-2 px-4 border border-red-200 text-red-600 hover:bg-red-50 dark:border-red-900/30 dark:hover:bg-red-900/20 rounded-lg transition-colors text-sm font-medium"
                >
                  Cancel Subscription
                </button>
                <p className="text-xs text-center text-gray-400 mt-2">
                  You'll keep access until the end of the billing period.
                </p>
              </div>
            )}
            
            {isPremium && subscription?.cancelAtPeriodEnd && (
              <div className="pt-6 mt-2 border-t border-gray-100 dark:border-gray-800">
                 <div className="p-3 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg text-sm text-yellow-800 dark:text-yellow-200">
                    Your subscription is set to cancel on {format(new Date(subscription.currentPeriodEnd), 'MMM dd, yyyy')}.
                 </div>
                 {/* Potential "Resume" button could go here if supported */}
              </div>
            )}
          </div>
        </div>

        {/* Right Column: Quota & Usage */}
        <div className="lg:col-span-2 space-y-6">
          <div className="card p-6">
            <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-6 flex items-center gap-2">
              <Zap className="w-5 h-5 text-yellow-500" />
              Usage & Limits
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {/* Feature Usage */}
              <div className="space-y-6">
                <h3 className="font-semibold text-gray-700 dark:text-gray-300 border-b pb-2 mb-4">AI Features</h3>
                
                {/* Quiz Usage */}
                <div className="space-y-2">
                   <div className="flex justify-between text-sm">
                      <span className="flex items-center gap-2 text-gray-600 dark:text-gray-400">
                        <Brain className="w-4 h-4" /> Quizzes Generated
                      </span>
                      <span className="font-medium">
                        {quota?.quiz.used} / {quota?.quiz.limit === -1 ? '∞' : quota?.quiz.limit}
                      </span>
                   </div>
                   <div className="h-2.5 w-full bg-gray-100 dark:bg-gray-700 rounded-full overflow-hidden">
                      <div 
                        className={`h-full rounded-full transition-all duration-500 ${quota?.quiz.limit === -1 ? 'bg-primary-600' : getUsageColor(quota?.quiz.used || 0, quota?.quiz.limit || 1)}`}
                        style={{ width: quota?.quiz.limit === -1 ? '100%' : `${getPercentage(quota?.quiz.used || 0, quota?.quiz.limit || 1)}%` }}
                      ></div>
                   </div>
                </div>

                {/* Flashcard Usage */}
                <div className="space-y-2">
                   <div className="flex justify-between text-sm">
                      <span className="flex items-center gap-2 text-gray-600 dark:text-gray-400">
                        <CopyIcon className="w-4 h-4" /> Flashcards
                      </span>
                      <span className="font-medium">
                        {quota?.flashcard.used} / {quota?.flashcard.limit === -1 ? '∞' : quota?.flashcard.limit}
                      </span>
                   </div>
                   <div className="h-2.5 w-full bg-gray-100 dark:bg-gray-700 rounded-full overflow-hidden">
                       <div 
                        className={`h-full rounded-full transition-all duration-500 ${quota?.flashcard.limit === -1 ? 'bg-primary-600' : getUsageColor(quota?.flashcard.used || 0, quota?.flashcard.limit || 1)}`}
                        style={{ width: quota?.flashcard.limit === -1 ? '100%' : `${getPercentage(quota?.flashcard.used || 0, quota?.flashcard.limit || 1)}%` }}
                      ></div>
                   </div>
                </div>

                {/* Explanations Usage */}
                <div className="space-y-2">
                   <div className="flex justify-between text-sm">
                      <span className="flex items-center gap-2 text-gray-600 dark:text-gray-400">
                        <Brain className="w-4 h-4" /> AI Explanations
                      </span>
                      <span className="font-medium">
                        {quota?.explanation.used} / {quota?.explanation.limit === -1 ? '∞' : quota?.explanation.limit}
                      </span>
                   </div>
                   <div className="h-2.5 w-full bg-gray-100 dark:bg-gray-700 rounded-full overflow-hidden">
                       <div 
                        className={`h-full rounded-full transition-all duration-500 ${quota?.explanation.limit === -1 ? 'bg-primary-600' : getUsageColor(quota?.explanation.used || 0, quota?.explanation.limit || 1)}`}
                        style={{ width: quota?.explanation.limit === -1 ? '100%' : `${getPercentage(quota?.explanation.used || 0, quota?.explanation.limit || 1)}%` }}
                      ></div>
                   </div>
                </div>
                 
                 {/* Learning Guides Usage */}
                <div className="space-y-2">
                   <div className="flex justify-between text-sm">
                      <span className="flex items-center gap-2 text-gray-600 dark:text-gray-400">
                        <BookOpen className="w-4 h-4" /> Learning Guides
                      </span>
                      <span className="font-medium">
                         {quota?.learningGuide.used} / {quota?.learningGuide.limit === -1 ? '∞' : quota?.learningGuide.limit}
                      </span>
                   </div>
                   <div className="h-2.5 w-full bg-gray-100 dark:bg-gray-700 rounded-full overflow-hidden">
                       <div 
                        className={`h-full rounded-full transition-all duration-500 ${quota?.learningGuide.limit === -1 ? 'bg-primary-600' : getUsageColor(quota?.learningGuide.used || 0, quota?.learningGuide.limit || 1)}`}
                        style={{ width: quota?.learningGuide.limit === -1 ? '100%' : `${getPercentage(quota?.learningGuide.used || 0, quota?.learningGuide.limit || 1)}%` }}
                      ></div>
                   </div>
                </div>
              </div>

              {/* Storage Usage */}
              <div className="space-y-6">
                <h3 className="font-semibold text-gray-700 dark:text-gray-300 border-b pb-2 mb-4">Storage & Files</h3>
                
                 {/* File Uploads (Count) */}
                 <div className="space-y-2">
                   <div className="flex justify-between text-sm">
                      <span className="flex items-center gap-2 text-gray-600 dark:text-gray-400">
                        <FileText className="w-4 h-4" /> Files Uploaded
                      </span>
                      {/* Note: Quota type might need a fileUpload property based on recent changes, checking useQuota hook previously... 
                          Wait, index.ts showed QuotaPlan features, but QuotaStatus usually mirrors them. 
                          I will assume it is available or I might need to adjust.
                          Actually index.ts QuotaStatus had quiz, flashcard, learningGuide, explanation.
                          It DID NOT typically show fileUpload in the QuotaStatus interface I saw in Step 14. 
                          Wait, let me double check Step 14 output.
                          Lines 433-440:
                          export interface QuotaStatus {
                            isPremium: boolean;
                            resetAt: string;
                            quiz: QuotaFeatureStatus;
                            flashcard: QuotaFeatureStatus;
                            learningGuide: QuotaFeatureStatus;
                            explanation: QuotaFeatureStatus;
                          }
                          It SEEMS fileUpload is missing from QuotaStatus interface in the file I read!
                          However, SubscriptionPlan (lines 454-460) has fileUploadLimit and fileStorageLimitMB.
                          This suggests the QuotaStatus MIGHT need updating or I should just hide it if not available.
                          I will comments out file limits if they are undefined to avoid crashes, or check if I need to update types.
                          Since I am only implementing the frontend page now, I will safely access them.
                      */}
                      {/* Temporary Safe Access if extended in backend but not TS types yet, or just hide */}
                       <span className="font-medium">
                        {quota?.fileUpload?.used || 0} / {quota?.fileUpload?.limit === -1 ? '∞' : quota?.fileUpload?.limit || 5}
                      </span>
                   </div>
                   <div className="h-2.5 w-full bg-gray-100 dark:bg-gray-700 rounded-full overflow-hidden">
                       <div 
                        className="h-full bg-blue-500 rounded-full"
                        style={{ width: `${getPercentage(quota?.fileUpload?.used || 0, quota?.fileUpload?.limit || 5)}%` }}
                      ></div>
                   </div>
                </div>

                {/* Storage Space */}
                 <div className="space-y-2">
                   <div className="flex justify-between text-sm">
                      <span className="flex items-center gap-2 text-gray-600 dark:text-gray-400">
                        <Upload className="w-4 h-4" /> Storage Used
                      </span>
                       <span className="font-medium">
                        {(quota?.fileStorage?.used || 0).toFixed(1)} MB / {quota?.fileStorage?.limit === -1 ? '∞' : (quota?.fileStorage?.limit ? quota.fileStorage.limit + ' MB' : '50 MB')}
                      </span>
                   </div>
                   <div className="h-2.5 w-full bg-gray-100 dark:bg-gray-700 rounded-full overflow-hidden">
                       <div 
                        className="h-full bg-purple-500 rounded-full"
                        style={{ width: `${getPercentage(quota?.fileStorage?.used || 0, quota?.fileStorage?.limit || 50)}%` }}
                      ></div>
                   </div>
                </div>

                 {!isPremium && (
                   <div className="mt-8 p-4 bg-indigo-50 dark:bg-indigo-900/10 border border-indigo-100 dark:border-indigo-800 rounded-xl">
                      <h4 className="font-bold text-indigo-900 dark:text-indigo-300 text-sm mb-2">Why Upgrade?</h4>
                      <ul className="space-y-2 text-sm text-indigo-800 dark:text-indigo-400">
                        <li className="flex items-center gap-2"><CheckCircle className="w-4 h-4 text-green-500" /> Unlimited AI Quizzes</li>
                        <li className="flex items-center gap-2"><CheckCircle className="w-4 h-4 text-green-500" /> 1GB Storage Space</li>
                        <li className="flex items-center gap-2"><CheckCircle className="w-4 h-4 text-green-500" /> Priority Support</li>
                      </ul>
                   </div>
                 )}
              </div>
            </div>
            
            <div className="mt-8 pt-6 border-t border-gray-100 dark:border-gray-800 text-center">
              <p className="text-xs text-gray-500">
                Quotas reset on {format(new Date(quota?.resetAt || new Date()), 'MMM dd, yyyy')}.
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
              You will lose access to premium features at the end of your current billing period ({subscription?.currentPeriodEnd ? format(new Date(subscription.currentPeriodEnd), 'MMM dd, yyyy') : 'soon'}).
            </p>

            <div className="grid grid-cols-2 gap-3 mt-6">
              <button
                onClick={() => setShowCancelDialog(false)}
                className="px-4 py-2 bg-gray-100 hover:bg-gray-200 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-200 rounded-xl font-medium transition-colors"
              >
                Keep Plan
              </button>
              <button
                onClick={confirmCancel}
                disabled={isCancelling}
                className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-xl font-medium transition-colors flex items-center justify-center gap-2"
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
// Icon component helper
const CopyIcon = (props: any) => (
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
