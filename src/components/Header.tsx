import { useState, useEffect, useRef } from 'react';
import { Search, Menu, Sun, Moon, Zap, ChevronDown, Crown } from 'lucide-react';
import Skeleton from 'react-loading-skeleton';
import 'react-loading-skeleton/dist/skeleton.css';
import { Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useTheme } from '../contexts/ThemeContext';
import { GlobalSearch } from './GlobalSearch';
import { useQuota } from '../hooks';
import { SubscriptionBadge } from './SubscriptionBadge';
import type { QuotaStatus } from '../types';

// Helper function to calculate total remaining quota
const getTotalRemaining = (quota: QuotaStatus): number => {
  let total =
    quota.quiz.remaining +
    quota.flashcard.remaining +
    quota.studyMaterial.remaining +
    quota.conceptExplanation.remaining;

  if (quota.fileStorage) {
     if (quota.fileStorage) {
       total += quota.fileStorage.remaining;
     }
  }
  return total;
};

// Helper function to format reset time
const getResetTimeText = (resetAt?: string): string => {
  if (!resetAt) return '';
  
  const now = new Date();
  const resetDate = new Date(resetAt);
  
  // If reset date is in the past, it means it resets next month relative to now
  if (resetDate < now) {
    const nextMonth = new Date(now);
    nextMonth.setMonth(nextMonth.getMonth() + 1);
    nextMonth.setDate(1);
    nextMonth.setHours(0, 0, 0, 0);
    
    const diffMs = nextMonth.getTime() - now.getTime();
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
    
    if (diffDays > 0) {
      return `in ${diffDays} days`;
    }
    
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    return `in ${diffHours} hours`;
  }

  const diffMs = resetDate.getTime() - now.getTime();
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
  
  if (diffDays > 0) {
    return `in ${diffDays} days`;
  }
  
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

  // Keyboard shortcut Cmd+K / Ctrl+K (only for non-admin users)
  useEffect(() => {
    // Don't enable search shortcut for admins
    if (user?.role === 'ADMIN' || user?.role === 'SUPER_ADMIN') {
      return;
    }

    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setIsSearchOpen((prev) => !prev);
      }
    };

    globalThis.addEventListener('keydown', handleKeyDown);
    return () => globalThis.removeEventListener('keydown', handleKeyDown);
  }, [user?.role]);

  return (
    <>
      <header className="bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-600 h-16 flex items-center justify-between px-3 sm:px-4 lg:px-6 sticky top-0 z-50 text-gray-900 dark:text-white">
        <div className="flex items-center gap-2 sm:gap-3 flex-1 min-w-0">
          <button
            onClick={toggleSidebar}
            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg lg:hidden text-gray-600 dark:text-gray-200 flex-shrink-0"
            aria-label="Toggle sidebar"
          >
            <Menu className="w-5 h-5" />
          </button>

          {/* Search Trigger - Desktop (non-admin only) */}
          {user?.role !== 'ADMIN' && user?.role !== 'SUPER_ADMIN' && (
            <button
              onClick={() => setIsSearchOpen(true)}
              className="hidden md:flex items-center w-full max-w-md bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg px-3 py-2 text-sm text-gray-500 hover:border-gray-300 dark:hover:border-gray-600 transition-colors group"
            >
              <Search className="w-4 h-4 mr-2 text-gray-400 group-hover:text-primary-500 transition-colors flex-shrink-0" />
              <span className="flex-1 text-left truncate">
                Search topics, quizzes, flashcards...
              </span>
              <div className="hidden lg:flex items-center gap-1 text-xs text-gray-400 bg-white dark:bg-gray-700 px-1.5 py-0.5 rounded border border-gray-200 dark:border-gray-600 flex-shrink-0">
                <span className="text-xs">⌘</span>
                <span>K</span>
              </div>
            </button>
          )}

          {/* Mobile Search Icon (non-admin only) */}
          {user?.role !== 'ADMIN' && user?.role !== 'SUPER_ADMIN' && (
            <button
              onClick={() => setIsSearchOpen(true)}
              className="md:hidden p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg text-gray-600 dark:text-gray-200 flex-shrink-0"
              aria-label="Search"
            >
              <Search className="w-5 h-5" />
            </button>
          )}
        </div>

        <div className="flex items-center gap-1.5 sm:gap-2 lg:gap-3 flex-shrink-0">
          {/* Pricing Link for Non-Premium (non-admin only) */}
          {quotaLoading ? (
            !user?.role || (user.role !== 'ADMIN' && user.role !== 'SUPER_ADMIN') ? (
              <div className="hidden sm:block w-20 lg:w-24">
                <Skeleton height={36} borderRadius={8} />
              </div>
            ) : null
          ) : (
            quota &&
            !quota.isPremium &&
            user?.role !== 'ADMIN' &&
            user?.role !== 'SUPER_ADMIN' && (
              <Link
                to="/pricing"
                className="flex items-center gap-1.5 px-2.5 py-1.5 sm:px-3 sm:py-2 lg:px-4 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-white text-sm font-medium rounded-lg shadow-sm hover:shadow transition-all group flex-shrink-0"
              >
                <Crown className="w-4 h-4 text-amber-100 group-hover:text-white transition-colors flex-shrink-0" />
                <span className="hidden sm:inline whitespace-nowrap">Pricing</span>
              </Link>
            )
          )}

          {/* Quota Display (non-admin only) */}
          {quotaLoading ? (
            !user?.role || (user.role !== 'ADMIN' && user.role !== 'SUPER_ADMIN') ? (
              <div className="w-20 sm:w-28">
                <Skeleton height={36} borderRadius={8} />
              </div>
            ) : null
          ) : (
            quota &&
            user?.role !== 'ADMIN' &&
            user?.role !== 'SUPER_ADMIN' && (
              <div className="relative" ref={quotaDropdownRef}>
                <button
                  onClick={() => setIsQuotaDropdownOpen(!isQuotaDropdownOpen)}
                  className={`flex items-center gap-1.5 sm:gap-2 px-2.5 sm:px-3 py-1.5 rounded-lg border transition-all flex-shrink-0 ${
                    getTotalRemaining(quota) <= 2
                      ? 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-700 hover:border-red-300 dark:hover:border-red-600'
                      : 'bg-gray-50 dark:bg-gray-800 border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
                  }`}
                  aria-label="Quota status"
                >
                  <Zap
                    className={`w-4 h-4 flex-shrink-0 ${
                      quota.isPremium
                        ? 'text-amber-500'
                        : getTotalRemaining(quota) <= 2
                        ? 'text-red-500'
                        : 'text-gray-500 dark:text-gray-400'
                    }`}
                  />
                  <span className="hidden sm:inline text-sm font-medium text-gray-700 dark:text-gray-300 whitespace-nowrap">
                    {getTotalRemaining(quota)} left
                  </span>
                  <ChevronDown className="w-3 h-3 text-gray-400 flex-shrink-0" />
                </button>

                {/* Quota Dropdown */}
                {isQuotaDropdownOpen && (
                  <div className="fixed sm:absolute left-3 right-3 sm:left-auto sm:right-0 top-[4.5rem] sm:top-full sm:mt-2 w-auto sm:w-80 max-w-[calc(100vw-1.5rem)] bg-white dark:bg-gray-800 rounded-lg shadow-xl border border-gray-200 dark:border-gray-700 p-4 z-[100] max-h-[calc(100vh-6rem)] overflow-y-auto">
                    <div className="flex items-center justify-between mb-3">
                      <h3 className="font-semibold text-gray-900 dark:text-white">
                        Monthly Quota
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

                      {/* Study Material Quota */}
                      <QuotaItem
                        label="Study Material"
                        used={quota.studyMaterial.used}
                        limit={quota.studyMaterial.limit}
                        remaining={quota.studyMaterial.remaining}
                      />

                      {/* Concept Explanation Quota */}
                      <QuotaItem
                        label="Explanations"
                        used={quota.conceptExplanation.used}
                        limit={quota.conceptExplanation.limit}
                        remaining={quota.conceptExplanation.remaining}
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
                        Resets {getResetTimeText(quota.monthlyResetAt)}
                      </p>
                    </div>

                    {!quota.isPremium && getTotalRemaining(quota) <= 3 && (
                      <div className="mt-3 pt-3 border-t border-gray-200 dark:border-gray-700">
                        <p className="text-xs text-gray-600 dark:text-gray-400 mb-2">
                          Running low on quota? Upgrade for more!
                        </p>
                        <Link
                          to="/pricing"
                          onClick={() => setIsQuotaDropdownOpen(false)}
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
                          onClick={() => setIsQuotaDropdownOpen(false)}
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
            className="p-2 text-gray-500 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-700 rounded-lg transition-colors flex-shrink-0"
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
            className="flex items-center gap-2 sm:gap-3 pl-2 sm:pl-3 lg:pl-4 border-l border-gray-200 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors rounded-lg p-1 flex-shrink-0"
          >
            <div className="text-right hidden lg:block">
              <p className="text-sm font-medium text-gray-900 dark:text-gray-100 truncate max-w-[120px]">
                {user?.name || 'Guest'}
              </p>
              <p className="text-xs text-gray-500 dark:text-gray-400 truncate max-w-[120px]">
                {user?.schoolName || 'Student'}
              </p>
            </div>
            <div className="w-8 h-8 bg-primary-100 rounded-full flex items-center justify-center text-primary-700 font-medium flex-shrink-0">
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
