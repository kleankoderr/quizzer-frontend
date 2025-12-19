import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate, useLocation , Link } from 'react-router-dom';
import {
  BookOpen,
  Brain,
  ArrowLeft,
  Trash2,
  Calendar,
  MoreVertical,
} from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import rehypeRaw from 'rehype-raw';
import rehypeSanitize, { defaultSchema } from 'rehype-sanitize';
import remarkMath from 'remark-math';
import rehypeKatex from 'rehype-katex';
import rehypeHighlight from 'rehype-highlight';
import 'highlight.js/styles/github-dark.css';
import { format } from 'date-fns';

import { contentService, type Content } from '../services/content.service';

import { Toast as toast } from '../utils/toast';
import { DeleteModal } from '../components/DeleteModal';
import { LearningGuide } from '../components/LearningGuide';
import { ContentPageSkeleton } from '../components/skeletons';
import './ContentPage.css';
import { useContent } from '../hooks';
import { useQueryClient } from '@tanstack/react-query';



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

  // Custom heading renderer to add IDs
  const HeadingRenderer = ({ level, children }: any) => {
    const text = children?.[0]?.toString() || '';
    const id = text.toLowerCase().replaceAll(/[^\w]+/g, '-');
    const Tag = `h${level}` as React.ElementType;
    return <Tag id={id}>{children}</Tag>;
  };

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
        components={{
          h1: (props) => <HeadingRenderer level={1} {...props} />,
          h2: (props) => <HeadingRenderer level={2} {...props} />,
          h3: (props) => <HeadingRenderer level={3} {...props} />,
        }}
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
  const {
    data: content,
    isLoading: loading,
  } = useContent(id);
  const contentRef = useRef<HTMLDivElement>(null);
  const location = useLocation();

  // Modal states
  const [isDeleteContentModalOpen, setIsDeleteContentModalOpen] =
    useState(false);
  const [isDeletingContent, setIsDeletingContent] = useState(false);

  // Set breadcrumb when content loads
  useEffect(() => {
    if (!content || !id || loading || location.state?.breadcrumb) return;

    const breadcrumbItems = [];
    
    // Item 1: Home (Link to /dashboard)
    breadcrumbItems.push({ label: 'Home', path: '/dashboard' });
    
    // Item 2: Study Pack or Study
    if (content.studyPack) {
      breadcrumbItems.push({
        label: content.studyPack.title,
        path: `/study-packs/${content.studyPack.id}`
      });
    } else {
      breadcrumbItems.push({ label: 'Study', path: '/study' });
    }
    
    // Item 3: Content Title (Plain Text, No Link)
    breadcrumbItems.push({ label: content.title, path: null });

    navigate(location.pathname + location.search, {
      replace: true,
      state: { breadcrumb: breadcrumbItems },
    });
  }, [content, id, loading, location, navigate]);







  const handleGenerateQuiz = () => {
    if (!content) return;

    const baseBreadcrumb = [
      { label: 'Home', path: '/dashboard' },
      content.studyPack
        ? { label: content.studyPack.title, path: `/study-packs/${content.studyPack.id}` }
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
        breadcrumb: [...baseBreadcrumb, { label: 'Generate Quiz', path: null }],
      },
    });
  };

  const handleGenerateFlashcards = () => {
    if (!content) return;

    const baseBreadcrumb = [
      { label: 'Home', path: '/dashboard' },
      content.studyPack
        ? { label: content.studyPack.title, path: `/study-packs/${content.studyPack.id}` }
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
        breadcrumb: [...baseBreadcrumb, { label: 'Generate Flashcards', path: null }],
      },
    });
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
      <div className="mb-8 sticky top-0 z-50 bg-white dark:bg-gray-900 pt-4 pb-4 -mx-4 px-4 sm:-mx-6 sm:px-6 lg:-mx-8 lg:px-8">
        <div className="flex items-center justify-between gap-4 max-w-7xl mx-auto">
          <div className="flex items-center gap-4">
            <Link
              to="/study"
              className="p-2 -ml-2 text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
            >
              <ArrowLeft className="w-5 h-5" />
            </Link>
            <div>
              <div className="hidden sm:flex items-center gap-2 mb-1">
                <span className="text-xs font-semibold text-primary-700 dark:text-primary-300 bg-primary-50 dark:bg-primary-900/30 px-2 py-0.5 rounded text-nowrap">
                  {content.topic}
                </span>
                <span className="text-xs text-gray-500 dark:text-gray-400 flex items-center gap-1">
                  <Calendar className="w-3 h-3" />
                  {format(new Date(content.createdAt), 'MMM d')}
                </span>
              </div>
              <h1 className="text-xl font-bold text-gray-900 dark:text-white truncate max-w-[200px] sm:max-w-md">
                {content.title}
              </h1>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {content.quizId ? (
              <button
                onClick={() => navigate(`/quiz/${content.quizId}`)}
                className="flex items-center gap-2 px-2 sm:px-4 py-2 bg-white border border-gray-200 dark:bg-gray-800 dark:border-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors shadow-sm text-sm font-medium"
                title="View Quiz"
              >
                <Brain className="w-4 h-4 flex-shrink-0" />
                <span className="hidden sm:inline">View Quiz</span>
              </button>
            ) : (
              <button
                onClick={handleGenerateQuiz}
                className="flex items-center gap-2 px-2 sm:px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors shadow-sm text-sm font-medium"
                title="Generate Quiz"
              >
                <Brain className="w-4 h-4 flex-shrink-0" />
                <span className="hidden sm:inline">Generate Quiz</span>
              </button>
            )}

            {content.flashcardSetId ? (
              <button
                onClick={() =>
                  navigate(`/flashcards/${content.flashcardSetId}`)
                }
                className="flex items-center gap-2 px-2 sm:px-4 py-2 bg-white border border-gray-200 dark:bg-gray-800 dark:border-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors shadow-sm text-sm font-medium"
                title="View Flashcards"
              >
                <BookOpen className="w-4 h-4 flex-shrink-0" />
                <span className="hidden sm:inline">View Flashcards</span>
              </button>
            ) : (
              <button
                onClick={handleGenerateFlashcards}
                className="flex items-center gap-2 px-2 sm:px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors shadow-sm text-sm font-medium"
                title="Generate Flashcards"
              >
                <BookOpen className="w-4 h-4 flex-shrink-0" />
                <span className="hidden sm:inline">Generate Flashcards</span>
              </button>
            )}
            {/* Desktop Actions */}
            <div className="hidden sm:flex items-center gap-2">
              <div className="h-6 w-px bg-gray-200 dark:bg-gray-700 mx-1"></div>
              <button
                onClick={handleDelete}
                className="p-2 text-gray-500 hover:text-red-600 dark:text-gray-400 dark:hover:text-red-400 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
                title="Delete Content"
              >
                <Trash2 className="w-5 h-5" />
              </button>
            </div>

            {/* Mobile Actions Dropdown */}
            <div className="sm:hidden relative group">
              <button className="p-2 text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors">
                <MoreVertical className="w-5 h-5" />
              </button>
              <div className="absolute right-0 top-full mt-2 w-48 bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 py-1 hidden group-hover:block group-focus-within:block z-50">
                <button
                  onClick={handleDelete}
                  className="w-full text-left px-4 py-2 text-sm text-re d-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 flex items-center gap-2"
                >
                  <Trash2 className="w-4 h-4" /> Delete
                </button>
              </div>
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
                onSectionUpdate={async (index, updates) => {
                  if (!content?.learningGuide) return;

                  const updatedGuide = JSON.parse(
                    JSON.stringify(content.learningGuide)
                  );
                  
                  if (updatedGuide.sections[index]) {
                    updatedGuide.sections[index] = {
                      ...updatedGuide.sections[index],
                      ...updates
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
                      if (!old || !old.learningGuide) return old;
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
                    await queryClient.invalidateQueries({ queryKey: ['content', id] });
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
                  } catch (_error) {}
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
    </div>
  );
};
