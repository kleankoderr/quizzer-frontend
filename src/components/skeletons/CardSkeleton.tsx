import Skeleton from "react-loading-skeleton";
import "react-loading-skeleton/dist/skeleton.css";

interface CardSkeletonProps {
  count?: number;
}

export const CardSkeleton: React.FC<CardSkeletonProps> = ({ count = 1 }) => {
  return (
    <>
      {Array.from({ length: count }).map((_, index) => (
        <div key={index} className="card dark:bg-gray-800 p-4 md:p-6">
          <div className="flex items-start justify-between mb-4">
            <Skeleton circle width={48} height={48} />
            <Skeleton width={60} height={24} borderRadius={12} />
          </div>
          <Skeleton height={24} width="80%" className="mb-2" />
          <Skeleton count={3} />
          <div className="mt-4 flex items-center gap-2">
            <Skeleton width={16} height={16} />
            <Skeleton width={120} />
          </div>
        </div>
      ))}
    </>
  );
};
