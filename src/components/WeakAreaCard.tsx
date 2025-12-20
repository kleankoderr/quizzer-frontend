import { AlertTriangle, CheckCircle, Lock, Target } from 'lucide-react';
import type { WeakArea } from '../services/weak-area.service';
import { format } from 'date-fns';

interface WeakAreaCardProps {
  weakArea: WeakArea;
  isPremium: boolean;
  onResolve: (id: string) => void;
  onPractice: (id: string) => void;
  showActions?: boolean;
}

export const WeakAreaCard = ({
  weakArea,
  isPremium,
  onResolve,
  onPractice,
  showActions = true,
}: WeakAreaCardProps) => {
  return (
    <div className="card p-4 hover:shadow-md transition-all dark:bg-gray-800">
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1 min-w-0">
          {/* Topic Badge */}
          <div className="flex items-center gap-2 mb-2">
            <AlertTriangle className="w-4 h-4 text-orange-600 dark:text-orange-400 flex-shrink-0" />
            <span className="text-xs font-semibold text-orange-600 dark:text-orange-400 bg-orange-50 dark:bg-orange-900/20 px-2 py-1 rounded">
              {weakArea.topic}
            </span>
          </div>

          {/* Concept */}
          <h3 className="text-base font-semibold text-gray-900 dark:text-white mb-2 line-clamp-2">
            {weakArea.concept}
          </h3>

          {/* Stats */}
          <div className="flex items-center gap-4 text-sm text-gray-600 dark:text-gray-400">
            <div className="flex items-center gap-1">
              <span className="font-semibold text-red-600 dark:text-red-400">
                {weakArea.errorCount}
              </span>
              <span>
                {weakArea.errorCount === 1 ? 'error' : 'errors'}
              </span>
            </div>
            <span>•</span>
            <div>
              Last: {format(new Date(weakArea.lastErrorAt), 'MMM d, yyyy')}
            </div>
          </div>
        </div>

        {/* Error Count Badge */}
        <div className="flex-shrink-0">
          <div className="w-12 h-12 rounded-full bg-red-50 dark:bg-red-900/20 flex items-center justify-center">
            <span className="text-lg font-bold text-red-600 dark:text-red-400">
              {weakArea.errorCount}
            </span>
          </div>
        </div>
      </div>

      {/* Actions */}
      {showActions && (
        <div className="flex flex-col sm:flex-row gap-2 mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
          {!weakArea.resolved && (
            <button
              onClick={() => onResolve(weakArea.id)}
              className="flex items-center justify-center gap-2 px-4 py-2 text-sm font-medium text-green-700 dark:text-green-400 bg-green-50 dark:bg-green-900/20 hover:bg-green-100 dark:hover:bg-green-900/30 rounded-lg transition-colors"
            >
              <CheckCircle className="w-4 h-4" />
              Mark as Resolved
            </button>
          )}

          {/* Practice This Button */}
          <button
            onClick={() => onPractice(weakArea.id)}
            disabled={!isPremium}
            className={`flex items-center justify-center gap-2 px-4 py-2 text-sm font-medium rounded-lg transition-colors ${
              isPremium
                ? 'text-blue-700 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/20 hover:bg-blue-100 dark:hover:bg-blue-900/30'
                : 'text-gray-500 dark:text-gray-500 bg-gray-100 dark:bg-gray-800 cursor-not-allowed'
            }`}
            title={!isPremium ? 'Upgrade to Premium to generate smart practice quizzes' : ''}
          >
            {!isPremium ? (
              <>
                <Lock className="w-4 h-4" />
                Practice This (Premium)
              </>
            ) : (
              <>
                <Target className="w-4 h-4" />
                Practice This
              </>
            )}
          </button>
        </div>
      )}
    </div>
  );
};
