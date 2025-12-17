import React, { useMemo } from 'react';
import { Check, Zap, Loader2 } from 'lucide-react';
import type { SubscriptionPlan } from '../types';

interface PricingCardProps {
  plan: SubscriptionPlan;
  isCurrent?: boolean;
  onSubscribe?: (planId: string) => void;
  isLoading?: boolean;
  className?: string;
}

export const PricingCard: React.FC<PricingCardProps> = ({
  plan,
  isCurrent = false,
  onSubscribe,
  isLoading = false,
  className = '',
}) => {
  const isFree = plan.price === 0;

  // Format price
  const formattedPrice = useMemo(() => {
    if (isFree) return 'Free';
    // Assuming price is in kobo/cents based on typical Paystack integration
    // But verify based on usage. Usually backend stores smallest currency unit.
    // If usage showed 200000 for 2000, then it's subunits.
    // Let's assume passed plan.price is in minor units (kobo).
    // Price is in kobo (subunits), convert to Naira
    return new Intl.NumberFormat('en-NG', {
      style: 'currency',
      currency: 'NGN',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(plan.price / 100);
  }, [plan.price, isFree]);

  const features = useMemo(() => {
    const q = plan.quotas || {};
    return [
      {
        label: 'Quizzes per day',
        value: q.quizzes === -1 ? 'Unlimited' : q.quizzes ?? 0,
        icon: Zap,
      },
      {
        label: 'Flashcard sets per day',
        value: q.flashcards === -1 ? 'Unlimited' : q.flashcards ?? 0,
        icon: Zap,
      },
      {
        label: 'Learning Guides per day',
        value: q.learningGuides === -1 ? 'Unlimited' : q.learningGuides ?? 0,
        icon: Zap,
      },
      {
        label: 'AI Explanations per day',
        value: q.explanations === -1 ? 'Unlimited' : q.explanations ?? 0,
        icon: Zap,
      },
      {
        label: 'File Uploads',
        value: q.filesPerMonth === -1 ? 'Unlimited' : `${q.filesPerMonth ?? 0} files`,
        icon: Check,
      },
      {
        label: 'Storage Limit',
        value: q.storageLimitMB === -1 ? 'Unlimited' : `${q.storageLimitMB ?? 0} MB`,
        icon: Check,
      },
    ];
  }, [plan.quotas]);

  return (
    <div
      className={`relative overflow-hidden rounded-2xl flex flex-col h-full transition-all duration-300 ${
        isCurrent
          ? 'bg-white dark:bg-gray-800 border-2 border-primary-500 shadow-xl scale-[1.02]'
          : isFree
          ? 'bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600 hover:shadow-lg'
          : 'bg-white dark:bg-gray-800 border border-amber-200 dark:border-amber-700/50 hover:border-amber-300 dark:hover:border-amber-600 hover:shadow-xl hover:-translate-y-1'
      } ${className}`}
    >
      {/* Popular/Current Badge */}
      {!isFree && !isCurrent && (
        <div className="absolute top-0 right-0">
          <div className="bg-amber-500 text-white text-xs font-bold px-3 py-1 rounded-bl-lg">
            RECOMMENDED
          </div>
        </div>
      )}
      
      {isCurrent && (
        <div className="absolute top-0 right-0 left-0 bg-primary-500 h-1"></div>
      )}

      <div className="p-6 md:p-8 flex-1 flex flex-col">
        {/* Header */}
        <div className="mb-6">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-xl font-bold text-gray-900 dark:text-white">
              {plan.name}
            </h3>
            {isCurrent && (
               <span className="text-xs font-semibold text-primary-700 dark:text-primary-300 bg-primary-50 dark:bg-primary-900/30 px-2 py-1 rounded-full border border-primary-100 dark:border-primary-800">
                 Current Plan
               </span>
            )}
          </div>
          <div className="flex items-baseline gap-1">
            <span className="text-4xl font-extrabold text-gray-900 dark:text-white">
              {formattedPrice}
            </span>
            {!isFree && (
              <span className="text-gray-500 dark:text-gray-400 font-medium">
                /{plan.interval.toLowerCase() === 'monthly' ? 'mo' : 'yr'}
              </span>
            )}
          </div>
          <p className="mt-2 text-sm text-gray-500 dark:text-gray-400 line-clamp-2 min-h-[2.5em]">
            {plan.description}
          </p>
        </div>

        {/* Divider */}
        <div className="h-px w-full bg-gray-100 dark:bg-gray-700 mb-6"></div>

        {/* Features */}
        <ul className="space-y-4 mb-8 flex-1">
          {features.map((feature, index) => (
            <li key={index} className="flex items-start gap-3">
              <div className={`p-1 rounded-full mt-0.5 shrink-0 ${
                isFree 
                  ? 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400' 
                  : 'bg-amber-100 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400'
              }`}>
                <Check className="w-3 h-3" strokeWidth={3} />
              </div>
              <div>
                <span className="block text-sm font-medium text-gray-900 dark:text-gray-200">
                  {feature.value}
                </span>
                <span className="block text-xs text-gray-500 dark:text-gray-400">
                  {feature.label}
                </span>
              </div>
            </li>
          ))}
        </ul>

        {/* Action Button */}
        <div className="mt-auto">
          {isCurrent ? (
            <button
              disabled
              className="w-full py-3 px-4 rounded-xl font-semibold text-sm bg-gray-100 dark:bg-gray-700 text-gray-400 dark:text-gray-500 border border-gray-200 dark:border-gray-600 cursor-not-allowed flex items-center justify-center gap-2"
            >
              Current Plan
            </button>
          ) : (
            <button
              onClick={() => onSubscribe?.(plan.id)}
              disabled={isLoading}
              className={`w-full py-3 px-4 rounded-xl font-semibold text-sm shadow-sm transition-all duration-200 flex items-center justify-center gap-2 ${
                isFree
                  ? 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-200 border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700'
                  : 'bg-gradient-to-r from-primary-600 to-primary-500 hover:from-primary-700 hover:to-primary-600 text-white shadow-primary-500/25 hover:shadow-primary-500/40 hover:-translate-y-0.5'
              }`}
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Processing...
                </>
              ) : (
                isFree ? 'Downgrade' : 'Subscribe Now'
              )}
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
