import React, { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { subscriptionService } from '../services/subscription.service';
import { useSubscription, useCheckout } from '../hooks/useSubscription';
import { PricingCard } from '../components/PricingCard';
import { AlertCircle } from 'lucide-react';
import { toast } from 'react-hot-toast';
import Skeleton from 'react-loading-skeleton';
import 'react-loading-skeleton/dist/skeleton.css';

export const PricingPage: React.FC = () => {
  const { data: subscription, isLoading: isSubscriptionLoading } = useSubscription();
  const { mutate: checkout, isPending: isCheckoutLoading } = useCheckout();
  const [selectedPlanId, setSelectedPlanId] = useState<string | null>(null);
  
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
    // Check for success or cancelled query params from Paystack redirect if needed
    // Usually handled by verify page, but good to have context
  }, [location]);

  const handleSubscribe = (planId: string) => {
    setSelectedPlanId(planId);
    checkout(planId, {
      onError: (error: any) => {
        toast.error(error.response?.data?.message || 'Failed to initiate checkout');
        setSelectedPlanId(null);
      },
      onSuccess: () => {
        // Redirect handled by hook
      }
    });
  };

  if (isSubscriptionLoading || isPlansLoading) {
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
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 pb-24">
      {/* Header */}
      <div className="text-center max-w-3xl mx-auto mb-16">
        <h1 className="text-4xl font-extrabold text-gray-900 dark:text-white mb-4 tracking-tight">
          Simple, Transparent Pricing
        </h1>
        <p className="text-xl text-gray-500 dark:text-gray-400">
          Choose the plan that fits your learning needs. Upgrade or downgrade at any time.
        </p>
      </div>

      {/* Plans Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mx-auto items-stretch">
        {plans
          ?.sort((a, b) => b.price - a.price) // Sort by price descending (Premium first)
          .map((plan) => {
            const isCurrentPlan = subscription?.planId === plan.id;
          
          return (
            <PricingCard
              key={plan.id}
              plan={plan}
              isCurrent={isCurrentPlan}
              isLoading={isCheckoutLoading && selectedPlanId === plan.id}
              onSubscribe={handleSubscribe}
              className={isCurrentPlan ? 'ring-2 ring-primary-500 ring-offset-2 dark:ring-offset-gray-900' : ''}
            />
          );
        })}
      </div>

      {/* FAQ or Trust Badges could go here */}
      <div className="mt-20 text-center">
        <p className="text-sm text-gray-400 dark:text-gray-500">
          Secure payments processed by Paystack. Cancel anytime.
        </p>
      </div>
    </div>
  );
};
