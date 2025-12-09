import Skeleton from 'react-loading-skeleton';
import 'react-loading-skeleton/dist/skeleton.css';

interface StatCardSkeletonProps {
  count?: number;
}

export const StatCardSkeleton: React.FC<StatCardSkeletonProps> = ({
  count = 1,
}) => {
  return (
    <>
      {Array.from({ length: count }).map((_, index) => (
        <div key={index} className="card dark:bg-gray-800">
          <div className="flex items-center gap-3">
            <Skeleton circle width={48} height={48} />
            <div className="flex-1">
              <Skeleton width={100} height={14} className="mb-2" />
              <Skeleton width={60} height={32} />
            </div>
          </div>
        </div>
      ))}
    </>
  );
};
