import { useState, useEffect, useRef } from 'react';
import { Search, Menu, Sun, Moon, Zap, ChevronDown, Crown } from 'lucide-react';
import Skeleton from 'react-loading-skeleton';
import 'react-loading-skeleton/dist/skeleton.css';
import { Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useTheme } from '../contexts/ThemeContext';
import { GlobalSearch } from './GlobalSearch';
import { useQuota } from '../hooks/useQuota';
import { SubscriptionBadge } from './SubscriptionBadge';
import type { QuotaStatus } from '../types';

// Helper function to calculate total remaining quota
const getTotalRemaining = (quota: QuotaStatus): number => {
  return (
    quota.quiz.remaining +
    quota.flashcard.remaining +
    quota.learningGuide.remaining +
    quota.explanation.remaining
  );
};

// Helper function to format reset time
const getResetTimeText = (): string => {
  // const reset = new Date(resetAt); // Unused

  const now = new Date();
  const tomorrow = new Date(now);
  tomorrow.setDate(tomorrow.getDate() + 1);
  tomorrow.setHours(0, 0, 0, 0);

  const diffMs = tomorrow.getTime() - now.getTime();
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
  const diffMins = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));

  if (diffHours > 0) {
    return `in ${diffHours}h ${diffMins}m`;
  }
  return `in ${diffMins}m`;
};

// Quota item component
interface QuotaItemProps {
  label: string;
  used: number;
  limit: number;
  remaining: number;
}

const QuotaItem = ({ label, used, limit, remaining }: QuotaItemProps) => {
  const percentage = limit > 0 ? (used / limit) * 100 : 0;
  const isLow = remaining <= 1;

  return (
    <div>
      <div className="flex items-center justify-between mb-1">
        <span className="text-sm text-gray-700 dark:text-gray-300">
          {label}
        </span>
        <span
          className={`text-sm font-medium ${
            isLow
              ? 'text-red-600 dark:text-red-400'
              : 'text-gray-900 dark:text-white'
          }`}
        >
          {used}/{limit}
        </span>
      </div>
      <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2 overflow-hidden">
        <div
          className={`h-2 rounded-full transition-all ${
            isLow
              ? 'bg-red-500'
              : percentage > 50
              ? 'bg-amber-500'
              : 'bg-primary-500'
          }`}
          style={{ width: `${percentage}%` }}
        />
      </div>
    </div>
  );
};

interface HeaderProps {
  toggleSidebar: () => void;
}

