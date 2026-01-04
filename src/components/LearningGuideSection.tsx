import React from 'react';
import {
  CheckCircle,
  ChevronRight,
  Lightbulb,
  MessageCircle,
  Sparkles,
  Loader2,
  Brain,
} from 'lucide-react';
import { MarkdownRenderer } from './MarkdownRenderer';
import type { Content } from '../services/content.service';

interface LearningGuideSectionProps {
  section: NonNullable<Content['learningGuide']>['sections'][number];
  index: number;
  isActive: boolean;
  isCompleted: boolean;
  processedContent: string;
  generatedContent: Record<string, string>;
  visibleContent: Record<string, boolean>;
  loadingAction: { section: number; type: 'explain' | 'example' } | null;
  onToggleContentVisibility: (index: number, type: 'explain' | 'example') => void;
  HeadingRenderer: React.FC<{ level: number; children?: any }>;
  onToggleSection: (index: number) => void;
  onMarkComplete: (index: number, e: React.MouseEvent) => void;
  onAskQuestion: (index: number, type: 'explain' | 'example') => void;
}

export const LearningGuideSection = React.forwardRef<HTMLDivElement, LearningGuideSectionProps>(
  (
    {
      section,
      index,
      isActive,
      isCompleted,
      processedContent,
      generatedContent,
      visibleContent,
      loadingAction,
      HeadingRenderer,
      onToggleSection,
      onMarkComplete,
      onAskQuestion,
      onToggleContentVisibility,
    },
    ref
  ) => {
    return (
      <div
        ref={ref}
        data-section-index={index}
        className={`bg-white dark:bg-gray-800 sm:rounded-xl sm:border transition-all duration-300 overflow-hidden ${
          isActive
            ? 'sm:border-primary-500 sm:shadow-md sm:ring-2 ring-primary-500/20'
            : isCompleted
            ? 'border-gray-200 dark:border-gray-700 opacity-75 hover:opacity-100'
            : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
        }`}
      >
        <div
          onClick={() => onToggleSection(index)}
          className="p-4 md:p-6 flex items-center justify-between cursor-pointer select-none"
        >
          <div className="flex items-center gap-4">
            <button
              onClick={(e) => onMarkComplete(index, e)}
              className={`w-6 h-6 rounded-full border-2 flex items-center justify-center transition-colors flex-shrink-0 ${
                isCompleted
                  ? 'bg-green-500 border-green-500 text-white'
                  : 'border-gray-300 dark:border-gray-600 text-transparent hover:border-green-500'
              }`}
            >
              <CheckCircle className="w-4 h-4" />
            </button>
            <h3
              className={`text-lg font-semibold transition-colors ${
                isCompleted
                  ? 'text-gray-500 dark:text-gray-400'
                  : 'text-gray-900 dark:text-white'
              }`}
              style={{ fontFamily: 'Lexend' }}
            >
              {section.title}
            </h3>
          </div>
          <ChevronRight
            className={`w-5 h-5 text-gray-400 transition-transform duration-300 ${
              isActive ? 'rotate-90' : ''
            }`}
          />
        </div>

        <div
          className={`grid transition-all duration-300 ease-in-out ${
            isActive
              ? 'grid-rows-[1fr] opacity-100'
              : 'grid-rows-[0fr] opacity-0'
          }`}
        >
          <div className="overflow-hidden">
            <div className="px-4 md:px-6 pb-4 md:pb-6 pt-0 border-t border-gray-100 dark:border-gray-700/50 mt-2">
              <div className="prose prose-lg dark:prose-invert max-w-none mt-4 text-gray-600 dark:text-gray-300 content-markdown">
                <MarkdownRenderer
                  content={processedContent}
                  HeadingRenderer={HeadingRenderer}
                />
              </div>

              {section.example && (
                <div className="mt-4 relative overflow-hidden sm:rounded-xl sm:border border-blue-100 dark:border-blue-900/50 bg-blue-50/30 sm:bg-gradient-to-br sm:from-blue-50/50 sm:to-white dark:from-blue-900/10 dark:to-gray-800 sm:shadow-sm border-l-4 sm:border-l border-l-blue-500 sm:border-l-blue-100">
                  <div className="hidden sm:block absolute top-0 left-0 w-1 h-full bg-gradient-to-b from-blue-400 to-blue-600"></div>
                  <div className="p-4">
                    <div className="flex items-center gap-2.5 mb-2">
                      <div className="w-8 h-8 rounded-lg bg-white dark:bg-gray-800 shadow-sm border border-blue-100 dark:border-blue-800 flex items-center justify-center text-blue-600 dark:text-blue-400 flex-shrink-0">
                        <Lightbulb className="w-4 h-4" />
                      </div>
                      <div>
                        <h4
                          className="font-bold text-gray-900 dark:text-white text-sm"
                          style={{ fontFamily: 'Lexend' }}
                        >
                          Key Example
                        </h4>
                      </div>
                    </div>
                    <div className="prose prose-blue prose-sm dark:prose-invert max-w-none bg-white/50 dark:bg-gray-900/30 rounded-lg p-3 border border-blue-50 dark:border-blue-900/20">
                      <div
                        className="m-0 leading-relaxed text-sm"
                        style={{ fontFamily: 'Lexend' }}
                      >
                        <MarkdownRenderer content={section.example} />
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {section.assessment && (
                <div className="mt-4 relative overflow-hidden sm:rounded-xl sm:border border-green-100 dark:border-green-900/50 bg-green-50/30 sm:bg-gradient-to-br sm:from-green-50/50 sm:to-white dark:from-green-900/10 dark:to-gray-800 sm:shadow-sm border-l-4 sm:border-l border-l-green-500 sm:border-l-green-100">
                  <div className="hidden sm:block absolute top-0 left-0 w-1 h-full bg-gradient-to-b from-green-400 to-green-600"></div>
                  <div className="p-4">
                    <div className="flex items-center gap-2.5 mb-2">
                      <div className="w-8 h-8 rounded-lg bg-white dark:bg-gray-800 shadow-sm border border-green-100 dark:border-green-800 flex items-center justify-center text-green-600 dark:text-green-400 flex-shrink-0">
                        <Brain className="w-4 h-4" />
                      </div>
                      <div>
                        <h4
                          className="font-bold text-gray-900 dark:text-white text-sm"
                          style={{ fontFamily: 'Lexend' }}
                        >
                          Knowledge Check
                        </h4>
                      </div>
                    </div>
                    <div className="prose prose-green prose-sm dark:prose-invert max-w-none bg-white/50 dark:bg-gray-900/30 rounded-lg p-3 border border-green-50 dark:border-green-900/20">
                      <div
                        className="m-0 leading-relaxed text-sm"
                        style={{ fontFamily: 'Lexend' }}
                      >
                        <MarkdownRenderer content={section.assessment} />
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {isActive && (
                <div className="mt-8 space-y-6">
                  <div className="flex flex-wrap gap-3">
                    <button
                      onClick={() => onAskQuestion(index, 'explain')}
                      disabled={!!loadingAction}
                      className="group relative flex items-center gap-2.5 px-4 py-3 md:px-5 md:py-2.5 bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-200 rounded-xl hover:text-purple-600 dark:hover:text-purple-400 transition-all duration-300 shadow-sm hover:shadow-md border border-gray-200 dark:border-gray-700 hover:border-purple-200 dark:hover:border-purple-800 disabled:opacity-50 disabled:cursor-not-allowed overflow-hidden flex-1 sm:flex-none justify-center h-auto min-h-[44px]"
                    >
                      <div className="absolute inset-0 bg-purple-50 dark:bg-purple-900/20 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                      {loadingAction?.section === index &&
                      loadingAction?.type === 'explain' ? (
                        <Loader2 className="w-4 h-4 animate-spin relative z-10 flex-shrink-0" />
                      ) : (
                        <MessageCircle className="w-4 h-4 relative z-10 flex-shrink-0" />
                      )}
                      <span
                        className="relative z-10 font-medium text-sm text-center leading-tight"
                        style={{ fontFamily: 'Lexend' }}
                      >
                        Explain this better
                      </span>
                    </button>

                    <button
                      onClick={() => onAskQuestion(index, 'example')}
                      disabled={!!loadingAction}
                      className="group relative flex items-center gap-2.5 px-4 py-3 md:px-5 md:py-2.5 bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-200 rounded-xl hover:text-amber-600 dark:hover:text-amber-400 transition-all duration-300 shadow-sm hover:shadow-md border border-gray-200 dark:border-gray-700 hover:border-amber-200 dark:hover:border-amber-800 disabled:opacity-50 disabled:cursor-not-allowed overflow-hidden flex-1 sm:flex-none justify-center h-auto min-h-[44px]"
                    >
                      <div className="absolute inset-0 bg-amber-50 dark:bg-amber-900/20 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                      {loadingAction?.section === index &&
                      loadingAction?.type === 'example' ? (
                        <Loader2 className="w-4 h-4 animate-spin relative z-10 flex-shrink-0" />
                      ) : (
                        <Sparkles className="w-4 h-4 relative z-10 flex-shrink-0" />
                      )}
                      <span
                        className="relative z-10 font-medium text-sm text-center leading-tight"
                        style={{ fontFamily: 'Lexend' }}
                      >
                        Give more examples
                      </span>
                    </button>
                  </div>

                  {/* Generated Content Display */}
                  {generatedContent[`${index}-explain`] &&
                    visibleContent[`${index}-explain`] && (
                      <div className="relative overflow-hidden sm:rounded-2xl sm:border border-purple-100 dark:border-purple-900/50 bg-purple-50/30 sm:bg-gradient-to-br sm:from-purple-50/50 sm:to-white dark:from-purple-900/10 dark:to-gray-800 sm:shadow-sm animate-in fade-in slide-in-from-top-4 duration-500 border-l-4 sm:border-l border-l-purple-500 sm:border-l-purple-100">
                        <div className="hidden sm:block absolute top-0 left-0 w-1.5 h-full bg-gradient-to-b from-purple-400 to-purple-600"></div>
                        <div className="p-4 md:p-6">
                          <div className="flex items-center justify-between mb-4">
                            <div className="flex items-center gap-3">
                              <div className="w-10 h-10 rounded-xl bg-white dark:bg-gray-800 shadow-sm border border-purple-100 dark:border-purple-800 flex items-center justify-center text-purple-600 dark:text-purple-400 flex-shrink-0">
                                <MessageCircle className="w-5 h-5" />
                              </div>
                              <div>
                                <h4
                                  className="font-bold text-gray-900 dark:text-white text-base"
                                  style={{ fontFamily: 'Lexend' }}
                                >
                                  Simpler Explanation
                                </h4>
                              </div>
                            </div>
                            <button
                              onClick={() =>
                                onToggleContentVisibility(index, 'explain')
                              }
                              className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 p-1 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                            >
                              <ChevronRight className="w-5 h-5 rotate-90" />
                            </button>
                          </div>
                          <div className="prose prose-purple prose-sm sm:prose-base dark:prose-invert max-w-none bg-white/50 dark:bg-gray-900/30 rounded-xl p-4 border border-purple-50 dark:border-purple-900/20">
                            <MarkdownRenderer content={generatedContent[`${index}-explain`]} />
                          </div>
                        </div>
                      </div>
                    )}

                  {generatedContent[`${index}-example`] &&
                    visibleContent[`${index}-example`] && (
                      <div className="relative overflow-hidden sm:rounded-2xl sm:border border-amber-100 dark:border-amber-900/50 bg-amber-50/30 sm:bg-gradient-to-br sm:from-amber-50/50 sm:to-white dark:from-amber-900/10 dark:to-gray-800 sm:shadow-sm animate-in fade-in slide-in-from-top-4 duration-500 border-l-4 sm:border-l border-l-amber-500 sm:border-l-amber-100">
                        <div className="hidden sm:block absolute top-0 left-0 w-1.5 h-full bg-gradient-to-b from-amber-400 to-amber-600"></div>
                        <div className="p-4 md:p-6">
                          <div className="flex items-center justify-between mb-4">
                            <div className="flex items-center gap-3">
                              <div className="w-10 h-10 rounded-xl bg-white dark:bg-gray-800 shadow-sm border border-amber-100 dark:border-amber-800 flex items-center justify-center text-amber-600 dark:text-amber-400 flex-shrink-0">
                                <Sparkles className="w-5 h-5" />
                              </div>
                              <div>
                                <h4
                                  className="font-bold text-gray-900 dark:text-white text-base"
                                  style={{ fontFamily: 'Lexend' }}
                                >
                                  Real-World Examples
                                </h4>
                              </div>
                            </div>
                            <button
                              onClick={() =>
                                onToggleContentVisibility(index, 'example')
                              }
                              className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 p-1 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                            >
                              <ChevronRight className="w-5 h-5 rotate-90" />
                            </button>
                          </div>
                          <div className="prose prose-amber prose-sm sm:prose-base dark:prose-invert max-w-none bg-white/50 dark:bg-gray-900/30 rounded-xl p-4 border border-amber-50 dark:border-amber-900/20">
                            <MarkdownRenderer content={generatedContent[`${index}-example`]} />
                          </div>
                        </div>
                      </div>
                    )}
                </div>
              )}

              {!isCompleted && (
                <div className="mt-8 flex justify-end">
                  <button
                    onClick={(e) => onMarkComplete(index, e)}
                    className="px-6 py-2.5 bg-primary-600 hover:bg-primary-700 text-white rounded-xl font-medium transition-colors shadow-sm hover:shadow-md flex items-center gap-2"
                  >
                    <CheckCircle className="w-5 h-5" />
                    <span>Complete Section</span>
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  }
);

LearningGuideSection.displayName = 'LearningGuideSection';
