import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate, useLocation, Link } from 'react-router-dom';
import {
  BookOpen,
  Brain,
  Trash2,
  MoreVertical,
  ChevronRight,
  Home,
  Edit2,
  Check,
  X,
  LayoutTemplate,
  Loader2,
} from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import rehypeRaw from 'rehype-raw';
import rehypeSanitize, { defaultSchema } from 'rehype-sanitize';
import remarkMath from 'remark-math';
import rehypeKatex from 'rehype-katex';
import rehypeHighlight from 'rehype-highlight';
import 'highlight.js/styles/github.css';

import { contentService, type Content } from '../services/content.service';
import { summaryService } from '../services';

import { Toast as toast } from '../utils/toast';
import { DeleteModal } from '../components/DeleteModal';
import { LearningGuide } from '../components/LearningGuide';
import { ContentPageSkeleton } from '../components/skeletons';
import './ContentPage.css';
import { useContent, useSummaryGeneration } from '../hooks';
import { Modal } from '../components/Modal';
import { MarkdownRenderer } from '../components/MarkdownRenderer';
import { useQueryClient } from '@tanstack/react-query';

// Custom heading renderer to add IDs
const HeadingRenderer = ({ level, children }: any) => {
  const text = children?.[0]?.toString() || '';
  const id = text.toLowerCase().replaceAll(/[^\w]+/g, '-');
  const Tag = `h${level}` as React.ElementType;
  return <Tag id={id}>{children}</Tag>;
};

const MARKDOWN_COMPONENTS = {
  h1: (props: any) => <HeadingRenderer level={1} {...props} />,
  h2: (props: any) => <HeadingRenderer level={2} {...props} />,
  h3: (props: any) => <HeadingRenderer level={3} {...props} />,
};

// Markdown Content Component with Scroll Tracking
const MarkdownContent = ({
  processedContent,
  initialProgress,
  onProgressUpdate,
}: {
  processedContent: string;
  initialProgress: number;
  onProgressUpdate: (progress: number) => void;
}) => {
  const [restored, setRestored] = useState(false);

  // Restore scroll position
  useEffect(() => {
    if (!restored && initialProgress > 0) {
      const scrollHeight =
        document.documentElement.scrollHeight - window.innerHeight;
      const targetScroll = (initialProgress / 100) * scrollHeight;
      window.scrollTo({ top: targetScroll, behavior: 'smooth' });
      setRestored(true);
    }
  }, [initialProgress, restored]);

  // Track scroll progress
  useEffect(() => {
    let timeoutId: ReturnType<typeof setTimeout>;

    const handleScroll = () => {
      clearTimeout(timeoutId);
      timeoutId = setTimeout(() => {
        const scrollTop = window.scrollY;
        const scrollHeight =
          document.documentElement.scrollHeight - window.innerHeight;
        if (scrollHeight <= 0) return;

        const progress = Math.min(
          100,
          Math.max(0, (scrollTop / scrollHeight) * 100)
        );
        onProgressUpdate(progress);
      }, 500); // Debounce by 500ms
    };

    window.addEventListener('scroll', handleScroll);
    return () => {
      window.removeEventListener('scroll', handleScroll);
      clearTimeout(timeoutId);
    };
  }, [onProgressUpdate]);

  return (
    <div className="prose prose-lg max-w-none content-markdown font-sans dark:prose-invert">
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
                'mark',
                'span',
                'div',
                'math',
                'semantics',
                'mrow',
                'mi',
                'mo',
                'mn',
                'msup',
                'msub',
                'mfrac',
                'msqrt',
                'mroot',
                'mtable',
                'mtr',
                'mtd',
              ],
              attributes: {
                ...defaultSchema.attributes,
                mark: [
                  ['className'],
                  ['data-highlight-id'],
                  ['data-has-note'],
                  ['title'],
                ],
                span: [
                  ['className'],
                  ['title'],
                  ['style'],
                  ['data-note-id'],
                  ['data-note-text'],
                ],
                div: [['className']],
                math: [['xmlns'], ['display']],
                code: [['className']],
                pre: [['className']],
              },
            },
          ],
          rehypeHighlight,
        ]}
        components={MARKDOWN_COMPONENTS}
      >
        {processedContent}
      </ReactMarkdown>
    </div>
  );
};

