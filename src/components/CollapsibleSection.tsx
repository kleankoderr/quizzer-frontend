import React, { useState } from 'react';
import { ChevronDown, Folder } from 'lucide-react';

interface CollapsibleSectionProps {
  title: string; // The title of the section (e.g., Study Set name)
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
      <div
        onClick={() => setIsOpen(!isOpen)}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            setIsOpen(!isOpen);
          }
        }}
        role="button"
        tabIndex={0}
        className="w-full flex items-center justify-between p-4 bg-gray-50/50 dark:bg-gray-800/50 cursor-pointer hover:bg-gray-100/50 dark:hover:bg-gray-700/50 transition-colors group/header outline-none focus-visible:bg-gray-100/80 dark:focus-visible:bg-gray-700/80"
      >
        {/* Left side: Clickable folder icon and title (triggers redirect) */}
        <button
          onClick={handleTitleClick}
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ' ') {
              e.preventDefault();
              e.stopPropagation();
              if (onTitleClick) onTitleClick();
            }
          }}
          className={`flex items-center gap-3 text-left outline-none focus-visible:ring-2 focus-visible:ring-primary-500 rounded-lg p-1 -m-1 ${
            onTitleClick ? 'cursor-pointer group/title' : ''
          }`}
        >
          <div className="p-2 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 shadow-sm group-hover/title:border-primary-400 group-hover/title:bg-primary-50 dark:group-hover/title:bg-primary-900/20 transition-all">
            {icon || (
              <Folder className="w-5 h-5 text-primary-600 dark:text-primary-400 group-hover/title:scale-110 transition-transform" />
            )}
          </div>
          <div className="flex flex-col items-start">
            <h3
              className={`text-lg font-bold text-gray-900 dark:text-gray-100 transition-colors ${
                onTitleClick
                  ? 'group-hover/title:text-primary-600 dark:group-hover/title:text-primary-400'
                  : ''
              }`}
            >
              {title}
            </h3>
          </div>
        </button>

        {/* Center/Empty space: Expand/Collapse trigger */}
        <div className="flex-1 flex flex-col items-start px-4 h-full">
          <span className="text-xs text-gray-500 dark:text-gray-400 font-medium">
            {count} item{count === 1 ? '' : 's'}
          </span>
        </div>

        {/* Right side: Toggle indicator */}
        <div className="p-2 rounded-lg bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-500 dark:text-gray-400 group-hover/header:bg-gray-100 dark:group-hover/header:bg-gray-700 transition-colors">
          <div
            className={`transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`}
          >
            <ChevronDown className="w-5 h-5" />
          </div>
        </div>
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
