import { useState, useEffect, useRef, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  BookOpen,
  Highlighter,
  Brain,
  ArrowLeft,
  StickyNote,
  Trash2,
  Calendar,
  Check,
  X,
  MoreVertical,
} from 'lucide-react';
import { Link } from 'react-router-dom';
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
import { InlineNoteInput } from '../components/InlineNoteInput';
import { LearningGuide } from '../components/LearningGuide';
import { ContentPageSkeleton } from '../components/skeletons';
import { 
  applyHighlights,
  HIGHLIGHT_BORDER_COLORS,
  type Highlight 
} from '../utils/contentUtils';

import './ContentPage.css';
import { useContent } from '../hooks';
import { useQueryClient } from '@tanstack/react-query';

interface ExtendedContent extends Content {
  highlights?: Highlight[];
}

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
    const id = text.toLowerCase().replace(/[^\w]+/g, '-');
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
    data: contentData,
    isLoading: loading,
    error,
  } = useContent(id);
  const content = contentData as ExtendedContent | undefined;
  const [selectedText, setSelectedText] = useState('');
  const [toolbarPosition, setToolbarPosition] = useState<{
    x: number;
    y: number;
  } | null>(null);
  const contentRef = useRef<HTMLDivElement>(null);
  const [showNotes, setShowNotes] = useState(window.innerWidth >= 1280);
  const [selectedColor, setSelectedColor] = useState<
    'yellow' | 'green' | 'pink'
  >('yellow');

  // Inline Note States
  const [inlineNote, setInlineNote] = useState<{
    id?: string;
    text: string;
    position: { x: number; y: number };
  } | null>(null);

  // Modal states
  const [isDeleteContentModalOpen, setIsDeleteContentModalOpen] =
    useState(false);
  const [isDeletingContent, setIsDeletingContent] = useState(false);
  const [selectedSectionIndex, setSelectedSectionIndex] = useState<
    number | undefined
  >(undefined);

  // Handle errors
  if (error) {
    toast.error('Failed to load content');
    navigate('/dashboard');
  }

  useEffect(() => {
    const handleSelection = () => {
      const sel = window.getSelection();
      if (
        sel &&
        sel.toString().trim().length > 0 &&
        contentRef.current?.contains(sel.anchorNode)
      ) {
        const range = sel.getRangeAt(0);
        const rect = range.getBoundingClientRect();
        setSelectedText(sel.toString().trim());

        // Detect section index
        const anchorNode = sel.anchorNode;
        const element =
          anchorNode instanceof Element
            ? anchorNode
            : anchorNode?.parentElement;
        const sectionNode = element?.closest('[data-section-index]');
        if (sectionNode) {
          const index = parseInt(
            sectionNode.getAttribute('data-section-index') || '0',
            10
          );
          setSelectedSectionIndex(index);
        } else {
          setSelectedSectionIndex(undefined);
        }

        setToolbarPosition({
          x: rect.left + rect.width / 2,
          y: rect.top - 10 + window.scrollY,
        });
        // Close inline note input if open
        if (inlineNote && !inlineNote.id) {
          setInlineNote(null);
        }
      }
    };

    document.addEventListener('mouseup', handleSelection);
    return () => document.removeEventListener('mouseup', handleSelection);
  }, [inlineNote]);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (
        !target.closest('.floating-toolbar') &&
        !target.closest('.inline-note-input') &&
        window.getSelection()?.toString().length === 0
      ) {
        setToolbarPosition(null);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    const handleAddSectionNote = (e: Event) => {
      const customEvent = e as CustomEvent;
      const { sectionIndex, x, y } = customEvent.detail;
      setSelectedSectionIndex(sectionIndex);
      setInlineNote({
        text: '',
        position: { x, y },
      });
      setSelectedText(''); // Clear selected text to indicate section note
      window.getSelection()?.removeAllRanges();
    };

    window.addEventListener('add-section-note', handleAddSectionNote);
    return () =>
      window.removeEventListener('add-section-note', handleAddSectionNote);
  }, []);

  const handleHighlight = async (
    color: 'yellow' | 'green' | 'pink' = selectedColor
  ) => {
    if (!selectedText || !id) return;

    // Create temporary highlight for optimistic update
    const tempHighlight: Highlight = {
      id: `temp-${Date.now()}`,
      text: selectedText,
      color: color,
      createdAt: new Date().toISOString(),
      sectionIndex: selectedSectionIndex,
    };

    // Optimistic update - add highlight immediately to UI
    queryClient.setQueryData(['content', id], (old: ExtendedContent | undefined) => {
      if (!old) return old;
      return {
        ...old,
        highlights: [...(old.highlights || []), tempHighlight],
      };
    });

    // Clear selection immediately for better UX
    setToolbarPosition(null);
    window.getSelection()?.removeAllRanges();

    try {
      await contentService.addHighlight(id, {
        text: selectedText,
        startOffset: 0,
        endOffset: 0,
        color: color,
        sectionIndex: selectedSectionIndex,
      });
      
      // Invalidate to get the real highlight from server (with real ID)
      // Backend will return existing highlight if duplicate, so no error
      await queryClient.invalidateQueries({ queryKey: ['content', id] });
    } catch (_error) {
      // Rollback optimistic update on error
      queryClient.setQueryData(['content', id], (old: ExtendedContent | undefined) => {
        if (!old) return old;
        return {
          ...old,
          highlights: old.highlights?.filter((h) => h.id !== tempHighlight.id) || [],
        };
      });
      toast.error('Failed to save highlight');
    }
  };

  const handleAddNote = () => {
    if (!selectedText || !id || !toolbarPosition) return;
    setInlineNote({
      text: '',
      position: toolbarPosition,
    });
    setToolbarPosition(null);
  };

  const saveInlineNote = async () => {
    if (!inlineNote?.text || !id) return;

    let textToSave = selectedText;
    if (
      !textToSave &&
      selectedSectionIndex !== undefined &&
      content?.learningGuide
    ) {
      textToSave = content.learningGuide.sections[selectedSectionIndex].title;
    }

    // Create temporary note for optimistic update
    const tempNote: Highlight = {
      id: `temp-note-${Date.now()}`,
      text: textToSave || 'Note',
      note: inlineNote.text,
      color: 'yellow',
      createdAt: new Date().toISOString(),
      sectionIndex: selectedSectionIndex,
    };

    // Optimistic update - add note immediately to UI
    queryClient.setQueryData(['content', id], (old: ExtendedContent | undefined) => {
      if (!old) return old;
      return {
        ...old,
        highlights: [...(old.highlights || []), tempNote],
      };
    });

    // Clear note input immediately for better UX
    setInlineNote(null);
    window.getSelection()?.removeAllRanges();

    try {
      await contentService.addHighlight(id, {
        text: textToSave || 'Note',
        startOffset: 0,
        endOffset: 0,
        note: inlineNote.text,
        color: 'yellow',
        sectionIndex: selectedSectionIndex,
      });
      
      // Invalidate to get the real note from server (with real ID)
      await queryClient.invalidateQueries({ queryKey: ['content', id] });
    } catch (_error) {
      // Rollback optimistic update on error
      queryClient.setQueryData(['content', id], (old: ExtendedContent | undefined) => {
        if (!old) return old;
        return {
          ...old,
          highlights: old.highlights?.filter((h) => h.id !== tempNote.id) || [],
        };
      });
      toast.error('Failed to add note');
    }
  };

  const handleDeleteHighlight = async (highlightId: string) => {
    if (!id) return;

    // Store the highlight being deleted for potential rollback
    const highlightToDelete = content?.highlights?.find(
      (h) => h.id === highlightId
    );

    // Optimistic update - remove highlight immediately from UI
    queryClient.setQueryData(['content', id], (old: ExtendedContent | undefined) => {
      if (!old) return old;
      return {
        ...old,
        highlights: old.highlights?.filter((h) => h.id !== highlightId) || [],
      };
    });

    try {
      await contentService.deleteHighlight(highlightId);
      // Invalidate to ensure consistency with server
      await queryClient.invalidateQueries({ queryKey: ['content', id] });
    } catch (_error) {
      // Rollback optimistic update on error
      if (highlightToDelete) {
        queryClient.setQueryData(['content', id], (old: ExtendedContent | undefined) => {
          if (!old) return old;
          return {
            ...old,
            highlights: [...(old.highlights || []), highlightToDelete],
          };
        });
      }
      toast.error('Failed to delete highlight');
    }
  };

  const handleGenerateQuiz = () => {
    if (!content) return;

    if (content.quizId) {
      navigate(`/quiz/${content.quizId}`);
      return;
    }

    navigate('/quiz', {
      state: {
        topic: content.title,
        sourceId: content.id,
        contentId: content.id,
        breadcrumb: [
          { label: 'Study', path: '/study' },
          { label: content.title, path: `/content/${content.id}` },
          { label: 'Generate Quiz' },
        ],
      },
    });
  };

  const handleGenerateFlashcards = () => {
    if (!content) return;

    if (content.flashcardSetId) {
      navigate(`/flashcards/${content.flashcardSetId}`);
      return;
    }

    navigate('/flashcards', {
      state: {
        topic: content.topic,
        sourceId: content.id,
        sourceTitle: content.title,
        contentId: content.id,
        breadcrumb: [
          { label: 'Study', path: '/study' },
          { label: content.title, path: `/content/${content.id}` },
          { label: 'Generate Flashcards' },
        ],
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

  const renderNotesContent = () => (
    <>
      <div className="flex items-center justify-between mb-6 flex-shrink-0">
        <h3 className="font-bold text-gray-900 dark:text-white flex items-center gap-2 text-lg">
          <StickyNote className="w-5 h-5 text-primary-600" />
          Notes & Highlights
        </h3>
        <span className="text-xs font-medium bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 px-2 py-1 rounded-full">
          {content?.highlights?.length || 0}
        </span>
      </div>

      <div className="space-y-4 flex-1 overflow-y-auto min-h-0 pr-2 -mr-2 pb-6">
        {content?.highlights && content.highlights.length > 0 ? (
          content.highlights.map((highlight) => (
            <div
              key={highlight.id}
              className={`p-4 rounded-xl border transition-all hover:shadow-md group relative ${
                HIGHLIGHT_BORDER_COLORS[
                  highlight.color as keyof typeof HIGHLIGHT_BORDER_COLORS
                ]
              } bg-white dark:bg-gray-800`}
            >
              <div
                className={`absolute left-0 top-0 bottom-0 w-1 rounded-l-xl ${
                  highlight.color === 'yellow'
                    ? 'bg-yellow-400'
                    : highlight.color === 'green'
                      ? 'bg-green-400'
                      : 'bg-pink-400'
                }`}
              ></div>

              <div className="flex justify-between items-start mb-2 pl-2">
                <span className="text-xs font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400">
                  {highlight.note ? 'Note' : 'Highlight'}
                </span>
                <button
                  onClick={() => handleDeleteHighlight(highlight.id)}
                  className="text-gray-400 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>

              <p className="text-sm text-gray-800 dark:text-gray-200 italic mb-2 pl-2">
                "{highlight.text}"
              </p>

              {highlight.note && (
                <div className="mt-3 pt-3 border-t border-gray-100 dark:border-gray-700 pl-2">
                  <p className="text-sm text-gray-700 dark:text-gray-300 font-medium">
                    {highlight.note}
                  </p>
                </div>
              )}

              <div className="mt-2 text-xs text-gray-400 pl-2">
                {format(new Date(highlight.createdAt), 'MMM d, h:mm a')}
              </div>
            </div>
          ))
        ) : (
          <div className="text-center py-12 text-gray-400 dark:text-gray-500">
            <Highlighter className="w-12 h-12 mx-auto mb-3 opacity-20" />
            <p className="text-sm">No highlights yet</p>
            <p className="text-xs mt-1 opacity-70">
              Select text to add highlights
            </p>
          </div>
        )}
      </div>
    </>
  );

  const processedContent = useMemo(() => {
    if (!content?.content) return '';
    const result = applyHighlights(content.content, content.highlights || []);
    console.log('Processing highlights:', {
      hasContent: !!content?.content,
      highlightsCount: content?.highlights?.length || 0,
      highlights: content?.highlights,
      processedLength: result.length,
      originalLength: content?.content?.length || 0
    });
    return result;
  }, [content?.content, content?.highlights]);

  // Handle clicks on highlights and note indicators
  const handleContentClick = (e: React.MouseEvent) => {
    const target = e.target as HTMLElement;
    
    // Handle note indicator clicks - show note
    if (target.classList.contains('note-indicator')) {
      e.stopPropagation();
      const noteText = target.getAttribute('data-note-text');
      const noteId = target.getAttribute('data-note-id');
      if (noteText) {
        const rect = target.getBoundingClientRect();
        setInlineNote({
          id: noteId || undefined,
          text: noteText,
          position: {
            x: rect.left + rect.width / 2,
            y: rect.top - 10 + window.scrollY,
          },
        });
      }
      return;
    }
    
    // Handle highlight clicks - remove highlight or show note
    if (target.classList.contains('highlight-mark') || target.tagName === 'MARK') {
      const highlightId = target.getAttribute('data-highlight-id');
      const hasNote = target.getAttribute('data-has-note') === 'true';
      
      if (highlightId) {
        if (hasNote) {
          // If it has a note, show the note
          const noteText = target.querySelector('.note-indicator')?.getAttribute('data-note-text');
          if (noteText) {
            const rect = target.getBoundingClientRect();
            setInlineNote({
              id: highlightId,
              text: noteText,
              position: {
                x: rect.left + rect.width / 2,
                y: rect.top - 10 + window.scrollY,
              },
            });
          }
        } else {
          // If it's just a highlight, remove it (unhighlight)
          handleDeleteHighlight(highlightId);
        }
      }
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
                onClick={() => setShowNotes(!showNotes)}
                className={`p-2 rounded-lg transition-colors ${showNotes ? 'text-primary-600 bg-primary-50 dark:text-primary-400 dark:bg-primary-900/20' : 'text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-800'}`}
                title="Toggle Notes"
              >
                <StickyNote className="w-5 h-5" />
              </button>
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
                  onClick={() => setShowNotes(!showNotes)}
                  className="w-full text-left px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 flex items-center gap-2"
                >
                  <StickyNote className="w-4 h-4" />{' '}
                  {showNotes ? 'Hide Notes' : 'Show Notes'}
                </button>
                <button
                  onClick={handleDelete}
                  className="w-full text-left px-4 py-2 text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 flex items-center gap-2"
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
            onClick={handleContentClick}
            className="bg-white dark:bg-gray-800 sm:rounded-2xl sm:shadow-sm sm:border border-gray-200 dark:border-gray-700 p-0 sm:p-8 md:p-12 min-h-[500px]"
          >
            {content.learningGuide ? (
              <LearningGuide
                key={content.id}
                guide={content.learningGuide}
                title={content.title}
                highlights={content.highlights}
                onContentClick={handleContentClick}
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
                    (old: ExtendedContent | undefined) => {
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
                processedContent={processedContent}
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

        {/* Notes Sidebar / Drawer */}
        {showNotes && (
          <>
            {/* Desktop Sidebar */}
            <div className="w-80 flex-shrink-0 hidden xl:block">
              <div className="sticky top-24 bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-700 p-6 max-h-[calc(100vh-120px)] overflow-y-auto flex flex-col">
                {renderNotesContent()}
              </div>
            </div>

            {/* Mobile/Tablet Drawer */}
            <div className="fixed inset-0 z-[60] xl:hidden">
              <div
                className="absolute inset-0 bg-black/50 backdrop-blur-sm"
                onClick={() => setShowNotes(false)}
              ></div>
              <div className="absolute right-0 top-0 bottom-0 w-full max-w-sm bg-white dark:bg-gray-800 shadow-xl p-6 overflow-y-auto flex flex-col animate-in slide-in-from-right duration-200">
                <div className="flex justify-end mb-2">
                  <button
                    onClick={() => setShowNotes(false)}
                    className="p-2 text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
                {renderNotesContent()}
              </div>
            </div>
          </>
        )}
      </div>

      {/* Floating Toolbar */}
      {toolbarPosition && (
        <div
          className="floating-toolbar fixed z-50 bg-gray-900 text-white rounded-xl shadow-2xl flex items-center p-1.5 transform -translate-x-1/2 -translate-y-full animate-in fade-in zoom-in duration-200"
          style={{ left: toolbarPosition.x, top: toolbarPosition.y }}
        >
          <div className="flex items-center gap-1 pr-2 border-r border-gray-700 mr-2">
            {(['yellow', 'green', 'pink'] as const).map((color) => (
              <button
                key={color}
                onClick={() => {
                  setSelectedColor(color);
                  handleHighlight(color);
                }}
                className={`w-6 h-6 rounded-full flex items-center justify-center transition-transform hover:scale-110 ${
                  color === 'yellow'
                    ? 'bg-yellow-400'
                    : color === 'green'
                      ? 'bg-green-400'
                      : 'bg-pink-400'
                } ${selectedColor === color ? 'ring-2 ring-white' : ''}`}
              >
                {selectedColor === color && (
                  <Check className="w-3 h-3 text-black/50" />
                )}
              </button>
            ))}
          </div>

          <button
            onClick={() => handleHighlight()}
            className="p-2 hover:bg-gray-700 rounded-lg transition-colors flex flex-col items-center gap-0.5 min-w-[3rem]"
            title="Highlight"
          >
            <Highlighter className="w-4 h-4" />
            <span className="text-[10px] font-medium">Highlight</span>
          </button>

          <button
            onClick={handleAddNote}
            className="p-2 hover:bg-gray-700 rounded-lg transition-colors flex flex-col items-center gap-0.5 min-w-[3rem]"
            title="Add Note"
          >
            <StickyNote className="w-4 h-4" />
            <span className="text-[10px] font-medium">Note</span>
          </button>
        </div>
      )}

      {/* Inline Note Input */}
      {inlineNote && (
        <div className="inline-note-input">
          <InlineNoteInput
            value={inlineNote.text}
            onChange={(text) => setInlineNote({ ...inlineNote, text })}
            onSave={saveInlineNote}
            onCancel={() => setInlineNote(null)}
            position={inlineNote.position}
          />
        </div>
      )}

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
