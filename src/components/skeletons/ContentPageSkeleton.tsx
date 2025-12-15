import Skeleton from 'react-loading-skeleton';
import 'react-loading-skeleton/dist/skeleton.css';

export const ContentPageSkeleton = () => {
  return (
    <div className="max-w-[1600px] mx-auto pb-20 px-4 sm:px-6 lg:px-8">
      {/* Header Skeleton */}
      <div className="mb-8 sticky top-0 z-50 bg-white dark:bg-gray-900 pt-4 pb-4 -mx-4 px-4 sm:-mx-6 sm:px-6 lg:-mx-8 lg:px-8">
        <div className="flex items-center justify-between gap-4 max-w-7xl mx-auto">
          <div className="flex items-center gap-4">
            {/* Back Button */}
            <Skeleton circle width={40} height={40} />
            <div>
              {/* Topic & Date */}
              <div className="flex items-center gap-2 mb-1">
                <Skeleton width={80} height={20} />
                <Skeleton width={60} height={16} />
              </div>
              {/* Title */}
              <Skeleton width={200} height={28} />
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Actions */}
            <Skeleton width={120} height={40} borderRadius={8} />
            <Skeleton width={140} height={40} borderRadius={8} />
            <div className="hidden sm:block h-6 w-px bg-gray-200 dark:bg-gray-700 mx-1"></div>
            <Skeleton width={40} height={40} borderRadius={8} className="hidden sm:block" />
            <Skeleton width={40} height={40} borderRadius={8} className="hidden sm:block" />
          </div>
        </div>
      </div>

      <div className="flex gap-8 max-w-[1600px] mx-auto">
        {/* Main Content Skeleton */}
        <div className="flex-1 min-w-0">
          <div className="bg-white dark:bg-gray-800 sm:rounded-2xl sm:shadow-sm sm:border border-gray-200 dark:border-gray-700 p-4 sm:p-8 md:p-12 min-h-[500px]">
            {/* Title */}
            <Skeleton width="60%" height={48} className="mb-8" />
            
            {/* Section 1 */}
            <div className="mb-12">
              <Skeleton width="40%" height={32} className="mb-4" />
              <Skeleton count={5} className="mb-2" />
            </div>

            {/* Section 2 */}
            <div className="mb-12">
              <Skeleton width="40%" height={32} className="mb-4" />
              <Skeleton count={5} className="mb-2" />
            </div>
            
            {/* Section 3 */}
            <div className="mb-12">
              <Skeleton width="40%" height={32} className="mb-4" />
              <Skeleton count={5} className="mb-2" />
            </div>
          </div>
        </div>

        {/* Notes Skeleton */}
        <div className="hidden xl:block w-80 flex-shrink-0">
          <div className="flex items-center justify-between mb-6">
            <Skeleton width={150} height={24} />
            <Skeleton width={30} height={20} borderRadius={10} />
          </div>
          <div className="space-y-4">
            <Skeleton height={100} borderRadius={12} />
            <Skeleton height={80} borderRadius={12} />
            <Skeleton height={120} borderRadius={12} />
          </div>
        </div>
      </div>
    </div>
  );
};
