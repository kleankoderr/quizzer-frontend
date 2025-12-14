import React, { useEffect, useState } from 'react';
import { Loader2, CheckCircle, XCircle } from 'lucide-react';
import { toast } from 'react-hot-toast';

interface ProgressToastProps {
  t: any;
  title: string;
  message?: string;
  progress: number;
  status: 'processing' | 'success' | 'error';
}

export const ProgressToast: React.FC<
  ProgressToastProps & { autoProgress?: boolean }
> = ({ t, title, message, progress, status, autoProgress = false }) => {
  const [currentProgress, setCurrentProgress] = useState(progress);

  useEffect(() => {
    if (status === 'success') {
      setCurrentProgress(100);
      return;
    }
    if (status === 'error') {
      return;
    }

    if (status === 'processing' && autoProgress) {
      setCurrentProgress((prev: number) => Math.max(prev, 10)); // Start at least at 10%

      const interval = setInterval(() => {
        setCurrentProgress((prev: number) => {
          if (prev >= 95) return prev;
          // Calculate increment - slower as it gets higher
          const remaining = 95 - prev;
          const increment = Math.max(0.1, remaining * 0.05);
          return Math.min(95, prev + Math.random() * increment);
        });
      }, 500);

      return () => clearInterval(interval);
    } else {
      setCurrentProgress(progress);
    }
  }, [status, autoProgress, progress]);

  useEffect(() => {
    if (status === 'success' || status === 'error') {
      const timer = setTimeout(() => {
        toast.dismiss(t.id);
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [status, t.id]);

  const getBorderColor = () => {
    if (status === 'processing') return 'border-l-blue-500';
    if (status === 'success') return 'border-l-green-500';
    return 'border-l-red-500';
  };

  const getIconBgColor = () => {
    if (status === 'processing') return 'bg-blue-50 dark:bg-blue-900/20';
    if (status === 'success') return 'bg-green-50 dark:bg-green-900/20';
    return 'bg-red-50 dark:bg-red-900/20';
  };

  const truncateMessage = (msg: string, maxLength: number = 60) => {
    if (msg.length <= maxLength) return msg;
    return msg.substring(0, maxLength) + '...';
  };

  const displayMessage =
    status === 'error'
      ? '.....'
      : message
        ? truncateMessage(message)
        : undefined;

  return (
    <div
      className={`${
        t.visible ? 'animate-enter' : 'animate-leave'
      } max-w-md w-full bg-white dark:bg-gray-800 shadow-xl rounded-lg pointer-events-auto border-l-4 ${getBorderColor()} overflow-hidden`}
    >
      <div className="p-4">
        <div className="flex items-center gap-3">
          {/* Icon */}
          <div className={`flex-shrink-0 rounded-full p-2 ${getIconBgColor()}`}>
            {status === 'processing' && (
              <div className="relative flex items-center justify-center w-10 h-10">
                <Loader2 className="absolute w-10 h-10 text-blue-600 dark:text-blue-400 animate-spin" />
                <span className="relative text-[10px] font-bold text-blue-700 dark:text-blue-300">
                  {Math.round(currentProgress)}%
                </span>
              </div>
            )}
            {status === 'success' && (
              <CheckCircle className="h-6 w-6 text-green-600 dark:text-green-400" />
            )}
            {status === 'error' && (
              <XCircle className="h-6 w-6 text-red-600 dark:text-red-400" />
            )}
          </div>

          {/* Content */}
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-gray-900 dark:text-white">
              {title}
            </p>
            {displayMessage && (
              <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                {displayMessage}
              </p>
            )}
            {status === 'processing' && (
              <div className="mt-2 w-full bg-gray-200 dark:bg-gray-700 rounded-full h-1.5 overflow-hidden">
                <div
                  className="bg-gradient-to-r from-blue-500 to-blue-600 h-1.5 rounded-full transition-all duration-500 ease-out"
                  style={{ width: `${currentProgress}%` }}
                />
              </div>
            )}
          </div>

          {/* Close Button */}
          {status === 'processing' && (
            <button
              onClick={() => toast.dismiss(t.id)}
              className="flex-shrink-0 text-xs font-medium text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 px-2 py-1 rounded hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
              aria-label="Close notification"
            >
              Close
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
