import React, { useState } from 'react';
import { ChevronDown, Folder } from 'lucide-react';

interface CollapsibleSectionProps {
  title: string; // The title of the section (e.g., Study Pack name)
  count: number; // Number of items in the section
  children: React.ReactNode;
  defaultOpen?: boolean;
  className?: string;
  icon?: React.ReactNode;
  onTitleClick?: () => void; // Optional callback when title/icon is clicked
}

export const CollapsibleSection: React.FC<CollapsibleSectionProps> = ({
  title,
  count,
  children,
  defaultOpen = true,
  className = '',
  icon,
  onTitleClick,
}) => {
  const [isOpen, setIsOpen] = useState(defaultOpen);

  const handleTitleClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (onTitleClick) {
      onTitleClick();
    }
  };

  return (
    <div
      className={`border border-gray-200 dark:border-gray-700/50 rounded-xl overflow-hidden bg-white dark:bg-gray-800/50 ${className}`}
    >
      <div className="w-full flex items-center justify-between p-4 bg-gray-50/50 dark:bg-gray-800/50">
        {/* Left side: Clickable folder icon and title */}
        <button
          onClick={handleTitleClick}
          disabled={!onTitleClick}
          className={`flex items-center gap-3 flex-1 ${
            onTitleClick
              ? 'cursor-pointer group hover:opacity-80 transition-opacity'
              : ''
          }`}
        >
          <div className="p-2 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 shadow-sm">
            {icon || (
              <Folder className="w-5 h-5 text-primary-600 dark:text-primary-400" />
            )}
          </div>
          <div className="flex flex-col items-start">
            <h3 className={`text-lg font-bold text-gray-900 dark:text-gray-100 ${onTitleClick ? 'group-hover:text-primary-600 dark:group-hover:text-primary-400' : ''}`}>
              {title}
            </h3>
            <span className="text-xs text-gray-500 dark:text-gray-400 font-medium">
              {count} item{count === 1 ? '' : 's'}
            </span>
          </div>
        </button>

        {/* Right side: Toggle button */}
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="p-2 rounded-lg bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
        >
          <div
            className={`transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`}
          >
            <ChevronDown className="w-5 h-5" />
          </div>
        </button>
      </div>

      <div
        className={`transition-all duration-300 ease-in-out overflow-hidden ${
          isOpen ? 'max-h-[5000px] opacity-100' : 'max-h-0 opacity-0'
        }`}
      >
        <div className="p-4 md:p-6 border-t border-gray-100 dark:border-gray-700/50">
          {children}
        </div>
      </div>
    </div>
  );
};