export const Header = ({ toggleSidebar }: HeaderProps) => {
  const { user } = useAuth();
  const { setTheme, resolvedTheme } = useTheme();
  const { data: quota, isLoading: quotaLoading } = useQuota();

  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isQuotaDropdownOpen, setIsQuotaDropdownOpen] = useState(false);
  const quotaDropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        quotaDropdownRef.current &&
        !quotaDropdownRef.current.contains(event.target as Node)
      ) {
        setIsQuotaDropdownOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Keyboard shortuct Cmd+K / Ctrl+K
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setIsSearchOpen((prev) => !prev);
      }
    };

    globalThis.addEventListener('keydown', handleKeyDown);
    return () => globalThis.removeEventListener('keydown', handleKeyDown);
  }, []);

  return (
    <>
      <header className="bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-600 h-16 flex items-center justify-between px-3 sm:px-4 sticky top-0 z-40 text-gray-900 dark:text-white">
        <div className="flex items-center gap-2 sm:gap-4 flex-1">
          <button
            onClick={toggleSidebar}
            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg lg:hidden text-gray-600 dark:text-gray-200"
          >
            <Menu className="w-5 h-5" />
          </button>

          {/* Search Trigger */}
          <button
            onClick={() => setIsSearchOpen(true)}
            className="hidden md:flex items-center w-full max-w-md bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg px-3 py-2 text-sm text-gray-500 hover:border-gray-300 dark:hover:border-gray-600 transition-colors group"
          >
            <Search className="w-4 h-4 mr-2 text-gray-400 group-hover:text-primary-500 transition-colors" />
            <span className="flex-1 text-left">
              Search topics, quizzes, flashcards...
            </span>
            <div className="flex items-center gap-1 text-xs text-gray-400 bg-white dark:bg-gray-700 px-1.5 py-0.5 rounded border border-gray-200 dark:border-gray-600">
              <span className="text-xs">⌘</span>
              <span>K</span>
            </div>
          </button>

          {/* Mobile Search Icon */}
          <button
            onClick={() => setIsSearchOpen(true)}
            className="md:hidden p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg text-gray-600 dark:text-gray-200"
          >
            <Search className="w-5 h-5" />
          </button>
        </div>

        <div className="flex items-center gap-2 sm:gap-4">
          {/* Pricing Link for Non-Premium */}
          {quotaLoading ? (
            <div className="block w-10 sm:w-24">
              <Skeleton height={36} borderRadius={8} />
            </div>
          ) : (
            quota &&
            !quota.isPremium && (
              <Link
                to="/pricing"
                className="flex items-center gap-2 px-3 py-2 sm:px-4 sm:py-2 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-white text-sm font-medium rounded-lg shadow-sm hover:shadow transition-all group"
              >
                <Crown className="w-4 h-4 text-amber-100 group-hover:text-white transition-colors" />
                <span className="hidden sm:inline">Pricing</span>
              </Link>
            )
          )}

          {/* Quota Display */}
          {quotaLoading ? (
            <div className="w-32">
              <Skeleton height={36} borderRadius={8} />
            </div>
          ) : (
            quota && (
              <div className="relative" ref={quotaDropdownRef}>
                <button
                  onClick={() => setIsQuotaDropdownOpen(!isQuotaDropdownOpen)}
                  className={`flex items-center gap-2 px-3 py-1.5 rounded-lg border transition-all ${
                    quota.isPremium
                      ? 'bg-gradient-to-r from-amber-50 to-yellow-50 dark:from-amber-900/20 dark:to-yellow-900/20 border-amber-200 dark:border-amber-700 hover:border-amber-300 dark:hover:border-amber-600'
                      : getTotalRemaining(quota) <= 2
                      ? 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-700 hover:border-red-300 dark:hover:border-red-600'
                      : 'bg-gray-50 dark:bg-gray-800 border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
                  }`}
                  aria-label="Quota status"
                >
                  <Zap
                    className={`w-4 h-4 ${
                      quota.isPremium
                        ? 'text-amber-500'
                        : getTotalRemaining(quota) <= 2
                        ? 'text-red-500'
                        : 'text-gray-500 dark:text-gray-400'
                    }`}
                  />
                  <span className="hidden sm:inline text-sm font-medium text-gray-700 dark:text-gray-300">
                    {getTotalRemaining(quota)} left
                  </span>
                  {quota.isPremium && (
                    <SubscriptionBadge isPremium={true} size="sm" />
                  )}
                  <ChevronDown className="w-3 h-3 text-gray-400" />
                </button>

                {/* Quota Dropdown */}
                {isQuotaDropdownOpen && (
                  <div className="fixed sm:absolute left-2 right-2 sm:left-auto sm:right-0 top-[4.5rem] sm:top-full w-auto sm:w-72 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 p-4 z-[100]">
                    <div className="flex items-center justify-between mb-3">
                      <h3 className="font-semibold text-gray-900 dark:text-white">
                        Daily Quota
                      </h3>
                      {quota.isPremium && (
                        <SubscriptionBadge isPremium={true} size="sm" />
                      )}
                    </div>

                    <div className="space-y-3">
                      {/* Quiz Quota */}
                      <QuotaItem
                        label="Quizzes"
                        used={quota.quiz.used}
                        limit={quota.quiz.limit}
                        remaining={quota.quiz.remaining}
                      />

                      {/* Flashcard Quota */}
                      <QuotaItem
                        label="Flashcards"
                        used={quota.flashcard.used}
                        limit={quota.flashcard.limit}
                        remaining={quota.flashcard.remaining}
                      />

                      {/* Learning Guide Quota */}
                      <QuotaItem
                        label="Learning Guides"
                        used={quota.learningGuide.used}
                        limit={quota.learningGuide.limit}
                        remaining={quota.learningGuide.remaining}
                      />

                      {/* Explanation Quota */}
                      <QuotaItem
                        label="Explanations"
                        used={quota.explanation.used}
                        limit={quota.explanation.limit}
                        remaining={quota.explanation.remaining}
                      />

                      {/* File Storage Quota (Premium only) */}
                      {quota.fileStorage && (
                        <QuotaItem
                          label="Storage"
                          used={quota.fileStorage.used}
                          limit={quota.fileStorage.limit}
                          remaining={quota.fileStorage.remaining}
                        />
                      )}
                    </div>

                    <div className="mt-3 pt-3 border-t border-gray-200 dark:border-gray-700">
                      <p className="text-xs text-gray-500 dark:text-gray-400">
                        Resets {getResetTimeText()}
                      </p>
                    </div>

                    {!quota.isPremium && getTotalRemaining(quota) <= 3 && (
                      <div className="mt-3 pt-3 border-t border-gray-200 dark:border-gray-700">
                        <p className="text-xs text-gray-600 dark:text-gray-400 mb-2">
                          Running low on quota? Upgrade for more!
                        </p>
                        <Link
                          to="/pricing"
                          className="block w-full text-center px-3 py-1.5 bg-gradient-to-r from-primary-500 to-primary-600 text-white text-sm font-medium rounded-lg hover:from-primary-600 hover:to-primary-700 transition-all"
                        >
                          Upgrade to Premium
                        </Link>
                      </div>
                    )}

                    {quota.isPremium && (
                      <div className="mt-3 pt-3 border-t border-gray-200 dark:border-gray-700">
                        <Link
                          to="/subscription/manage"
                          className="block w-full text-center px-3 py-1.5 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 text-sm font-medium rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-all"
                        >
                          Manage Subscription
                        </Link>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )
          )}

          <button
            onClick={() =>
              setTheme(resolvedTheme === 'dark' ? 'light' : 'dark')
            }
            className="p-2 text-gray-500 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-700 rounded-lg transition-colors"
            aria-label="Toggle theme"
          >
            {resolvedTheme === 'dark' ? (
              <Sun className="w-5 h-5" />
            ) : (
              <Moon className="w-5 h-5" />
            )}
          </button>

          <Link
            to="/profile"
            className="flex items-center gap-2 sm:gap-3 pl-2 sm:pl-4 border-l border-gray-200 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors rounded-lg p-1"
          >
            <div className="text-right hidden sm:block">
              <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
                {user?.name || 'Guest'}
              </p>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                {user?.schoolName || 'Student'}
              </p>
            </div>
            <div className="w-8 h-8 bg-primary-100 rounded-full flex items-center justify-center text-primary-700 font-medium">
              {user?.name?.[0] || 'U'}
            </div>
          </Link>
        </div>
      </header>

      <GlobalSearch
        isOpen={isSearchOpen}
        onClose={() => setIsSearchOpen(false)}
      />
    </>
  );
};
