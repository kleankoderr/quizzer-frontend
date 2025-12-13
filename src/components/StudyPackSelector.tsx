import React from 'react';
import { useStudyPacks } from '../hooks/useStudyPacks';
import { Folder } from 'lucide-react';

interface StudyPackSelectorProps {
  value?: string;
  onChange: (value: string) => void;
  className?: string;
}

export const StudyPackSelector: React.FC<StudyPackSelectorProps> = ({
  value,
  onChange,
  className = '',
}) => {
  const { data, isLoading } = useStudyPacks(1, 100);
  const studyPacks = data?.data || [];

  return (
    <div className={`space-y-2 ${className}`}>
      <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300">
        Add to Study Pack (Optional)
      </label>
      <div className="relative">
        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
          <Folder className="h-5 w-5 text-gray-400" />
        </div>
        <select
          value={value || ''}
          onChange={(e) => onChange(e.target.value)}
          disabled={isLoading}
          className="w-full pl-10 pr-4 py-3 border-2 border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-all appearance-none"
        >
          <option value="">No Study Pack</option>
          {studyPacks.map((pack) => (
            <option key={pack.id} value={pack.id}>
              {pack.title}
            </option>
          ))}
        </select>
        <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
          <svg
            className="h-5 w-5 text-gray-400"
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 20 20"
            fill="currentColor"
            aria-hidden="true"
          >
            <path
              fillRule="evenodd"
              d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z"
              clipRule="evenodd"
            />
          </svg>
        </div>
      </div>
    </div>
  );
};