export const ContentPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { data: content, isLoading: loading } = useContent(id);
  const contentRef = useRef<HTMLDivElement>(null);
  const location = useLocation();

  // Modal states
  const [isDeleteContentModalOpen, setIsDeleteContentModalOpen] =
    useState(false);
  const [isDeletingContent, setIsDeletingContent] = useState(false);
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [editedTitle, setEditedTitle] = useState('');

  useEffect(() => {
    if (content) {
      setEditedTitle(content.title);
    }
  }, [content]);

  const handleTitleUpdate = async () => {
    if (!content || !editedTitle.trim() || editedTitle === content.title) {
      setIsEditingTitle(false);
      return;
    }

    try {
      await contentService.update(content.id, { title: editedTitle });
      queryClient.setQueryData(['content', id], (old: Content | undefined) => {
        if (!old) return old;
        return { ...old, title: editedTitle };
      });
      toast.success('Title updated');
      setIsEditingTitle(false);
    } catch (_error) {
      toast.error('Failed to update title');
    }
  };

  // Set breadcrumb when content loads
  useEffect(() => {
    if (!content || !id || loading || location.state?.breadcrumb) return;

    const breadcrumbItems = [];

    // Item 1: Study Pack or Study
    if (content.studyPack) {
      breadcrumbItems.push({
        label: content.studyPack.title,
        path: `/study-pack/${content.studyPack.id}`,
      });
    } else {
      breadcrumbItems.push({ label: 'Study', path: '/study' });
    }

    // Item 2: Content Title (Plain Text, No Link)
    breadcrumbItems.push({ label: content.title, path: null });

    navigate(location.pathname + location.search, {
      replace: true,
      state: { breadcrumb: breadcrumbItems },
    });
  }, [content, id, loading, location, navigate]);

  const handleGenerateQuiz = () => {
    if (!content) return;

    const baseBreadcrumb = [
      content.studyPack
        ? {
            label: content.studyPack.title,
            path: `/study-pack/${content.studyPack.id}`,
          }
        : { label: 'Study', path: '/study' },
      { label: content.title, path: `/content/${content.id}` },
    ];

    if (content.quizId) {
      navigate(`/quiz/${content.quizId}`, {
        state: { breadcrumb: baseBreadcrumb },
      });
      return;
    }

    navigate('/quiz', {
      state: {
        openGenerator: true,
        sourceTitle: content.title,
        sourceId: content.id,
        contentId: content.id,
        studyPackId: content.studyPack?.id,
        breadcrumb: [...baseBreadcrumb, { label: 'Generate Quiz', path: null }],
      },
    });
  };

  const handleGenerateFlashcards = () => {
    if (!content) return;

    const baseBreadcrumb = [
      content.studyPack
        ? {
            label: content.studyPack.title,
            path: `/study-pack/${content.studyPack.id}`,
          }
        : { label: 'Study', path: '/study' },
      { label: content.title, path: `/content/${content.id}` },
    ];

    if (content.flashcardSetId) {
      navigate(`/flashcards/${content.flashcardSetId}`, {
        state: { breadcrumb: baseBreadcrumb },
      });
      return;
    }

    navigate('/flashcards', {
      state: {
        openGenerator: true,
        sourceId: content.id,
        sourceTitle: content.title,
        contentId: content.id,
        studyPackId: content.studyPack?.id,
        breadcrumb: [
          ...baseBreadcrumb,
          { label: 'Generate Flashcards', path: null },
        ],
      },
    });
  };

  /* New Hook Integration */
  const { startGeneration, isGenerating, streamingContent } =
    useSummaryGeneration();
  const [showStreamingModal, setShowStreamingModal] = useState(false);
  const [generatedShortCode, setGeneratedShortCode] = useState<string | null>(
    null
  );

  const handleGenerateSummary = async () => {
    if (!content) return;

    if (content.summary) {
      navigate(`/s/${content.summary.shortCode}`);
      return;
    }

    try {
      const { jobId } = await summaryService.generateSummary(content.id);

      setShowStreamingModal(true);
      setGeneratedShortCode(null);

      // Start generation listeners
      startGeneration(jobId, (shortCode) => {
        setGeneratedShortCode(shortCode);
        queryClient.invalidateQueries({ queryKey: ['content', id] });
      });
    } catch (_error: any) {
      const message =
        _error.response?.data?.message || 'Failed to generate summary';
      toast.error(message || 'Failed to generate summary');
    }
  };

  const handleDelete = () => {
    setIsDeleteContentModalOpen(true);
  };

  const confirmDeleteContent = async () => {
    if (!id) return;

    setIsDeletingContent(true);
    const loadingToast = toast.loading('Deleting content...');
    try {
      await contentService.delete(id);
      toast.success('Content deleted successfully!', { id: loadingToast });
      // Invalidate contents list to remove deleted item
      await queryClient.invalidateQueries({ queryKey: ['contents'] });
      setIsDeleteContentModalOpen(false);
      navigate('/study');
    } catch (_error) {
      toast.error('Failed to delete content', { id: loadingToast });
    } finally {
      setIsDeletingContent(false);
    }
  };

  if (loading) {
    return <ContentPageSkeleton />;
  }

  if (!content) {
    return (
      <div className="text-center py-12">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
          Content not found
        </h2>
        <Link
          to="/dashboard"
          className="text-primary-600 dark:text-primary-400 hover:underline mt-4 inline-block"
        >
          Return to Dashboard
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-[1600px] mx-auto pb-20 px-4 sm:px-6 lg:px-8">
      {/* Header */}
      <div className="max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8 pt-4 pb-2">
        {/* Breadcrumbs - placed outside sticky header */}
        <nav className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400 overflow-hidden mb-4">
          <Link
            to="/"
            className="hover:text-gray-900 dark:hover:text-white transition-colors flex items-center p-1 -ml-1 rounded-md hover:bg-gray-100 dark:hover:bg-gray-800"
            title="Home"
          >
            <Home className="w-4 h-4" />
          </Link>
          <ChevronRight className="w-4 h-4 text-gray-300 dark:text-gray-600 flex-shrink-0" />

          {content.studyPack ? (
            <>
              <Link
                to={`/study-pack/${content.studyPack.id}?tab=materials`}
                className="hover:text-gray-900 dark:hover:text-white transition-colors truncate max-w-[150px] sm:max-w-[200px] font-medium"
              >
                {content.studyPack.title}
              </Link>
              <ChevronRight className="w-4 h-4 text-gray-300 dark:text-gray-600 flex-shrink-0" />
            </>
          ) : (
            <>
              <Link
                to="/study"
                className="hover:text-gray-900 dark:hover:text-white transition-colors font-medium"
              >
                Study
              </Link>
              <ChevronRight className="w-4 h-4 text-gray-300 dark:text-gray-600 flex-shrink-0" />
            </>
          )}

          <span className="font-semibold text-gray-900 dark:text-white truncate">
            {content.title}
          </span>
        </nav>
      </div>

      {/* Sticky Header - Title and Actions only */}
      <div className="mb-6 sticky top-0 z-50 bg-white/80 dark:bg-gray-900/80 backdrop-blur-xl border-b border-gray-200 dark:border-gray-800 transition-all duration-200 supports-[backdrop-filter]:bg-white/60">
        <div className="max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8">
          <div className="py-4">
            <div className="flex flex-row items-center justify-between gap-4">
              {/* Title Row */}
              <div className="flex items-center gap-3 min-w-0 flex-1">
                {isEditingTitle ? (
                  <div className="flex items-center gap-2 w-full max-w-2xl">
                    <input
                      type="text"
                      value={editedTitle}
                      onChange={(e) => setEditedTitle(e.target.value)}
                      className="flex-1 px-3 py-1.5 text-xl font-bold bg-white dark:bg-gray-800 border border-primary-300 dark:border-primary-700 rounded-lg focus:ring-2 focus:ring-primary-500 outline-none"
                      autoFocus
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') handleTitleUpdate();
                        if (e.key === 'Escape') {
                          setEditedTitle(content.title);
                          setIsEditingTitle(false);
                        }
                      }}
                    />
                    <button
                      onClick={handleTitleUpdate}
                      className="p-1 sm:p-2 text-green-600 hover:bg-green-50 rounded-lg transition-colors flex-shrink-0"
                    >
                      <Check className="w-5 h-5" />
                    </button>
                    <button
                      onClick={() => {
                        setEditedTitle(content.title);
                        setIsEditingTitle(false);
                      }}
                      className="p-1 sm:p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors flex-shrink-0"
                    >
                      <X className="w-5 h-5" />
                    </button>
                  </div>
                ) : (
                  <>
                    <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white truncate">
                      {content.title}
                    </h1>
                    <button
                      onClick={() => setIsEditingTitle(true)}
                      className="hidden sm:block p-1.5 text-gray-400 hover:text-primary-600 hover:bg-primary-50 dark:hover:bg-primary-900/20 rounded-lg transition-colors"
                      title="Edit Title"
                    >
                      <Edit2 className="w-4 h-4" />
                    </button>
                  </>
                )}
              </div>

              {/* Desktop Actions - Reversed Order */}
              <div className="hidden sm:flex items-center gap-2">
                {/* Quiz Button */}
                {content.quizId ? (
                  <button
                    onClick={() => navigate(`/quiz/${content.quizId}`)}
                    className="p-2 bg-primary-50 dark:bg-primary-900/20 text-primary-700 dark:text-primary-300 border border-primary-200 dark:border-primary-800 rounded-full hover:bg-primary-100 dark:hover:bg-primary-900/30 transition-all shadow-sm"
                    title="View Quiz"
                  >
                    <Brain className="w-4 h-4" />
                  </button>
                ) : (
                  <button
                    onClick={handleGenerateQuiz}
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-all shadow-sm text-[10px] font-bold uppercase tracking-wider"
                    title="Generate Quiz"
                  >
                    <Brain className="w-3.5 h-3.5" />
                    <span>Quiz</span>
                  </button>
                )}

                {/* Flashcards Button */}
                {content.flashcardSetId ? (
                  <button
                    onClick={() =>
                      navigate(`/flashcards/${content.flashcardSetId}`)
                    }
                    className="p-2 bg-emerald-50 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 rounded-full hover:bg-emerald-100 dark:hover:bg-emerald-900/30 transition-all shadow-sm"
                    title="View Flashcards"
                  >
                    <BookOpen className="w-4 h-4" />
                  </button>
                ) : (
                  <button
                    onClick={handleGenerateFlashcards}
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-all shadow-sm text-[10px] font-bold uppercase tracking-wider"
                    title="Generate Flashcards"
                  >
                    <BookOpen className="w-3.5 h-3.5" />
                    <span>Cards</span>
                  </button>
                )}

                {/* Summary Button */}
                {content.summary ? (
                  <button
                    onClick={() => navigate(`/s/${content.summary?.shortCode}`)}
                    className="p-2 bg-purple-50 dark:bg-purple-900/20 text-purple-700 dark:text-purple-300 border border-purple-200 dark:border-purple-800 rounded-full hover:bg-purple-100 dark:hover:bg-purple-900/30 transition-all shadow-sm"
                    title="View Summary"
                  >
                    <LayoutTemplate className="w-4 h-4" />
                  </button>
                ) : (
                  <button
                    onClick={handleGenerateSummary}
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-all shadow-sm text-[10px] font-bold uppercase tracking-wider"
                    title="Generate Summary"
                  >
                    <LayoutTemplate className="w-3.5 h-3.5" />
                    <span>Summary</span>
                  </button>
                )}

                <div className="h-6 w-px bg-gray-200 dark:bg-gray-700 mx-1"></div>

                <button
                  onClick={handleDelete}
                  className="p-2 text-gray-400 hover:text-red-600 dark:text-gray-500 dark:hover:text-red-400 transition-colors rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20"
                  title="Delete Content"
                >
                  <Trash2 className="w-5 h-5" />
                </button>
              </div>

              {/* Mobile Menu Button */}
              {!isEditingTitle && (
                <div className="sm:hidden relative group">
                  <button className="p-2 text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors">
                    <MoreVertical className="w-5 h-5" />
                  </button>
                  <div className="absolute right-0 top-full mt-2 w-48 bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 py-1 hidden group-hover:block group-focus-within:block z-50">
                    {/* Mobile Actions in Dropdown */}
                    <button
                      onClick={() => setIsEditingTitle(true)}
                      className="w-full text-left px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 flex items-center gap-2"
                    >
                      <Edit2 className="w-4 h-4" /> Edit Title
                    </button>

                    {/* Quiz */}
                    {content.quizId ? (
                      <button
                        onClick={() => navigate(`/quiz/${content.quizId}`)}
                        className="w-full text-left px-4 py-2 text-sm text-primary-600 dark:text-primary-400 hover:bg-primary-50 dark:hover:bg-primary-900/20 flex items-center gap-2"
                      >
                        <Brain className="w-4 h-4" /> View Quiz
                      </button>
                    ) : (
                      <button
                        onClick={handleGenerateQuiz}
                        className="w-full text-left px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 flex items-center gap-2"
                      >
                        <Brain className="w-4 h-4" /> Generate Quiz
                      </button>
                    )}

                    {/* Flashcards */}
                    {content.flashcardSetId ? (
                      <button
                        onClick={() =>
                          navigate(`/flashcards/${content.flashcardSetId}`)
                        }
                        className="w-full text-left px-4 py-2 text-sm text-emerald-600 dark:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-900/20 flex items-center gap-2"
                      >
                        <BookOpen className="w-4 h-4" /> View Cards
                      </button>
                    ) : (
                      <button
                        onClick={handleGenerateFlashcards}
                        className="w-full text-left px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 flex items-center gap-2"
                      >
                        <BookOpen className="w-4 h-4" /> Generate Cards
                      </button>
                    )}

                    {/* Summary Mobile */}
                    {content.summary ? (
                      <button
                        onClick={() =>
                          navigate(`/s/${content.summary?.shortCode}`)
                        }
                        className="w-full text-left px-4 py-2 text-sm text-purple-600 dark:text-purple-400 hover:bg-purple-50 dark:hover:bg-purple-900/20 flex items-center gap-2"
                      >
                        <LayoutTemplate className="w-4 h-4" /> View Summary
                      </button>
                    ) : (
                      <button
                        onClick={handleGenerateSummary}
                        className="w-full text-left px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 flex items-center gap-2"
                      >
                        <LayoutTemplate className="w-4 h-4" /> Generate Summary
                      </button>
                    )}

                    <div className="my-1 border-t border-gray-100 dark:border-gray-700"></div>
                    <button
                      onClick={handleDelete}
                      className="w-full text-left px-4 py-2 text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 flex items-center gap-2"
                    >
                      <Trash2 className="w-4 h-4" /> Delete
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="flex gap-8 max-w-[1600px] mx-auto">
        {/* Main Content */}
        <div className="flex-1 min-w-0">
          <div
            ref={contentRef}
            className="bg-white dark:bg-gray-800 sm:rounded-2xl sm:shadow-sm sm:border border-gray-200 dark:border-gray-700 p-0 sm:p-8 md:p-12 min-h-[500px]"
          >
            {content.learningGuide ? (
              <LearningGuide
                key={content.id}
                guide={content.learningGuide}
                title={content.title}
                contentRef={contentRef}
                contentId={content.id}
                topic={content.topic}
                description={content.description}
                onGenerateQuiz={handleGenerateQuiz}
                onGenerateFlashcards={handleGenerateFlashcards}
                onGenerateSummary={handleGenerateSummary}
                hasSummary={!!content.summary}
                onSectionUpdate={async (index, updates) => {
                  if (!content?.learningGuide) return;

                  const updatedGuide = structuredClone(content.learningGuide);

                  if (updatedGuide.sections[index]) {
                    updatedGuide.sections[index] = {
                      ...updatedGuide.sections[index],
                      ...updates,
                    };
                  }

                  // Recalculate progress if completed status changed
                  let newProgress = content.lastReadPosition;
                  if ('completed' in updates) {
                    const totalSections = updatedGuide.sections.length;
                    const completedCount = updatedGuide.sections.filter(
                      (s: any) => s.completed
                    ).length;
                    newProgress = Math.round(
                      (completedCount / totalSections) * 100
                    );
                  }

                  // Optimistic update
                  queryClient.setQueryData(
                    ['content', id],
                    (old: Content | undefined) => {
                      if (!old?.learningGuide) return old;
                      return {
                        ...old,
                        learningGuide: updatedGuide,
                        lastReadPosition: newProgress,
                      };
                    }
                  );

                  try {
                    await contentService.update(content.id, {
                      learningGuide: updatedGuide,
                      lastReadPosition: newProgress,
                    });
                  } catch (_error) {
                    toast.error('Failed to save progress');
                    await queryClient.invalidateQueries({
                      queryKey: ['content', id],
                    });
                  }
                }}
              />
            ) : (
              <MarkdownContent
                processedContent={content.content}
                initialProgress={content.lastReadPosition || 0}
                onProgressUpdate={async (progress) => {
                  try {
                    await contentService.update(content.id, {
                      lastReadPosition: progress,
                    });
                  } catch (_error) {
                    toast.error('Failed to save progress');
                  }
                }}
              />
            )}
          </div>
        </div>
      </div>

      {/* Modals */}
      <DeleteModal
        isOpen={isDeleteContentModalOpen}
        onClose={() => setIsDeleteContentModalOpen(false)}
        onConfirm={confirmDeleteContent}
        title="Delete Content"
        message="Are you sure you want to delete this content? This action cannot be undone."
        isDeleting={isDeletingContent}
      />

      {/* Streaming Summary Modal */}
      <Modal
        isOpen={showStreamingModal}
        onClose={() => {
          if (!isGenerating) {
            setShowStreamingModal(false);
          }
        }}
        title="Generating Summary"
        className="max-w-2xl"
        footer={
          !isGenerating && generatedShortCode ? (
            <button
              onClick={() => navigate(`/s/${generatedShortCode}`)}
              className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 font-bold"
            >
              View Full Summary
            </button>
          ) : isGenerating ? (
            <div className="flex items-center gap-2 text-sm text-gray-500 font-medium">
              <Loader2 className="w-4 h-4 animate-spin" />
              AI is writing your summary...
            </div>
          ) : null
        }
      >
        <div className="max-h-[60vh] overflow-y-auto pr-2">
          {streamingContent ? (
            <div className="prose prose-sm dark:prose-invert">
              <MarkdownRenderer content={streamingContent} />
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-12 text-center text-gray-500">
              <Brain className="w-12 h-12 text-primary-200 mb-4 animate-pulse" />
              <p>Analyzing content and drafting summary chunks...</p>
            </div>
          )}
        </div>
      </Modal>
    </div>
  );
};
