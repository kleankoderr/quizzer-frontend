import React, { useState, useRef, useEffect, createRef } from 'react';
import {
  CheckCircle,
  Brain,
  BookOpen,
} from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import rehypeRaw from 'rehype-raw';
import rehypeSanitize, { defaultSchema } from 'rehype-sanitize';
import remarkMath from 'remark-math';
import rehypeKatex from 'rehype-katex';
import rehypeHighlight from 'rehype-highlight';
import 'highlight.js/styles/github-dark.css';

import { contentService, type Content } from '../services/content.service';
import { KnowledgeCheckModal } from './KnowledgeCheckModal';
import { LearningGuideSection } from './LearningGuideSection';
import { SectionNavigator } from './SectionNavigator';
import { useInvalidateQuota } from '../hooks/useQuota';

interface LearningGuideProps {
  guide: NonNullable<Content['learningGuide']>;
  title: string;
  onToggleSectionComplete?: (index: number, isComplete: boolean) => void;
  contentRef?: React.RefObject<HTMLDivElement | null>;
  contentId: string;
  topic?: string;
  description?: string;
  onGenerateQuiz?: () => void;
  onGenerateFlashcards?: () => void;
  onSectionUpdate?: (index: number, updates: any) => void;
}

export const LearningGuide: React.FC<LearningGuideProps> = ({
  guide,
  title,
  onToggleSectionComplete,
  contentRef,
  contentId,
  description,
  onGenerateQuiz,
  onGenerateFlashcards,
  onSectionUpdate,
}) => {
  const invalidateQuota = useInvalidateQuota();
  // Create refs for each section
  const sectionRefs = useRef<React.RefObject<HTMLDivElement>[]>([]);
  
  // Initialize refs array
  useEffect(() => {
    sectionRefs.current = guide.sections.map((_, i) => sectionRefs.current[i] || createRef<HTMLDivElement>());
  }, [guide.sections.length]);

  const [completedSections, setCompletedSections] = useState<Set<number>>(
    () => {
      const initial = new Set<number>();
      for (const section of guide.sections) {
        const index = guide.sections.indexOf(section);
        if (section.completed) initial.add(index);
      }
      return initial;
    }
  );

  // Sync with guide updates
  React.useEffect(() => {
    const newCompleted = new Set<number>();
    for (const section of guide.sections) {
      const index = guide.sections.indexOf(section);
      if (section.completed) newCompleted.add(index);
    }
    setCompletedSections(newCompleted);
  }, [guide]);
  
  // Initialize activeSection - prioritize first uncompleted section
  const [activeSection, setActiveSection] = useState<number>(() => {
    // Find the first uncompleted section
    const firstUncompletedIndex = guide.sections.findIndex(section => !section.completed);
    
    // Try to get stored section from localStorage
    try {
      const stored = localStorage.getItem(`activeSection-${contentId}`);
      if (stored) {
        const storedIndex = Number.parseInt(stored, 10);
        // Only use stored section if it's valid and uncompleted
        if (storedIndex >= 0 && storedIndex < guide.sections.length && !guide.sections[storedIndex].completed) {
          return storedIndex;
        }
      }
    } catch {
      // Ignore localStorage errors
    }
    
    // Default to first uncompleted section, or -1 if all are completed
    return firstUncompletedIndex;
  });
  
  const [generatedContent, setGeneratedContent] = useState<
    Record<string, string>
  >(() => {
    const initial: Record<string, string> = {};
    for (const section of guide.sections) {
      const index = guide.sections.indexOf(section);
      if (section.generatedExplanation) {
        const val = section.generatedExplanation as any;
        initial[`${index}-explain`] =
          typeof val === 'object'
            ? val.explanation || ''
            : String(val);
      }
      if (section.generatedExample) {
        const val = section.generatedExample as any;
        initial[`${index}-example`] =
          typeof val === 'object'
            ? val.examples || ''
            : String(val);
      }
    }
    return initial;
  });
  
  const [visibleContent, setVisibleContent] = useState<Record<string, boolean>>(
    () => {
      const initial: Record<string, boolean> = {};
      for (const section of guide.sections) {
        const index = guide.sections.indexOf(section);
        if (section.generatedExplanation) {
          initial[`${index}-explain`] = true;
        }
        if (section.generatedExample) {
          initial[`${index}-example`] = true;
        }
      }
      return initial;
    }
  );
  
  const [loadingAction, setLoadingAction] = useState<{
    section: number;
    type: 'explain' | 'example';
  } | null>(null);
  
  const [activeKnowledgeCheckSectionIndex, setActiveKnowledgeCheckSectionIndex] = useState<number | null>(null);

  // Smooth scroll to active section when completed sections change
  React.useEffect(() => {
    if (activeSection !== -1 && sectionRefs.current[activeSection]?.current) {
      // Small delay to allow DOM to update after section visibility changes
      const timer = setTimeout(() => {
        const sectionElement = sectionRefs.current[activeSection]?.current;
        if (sectionElement) {
          const elementTop = sectionElement.getBoundingClientRect().top + window.pageYOffset;
          const currentScroll = window.pageYOffset;
          
          // Only scroll if the section is not already in view
          if (Math.abs(elementTop - currentScroll - 80) > 50) {
            window.scrollTo({
              top: elementTop - 80,
              behavior: 'smooth'
            });
          }
        }
      }, 100);
      
      return () => clearTimeout(timer);
    }
  }, [completedSections, activeSection]);

  const markdownRehypePlugins = React.useMemo(() => [
    rehypeRaw,
    rehypeKatex,
    [
      rehypeSanitize,
      {
        ...defaultSchema,
        tagNames: [
          ...(defaultSchema.tagNames || []),
          'mark', 'span', 'div', 'math', 'semantics', 'mrow', 'mi', 'mo', 'mn', 'msup', 'msub', 'mfrac', 'msqrt', 'mroot', 'mtable', 'mtr', 'mtd', 'code', 'pre'
        ],
        attributes: {
          ...defaultSchema.attributes,
          mark: [
            'className',
            'class',
            'style',
            'data-highlight-id',
            'data-has-note',
            'title',
          ],
          span: [
            'className',
            'class',
            'title',
            'style',
            'data-note-id',
            'data-note-text',
          ],
          div: ['className'],
          math: ['xmlns', 'display'],
          code: ['className'],
          pre: ['className'],
        },
      },
    ],
    rehypeHighlight,
  ] as any, []);

  const markdownRemarkPlugins = React.useMemo(() => [remarkGfm, remarkMath], []);

  const toggleSection = (index: number) => {
    const newActiveSection = activeSection === index ? -1 : index;
    setActiveSection(newActiveSection);
    
    // Store in localStorage
    try {
      if (newActiveSection === -1) {
        localStorage.removeItem(`activeSection-${contentId}`);
      } else {
        localStorage.setItem(`activeSection-${contentId}`, String(newActiveSection));
      }
    } catch {
      // Ignore localStorage errors
    }

    // Scroll to top of section when opening
    if (newActiveSection !== -1 && sectionRefs.current[index]?.current) {
      setTimeout(() => {
        const sectionElement = sectionRefs.current[index]?.current;
        if (sectionElement) {
          const elementTop = sectionElement.getBoundingClientRect().top + window.pageYOffset;
          window.scrollTo({
            top: elementTop - 80, // 80px offset to position below sticky header
            behavior: 'smooth'
          });
        }
      }, 200);
    }
  };

  const markAsComplete = (index: number, e: React.MouseEvent) => {
    e.stopPropagation();
    const section = guide.sections[index];
    
    // Check for Knowledge Check if trying to complete (not un-complete)
    if (!completedSections.has(index) && section.knowledgeCheck && section.knowledgeCheck.userScore !== 1) {
       setActiveKnowledgeCheckSectionIndex(index);
       return;
    }

    const newCompleted = new Set(completedSections);
    const isComplete = !newCompleted.has(index);

    if (isComplete) {
      newCompleted.add(index);

      // Auto-advance to next section or close if last
      if (index === activeSection) {
        const nextSection = index < guide.sections.length - 1 ? index + 1 : -1;
        
        setTimeout(() => {
          setActiveSection(nextSection);
          
          // Update localStorage
          try {
            if (nextSection === -1) {
              localStorage.removeItem(`activeSection-${contentId}`);
            } else {
              localStorage.setItem(`activeSection-${contentId}`, String(nextSection));
            }
          } catch {
            // Ignore localStorage errors
          }

          // Scroll to top of next section
          if (nextSection !== -1 && sectionRefs.current[nextSection]?.current) {
            setTimeout(() => {
              const sectionElement = sectionRefs.current[nextSection]?.current;
              if (sectionElement) {
                const elementTop = sectionElement.getBoundingClientRect().top + window.pageYOffset;
                window.scrollTo({
                  top: elementTop - 80, // 80px offset to position below sticky header
                  behavior: 'smooth'
                });
              }
            }, 200);
          }

        }, 300);
      }
    } else {
      newCompleted.delete(index);
    }

    setCompletedSections(newCompleted);
    if (onSectionUpdate) {
      const updates: any = { completed: isComplete };
      // Reset knowledge check score if marking as incomplete
      if (!isComplete && section.knowledgeCheck) {
        updates.knowledgeCheck = {
          ...section.knowledgeCheck,
          userScore: undefined,
          userAnswer: undefined,
        };
      }
      onSectionUpdate(index, updates);
    } else {
      onToggleSectionComplete?.(index, isComplete);
    }
  };

  const handleAskQuestion = async (
    sectionIndex: number,
    type: 'explain' | 'example'
  ) => {
    const section = guide.sections[sectionIndex];
    if (!section) return;

    const key = `${sectionIndex}-${type}`;

    // If content exists, just toggle visibility
    if (generatedContent[key]) {
      setVisibleContent((prev) => ({
        ...prev,
        [key]: !prev[key],
      }));
      return;
    }

    setLoadingAction({ section: sectionIndex, type });

    try {
      let result = '';
      if (type === 'explain') {
        result = await contentService.generateExplanation(
          contentId,
          section.title,
          section.content
        );
      } else {
        result = await contentService.generateExample(
          contentId,
          section.title,
          section.content
        );
      }

      setGeneratedContent((prev) => ({
        ...prev,
        [key]: result,
      }));
      setVisibleContent((prev) => ({
        ...prev,
        [key]: true,
      }));

      // Persist to backend
      const updatedGuide = structuredClone(guide);
      // Invalidate quota
      await invalidateQuota();

      if (updatedGuide.sections[sectionIndex]) {
        if (type === 'explain') {
          updatedGuide.sections[sectionIndex].generatedExplanation = result;
        } else {
          updatedGuide.sections[sectionIndex].generatedExample = result;
        }

        try {
          await contentService.update(contentId, {
            learningGuide: updatedGuide,
          });
        } catch (_err) {}
      }
    } catch (_error) {
    } finally {
      setLoadingAction(null);
    }
  };

  const toggleContentVisibility = (
    sectionIndex: number,
    type: 'explain' | 'example'
  ) => {
    const key = `${sectionIndex}-${type}`;
    setVisibleContent((prev) => ({
      ...prev,
      [key]: !prev[key],
    }));
  };

  const progress = Math.round(
    (completedSections.size / guide.sections.length) * 100
  );

  // Custom heading renderer
  const HeadingRenderer = ({ level, children }: any) => {
    const text = children?.[0]?.toString() || '';
    const id = text.toLowerCase().replaceAll(/[^\w]+/g, '-');
    const Tag = `h${level}` as React.ElementType;
    return <Tag id={id}>{children}</Tag>;
  };

  return (
    <div
      className="max-w-6xl mx-auto space-y-8 animate-in fade-in duration-500"
      ref={contentRef}
    >
      {/* Header Section */}
      <div className="bg-white dark:bg-gray-800 sm:rounded-2xl sm:shadow-sm sm:border border-gray-200 dark:border-gray-700">
        <div className="p-4 md:p-6">
          <div className="flex items-start justify-between gap-6 mb-4">
            <div className="flex-1">
              <h1
                className="text-2xl md:text-3xl font-bold text-gray-900 dark:text-white mb-2"
                style={{ fontFamily: 'Lexend' }}
              >
                {title}
              </h1>
              <div className="flex items-center gap-4 text-sm text-gray-600 dark:text-gray-400">
                <span className="flex items-center gap-2">
                  <CheckCircle className="w-4 h-4" />
                  {completedSections.size} of {guide.sections.length} sections completed
                </span>
              </div>
            </div>
            <div className="hidden md:block">
              <div className="relative w-16 h-16 flex items-center justify-center">
                <svg className="w-full h-full transform -rotate-90">
                  <circle
                    cx="32"
                    cy="32"
                    r="28"
                    stroke="currentColor"
                    strokeWidth="6"
                    fill="transparent"
                    className="text-gray-200 dark:text-gray-700"
                  />
                  <circle
                    cx="32"
                    cy="32"
                    r="28"
                    stroke="currentColor"
                    strokeWidth="6"
                    fill="transparent"
                    strokeDasharray={175.93}
                    strokeDashoffset={175.93 - (175.93 * progress) / 100}
                    className="text-primary-600 transition-all duration-1000 ease-out"
                  />
                </svg>
                <span className="absolute text-xs font-bold text-primary-600 dark:text-primary-400">
                  {progress}%
                </span>
              </div>
            </div>
          </div>

          {/* Overview */}
          {(guide.overview || description) && (
            <div
              className="text-base text-gray-600 dark:text-gray-300 leading-relaxed prose dark:prose-invert max-w-none mb-4"
              style={{ fontFamily: 'Lexend' }}
            >
              <ReactMarkdown
                remarkPlugins={markdownRemarkPlugins}
                rehypePlugins={markdownRehypePlugins}
              >
                {guide.overview || description || ''}
              </ReactMarkdown>
            </div>
          )}

          {/* Key Concepts */}
          {guide.keyConcepts && guide.keyConcepts.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {guide.keyConcepts.map((concept, idx) => (
                <span
                  key={idx}
                  className="px-3 py-1.5 bg-primary-50 dark:bg-primary-900/30 text-primary-700 dark:text-primary-300 rounded-lg text-sm font-medium border border-primary-100 dark:border-primary-800"
                  style={{ fontFamily: 'Lexend' }}
                >
                  {concept}
                </span>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Table of Contents - Navigation & Progress */}
      <SectionNavigator
        sections={guide.sections}
        activeSection={activeSection}
        completedSections={completedSections}
        onSectionClick={toggleSection}
      />

      {/* All Sections in Natural Order */}
      <div className="space-y-4">
        {guide.sections.map((section, idx) => {
          const processedContent = section.content;
          const isCompleted = completedSections.has(idx);
          const isActive = activeSection === idx;

          return (
            <LearningGuideSection
              key={idx}
              ref={sectionRefs.current[idx]}
              section={section}
              index={idx}
              isActive={isActive}
              isCompleted={isCompleted}
              processedContent={processedContent}
              generatedContent={generatedContent}
              visibleContent={visibleContent}
              loadingAction={loadingAction}
              markdownRemarkPlugins={markdownRemarkPlugins}
              markdownRehypePlugins={markdownRehypePlugins}
              HeadingRenderer={HeadingRenderer}
              onToggleSection={toggleSection}
              onMarkComplete={markAsComplete}
              onAskQuestion={handleAskQuestion}
              onToggleContentVisibility={toggleContentVisibility}
            />
          );
        })}
      </div>
      
      {progress === 100 && (
        <div className="bg-gradient-to-br from-primary-50 to-white dark:from-gray-800 dark:to-gray-900 rounded-2xl p-4 md:p-6 border border-primary-100 dark:border-gray-700 text-center animate-in zoom-in duration-500">
          <div className="w-16 h-16 bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400 rounded-full flex items-center justify-center mx-auto mb-4">
            <CheckCircle className="w-8 h-8" />
          </div>
          <h2
            className="text-2xl font-bold text-gray-900 dark:text-white mb-2"
            style={{ fontFamily: 'Lexend' }}
          >
            Excellent work!
          </h2>
          <p
            className="text-gray-600 dark:text-gray-300 mb-8"
            style={{ fontFamily: 'Lexend' }}
          >
            You've completed this learning guide. Here are some recommended next
            steps:
          </p>
          {guide.nextSteps && guide.nextSteps.length > 0 ? (
            <div className="grid sm:grid-cols-2 gap-4 max-w-2xl mx-auto mb-8">
              {guide.nextSteps.map((step, idx) => (
                <div
                  key={idx}
                  className="bg-white dark:bg-gray-800 p-4 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm flex items-start gap-3 text-left"
                >
                  <div className="w-8 h-8 rounded-full bg-primary-50 dark:bg-primary-900/30 text-primary-600 dark:text-primary-400 flex items-center justify-center font-bold text-sm flex-shrink-0 mt-0.5">
                    {idx + 1}
                  </div>
                  <div
                    className="text-gray-700 dark:text-gray-300 font-medium text-sm prose dark:prose-invert max-w-none"
                    style={{ fontFamily: 'Lexend' }}
                  >
                    <ReactMarkdown
                      components={{
                        p: ({ children }) => (
                          <span className="m-0">{children}</span>
                        ),
                      }}
                    >
                      {step}
                    </ReactMarkdown>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="mb-8 p-4">
              <p className="text-gray-600 dark:text-gray-400">
                You have completed all sections!
              </p>
            </div>
          )}

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4 border-t border-gray-200 dark:border-gray-700 max-w-2xl mx-auto">
            <button
              onClick={onGenerateQuiz}
              className="w-full sm:w-auto flex items-center justify-center gap-2 px-6 py-3 bg-primary-600 text-white rounded-xl hover:bg-primary-700 transition-colors shadow-sm hover:shadow font-medium"
            >
              <Brain className="w-5 h-5 flex-shrink-0" />
              Take a Quiz
            </button>
            <button
              onClick={onGenerateFlashcards}
              className="w-full sm:w-auto flex items-center justify-center gap-2 px-6 py-3 bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-200 border border-gray-200 dark:border-gray-700 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors shadow-sm hover:shadow font-medium"
            >
              <BookOpen className="w-5 h-5 flex-shrink-0" />
              Review Flashcards
            </button>
          </div>
        </div>
      )}
      
      {/* Knowledge Check Modal */}
      {activeKnowledgeCheckSectionIndex !== null && guide.sections[activeKnowledgeCheckSectionIndex] && (
        <KnowledgeCheckModal 
          isOpen={true}
          onClose={() => setActiveKnowledgeCheckSectionIndex(null)}
          sectionTitle={guide.sections[activeKnowledgeCheckSectionIndex].title}
          knowledgeCheck={guide.sections[activeKnowledgeCheckSectionIndex].knowledgeCheck!}
          onUpdate={(updates) => {
             if (onSectionUpdate) {
                onSectionUpdate(activeKnowledgeCheckSectionIndex, updates);
             }
          }}
          onComplete={() => {
             // Mark as complete
             const index = activeKnowledgeCheckSectionIndex;
             const newCompleted = new Set(completedSections);
             newCompleted.add(index);
             setCompletedSections(newCompleted);

             if (onSectionUpdate) {
                onSectionUpdate(index, { completed: true });
             } else {
                onToggleSectionComplete?.(index, true);
             }

             // Auto-advance or close if last
             if (index === activeSection) {
               if (index < guide.sections.length - 1) {
                  const nextSection = index + 1;
                  setTimeout(() => {
                    setActiveSection(nextSection);

                    // Update localStorage
                    try {
                      localStorage.setItem(`activeSection-${contentId}`, String(nextSection));
                    } catch {
                      // Ignore localStorage errors
                    }

                    // Scroll to top of next section with smooth behavior
                    setTimeout(() => {
                      const sectionElement = sectionRefs.current[nextSection]?.current;
                      if (sectionElement) {
                        const elementTop = sectionElement.getBoundingClientRect().top + window.pageYOffset;
                        window.scrollTo({
                          top: elementTop - 80, // 80px offset to position below sticky header
                          behavior: 'smooth'
                        });
                      }
                    }, 300); // Increased delay to allow section to appear first
                  }, 300);
               } else {
                  setTimeout(() => {
                    setActiveSection(-1);
                    // Remove from localStorage
                    try {
                      localStorage.removeItem(`activeSection-${contentId}`);
                    } catch {
                      // Ignore localStorage errors
                    }
                  }, 300);
               }
             }
             
             setActiveKnowledgeCheckSectionIndex(null);
          }}
        />
      )}
    </div>
  );
};
