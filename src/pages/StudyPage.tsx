import { useState, useCallback, useRef, useMemo, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Toast as toast } from '../utils/toast';
import { contentService } from '../services';
import { useContents, usePopularTopics, useJobEvents } from '../hooks';
import { useQueryClient } from '@tanstack/react-query';
import {
  Plus,
  ChevronRight,
  BookOpen,
  Sparkles,
  Zap,
  FileText,
  Upload,
  X,
  ChevronDown,
  Folder,
  Trash2,
  Info,
} from 'lucide-react';

import { MoveToStudyPackModal } from '../components/MoveToStudyPackModal';
import { CollapsibleSection } from '../components/CollapsibleSection';
import { DeleteModal } from '../components/DeleteModal';
import { CardSkeleton } from '../components/skeletons';
import { ProgressToast } from '../components/ProgressToast';
import { FileSelector } from '../components/FileSelector';
import { FileUpload } from '../components/FileUpload';
import { Card } from '../components/Card';
import { StudyPackSelector } from '../components/StudyPackSelector';
import { CardMenu, Pencil } from '../components/CardMenu';
import { EditTitleModal } from '../components/EditTitleModal';
import { formatDate } from '../utils/dateFormat';

export const StudyPage = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const location = useLocation();

  // Use React Query hooks for data fetching (moved up for useMemo dependency)
  const [page, setPage] = useState(1);
  const {
    data: contentsData,
    isLoading: isLoadingContents,
    refetch,
  } = useContents(undefined, page, 6);
  const { data: popularTopics = [] } = usePopularTopics();

  const contents = useMemo(() => contentsData?.data ?? [], [contentsData]);
  const totalPages = contentsData?.meta?.totalPages ?? 1;

  // Content creation states
  const [showCreator, setShowCreator] = useState(
    location.state?.openCreator || false
  );
  const [activeTab, setActiveTab] = useState<'topic' | 'text' | 'file'>(
    location.state?.activeTab || 'topic'
  );
  const [topic, setTopic] = useState('');
  const [textContent, setTextContent] = useState('');
  const [textTitle, setTextTitle] = useState('');
  const [textTopic, setTextTopic] = useState('');
  const [files, setFiles] = useState<File[]>([]);
  const [selectedFileIds, setSelectedFileIds] = useState<string[]>([]);
  const [selectedStudyPackId, setSelectedStudyPackId] = useState<string>(
    location.state?.studyPackId || ''
  );

  const [contentLoading, setContentLoading] = useState(false);
  const [showUpload, setShowUpload] = useState(false);
  const [showExistingFiles, setShowExistingFiles] = useState(false);

  // Job polling state
  const [currentJobId, setCurrentJobId] = useState<string | undefined>(undefined);
  const toastIdRef = useRef<string | undefined>(undefined);

  // Delete state
  const [deleteContentId, setDeleteContentId] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [moveContentId, setMoveContentId] = useState<string | null>(null);
  const [editContentId, setEditContentId] = useState<string | null>(null);

  const editingContent = contents.find((c) => c.id === editContentId);

  // Handle location state for prefilling from recommendations
  useEffect(() => {
    if (location.state?.topic) {
      setTopic(location.state.topic);
      setActiveTab('topic');
    }
    if (location.state?.contentText) {
      setTextContent(location.state.contentText);
      setActiveTab('text');
    }
  }, [location.state]);

  const getSummary = (content: any) => {
    if (content.description) {
      return content.description;
    }
    if (content.generatedContent?.summary) {
      return content.generatedContent.summary;
    }
    return 'No description available';
  };

  // Group contents by study pack
  const groupedContents = useMemo(() => {
    const groups: Record<string, { id: string; title: string; contents: (typeof contents)[0][] }> = {};
    const noPack: (typeof contents)[0][] = [];

    for (const content of contents) {
      if (content.studyPack) {
        const packId = content.studyPack.id;
        if (!groups[packId]) {
          groups[packId] = {
            id: packId,
            title: content.studyPack.title,
            contents: [],
          };
        }
        groups[packId].contents.push(content);
      } else {
        noPack.push(content);
      }
    }

    return { groups, noPack };
  }, [contents]);

  const handleTitleUpdate = async (contentId: string, newTitle: string) => {
    try {
      await contentService.updateTitle(contentId, newTitle);
      
      // Optimistically update the cache
      queryClient.setQueryData(['contents'], (old: any) => {
        if (!old?.data) return old;
        return {
          ...old,
          data: old.data.map((c: any) =>
            c.id === contentId ? { ...c, title: newTitle } : c
          ),
        };
      });

      // Invalidate to refetch from server
      await queryClient.invalidateQueries({ queryKey: ['contents'] });
      
      toast.success('Content title updated successfully!');
    } catch (error) {
      toast.error('Failed to update content title');
      throw error;
    }
  };

  const renderContentCard = (content: any) => {
    const menuItems = [
      {
        label: 'Edit Title',
        icon: <Pencil className="w-4 h-4" />,
        onClick: () => setEditContentId(content.id),
      },
      {
        label: 'Move to Study Pack',
        icon: <Folder className="w-4 h-4" />,
        onClick: () => setMoveContentId(content.id),
      },
      {
        label: 'Delete',
        icon: <Trash2 className="w-4 h-4" />,
        onClick: () => setDeleteContentId(content.id),
        variant: 'danger' as const,
      },
    ];

    return (
      <Card
        key={content.id}
        title={content.title}
        subtitle={content.topic}
        onClick={() => navigate(`/content/${content.id}`, {
          state: {
            breadcrumb: [
              { label: 'Study', path: '/study' },
            ],
          },
        })}
        actions={<CardMenu items={menuItems} />}
      >
        <p className="text-sm text-gray-600 dark:text-gray-400 line-clamp-3 mb-4">
          {getSummary(content)}
        </p>
        <div className="flex items-center gap-3 text-xs text-gray-500 dark:text-gray-400">
          <div className="flex items-center gap-1">
            {formatDate(content.createdAt)}
          </div>
          {content.generatedContent && (
            <div className="flex items-center gap-1 text-green-600 dark:text-green-400">
              Generated
            </div>
          )}
        </div>
      </Card>
    );
  };

  // Poll for job status with exponential backoff
  useJobEvents({
    jobId: currentJobId,
    type: 'content',
    onCompleted: async (result: any) => {
      toast.custom(
        (t) => (
          <ProgressToast
            t={t}
            title="Content Ready!"
            message="Opening your study material..."
            progress={100}
            status="success"
          />
        ),
        { id: toastIdRef.current, duration: 2000 }
      );

      setTimeout(() => {
        navigate(`/content/${result.id}`, {
          state: {
            breadcrumb: [
              { label: 'Study', path: '/study' },
            ],
          },
        });
      }, 500);

      setContentLoading(false);
      setCurrentJobId(undefined);
      toastIdRef.current = undefined;
      refetch();
    },
    onFailed: (error: string) => {
      toast.custom(
        (t) => (
          <ProgressToast
            t={t}
            title="Generation Failed"
            message={error}
            progress={0}
            status="error"
          />
        ),
        { id: toastIdRef.current, duration: 5000 }
      );

      setContentLoading(false);
      setCurrentJobId(undefined);
      toastIdRef.current = undefined;
    },
    enabled: !!currentJobId,
  });

  const handleGenerateFromTopic = useCallback(async () => {
    if (!topic.trim()) {
      toast.error('Please enter a topic');
      return;
    }

    setContentLoading(true);

    const toastId = toast.custom(
      (t) => (
        <ProgressToast
          t={t}
          title="Generating Content"
          message="Preparing your study material..."
          progress={0}
          status="processing"
          autoProgress={true}
        />
      ),
      { duration: Infinity }
    );

    toastIdRef.current = toastId;

    try {
      const { jobId } = await contentService.generate({
        topic,
        studyPackId: selectedStudyPackId || undefined,
      });
      setCurrentJobId(jobId);
    } catch (error: any) {
      let errorMessage = error?.response?.data?.message || 'Failed to generate content';
      
      // Handle specific backend exception for quota limits
      if (error?.response?.status === 403 && error?.response?.data?.exception) {
        errorMessage = error.response.data.exception;
      } else if (error?.response?.data?.exception) {
        errorMessage = error.response.data.exception;
      }

      toast.custom(
        (t) => (
          <ProgressToast
            t={t}
            title="Unable to Generate Content"
            message={errorMessage}
            progress={0}
            status="error"
          />
        ),
        { id: toastId, duration: 5000 }
      );
      setContentLoading(false);
      setCurrentJobId(undefined);
      toastIdRef.current = undefined;
    }
  }, [topic, selectedStudyPackId]);

  const handleCreateFromText = useCallback(async () => {
    if (!textContent.trim()) {
      toast.error('Please enter some content');
      return;
    }

    setContentLoading(true);
    const toastId = toast.custom(
      (t) => (
        <ProgressToast
          t={t}
          title="Generating Content"
          message="Processing your text..."
          progress={0}
          status="processing"
          autoProgress={true}
        />
      ),
      { duration: Infinity }
    );

    toastIdRef.current = toastId;

    try {
      const { jobId } = await contentService.generate({
        content: textContent,
        title: textTitle || undefined,
        topic: textTopic || undefined,
        studyPackId: selectedStudyPackId || undefined,
      });
      setCurrentJobId(jobId);
    } catch (error: any) {
      let errorMessage = error?.response?.data?.message || 'Failed to generate content';
      
      // Handle specific backend exception for quota limits
      if (error?.response?.status === 403 && error?.response?.data?.exception) {
        errorMessage = error.response.data.exception;
      } else if (error?.response?.data?.exception) {
        errorMessage = error.response.data.exception;
      }

      toast.custom(
        (t) => (
          <ProgressToast
            t={t}
            title="Generation Failed"
            message={errorMessage}
            progress={0}
            status="error"
          />
        ),
        { id: toastId, duration: 5000 }
      );
      setContentLoading(false);
      setCurrentJobId(undefined);
      toastIdRef.current = undefined;
    }
  }, [textTitle, textContent, textTopic, selectedStudyPackId]);

  const handleFileUpload = useCallback(async () => {
    if (files.length === 0 && selectedFileIds.length === 0) {
      toast.error('Please select or upload at least one file');
      return;
    }

    setContentLoading(true);

    const toastId = toast.custom(
      (t) => (
        <ProgressToast
          t={t}
          title="Processing Files"
          message="Uploading and extracting text..."
          progress={0}
          status="processing"
        />
      ),
      { duration: Infinity }
    );

    toastIdRef.current = toastId;

    try {
      const { jobId } = await contentService.generate(
        {
          selectedFileIds,
          studyPackId: selectedStudyPackId || undefined,
        },
        files,
        (progress) => {
          // Show upload progress
          if (progress < 100) {
            toast.custom(
              (t) => (
                <ProgressToast
                  t={t}
                  title="Uploading Files"
                  message={`Uploading... ${progress}%`}
                  progress={progress}
                  status="processing"
                />
              ),
              { id: toastId }
            );
          }
        }
      );

      // Switch to auto-progress for content generation phase
      toast.custom(
        (t) => (
          <ProgressToast
            key="generation-phase"
            t={t}
            title="Generating Content"
            message="Processing uploaded files..."
            progress={0}
            status="processing"
            autoProgress={true}
          />
        ),
        { id: toastId }
      );

      setCurrentJobId(jobId);
    } catch (error: any) {
      let errorMessage = error?.response?.data?.message || 'Upload failed';
      
      // Handle specific backend exception for quota limits
      if (error?.response?.status === 403 && error?.response?.data?.exception) {
        errorMessage = error.response.data.exception;
      } else if (error?.response?.data?.exception) {
        errorMessage = error.response.data.exception;
      }

      toast.custom(
        (t) => (
          <ProgressToast
            t={t}
            title="Upload Failed"
            message={errorMessage}
            progress={0}
            status="error"
          />
        ),
        { id: toastId, duration: 5000 }
      );
      setContentLoading(false);
      setCurrentJobId(undefined);
      toastIdRef.current = undefined;
    }
  }, [files, selectedFileIds, selectedStudyPackId]);

  const confirmDeleteContent = useCallback(async () => {
    if (!deleteContentId) return;

    setIsDeleting(true);
    const loadingToast = toast.loading('Deleting content...');
    try {
      await contentService.delete(deleteContentId);
      toast.success('Content deleted successfully!', { id: loadingToast });
      // Refetch the contents list to update the UI
      refetch();
      setDeleteContentId(null);
    } catch (_error) {
      toast.error('Failed to delete content', { id: loadingToast });
    } finally {
      setIsDeleting(false);
    }
  }, [deleteContentId, refetch]);

  return (
    <div className="space-y-6 pb-8 px-4 sm:px-0">
      {/* Hero Header */}
      <header className="relative overflow-hidden rounded-xl bg-gradient-to-br from-primary-600 via-primary-700 to-blue-700 dark:from-primary-800 dark:via-primary-900 dark:to-blue-900 p-4 sm:p-6 md:p-10 shadow-xl">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute -top-20 -right-20 w-40 h-40 md:w-64 md:h-64 bg-white rounded-full blur-3xl"></div>
          <div className="absolute -bottom-20 -left-20 w-40 h-40 md:w-64 md:h-64 bg-white rounded-full blur-3xl"></div>
        </div>
        <div className="relative z-10">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6">
            <div>
              <div className="flex items-center gap-3 mb-3">
                <div className="p-2 bg-white/20 backdrop-blur-sm rounded-lg">
                  <BookOpen className="w-7 h-7 text-white" />
                </div>
                <span className="text-yellow-300 font-semibold text-lg">
                  Study Hub
                </span>
              </div>
              <h1 className="text-3xl md:text-5xl font-bold text-white mb-3">
                Study Materials
              </h1>
              <p className="text-primary-100 dark:text-primary-200 text-base md:text-xl max-w-2xl">
                Access your generated study content or create new materials
                automatically
              </p>
            </div>
            {!showCreator && (
              <button
                onClick={() => setShowCreator(true)}
                className="group flex items-center justify-center gap-2 px-6 py-3 bg-white dark:bg-gray-800 text-primary-600 dark:text-primary-400 hover:bg-primary-50 dark:hover:bg-gray-700 rounded-xl transition-all hover:scale-105 font-semibold shadow-lg whitespace-nowrap w-full md:w-auto"
              >
                <Plus className="w-5 h-5" />
                Create Study Material
              </button>
            )}
          </div>
        </div>
      </header>

      {/* Content Creation Card */}
      {showCreator && (
        <div className="card shadow-lg dark:bg-gray-800 animate-in fade-in slide-in-from-top-4 duration-300 relative">
          {/* Close Button */}
          <button
            onClick={() => {
              if (location.state?.cancelRoute) {
                navigate(location.state.cancelRoute);
              } else if (selectedStudyPackId) {
                navigate(`/study-pack/${selectedStudyPackId}?tab=materials`);
              } else {
                setShowCreator(false);
              }
            }}
            className="absolute top-3 right-3 sm:top-4 sm:right-4 p-2 bg-white/90 dark:bg-gray-800/90 text-gray-500 hover:text-gray-700 dark:hover:text-gray-200 rounded-xl transition-all z-20 shadow-sm border border-gray-100 dark:border-gray-700"
            aria-label="Close generator"
          >
            <X className="w-5 h-5" />
          </button>

          <div className="flex items-center gap-3 mb-6">
            <div className="p-3 bg-gradient-to-br from-primary-100 to-blue-100 rounded-xl">
              <Sparkles className="w-7 h-7 text-primary-600" />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                Generate Study Materials
              </h2>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Choose your preferred method to create content
              </p>
            </div>
          </div>

          {/* Tabs */}
          <div className="grid grid-cols-3 md:flex md:gap-2 mb-6 md:mb-8 border-b-0 md:border-b-2 border-gray-200 dark:border-gray-700">
            <button
              onClick={() => setActiveTab('topic')}
              className={`px-2 md:px-6 py-3 font-semibold transition-all rounded-lg md:rounded-none md:rounded-t-lg border-b-0 md:border-b-3 -mb-0 md:-mb-0.5 flex flex-col md:flex-row items-center justify-center gap-2 ${
                activeTab === 'topic'
                  ? 'bg-primary-50 dark:bg-primary-900/20 text-primary-600 dark:text-primary-400 md:border-primary-600 dark:md:border-primary-400'
                  : 'text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-700 md:border-transparent'
              }`}
            >
              <Sparkles className="w-5 h-5 md:w-5 md:h-5" />
              <span className="text-xs md:text-base">
                <span className="md:hidden">Topic</span>
                <span className="hidden md:inline">From Topic</span>
              </span>
            </button>
            <button
              onClick={() => setActiveTab('text')}
              className={`px-2 md:px-6 py-3 font-semibold transition-all rounded-lg md:rounded-none md:rounded-t-lg border-b-0 md:border-b-3 -mb-0 md:-mb-0.5 flex flex-col md:flex-row items-center justify-center gap-2 ${
                activeTab === 'text'
                  ? 'bg-primary-50 dark:bg-primary-900/20 text-primary-600 dark:text-primary-400 md:border-primary-600 dark:md:border-primary-400'
                  : 'text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-700 md:border-transparent'
              }`}
            >
              <FileText className="w-5 h-5 md:w-5 md:h-5" />
              <span className="text-xs md:text-base">
                <span className="md:hidden">Text</span>
                <span className="hidden md:inline">From Text</span>
              </span>
            </button>
            <button
              onClick={() => setActiveTab('file')}
              className={`px-2 md:px-6 py-3 font-semibold transition-all rounded-lg md:rounded-none md:rounded-t-lg border-b-0 md:border-b-3 -mb-0 md:-mb-0.5 flex flex-col md:flex-row items-center justify-center gap-2 ${
                activeTab === 'file'
                  ? 'bg-primary-50 dark:bg-primary-900/20 text-primary-600 dark:text-primary-400 md:border-primary-600 dark:md:border-primary-400'
                  : 'text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-700 md:border-transparent'
              }`}
            >
              <Upload className="w-5 h-5 md:w-5 md:h-5" />
              <span className="text-xs md:text-base">
                <span className="md:hidden">File</span>
                <span className="hidden md:inline">From File</span>
              </span>
            </button>
          </div>

          {/* Tab Content */}
          <div className="min-h-[400px]">
            {activeTab === 'topic' && (
              <div className="space-y-6">
                <div className="bg-gradient-to-br from-blue-50 to-primary-50 dark:from-gray-800 dark:to-gray-800 p-4 md:p-6 rounded-xl border border-primary-200 dark:border-gray-700">
                  <div className="flex items-start gap-3 mb-4">
                    <Zap className="w-6 h-6 text-primary-600 mt-1" />
                    <div>
                      <h3 className="font-semibold text-gray-900 dark:text-white mb-1">
                        Smart Generation
                      </h3>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        Enter any topic and the system will generate
                        comprehensive study materials including summaries, key
                        points, and practice questions.
                      </p>
                    </div>
                  </div>
                </div>

                <div>
                  <label
                    htmlFor={topic}
                    className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3"
                  >
                    What topic do you want to learn about?
                  </label>
                  <input
                    type="text"
                    value={topic}
                    onChange={(e) => setTopic(e.target.value)}
                    placeholder="e.g., Photosynthesis, World War II, Python Programming"
                    className="w-full px-5 py-4 border-2 border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-primary-500 text-lg transition-all"
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && !contentLoading) {
                        handleGenerateFromTopic();
                      }
                    }}
                  />
                </div>

                {popularTopics.length > 0 && (
                  <div>
                    <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
                      Popular topics:
                    </p>
                    <div className="flex flex-wrap gap-2">
                      {popularTopics.map((t) => (
                        <button
                          key={t}
                          onClick={() => setTopic(t)}
                          className="px-4 py-2 bg-white dark:bg-gray-700 border-2 border-gray-200 dark:border-gray-600 hover:border-primary-400 dark:hover:border-primary-500 hover:bg-primary-50 dark:hover:bg-primary-900/30 text-gray-700 dark:text-gray-200 hover:text-primary-700 dark:hover:text-primary-300 rounded-full text-sm font-medium transition-all shadow-sm hover:shadow"
                        >
                          {t}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                <StudyPackSelector
                  value={selectedStudyPackId}
                  onChange={setSelectedStudyPackId}
                  className="mb-6"
                />

                <button
                  onClick={handleGenerateFromTopic}
                  disabled={contentLoading || !topic.trim()}
                  className="w-full px-8 py-4 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-300 disabled:text-gray-500 text-white font-bold rounded-xl transition-all flex items-center justify-center gap-3 shadow-lg hover:shadow-xl disabled:shadow-none text-lg"
                >
                  {contentLoading ? (
                    <>
                      <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-white"></div>
                      Generating Content...
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-6 h-6" />
                      Generate Study Content
                    </>
                  )}
                </button>
              </div>
            )}

            {activeTab === 'text' && (
              <div className="space-y-6">
                <div className="bg-gradient-to-br from-purple-50 to-blue-50 dark:from-gray-800 dark:to-gray-800 p-4 md:p-6 rounded-xl border border-purple-200 dark:border-gray-700">
                  <div className="flex items-start gap-3 mb-4">
                    <FileText className="w-6 h-6 text-purple-600 mt-1" />
                    <div>
                      <h3 className="font-semibold text-gray-900 dark:text-white mb-1">
                        Create from Your Notes
                      </h3>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        Paste your study materials, lecture notes, or any text
                        content. We'll process it into structured learning
                        materials.
                      </p>
                    </div>
                  </div>
                </div>

                <div>
                  <label
                    htmlFor={textTitle}
                    className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2"
                  >
                    Title (Optional)
                  </label>
                  <input
                    type="text"
                    value={textTitle}
                    onChange={(e) => setTextTitle(e.target.value)}
                    placeholder="Enter content title (auto-generated if empty)"
                    className="w-full px-4 py-3 border-2 border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-all"
                  />
                </div>

                <div>
                  <label
                    htmlFor={textTopic}
                    className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2"
                  >
                    Topic (Optional)
                  </label>
                  <input
                    type="text"
                    value={textTopic}
                    onChange={(e) => setTextTopic(e.target.value)}
                    placeholder="e.g., Science, History"
                    className="w-full px-4 py-3 border-2 border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-all"
                  />
                </div>

                <div>
                  <label
                    htmlFor={textContent}
                    className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2"
                  >
                    Content
                  </label>
                  <textarea
                    value={textContent}
                    onChange={(e) => setTextContent(e.target.value)}
                    placeholder="Paste your study material here..."
                    className="w-full px-4 py-3 border-2 border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-primary-500 resize-none transition-all h-40 md:h-64"
                  />
                </div>

                <StudyPackSelector
                  value={selectedStudyPackId}
                  onChange={setSelectedStudyPackId}
                  className="mb-6"
                />

                <button
                  onClick={handleCreateFromText}
                  disabled={contentLoading || !textContent.trim()}
                  className="w-full px-8 py-4 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-300 disabled:text-gray-500 text-white font-bold rounded-xl transition-all flex items-center justify-center gap-3 shadow-lg hover:shadow-xl disabled:shadow-none text-lg"
                >
                  {contentLoading ? (
                    <>
                      <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-white"></div>
                      Generating Content...
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-6 h-6" />
                      Generate Study Content
                    </>
                  )}
                </button>
              </div>
            )}

            {activeTab === 'file' && (
              <div className="space-y-6">
                <div className="bg-blue-50/30 dark:bg-gray-800/30 p-4 rounded-xl border border-blue-100 dark:border-gray-700">
                  <div className="flex gap-4 items-start">
                    <div className="flex-shrink-0 p-2 bg-blue-100/50 dark:bg-blue-900/30 rounded-lg">
                      <Info className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <h3 className="text-base font-semibold text-gray-900 dark:text-white mb-1">
                        Upload or Select Documents
                      </h3>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        Upload new PDF files or select from your previously
                        uploaded files. The system will extract and organize the
                        content into study materials.
                      </p>
                    </div>
                  </div>
                </div>

                {/* Collapsible Existing Files Section */}
                <div className="border border-gray-200 dark:border-gray-700 rounded-xl overflow-hidden mb-6">
                  <button
                    type="button"
                    onClick={() => {
                      if (!showExistingFiles) setShowUpload(false);
                      setShowExistingFiles(!showExistingFiles);
                    }}
                    className="w-full flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-800 text-left hover:bg-gray-100 dark:hover:bg-gray-700/50 transition-colors"
                  >
                    <div className="flex items-center gap-2">
                      <Folder className="w-5 h-5 text-primary-600" />
                      <span className="font-semibold text-gray-900 dark:text-white">
                        Select Existing Files
                      </span>
                      {selectedFileIds.length > 0 && (
                        <span className="bg-primary-100 dark:bg-primary-900/30 text-primary-600 dark:text-primary-400 text-xs px-2 py-0.5 rounded-full font-bold">
                          {selectedFileIds.length}
                        </span>
                      )}
                    </div>
                    {showExistingFiles ? (
                      <ChevronDown className="w-5 h-5 text-gray-500" />
                    ) : (
                      <ChevronRight className="w-5 h-5 text-gray-500" />
                    )}
                  </button>

                  {showExistingFiles && (
                    <div className="p-4 bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700">
                      <FileSelector
                        selectedFileIds={selectedFileIds}
                        onSelectionChange={setSelectedFileIds}
                        maxFiles={5}
                        hideIfEmpty={false}
                      />
                    </div>
                  )}
                </div>

                {/* Collapsible Upload Section */}
                <div className="border border-gray-200 dark:border-gray-700 rounded-xl overflow-hidden mt-6">
                  <button
                    type="button"
                    onClick={() => {
                      if (!showUpload) setShowExistingFiles(false);
                      setShowUpload(!showUpload);
                    }}
                    className="w-full flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-800 text-left hover:bg-gray-100 dark:hover:bg-gray-700/50 transition-colors"
                  >
                    <div className="flex items-center gap-2">
                      <Upload className="w-5 h-5 text-primary-600" />
                      <span className="font-semibold text-gray-900 dark:text-white">
                        Upload New Files
                      </span>
                      {files.length > 0 && (
                        <span className="bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400 text-xs px-2 py-0.5 rounded-full font-bold">
                          {files.length}
                        </span>
                      )}
                    </div>
                    {showUpload ? (
                      <ChevronDown className="w-5 h-5 text-gray-500" />
                    ) : (
                      <ChevronRight className="w-5 h-5 text-gray-500" />
                    )}
                  </button>

                  {showUpload && (
                    <div className="p-4 bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700">
                      <FileUpload
                        files={files}
                        onFilesChange={setFiles}
                        maxFiles={5}
                      />
                    </div>
                  )}
                </div>

                <StudyPackSelector
                  value={selectedStudyPackId}
                  onChange={setSelectedStudyPackId}
                  className="mb-6"
                />

                <button
                  onClick={handleFileUpload}
                  disabled={
                    contentLoading ||
                    (files.length === 0 && selectedFileIds.length === 0)
                  }
                  className="w-full px-8 py-4 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-300 disabled:text-gray-500 text-white font-bold rounded-xl transition-all flex items-center justify-center gap-3 shadow-lg hover:shadow-xl disabled:shadow-none text-lg"
                >
                  {contentLoading ? (
                    <>
                      <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-white"></div>
                      Processing Files...
                    </>
                  ) : (
                    <>
                      <Upload className="w-6 h-6" />
                      Process{' '}
                      {files.length + selectedFileIds.length > 0
                        ? `${files.length + selectedFileIds.length} File${files.length + selectedFileIds.length > 1 ? 's' : ''}`
                        : 'Files'}
                    </>
                  )}
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Existing Contents Section */}
      {!showCreator && (
        <div className="mt-12">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">
            Your Study Materials
          </h2>

          {isLoadingContents ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              <CardSkeleton count={6} />
            </div>
          ) : contents.length > 0 ? (
            <>
              <>
                {Object.values(groupedContents.groups).map((pack) => (
                    <CollapsibleSection
                      key={pack.id}
                      title={pack.title}
                      count={pack.contents.length}
                      defaultOpen={false}
                      onTitleClick={() => navigate(`/study-pack/${pack.id}?tab=materials`)}
                      className="mb-8 last:mb-0"
                    >
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {pack.contents.map((content) =>
                          renderContentCard(content)
                        )}
                      </div>
                    </CollapsibleSection>
                  )
                )}

                {/* Uncategorized Contents */}
                {groupedContents.noPack.length > 0 && (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 pt-4 border-t border-gray-100 dark:border-gray-700/50">
                    {groupedContents.noPack.map((content) =>
                      renderContentCard(content)
                    )}
                  </div>
                )}
              </>

              {/* Move Modal */}
              <MoveToStudyPackModal
                isOpen={!!moveContentId}
                onClose={() => setMoveContentId(null)}
                itemId={moveContentId || ''}
                itemType="content"
                onMoveSuccess={(pack) => {
                  queryClient.setQueryData(
                    ['contents', undefined, page, 6],
                    (old: any) => {
                      if (!old || !old.data) return old;
                      return {
                        ...old,
                        data: old.data.map((c: any) => {
                          if (c.id === moveContentId) {
                            return {
                              ...c,
                              studyPackId: pack?.id,
                              studyPack: pack
                                ? { id: pack.id, title: pack.title }
                                : undefined,
                            };
                          }
                          return c;
                        }),
                      };
                    }
                  );
                  refetch();
                }}
              />

              <EditTitleModal
                isOpen={!!editContentId}
                currentTitle={editingContent?.title || ''}
                onClose={() => setEditContentId(null)}
                onSave={(newTitle) => handleTitleUpdate(editContentId || '', newTitle)}
              />

              <DeleteModal
                isOpen={!!deleteContentId}
                onClose={() => setDeleteContentId(null)}
                onConfirm={confirmDeleteContent}
                title="Delete Study Material"
                message="Are you sure you want to delete this study material? This action cannot be undone."
                isDeleting={isDeleting}
              />

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="flex flex-col sm:flex-row justify-center items-center mt-8 gap-2">
                  <button
                    onClick={() => setPage((p) => Math.max(1, p - 1))}
                    disabled={page === 1}
                    className="w-full sm:w-auto px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50 dark:hover:bg-gray-700 font-medium transition-colors"
                  >
                    Previous
                  </button>
                  <span className="px-4 py-2 font-medium text-gray-600 dark:text-gray-300 flex items-center text-center">
                    Page {page} of {totalPages}
                  </span>
                  <button
                    onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                    disabled={page === totalPages}
                    className="w-full sm:w-auto px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50 dark:hover:bg-gray-700 font-medium transition-colors"
                  >
                    Next
                  </button>
                </div>
              )}
            </>
          ) : (
            <div className="text-center py-16 bg-gray-50 dark:bg-gray-800 rounded-xl border-2 border-dashed border-gray-200 dark:border-gray-700">
              <div className="inline-flex items-center justify-center w-16 h-16 bg-primary-100 dark:bg-primary-900/30 rounded-full mb-4">
                <BookOpen className="w-8 h-8 text-primary-600 dark:text-primary-400" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
                No study materials yet
              </h3>
              <p className="text-gray-500 dark:text-gray-400 max-w-md mx-auto mb-6">
                Get started by generating content from a topic, your own text,
                or by uploading files.
              </p>
              <button
                onClick={() => setShowCreator(true)}
                className="inline-flex items-center gap-2 px-6 py-3 bg-primary-600 text-white font-medium rounded-lg hover:bg-primary-700 transition-colors shadow-sm"
              >
                <Plus className="w-5 h-5" />
                Create Content
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
