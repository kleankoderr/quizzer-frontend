import React, { useState } from "react";
import {
  CheckCircle,
  ChevronRight,
  Lightbulb,
  ArrowRight,
  MessageCircle,
  Sparkles,
  Loader2,
  Brain,
  BookOpen,
} from "lucide-react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import rehypeRaw from "rehype-raw";
import rehypeSanitize, { defaultSchema } from "rehype-sanitize";
import remarkMath from "remark-math";
import rehypeKatex from "rehype-katex";

import { contentService, type Content } from "../services/content.service";
import { applyHighlights, type Highlight } from "../utils/contentUtils";

interface LearningGuideProps {
  guide: NonNullable<Content["learningGuide"]>;
  title: string;
  highlights?: Highlight[];
  onToggleSectionComplete?: (index: number, isComplete: boolean) => void;
  onContentClick?: (e: React.MouseEvent) => void;
  contentRef?: React.RefObject<HTMLDivElement | null>;
  contentId: string;
  topic?: string;
  onGenerateQuiz?: () => void;
  onGenerateFlashcards?: () => void;
}

export const LearningGuide: React.FC<LearningGuideProps> = ({
  guide,
  title,
  highlights = [],
  onToggleSectionComplete,
  onContentClick,
  contentRef,
  contentId,
  onGenerateQuiz,
  onGenerateFlashcards,
}) => {
  const [completedSections, setCompletedSections] = useState<Set<number>>(
    () => {
      const initial = new Set<number>();
      for (const section of guide.sections) {
        const index = guide.sections.indexOf(section);
        if (section.completed) initial.add(index);
      }
      return initial;
    },
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
  const [activeSection, setActiveSection] = useState<number>(0);
  const [generatedContent, setGeneratedContent] = useState<
    Record<string, string>
  >(() => {
    const initial: Record<string, string> = {};
    for (const section of guide.sections) {
      const index = guide.sections.indexOf(section);
      if (section.generatedExplanation) {
        initial[`${index}-explain`] = section.generatedExplanation;
      }
      if (section.generatedExample) {
        initial[`${index}-example`] = section.generatedExample;
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
    },
  );
  const [loadingAction, setLoadingAction] = useState<{
    section: number;
    type: "explain" | "example";
  } | null>(null);

  const toggleSection = (index: number) => {
    setActiveSection(activeSection === index ? -1 : index);
  };

  const markAsComplete = (index: number, e: React.MouseEvent) => {
    e.stopPropagation();
    const newCompleted = new Set(completedSections);
    const isComplete = !newCompleted.has(index);

    if (isComplete) {
      newCompleted.add(index);

      // Auto-advance to next section
      if (index === activeSection && index < guide.sections.length - 1) {
        setTimeout(() => {
          setActiveSection(index + 1);
        }, 300);
      }
    } else {
      newCompleted.delete(index);
    }

    setCompletedSections(newCompleted);
    onToggleSectionComplete?.(index, isComplete);
  };

  const handleAskQuestion = async (
    sectionIndex: number,
    type: "explain" | "example",
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
      let result = "";
      if (type === "explain") {
        result = await contentService.generateExplanation(
          contentId,
          section.title,
          section.content,
        );
      } else {
        result = await contentService.generateExample(
          contentId,
          section.title,
          section.content,
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
      if (updatedGuide.sections[sectionIndex]) {
        if (type === "explain") {
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
    type: "explain" | "example",
  ) => {
    const key = `${sectionIndex}-${type}`;
    setVisibleContent((prev) => ({
      ...prev,
      [key]: !prev[key],
    }));
  };

  const progress = Math.round(
    (completedSections.size / guide.sections.length) * 100,
  );

  // Custom heading renderer
  const HeadingRenderer = ({ level, children }: any) => {
    const text = children?.[0]?.toString() || "";
    const id = text.toLowerCase().replace(/[^\w]+/g, "-");
    const Tag = `h${level}` as React.ElementType;
    return <Tag id={id}>{children}</Tag>;
  };

  return (
    <div
      className="max-w-6xl mx-auto space-y-8 animate-in fade-in duration-500"
      ref={contentRef}
      onClick={onContentClick}
    >
      {/* Header Section */}
      <div className="bg-white dark:bg-gray-800 sm:rounded-2xl p-4 md:p-6 sm:shadow-sm sm:border border-gray-200 dark:border-gray-700">
        <div className="flex items-start justify-between gap-6 mb-6">
          <div>
            <h1
              className="text-2xl md:text-3xl font-bold text-gray-900 dark:text-white mb-4"
              style={{ fontFamily: "Lexend" }}
            >
              {title}
            </h1>
            <div
              className="text-lg text-gray-600 dark:text-gray-300 leading-relaxed prose dark:prose-invert max-w-none"
              style={{ fontFamily: "Lexend" }}
            >
              <ReactMarkdown
                remarkPlugins={[remarkGfm, remarkMath]}
                rehypePlugins={[rehypeRaw, rehypeKatex]}
              >
                {guide.overview}
              </ReactMarkdown>
            </div>
          </div>
          <div className="hidden md:block">
            <div className="relative w-20 h-20 flex items-center justify-center">
              <svg className="w-full h-full transform -rotate-90">
                <circle
                  cx="40"
                  cy="40"
                  r="36"
                  stroke="currentColor"
                  strokeWidth="8"
                  fill="transparent"
                  className="text-gray-200 dark:text-gray-700"
                />
                <circle
                  cx="40"
                  cy="40"
                  r="36"
                  stroke="currentColor"
                  strokeWidth="8"
                  fill="transparent"
                  strokeDasharray={226.2}
                  strokeDashoffset={226.2 - (226.2 * progress) / 100}
                  className="text-primary-600 transition-all duration-1000 ease-out"
                />
              </svg>
              <span className="absolute text-sm font-bold text-primary-600 dark:text-primary-400">
                {progress}%
              </span>
            </div>
          </div>
        </div>

        {/* Key Concepts */}
        <div className="flex flex-wrap gap-2">
          {guide.keyConcepts.map((concept, idx) => (
            <span
              key={idx}
              className="px-3 py-1 bg-primary-50 dark:bg-primary-900/30 text-primary-700 dark:text-primary-300 rounded-full text-sm font-medium border border-primary-100 dark:border-primary-800"
              style={{ fontFamily: "Lexend" }}
            >
              {concept}
            </span>
          ))}
        </div>
      </div>

      {/* Sections */}
      <div className="space-y-4">
        {guide.sections.map((section, idx) => {
          const processedContent = applyHighlights(
            section.content,
            highlights,
            idx,
          );
          const isCompleted = completedSections.has(idx);

          return (
            <div
              key={idx}
              data-section-index={idx}
              className={`bg-white dark:bg-gray-800 sm:rounded-xl sm:border transition-all duration-300 overflow-hidden ${
                activeSection === idx
                  ? "sm:border-primary-500 sm:shadow-md sm:ring-1 ring-primary-500/20"
                  : "border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600"
              }`}
            >
              <div
                onClick={() => toggleSection(idx)}
                className="p-4 md:p-6 flex items-center justify-between cursor-pointer select-none"
              >
                <div className="flex items-center gap-4">
                  <button
                    onClick={(e) => markAsComplete(idx, e)}
                    className={`w-6 h-6 rounded-full border-2 flex items-center justify-center transition-colors flex-shrink-0 ${
                      isCompleted
                        ? "bg-green-500 border-green-500 text-white"
                        : "border-gray-300 dark:border-gray-600 text-transparent hover:border-green-500"
                    }`}
                  >
                    <CheckCircle className="w-4 h-4" />
                  </button>
                  <h3
                    className={`text-lg font-semibold transition-colors ${
                      isCompleted
                        ? "text-gray-500 dark:text-gray-400"
                        : "text-gray-900 dark:text-white"
                    }`}
                    style={{ fontFamily: "Lexend" }}
                  >
                    {section.title}
                  </h3>
                </div>
                <div className="flex items-center gap-3">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      // Trigger note creation for this section
                      // We can simulate a selection or use a callback
                      // For now, let's just use the global note handler if possible,
                      // or we might need to expose a specific handler.
                      // Since the requirement says "Clicking the note icon allows the user to add a note for that section",
                      // and "Do not highlight text when adding a note",
                      // we might need a way to open the note input without text selection.
                      // But the current note input is "InlineNoteInput" which positions based on selection/toolbar.

                      // Let's emit a custom event or callback if provided,
                      // or we can rely on the parent to handle "add note to section".
                      // For this iteration, I'll add the button and we can wire it up in ContentPage.
                      const rect = (
                        e.target as HTMLElement
                      ).getBoundingClientRect();
                      const event = new CustomEvent("add-section-note", {
                        detail: {
                          sectionIndex: idx,
                          sectionTitle: section.title,
                          x: rect.left,
                          y: rect.bottom + window.scrollY,
                        },
                      });
                      window.dispatchEvent(event);
                    }}
                    className="p-2 text-gray-400 hover:text-primary-600 dark:hover:text-primary-400 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full transition-colors"
                    title="Add Note to Section"
                  >
                    <MessageCircle className="w-5 h-5" />
                  </button>
                  <ChevronRight
                    className={`w-5 h-5 text-gray-400 transition-transform duration-300 ${
                      activeSection === idx ? "rotate-90" : ""
                    }`}
                  />
                </div>
              </div>

              <div
                className={`grid transition-all duration-300 ease-in-out ${
                  activeSection === idx
                    ? "grid-rows-[1fr] opacity-100"
                    : "grid-rows-[0fr] opacity-0"
                }`}
              >
                <div className="overflow-hidden">
                  <div className="px-4 md:px-6 pb-4 md:pb-6 pt-0 border-t border-gray-100 dark:border-gray-700/50 mt-2">
                    <div className="prose prose-lg dark:prose-invert max-w-none mt-4 text-gray-600 dark:text-gray-300 content-markdown">
                      <ReactMarkdown
                        remarkPlugins={[remarkGfm, remarkMath]}
                        rehypePlugins={[
                          rehypeRaw,
                          rehypeKatex,
                          [
                            rehypeSanitize,
                            {
                              ...defaultSchema,
                              tagNames: [
                                ...(defaultSchema.tagNames || []),
                                "mark",
                                "span",
                                "div",
                                "math",
                                "semantics",
                                "mrow",
                                "mi",
                                "mo",
                                "mn",
                                "msup",
                                "msub",
                                "mfrac",
                                "msqrt",
                                "mroot",
                                "mtable",
                                "mtr",
                                "mtd",
                              ],
                              attributes: {
                                ...defaultSchema.attributes,
                                mark: [["className"], ["data-highlight-id"]],
                                span: [["className"], ["title"], ["style"]],
                                div: [["className"]],
                                math: [["xmlns"], ["display"]],
                              },
                            },
                          ],
                        ]}
                        components={{
                          h1: (props) => (
                            <HeadingRenderer level={1} {...props} />
                          ),
                          h2: (props) => (
                            <HeadingRenderer level={2} {...props} />
                          ),
                          h3: (props) => (
                            <HeadingRenderer level={3} {...props} />
                          ),
                        }}
                      >
                        {processedContent}
                      </ReactMarkdown>
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
                                style={{ fontFamily: "Lexend" }}
                              >
                                Key Example
                              </h4>
                            </div>
                          </div>
                          <div className="prose prose-blue prose-sm dark:prose-invert max-w-none bg-white/50 dark:bg-gray-900/30 rounded-lg p-3 border border-blue-50 dark:border-blue-900/20">
                            <div
                              className="m-0 leading-relaxed text-sm"
                              style={{ fontFamily: "Lexend" }}
                            >
                              <ReactMarkdown
                                remarkPlugins={[remarkGfm, remarkMath]}
                                rehypePlugins={[rehypeRaw, rehypeKatex]}
                              >
                                {section.example}
                              </ReactMarkdown>
                            </div>
                          </div>
                        </div>
                      </div>
                    )}

                    {activeSection === idx && (
                      <div className="mt-8 space-y-6">
                        <div className="flex flex-wrap gap-3">
                          <button
                            onClick={() => handleAskQuestion(idx, "explain")}
                            disabled={!!loadingAction}
                            className="group relative flex items-center gap-2.5 px-4 py-3 md:px-5 md:py-2.5 bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-200 rounded-xl hover:text-purple-600 dark:hover:text-purple-400 transition-all duration-300 shadow-sm hover:shadow-md border border-gray-200 dark:border-gray-700 hover:border-purple-200 dark:hover:border-purple-800 disabled:opacity-50 disabled:cursor-not-allowed overflow-hidden flex-1 sm:flex-none justify-center h-auto min-h-[44px]"
                          >
                            <div className="absolute inset-0 bg-purple-50 dark:bg-purple-900/20 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                            {loadingAction?.section === idx &&
                            loadingAction?.type === "explain" ? (
                              <Loader2 className="w-4 h-4 animate-spin relative z-10 flex-shrink-0" />
                            ) : (
                              <MessageCircle className="w-4 h-4 relative z-10 flex-shrink-0" />
                            )}
                            <span
                              className="relative z-10 font-medium text-sm text-center leading-tight"
                              style={{ fontFamily: "Lexend" }}
                            >
                              Explain this better
                            </span>
                          </button>

                          <button
                            onClick={() => handleAskQuestion(idx, "example")}
                            disabled={!!loadingAction}
                            className="group relative flex items-center gap-2.5 px-4 py-3 md:px-5 md:py-2.5 bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-200 rounded-xl hover:text-amber-600 dark:hover:text-amber-400 transition-all duration-300 shadow-sm hover:shadow-md border border-gray-200 dark:border-gray-700 hover:border-amber-200 dark:hover:border-amber-800 disabled:opacity-50 disabled:cursor-not-allowed overflow-hidden flex-1 sm:flex-none justify-center h-auto min-h-[44px]"
                          >
                            <div className="absolute inset-0 bg-amber-50 dark:bg-amber-900/20 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                            {loadingAction?.section === idx &&
                            loadingAction?.type === "example" ? (
                              <Loader2 className="w-4 h-4 animate-spin relative z-10 flex-shrink-0" />
                            ) : (
                              <Sparkles className="w-4 h-4 relative z-10 flex-shrink-0" />
                            )}
                            <span
                              className="relative z-10 font-medium text-sm text-center leading-tight"
                              style={{ fontFamily: "Lexend" }}
                            >
                              Give more examples
                            </span>
                          </button>
                        </div>

                        {/* Generated Content Display */}
                        {generatedContent[`${idx}-explain`] &&
                          visibleContent[`${idx}-explain`] && (
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
                                        style={{ fontFamily: "Lexend" }}
                                      >
                                        Simpler Explanation
                                      </h4>
                                      <p className="text-xs text-purple-600 dark:text-purple-400 font-medium">
                                        Smart Tutor
                                      </p>
                                    </div>
                                  </div>
                                  <button
                                    onClick={() =>
                                      toggleContentVisibility(idx, "explain")
                                    }
                                    className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 p-1 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                                  >
                                    <ChevronRight className="w-5 h-5 rotate-90" />
                                  </button>
                                </div>
                                <div className="prose prose-purple prose-sm sm:prose-base dark:prose-invert max-w-none bg-white/50 dark:bg-gray-900/30 rounded-xl p-4 border border-purple-50 dark:border-purple-900/20">
                                  <ReactMarkdown
                                    remarkPlugins={[remarkGfm, remarkMath]}
                                    rehypePlugins={[rehypeRaw, rehypeKatex]}
                                  >
                                    {generatedContent[`${idx}-explain`]}
                                  </ReactMarkdown>
                                </div>
                              </div>
                            </div>
                          )}

                        {generatedContent[`${idx}-example`] &&
                          visibleContent[`${idx}-example`] && (
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
                                        style={{ fontFamily: "Lexend" }}
                                      >
                                        Real-World Examples
                                      </h4>
                                      <p className="text-xs text-amber-600 dark:text-amber-400 font-medium">
                                        Smart Tutor
                                      </p>
                                    </div>
                                  </div>
                                  <button
                                    onClick={() =>
                                      toggleContentVisibility(idx, "example")
                                    }
                                    className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 p-1 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                                  >
                                    <ChevronRight className="w-5 h-5 rotate-90" />
                                  </button>
                                </div>
                                <div className="prose prose-amber prose-sm sm:prose-base dark:prose-invert max-w-none bg-white/50 dark:bg-gray-900/30 rounded-xl p-4 border border-amber-50 dark:border-amber-900/20">
                                  <ReactMarkdown
                                    remarkPlugins={[remarkGfm, remarkMath]}
                                    rehypePlugins={[rehypeRaw, rehypeKatex]}
                                  >
                                    {generatedContent[`${idx}-example`]}
                                  </ReactMarkdown>
                                </div>
                              </div>
                            </div>
                          )}
                      </div>
                    )}

                    {!isCompleted && (
                      <div className="mt-8 flex justify-end">
                        <button
                          onClick={(e) => markAsComplete(idx, e)}
                          className="flex items-center gap-2 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors text-sm font-medium"
                        >
                          Complete Section
                          <ArrowRight className="w-4 h-4" />
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Next Steps */}
      {/* Completion Modal */}
      {/* Next Steps */}
      {progress === 100 && (
        <div className="bg-gradient-to-br from-primary-50 to-white dark:from-gray-800 dark:to-gray-900 rounded-2xl p-4 md:p-6 border border-primary-100 dark:border-gray-700 text-center animate-in zoom-in duration-500">
          <div className="w-16 h-16 bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400 rounded-full flex items-center justify-center mx-auto mb-4">
            <CheckCircle className="w-8 h-8" />
          </div>
          <h2
            className="text-2xl font-bold text-gray-900 dark:text-white mb-2"
            style={{ fontFamily: "Lexend" }}
          >
            Excellent work!
          </h2>
          <p
            className="text-gray-600 dark:text-gray-300 mb-8"
            style={{ fontFamily: "Lexend" }}
          >
            You've completed this learning guide. Here are some recommended next
            steps:
          </p>
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
                  style={{ fontFamily: "Lexend" }}
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
    </div>
  );
};
