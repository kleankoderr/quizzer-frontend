import { Clock } from 'lucide-react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { studyService } from '../services/study.service';

export const FloatingReviewButton = () => {
  const navigate = useNavigate();
  const location = useLocation();

  const { data: dueReviews } = useQuery({
    queryKey: ['due-reviews'],
    queryFn: studyService.getDueForReview,
    refetchInterval: 1000 * 60 * 5, // Refresh every 5 minutes
  });

  const dueCount = dueReviews?.totalDue || 0;

  // Only show on dashboard page
  const isDashboard = location.pathname === '/' || location.pathname === '/dashboard';

  // Don't show button if not on dashboard or no reviews are due
  if (!isDashboard || dueCount === 0) return null;

  const isUrgent = dueReviews?.overdueCount && dueReviews.overdueCount > 0;

  return (
    <button
      onClick={() => navigate('/review')}
      className={`fixed bottom-6 right-6 z-50 p-4 bg-primary-600 hover:bg-primary-700 rounded-full shadow-lg hover:shadow-xl transition-all transform hover:scale-105 ${
        isUrgent ? 'animate-pulse' : ''
      }`}
      title={`${dueCount} item${dueCount !== 1 ? 's' : ''} due for review`}
    >
      <Clock className="w-6 h-6 text-white" />
      {dueCount > 0 && (
        <div className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full min-w-[24px] h-6 flex items-center justify-center text-xs font-bold px-1.5 shadow-md">
          {dueCount > 99 ? '99+' : dueCount}
        </div>
      )}
    </button>
  );
};
