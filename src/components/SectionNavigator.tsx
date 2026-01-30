import React, { useState } from 'react';
import { CheckCircle, ChevronDown, Circle, List, Loader2 } from 'lucide-react';
import type { Content } from '../services/content.service';

interface SectionNavigatorProps {
  sections: NonNullable<Content['learningGuide']>['sections'];
  activeSection: number;
  completedSections: Set<number>;
  onSectionClick: (index: number) => void;
  generatingSections?: Set<number>;
  loadedSections?: Set<number>;
}

export const SectionNavigator: React.FC<SectionNavigatorProps> = ({
  sections,
  activeSection,
  completedSections,
  onSectionClick,
  generatingSections = new Set(),
  loadedSections = new Set(),
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
              const isGenerating = generatingSections.has(idx);
              const hasContent = section.content?.trim().length > 0;
              const isLoaded = loadedSections.has(idx) || hasContent;
              const isDisabled = !isCompleted && !isActive && !isLoaded;

              // Progressive reveal: show sections based on what has content
              // Find the last section with actual content
              const lastContentIndex = sections.reduce((max, s, i) => {
                return s.content?.trim().length > 0 ? i : max;
              }, -1);

              // Also consider sections being tracked as loaded/completed
              const lastTrackedIndex = Math.max(
                ...Array.from(completedSections).concat(
                  Array.from(loadedSections)
                ),
                -1
              );

              // Show up to the furthest point of progress
              const furthestProgress = Math.max(
                lastContentIndex,
                lastTrackedIndex
              );
              const visibleUpTo = Math.max(2, furthestProgress + 2); // At least 3, or 2 ahead

              // Special case: if no content yet but outline exists, show first section as loading
              const isFirstSectionLoading =
                idx === 0 &&
                sections.length > 0 &&
                !hasContent &&
                !isGenerating;

              // Hide sections beyond the visible threshold
              if (idx > visibleUpTo) {
                return null;
              }

              return (
                <button
                  key={idx}
                  onClick={() => !isDisabled && onSectionClick(idx)}
                  disabled={isDisabled}
                  className={`w-full flex items-center gap-3 p-3 rounded-lg transition-all duration-200 text-left group ${
                    isActive
                      ? 'bg-primary-50 dark:bg-primary-900/20 border border-primary-200 dark:border-primary-800 shadow-sm'
                      : isCompleted
                        ? 'hover:bg-gray-50 dark:hover:bg-gray-700/50 border border-transparent'
                        : isDisabled
                          ? 'opacity-50 cursor-not-allowed border border-transparent'
                          : 'hover:bg-gray-50 dark:hover:bg-gray-700/50 border border-transparent'
                  }`}
                >
                  {/* Icon */}
                  <div className="flex-shrink-0">
                    {isGenerating || isFirstSectionLoading ? (
                      <Loader2 className="w-5 h-5 text-primary-600 dark:text-primary-400 animate-spin" />
                    ) : isCompleted ? (
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
