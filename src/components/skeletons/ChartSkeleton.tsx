import Skeleton from 'react-loading-skeleton';
import 'react-loading-skeleton/dist/skeleton.css';

export const ChartSkeleton: React.FC = () => {
  return (
    <div className="card dark:bg-gray-800">
      <Skeleton height={24} width={200} className="mb-4" />
      <Skeleton height={300} />
    </div>
  );
};
