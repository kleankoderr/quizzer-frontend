import React, { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { subscriptionService } from '../services/subscription.service';
import { useCurrentPlan, useCheckout, useScheduleDowngrade } from '../hooks';
import { PricingCard } from '../components/PricingCard';
import { AlertCircle } from 'lucide-react';
import { Toast as toast } from '../utils/toast';
import Skeleton from 'react-loading-skeleton';
import 'react-loading-skeleton/dist/skeleton.css';
import { Modal } from '../components/Modal';

export const PricingPage: React.FC = () => {
  const { data: currentPlan, isLoading: isCurrentPlanLoading } = useCurrentPlan();
  const { mutate: checkout, isPending: isCheckoutLoading } = useCheckout();
  const { mutate: scheduleDowngrade, isPending: isDowngradeLoading } = useScheduleDowngrade();
  
  const [selectedPlanId, setSelectedPlanId] = useState<string | null>(null);
  const [showDowngradeModal, setShowDowngradeModal] = useState(false);
  const [showViolationModal, setShowViolationModal] = useState(false);
  const [violations, setViolations] = useState<string[]>([]);
  const [planToDowngrade, setPlanToDowngrade] = useState<{ id: string; name: string } | null>(null);
  
  // Fetch plans
  const { 
    data: plans, 
    isLoading: isPlansLoading, 
    error: plansError 
  } = useQuery({
    queryKey: ['plans'],
    queryFn: subscriptionService.getPlans,
    staleTime: 60 * 60 * 1000, // 1 hour
  });

  const location = useLocation();

  useEffect(() => {
  }, [location]);

  const handleSubscribe = (planId: string) => {
    const targetPlan = plans?.find(p => p.id === planId);
    if (!targetPlan) return;

    const isDowngrade = currentPlan?.price && currentPlan.price > targetPlan.price;
    
    // Don't allow clicking on current plan
    const isCurrent = currentPlan?.price === targetPlan.price;
    if (isCurrent) return;

    if (isDowngrade) {
      setPlanToDowngrade({ id: planId, name: targetPlan.name });
      setShowDowngradeModal(true);
      return;
    }

    setSelectedPlanId(planId);
    checkout(planId, {
      onError: (error: any) => {
        toast.error(error.response?.data?.message || 'Failed to initiate checkout');
        setSelectedPlanId(null);
      },
    });
  };

  const handleDowngradeConfirm = () => {
    if (!planToDowngrade) return;

    scheduleDowngrade(planToDowngrade.id, {
      onSuccess: () => {
        toast.success(`Downgrade scheduled! Your plan will change to ${planToDowngrade.name} at the end of your billing cycle.`);
        setShowDowngradeModal(false);
        setPlanToDowngrade(null);
      },
      onError: (error: any) => {
        // Check for violations in error response
        if (error.response?.data?.violations) {
          setViolations(error.response.data.violations);
          setShowDowngradeModal(false);
          setShowViolationModal(true);
        } else {
          toast.error(error.response?.data?.message || 'Failed to schedule downgrade');
          setShowDowngradeModal(false);
        }
      }
    });
  };

  if (isCurrentPlanLoading || isPlansLoading) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 pb-24">
        {/* Header Skeleton */}
        <div className="text-center max-w-3xl mx-auto mb-16">
          <Skeleton height={48} width="60%" className="mb-4" borderRadius={12} />
          <Skeleton height={24} width="40%" />
        </div>

        {/* Plans Grid Skeleton */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mx-auto items-stretch">
          {/* Skeleton Card 1 */}
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl overflow-hidden border border-gray-100 dark:border-gray-700 p-8 h-full flex flex-col">
            <Skeleton height={32} width="40%" className="mb-4" />
            <Skeleton height={48} width="30%" className="mb-8" />
            
            <div className="space-y-4 mb-8 flex-1">
              {Array.from({ length: 5 }).map((_, i) => (
                <div key={i} className="flex items-center gap-3">
                  <Skeleton circle width={20} height={20} />
                  <Skeleton width="80%" />
                </div>
              ))}
            </div>
            
            <Skeleton height={48} borderRadius={12} />
          </div>

          {/* Skeleton Card 2 */}
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl overflow-hidden border border-gray-100 dark:border-gray-700 p-8 h-full flex flex-col">
            <Skeleton height={32} width="40%" className="mb-4" />
            <Skeleton height={48} width="30%" className="mb-8" />
            
            <div className="space-y-4 mb-8 flex-1">
              {Array.from({ length: 8 }).map((_, i) => (
                <div key={i} className="flex items-center gap-3">
                  <Skeleton circle width={20} height={20} />
                  <Skeleton width="80%" />
                </div>
              ))}
            </div>
            
            <Skeleton height={48} borderRadius={12} />
          </div>
        </div>

        {/* Footer Text Skeleton */}
        <div className="mt-20 text-center flex justify-center">
            <Skeleton width={300} height={20} />
        </div>
      </div>
    );
  }

  if (plansError) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] px-4">
        <div className="bg-red-50 dark:bg-red-900/20 p-4 rounded-full mb-4">
          <AlertCircle className="w-8 h-8 text-red-500 dark:text-red-400" />
        </div>
        <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
          Unable to load plans
        </h2>
        <p className="text-gray-500 dark:text-gray-400 text-center max-w-md mb-6">
          We couldn't fetch the available subscription plans. Please try again later.
        </p>
        <button
          onClick={() => window.location.reload()}
          className="px-6 py-2 bg-primary-600 hover:bg-primary-700 text-white rounded-lg font-medium transition-colors"
        >
          Retry
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 pb-8">
      {/* Header */}
      <div className="text-center max-w-3xl mx-auto mb-8">
        <h1 className="text-3xl font-extrabold text-gray-900 dark:text-white mb-2 tracking-tight">
          Simple, Transparent Pricing
        </h1>
        <p className="text-base text-gray-500 dark:text-gray-400">
          Choose the plan that fits your learning needs. Upgrade or downgrade at any time.
        </p>
      </div>

      {/* Plans Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-5xl mx-auto items-stretch">
        {plans
          ?.sort((a, b) => a.price - b.price) // Sort by price ascending (Free first, Premium on right)
          .map((plan) => {
            const isPlanPremium = plan.price > 0;
            
            // Determine if this is the current plan based on price matching
            // If user is premium (currentPlan.price > 0), match premium plan
            // If user is free (currentPlan.price === 0), match free plan
            const isCurrentPlan = currentPlan 
              ? (currentPlan.price > 0 ? isPlanPremium : !isPlanPremium)
              : !isPlanPremium; // Default to free if no current plan
          
            // Determine if it's a downgrade
            const isDowngrade = currentPlan?.price && currentPlan.price > plan.price;
            
            let buttonText;
            if (isDowngrade) {
               buttonText = 'Downgrade';
            }
          
            return (
            <PricingCard
              key={plan.id}
              plan={plan}
              isCurrent={isCurrentPlan}
              isLoading={isCheckoutLoading && selectedPlanId === plan.id}
              onSubscribe={handleSubscribe}
              buttonText={buttonText}
              className={`${isPlanPremium ? 'order-first md:order-last' : 'order-last md:order-first'}`}
            />
          );
        })}
      </div>

      <div className="mt-8 text-center">
        <p className="text-sm text-gray-400 dark:text-gray-500">
          Secure payments processed by Paystack. Cancel anytime.
        </p>
      </div>

      {/* Downgrade Confirmation Modal */}
      <Modal
        isOpen={showDowngradeModal}
        onClose={() => setShowDowngradeModal(false)}
        title="Schedule Downgrade"
      >
        <div className="p-4 space-y-4">
          <p className="text-gray-600 dark:text-gray-300">
            Are you sure you want to downgrade to <strong>{planToDowngrade?.name}</strong>?
          </p>
          <div className="bg-amber-50 dark:bg-amber-900/20 p-3 rounded-lg border border-amber-200 dark:border-amber-700">
            <p className="text-sm text-amber-800 dark:text-amber-200 flex items-start gap-2">
              <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
              <span>
                Your current plan benefits will remain active until the end of your billing period. 
                The new plan limits will apply starting from your next billing cycle.
              </span>
            </p>
          </div>
          <div className="flex justify-end gap-3 mt-4">
            <button
              onClick={() => setShowDowngradeModal(false)}
              className="px-4 py-2 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleDowngradeConfirm}
              disabled={isDowngradeLoading}
              className="px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white rounded-lg transition-colors flex items-center gap-2"
            >
              {isDowngradeLoading ? 'Scheduling...' : 'Confirm Downgrade'}
            </button>
          </div>
        </div>
      </Modal>

      {/* Violation Error Modal */}
      <Modal
        isOpen={showViolationModal}
        onClose={() => setShowViolationModal(false)}
        title="Unable to Downgrade"
      >
        <div className="p-4 space-y-4">
          <div className="flex items-start gap-3 text-red-600 dark:text-red-400">
            <AlertCircle className="w-6 h-6 flex-shrink-0" />
            <p className="font-medium">
              You are currently exceeding the limits of the plan you want to switch to.
            </p>
          </div>
          
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Please resolve the following issues before downgrading:
          </p>

          <ul className="list-disc list-inside space-y-1 bg-red-50 dark:bg-red-900/10 p-4 rounded-lg border border-red-100 dark:border-red-900/50">
            {violations.map((violation, index) => (
              <li key={index} className="text-sm text-red-700 dark:text-red-300">
                {violation}
              </li>
            ))}
          </ul>

          <div className="flex justify-end mt-4">
            <button
              onClick={() => setShowViolationModal(false)}
              className="px-4 py-2 bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 text-gray-800 dark:text-white rounded-lg transition-colors"
            >
              I Understand
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
};
