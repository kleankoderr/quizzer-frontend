import { useState, useEffect, useRef, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { BookOpen, Highlighter, Brain, ArrowLeft, Loader2, StickyNote, Trash2, Calendar, Check, Edit3, Save, X, MoreVertical } from 'lucide-react';
import { Link } from 'react-router-dom';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import rehypeRaw from 'rehype-raw';
import rehypeSanitize, { defaultSchema } from 'rehype-sanitize';
import remarkMath from 'remark-math';
import rehypeKatex from 'rehype-katex';
import { format } from 'date-fns';

import { contentService, type Content } from '../services/content.service';
import toast from 'react-hot-toast';
import { analytics } from '../services/analytics.service';
import { Modal } from '../components/Modal';
import { InlineNoteInput } from '../components/InlineNoteInput';
import { LearningGuide } from '../components/LearningGuide';

import './ContentPage.css';
import { useContent } from '../hooks';
import { useQueryClient } from '@tanstack/react-query';

interface Highlight {
  id: string;
  text: string;
  note?: string;
  color: 'yellow' | 'green' | 'pink';
  createdAt: string;
}

interface ExtendedContent extends Content {
  highlights?: Highlight[];
}

const HIGHLIGHT_COLORS = {
  yellow: 'bg-yellow-200 dark:bg-yellow-900/50',
  green: 'bg-green-200 dark:bg-green-900/50',
  pink: 'bg-pink-200 dark:bg-pink-900/50'
};

const HIGHLIGHT_BORDER_COLORS = {
  yellow: 'border-yellow-400 dark:border-yellow-700',
  green: 'border-green-400 dark:border-green-700',
  pink: 'border-pink-400 dark:border-pink-700'
};

// Markdown Content Component with Scroll Tracking
const MarkdownContent = ({ 
  processedContent, 
  initialProgress, 
  onProgressUpdate 
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
      const scrollHeight = document.documentElement.scrollHeight - window.innerHeight;
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
        const scrollHeight = document.documentElement.scrollHeight - window.innerHeight;
        if (scrollHeight <= 0) return;
        
        const progress = Math.min(100, Math.max(0, (scrollTop / scrollHeight) * 100));
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
          [rehypeSanitize, {
            ...defaultSchema,
            tagNames: [...(defaultSchema.tagNames || []), 'mark', 'span', 'div', 'math', 'semantics', 'mrow', 'mi', 'mo', 'mn', 'msup', 'msub', 'mfrac', 'msqrt', 'mroot', 'mtable', 'mtr', 'mtd'],
            attributes: {
              ...defaultSchema.attributes,
              mark: [['className'], ['data-highlight-id']],
              span: [['className'], ['title'], ['style']],
              div: [['className']],
              math: [['xmlns'], ['display']],
            }
          }]
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
  const { data: contentData, isLoading: loading, error, refetch } = useContent(id);
  const content = contentData as ExtendedContent | undefined;
  const [selectedText, setSelectedText] = useState('');
  const [toolbarPosition, setToolbarPosition] = useState<{ x: number; y: number } | null>(null);
  const contentRef = useRef<HTMLDivElement>(null);
  const [showNotes, setShowNotes] = useState(window.innerWidth >= 1280);
  const [selectedColor, setSelectedColor] = useState<'yellow' | 'green' | 'pink'>('yellow');
  const [isEditing, setIsEditing] = useState(false);
  const [editedContent, setEditedContent] = useState('');
  const [editedTitle, setEditedTitle] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Inline Note States
  const [inlineNote, setInlineNote] = useState<{ id?: string; text: string; position: { x: number; y: number } } | null>(null);
  
  // Modal states
  const [deleteHighlightId, setDeleteHighlightId] = useState<string | null>(null);
  const [isDeleteContentModalOpen, setIsDeleteContentModalOpen] = useState(false);
  const [selectedSectionIndex, setSelectedSectionIndex] = useState<number | undefined>(undefined);

  // Handle errors
  if (error) {
    toast.error('Failed to load content');
    navigate('/dashboard');
  }

  useEffect(() => {
    if (content) {
      // Default to 'text' if type is missing, or infer from content structure
      const contentType = (content as any).type || 'text'; 
      analytics.trackContentView(content.id, contentType, content.title);
    }
  }, [content]);

  useEffect(() => {
    const handleSelection = () => {
      const sel = window.getSelection();
      if (sel && sel.toString().trim().length > 0 && contentRef.current?.contains(sel.anchorNode)) {
        const range = sel.getRangeAt(0);
        const rect = range.getBoundingClientRect();
        setSelectedText(sel.toString().trim());
        
        // Detect section index
        const anchorNode = sel.anchorNode;
        const element = anchorNode instanceof Element ? anchorNode : anchorNode?.parentElement;
        const sectionNode = element?.closest('[data-section-index]');
        if (sectionNode) {
          const index = parseInt(sectionNode.getAttribute('data-section-index') || '0', 10);
          setSelectedSectionIndex(index);
        } else {
          setSelectedSectionIndex(undefined);
        }

        setToolbarPosition({
          x: rect.left + rect.width / 2,
          y: rect.top - 10 + window.scrollY
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
      if (!target.closest('.floating-toolbar') && !target.closest('.inline-note-input') && window.getSelection()?.toString().length === 0) {
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
        position: { x, y }
      });
      setSelectedText(''); // Clear selected text to indicate section note
      window.getSelection()?.removeAllRanges();
    };

    window.addEventListener('add-section-note', handleAddSectionNote);
    return () => window.removeEventListener('add-section-note', handleAddSectionNote);
  }, []);

  const handleHighlight = async (color: 'yellow' | 'green' | 'pink' = selectedColor) => {
    if (!selectedText || !id) return;
    
    try {
      await contentService.addHighlight(id, {
        text: selectedText,
        startOffset: 0, 
        endOffset: 0,   
        color: color,
        sectionIndex: selectedSectionIndex
      });
      toast.success('Text highlighted');
      refetch(); // Refresh to show new highlight
    } catch (_error) {

      toast.error('Failed to save highlight');
    } finally {
      setToolbarPosition(null);
      window.getSelection()?.removeAllRanges();
    }
  };



  const handleAddNote = () => {
    if (!selectedText || !id || !toolbarPosition) return;
    setInlineNote({
      text: '',
      position: toolbarPosition
    });
    setToolbarPosition(null);
  };

  const saveInlineNote = async () => {
    if (!inlineNote?.text || !id) return;

    try {
      let textToSave = selectedText;
      if (!textToSave && selectedSectionIndex !== undefined && content?.learningGuide) {
         textToSave = content.learningGuide.sections[selectedSectionIndex].title;
      }

      await contentService.addHighlight(id, {
        text: textToSave || 'Note',
        startOffset: 0,
        endOffset: 0,
        note: inlineNote.text,
        color: 'yellow',
        sectionIndex: selectedSectionIndex
      });
      toast.success('Note added');
      refetch();
    } catch (_error) {

      toast.error('Failed to add note');
    } finally {
      setInlineNote(null);
      window.getSelection()?.removeAllRanges();
    }
  };

  const handleDeleteHighlight = (highlightId: string) => {
    setDeleteHighlightId(highlightId);
  };

  const confirmDeleteHighlight = async () => {
    if (!deleteHighlightId) return;
    try {
      await contentService.deleteHighlight(deleteHighlightId);
      toast.success('Highlight removed');
      refetch();
    } catch (_error) {

      toast.error('Failed to delete highlight');
    } finally {
      setDeleteHighlightId(null);
    }
  };

  const handleGenerateQuiz = () => {
    if (!content) return;
    
    if (content.quizId) {
      navigate(`/quiz/${content.quizId}`);
      return;
    }

    const maxContentLength = 5000;
    const contentText = content.content.length > maxContentLength 
      ? content.content.substring(0, maxContentLength) + '...'
      : content.content;

    navigate('/quiz', { 
      state: { 
        topic: content.topic, 
        contentText: contentText,
        sourceId: content.id,
        sourceTitle: content.title,
        contentId: content.id,
        breadcrumb: [
          { label: 'Study', path: '/study' },
          { label: content.title, path: `/content/${content.id}` },
          { label: 'Generate Quiz' }
        ]
      } 
    });
  };

  const handleGenerateFlashcards = () => {
    if (!content) return;

    if (content.flashcardSetId) {
      navigate(`/flashcards/${content.flashcardSetId}`);
      return;
    }

    const maxContentLength = 5000;
    const contentText = content.content.length > maxContentLength 
      ? content.content.substring(0, maxContentLength) + '...'
      : content.content;

    navigate('/flashcards', { 
      state: { 
        topic: content.topic, 
        contentText: contentText,
        sourceId: content.id,
        sourceTitle: content.title,
        contentId: content.id,
        breadcrumb: [
          { label: 'Study', path: '/study' },
          { label: content.title, path: `/content/${content.id}` },
          { label: 'Generate Flashcards' }
        ]
      } 
    });
  };

  const handleEdit = () => {
    if (!content) return;
    setEditedTitle(content.title);
    setEditedContent(content.content);
    setIsEditing(true);
    setToolbarPosition(null);
  };

  const handleCancelEdit = () => {
    setIsEditing(false);
    setEditedTitle('');
    setEditedContent('');
  };

  const handleSave = async () => {
    if (!id || !content) return;
    
    setIsSaving(true);
    const loadingToast = toast.loading('Saving changes...');
    
    try {
      await contentService.update(id, {
        title: editedTitle,
        content: editedContent,
        topic: content.topic
      });
      
      toast.success('Content updated successfully!', { id: loadingToast });
      setIsEditing(false);
      refetch();
      // Invalidate contents list to reflect changes
      await queryClient.invalidateQueries({ queryKey: ['contents'] });
    } catch (_error) {

      toast.error('Failed to save changes', { id: loadingToast });
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = () => {
    setIsDeleteContentModalOpen(true);
  };

  const confirmDeleteContent = async () => {
    if (!id) return;
    
    const loadingToast = toast.loading('Deleting content...');
    try {
      await contentService.delete(id);
      toast.success('Content deleted successfully!', { id: loadingToast });
      // Invalidate contents list to remove deleted item
      await queryClient.invalidateQueries({ queryKey: ['contents'] });
      navigate('/study');
    } catch (_error) {

      toast.error('Failed to delete content', { id: loadingToast });
    } finally {
      setIsDeleteContentModalOpen(false);
    }
  };

  // Keyboard shortcuts - fixed dependencies
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!isEditing) return;
      
      if ((e.ctrlKey || e.metaKey) && e.key === 's') {
        e.preventDefault();
        handleSave();
      }
      
      if (e.key === 'Escape') {
        e.preventDefault();
        handleCancelEdit();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isEditing]); // Only isEditing needed - handlers use latest values via closure

  const renderNotesContent = () => (
    <>
      <div className="flex items-center justify-between mb-6">
        <h3 className="font-bold text-gray-900 dark:text-white flex items-center gap-2 text-lg">
          <StickyNote className="w-5 h-5 text-primary-600" />
          Notes & Highlights
        </h3>
        <span className="text-xs font-medium bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 px-2 py-1 rounded-full">
          {content?.highlights?.length || 0}
        </span>
      </div>

      <div className="space-y-4 flex-1">
        {content?.highlights && content.highlights.length > 0 ? (
          content.highlights.map((highlight) => (
            <div 
              key={highlight.id} 
              className={`p-4 rounded-xl border transition-all hover:shadow-md group relative ${
                HIGHLIGHT_BORDER_COLORS[highlight.color as keyof typeof HIGHLIGHT_BORDER_COLORS]
              } bg-white dark:bg-gray-800`}
            >
              <div className={`absolute left-0 top-0 bottom-0 w-1 rounded-l-xl ${
                highlight.color === 'yellow' ? 'bg-yellow-400' : 
                highlight.color === 'green' ? 'bg-green-400' : 'bg-pink-400'
              }`}></div>
              
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
                  <p className="text-sm text-gray-700 dark:text-gray-300 font-medium">{highlight.note}</p>
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
            <p className="text-xs mt-1 opacity-70">Select text to add highlights</p>
          </div>
        )}
      </div>
    </>
  );

  // Helper function to apply highlights to markdown content
  const applyHighlights = (markdown: string, highlights: Highlight[]) => {
    if (!highlights || highlights.length === 0) return markdown;

    let processed = markdown;
    const sortedHighlights = [...highlights].sort((a, b) => b.text.length - a.text.length);
    const replacements: Map<string, string> = new Map();

    sortedHighlights.forEach((highlight) => {
      const escapedText = highlight.text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      const regex = new RegExp(escapedText, 'g');
      
      const colorKey = highlight.color as keyof typeof HIGHLIGHT_COLORS;
      const colorClass = HIGHLIGHT_COLORS[colorKey] || 'bg-yellow-200 dark:bg-yellow-900/50';
      
      processed = processed.replace(regex, (match) => {
        const placeholder = `__HL_${replacements.size}__`;
        const noteIndicator = highlight.note 
          ? `<span class="note-indicator inline-flex items-center justify-center w-4 h-4 ml-1 text-[10px] font-bold text-white bg-blue-600 hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-600 rounded-full align-top cursor-pointer transition-colors" data-note-id="${highlight.id}" data-note-text="${highlight.note.replace(/"/g, '&quot;')}" title="Click to view note">!</span>` 
          : '';
        
        replacements.set(placeholder, `<mark class="${colorClass} rounded px-0.5" data-highlight-id="${highlight.id}">${match}${noteIndicator}</mark>`);
        return placeholder;
      });
    });

    replacements.forEach((replacement, placeholder) => {
      processed = processed.split(placeholder).join(replacement);
    });

    return processed;
  };

  const processedContent = useMemo(() => {
    if (!content?.content) return '';
    return applyHighlights(content.content, content.highlights || []);
  }, [content]);

  // Handle note indicator clicks
  const handleContentClick = (e: React.MouseEvent) => {
    const target = e.target as HTMLElement;
    if (target.classList.contains('note-indicator')) {
      const noteText = target.getAttribute('data-note-text');
      const noteId = target.getAttribute('data-note-id');
      if (noteText) {
        // Show note in a tooltip or modal
        const rect = target.getBoundingClientRect();
        setInlineNote({
          id: noteId || undefined,
          text: noteText,
          position: { x: rect.left + rect.width / 2, y: rect.top - 10 + window.scrollY }
        });
      }
    }
  };


  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-3 border-primary-600"></div>
      </div>
    );
  }

  if (!content) {
    return (
      <div className="text-center py-12">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Content not found</h2>
        <Link to="/dashboard" className="text-primary-600 dark:text-primary-400 hover:underline mt-4 inline-block">
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
            <Link to="/study" className="p-2 -ml-2 text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors">
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
              <h1 className="text-xl font-bold text-gray-900 dark:text-white truncate max-w-[200px] sm:max-w-md">{content.title}</h1>
            </div>
          </div>

          <div className="flex items-center gap-2">
             {!isEditing ? (
                <>
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
                      onClick={() => navigate(`/flashcards/${content.flashcardSetId}`)}
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
                      onClick={handleEdit}
                      className="p-2 text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                      title="Edit Content"
                    >
                      <Edit3 className="w-5 h-5" />
                    </button>
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
                        onClick={handleEdit}
                        className="w-full text-left px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 flex items-center gap-2"
                      >
                        <Edit3 className="w-4 h-4" /> Edit
                      </button>
                      <button 
                        onClick={() => setShowNotes(!showNotes)}
                        className="w-full text-left px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 flex items-center gap-2"
                      >
                        <StickyNote className="w-4 h-4" /> {showNotes ? 'Hide Notes' : 'Show Notes'}
                      </button>
                      <button 
                        onClick={handleDelete}
                        className="w-full text-left px-4 py-2 text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 flex items-center gap-2"
                      >
                        <Trash2 className="w-4 h-4" /> Delete
                      </button>
                    </div>
                  </div>
                </>
              ) : (
                <>
                  <button 
                    onClick={handleCancelEdit}
                    className="px-4 py-2 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors text-sm font-medium"
                    disabled={isSaving}
                  >
                    Cancel
                  </button>
                  <button 
                    onClick={handleSave}
                    className="flex items-center gap-2 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors shadow-sm text-sm font-medium"
                    disabled={isSaving}
                  >
                    {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                    Save Changes
                  </button>
                </>
              )}
          </div>
        </div>
      </div>

      <div className="flex gap-8 max-w-[1600px] mx-auto">
        {/* Main Content */}
        <div className="flex-1 min-w-0">
          <div ref={contentRef} onClick={handleContentClick} className="bg-white dark:bg-gray-800 sm:rounded-2xl sm:shadow-sm sm:border border-gray-200 dark:border-gray-700 p-0 sm:p-8 md:p-12 min-h-[500px]">
            {isEditing ? (
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Title</label>
                  <input
                    type="text"
                    value={editedTitle}
                    onChange={(e) => setEditedTitle(e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                    placeholder="Content title"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Content (Markdown)</label>
                  <textarea
                    ref={textareaRef}
                    value={editedContent}
                    onChange={(e) => setEditedContent(e.target.value)}
                    className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent font-mono text-sm min-h-[400px] resize-y"
                    placeholder="Write your content in markdown..."
                  />
                </div>
                <div className="bg-gray-50 dark:bg-gray-900 rounded-lg p-4 border border-gray-200 dark:border-gray-700">
                  <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">Preview</h4>
                  <div className="prose prose-sm max-w-none bg-white dark:bg-gray-800 rounded p-4 border border-gray-200 dark:border-gray-700">
                    <ReactMarkdown remarkPlugins={[remarkGfm, remarkMath]} rehypePlugins={[rehypeKatex]}>
                      {editedContent || '*No content to preview*'}
                    </ReactMarkdown>
                  </div>
                </div>
              </div>
            ) : content.learningGuide ? (
              <LearningGuide 
                key={content.id}
                guide={content.learningGuide} 
                title={content.title}
                highlights={content.highlights}
                onContentClick={handleContentClick}
                contentRef={contentRef}
                contentId={content.id}
                topic={content.topic}
                onGenerateQuiz={handleGenerateQuiz}
                onGenerateFlashcards={handleGenerateFlashcards}
                onToggleSectionComplete={async (index, isComplete) => {
                  if (!content?.learningGuide) return;
                  
                  const previousContent = queryClient.getQueryData(['content', id]);
                  
                  // Calculate new progress
                  const updatedGuide = JSON.parse(JSON.stringify(content.learningGuide));
                  if (updatedGuide.sections[index]) {
                    updatedGuide.sections[index].completed = isComplete;
                  }
                  
                  const totalSections = updatedGuide.sections.length;
                  const completedCount = updatedGuide.sections.filter((s: any) => s.completed).length;
                  const newProgress = Math.round((completedCount / totalSections) * 100);

                  // Optimistic update
                  queryClient.setQueryData(['content', id], (old: ExtendedContent | undefined) => {
                    if (!old || !old.learningGuide) return old;
                    return { 
                      ...old, 
                      learningGuide: updatedGuide,
                      lastReadPosition: newProgress 
                    };
                  });

                  try {
                    await contentService.update(content.id, {
                      learningGuide: updatedGuide,
                      lastReadPosition: newProgress
                    });
                  } catch (_error) {

                    // Revert
                    queryClient.setQueryData(['content', id], previousContent);
                    toast.error('Failed to save progress');
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
                      lastReadPosition: progress
                    });
                  } catch (_error) {

                  }
                }}
              />
            )}
          </div>
        </div>

        {/* Notes Sidebar / Drawer */}
        {showNotes && !isEditing && (
          <>
            {/* Desktop Sidebar */}
            <div className="w-80 flex-shrink-0 hidden xl:block">
              <div className="sticky top-24 bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-700 p-6 max-h-[calc(100vh-120px)] overflow-y-auto flex flex-col">
                {renderNotesContent()}
              </div>
            </div>

            {/* Mobile/Tablet Drawer */}
            <div className="fixed inset-0 z-[60] xl:hidden">
              <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setShowNotes(false)}></div>
              <div className="absolute right-0 top-0 bottom-0 w-full max-w-sm bg-white dark:bg-gray-800 shadow-xl p-6 overflow-y-auto flex flex-col animate-in slide-in-from-right duration-200">
                <div className="flex justify-end mb-2">
                  <button onClick={() => setShowNotes(false)} className="p-2 text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full">
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
      {!isEditing && toolbarPosition && (
        <div
          className="floating-toolbar fixed z-50 bg-gray-900 text-white rounded-xl shadow-2xl flex items-center p-1.5 transform -translate-x-1/2 -translate-y-full animate-in fade-in zoom-in duration-200"
          style={{ left: toolbarPosition.x, top: toolbarPosition.y }}
        >
          <div className="flex items-center gap-1 pr-2 border-r border-gray-700 mr-2">
            {(['yellow', 'green', 'pink'] as const).map((color) => (
              <button 
                key={color}
                onClick={() => { setSelectedColor(color); handleHighlight(color); }}
                className={`w-6 h-6 rounded-full flex items-center justify-center transition-transform hover:scale-110 ${
                  color === 'yellow' ? 'bg-yellow-400' : color === 'green' ? 'bg-green-400' : 'bg-pink-400'
                } ${selectedColor === color ? 'ring-2 ring-white' : ''}`}
              >
                {selectedColor === color && <Check className="w-3 h-3 text-black/50" />}
              </button>
            ))}
          </div>

          <button onClick={() => handleHighlight()} className="p-2 hover:bg-gray-700 rounded-lg transition-colors flex flex-col items-center gap-0.5 min-w-[3rem]" title="Highlight">
            <Highlighter className="w-4 h-4" />
            <span className="text-[10px] font-medium">Highlight</span>
          </button>
          
          <button onClick={handleAddNote} className="p-2 hover:bg-gray-700 rounded-lg transition-colors flex flex-col items-center gap-0.5 min-w-[3rem]" title="Add Note">
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
      <Modal
        isOpen={!!deleteHighlightId}
        onClose={() => setDeleteHighlightId(null)}
        title="Delete Highlight"
        footer={
          <>
            <button
              onClick={() => setDeleteHighlightId(null)}
              className="px-4 py-2 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={confirmDeleteHighlight}
              className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
            >
              Delete
            </button>
          </>
        }
      >
        <p>Are you sure you want to delete this highlight?</p>
      </Modal>

      <Modal
        isOpen={isDeleteContentModalOpen}
        onClose={() => setIsDeleteContentModalOpen(false)}
        title="Delete Content"
        footer={
          <>
            <button
              onClick={() => setIsDeleteContentModalOpen(false)}
              className="px-4 py-2 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={confirmDeleteContent}
              className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
            >
              Delete Content
            </button>
          </>
        }
      >
        <p>Are you sure you want to delete this content? This action cannot be undone.</p>
      </Modal>
    </div>
  );
};
