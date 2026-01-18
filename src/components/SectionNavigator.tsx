import React, { useState } from 'react';
import { CheckCircle, Circle, ChevronDown, List } from 'lucide-react';
import type { Content } from '../services/content.service';

interface SectionNavigatorProps {
  sections: NonNullable<Content['learningGuide']>['sections'];
  activeSection: number;
  completedSections: Set<number>;
  onSectionClick: (index: number) => void;
}

export const SectionNavigator: React.FC<SectionNavigatorProps> = ({
  sections,
  activeSection,
  completedSections,
  onSectionClick,
}) => {
  const [isExpanded, setIsExpanded] = useState(true); // Expanded by default for better visibility

  return (
    <div className="bg-white dark:bg-gray-800 sm:rounded-xl sm:border border-gray-200 dark:border-gray-700 sm:shadow-sm mb-6">
      {/* Header */}
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full p-4 flex items-center justify-between hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors border-b border-gray-100 dark:border-gray-700"
      >
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-primary-50 dark:bg-primary-900/30 flex items-center justify-center text-primary-600 dark:text-primary-400">
              <List className="w-5 h-5" />
            </div>
            <div className="text-left">
              <h2
                className="text-base font-bold text-gray-900 dark:text-white"
                style={{ fontFamily: 'Lexend' }}
              >
                Learning Path
              </h2>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                {completedSections.size} of {sections.length} chapters •{' '}
                {Math.round((completedSections.size / sections.length) * 100)}%
              </p>
            </div>
          </div>
        </div>
        <ChevronDown
          className={`w-5 h-5 text-gray-400 transition-transform duration-300 ${
            isExpanded ? 'rotate-180' : ''
          }`}
        />
      </button>

      {/* Sections List */}
      <div
        className={`grid transition-all duration-300 ease-in-out ${
          isExpanded ? 'grid-rows-[1fr]' : 'grid-rows-[0fr]'
        }`}
      >
        <div className="overflow-hidden">
          <div className="p-3 space-y-1.5">
            {sections.map((section, idx) => {
              const isCompleted = completedSections.has(idx);
              const isActive = activeSection === idx;

              return (
                <button
                  key={idx}
                  onClick={() => onSectionClick(idx)}
                  className={`w-full flex items-center gap-3 p-3 rounded-lg transition-all duration-200 text-left group ${
                    isActive
                      ? 'bg-primary-50 dark:bg-primary-900/20 border border-primary-200 dark:border-primary-800 shadow-sm'
                      : isCompleted
                        ? 'hover:bg-gray-50 dark:hover:bg-gray-700/50 border border-transparent'
                        : 'hover:bg-gray-50 dark:hover:bg-gray-700/50 border border-transparent'
                  }`}
                >
                  {/* Icon */}
                  <div className="flex-shrink-0">
                    {isCompleted ? (
                      <CheckCircle className="w-5 h-5 text-green-600 dark:text-green-400" />
                    ) : isActive ? (
                      <div className="w-5 h-5 rounded-full bg-primary-600 dark:bg-primary-500 flex items-center justify-center">
                        <div className="w-2 h-2 rounded-full bg-white" />
                      </div>
                    ) : (
                      <Circle className="w-5 h-5 text-gray-300 dark:text-gray-600 group-hover:text-gray-400 dark:group-hover:text-gray-500" />
                    )}
                  </div>

                  {/* Section Title */}
                  <div className="flex-1 min-w-0">
                    <div
                      className={`font-medium text-sm transition-colors ${
                        isActive
                          ? 'text-primary-700 dark:text-primary-300 font-semibold'
                          : isCompleted
                            ? 'text-gray-500 dark:text-gray-400'
                            : 'text-gray-700 dark:text-gray-300 group-hover:text-gray-900 dark:group-hover:text-white'
                      }`}
                      style={{ fontFamily: 'Lexend' }}
                    >
                      {section.title}
                    </div>
                  </div>

                  {/* Section Number */}
                  <div
                    className={`flex-shrink-0 text-xs font-medium ${
                      isActive
                        ? 'text-primary-600 dark:text-primary-400'
                        : 'text-gray-400 dark:text-gray-500'
                    }`}
                  >
                    {idx + 1}
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};
