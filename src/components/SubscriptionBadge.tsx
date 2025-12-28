import React from 'react';
import { Crown, Sparkles } from 'lucide-react';

import type { SubscriptionStatus } from '../types';

interface SubscriptionBadgeProps {
  isPremium: boolean;
  status?: SubscriptionStatus;
  className?: string;
  size?: 'sm' | 'md';
}

export const SubscriptionBadge: React.FC<SubscriptionBadgeProps> = ({
  isPremium,
  status,
  className = '',
  size = 'md',
}) => {
  if (status === 'PENDING_PAYMENT') {
    return (
      <span
        className={`inline-flex items-center gap-1.5 font-medium text-yellow-700 dark:text-yellow-400 bg-yellow-100 dark:bg-yellow-900/40 border border-yellow-200 dark:border-yellow-700/50 rounded-full transition-colors ${
          size === 'sm' ? 'px-2 py-0.5 text-xs' : 'px-3 py-1 text-sm'
        } ${className}`}
      >
        <Sparkles className={size === 'sm' ? 'w-3 h-3' : 'w-4 h-4'} />
        <span>Processing</span>
      </span>
    );
  }

  if (isPremium) {
    return (
      <span
        className={`inline-flex items-center gap-1.5 font-semibold text-amber-700 dark:text-amber-400 bg-amber-100 dark:bg-amber-900/40 border border-amber-200 dark:border-amber-700/50 rounded-full transition-colors ${
          size === 'sm' ? 'px-2 py-0.5 text-xs' : 'px-3 py-1 text-sm'
        } ${className}`}
      >
        <Crown className={size === 'sm' ? 'w-3 h-3' : 'w-4 h-4'} />
        <span>Premium</span>
      </span>
    );
  }

  return (
    <span
      className={`inline-flex items-center gap-1.5 font-medium text-gray-600 dark:text-gray-400 bg-gray-100 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-full transition-colors ${
        size === 'sm' ? 'px-2 py-0.5 text-xs' : 'px-3 py-1 text-sm'
      } ${className}`}
    >
      <Sparkles className={size === 'sm' ? 'w-3 h-3' : 'w-4 h-4'} />
      <span>Free Plan</span>
    </span>
  );
};
