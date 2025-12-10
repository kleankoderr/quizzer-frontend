import { useState, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { contentService } from '../services';
import { useContents, usePopularTopics } from '../hooks';
import type { AppEvent } from '../types/events';
import {
  Sparkles,
  FileText,
  Upload,
  Plus,
  BookOpen,
  Zap,
  Calendar,
  Trash2,
  X,
} from 'lucide-react';
import { format } from 'date-fns';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { Modal } from '../components/Modal';
import { CardSkeleton } from '../components/skeletons';
import { ProgressToast } from '../components/ProgressToast';
import { useSSEEvent } from '../hooks/useSSE';

export const StudyPage = () => {
  const navigate = useNavigate();

  // Content creation states
  const [showCreator, setShowCreator] = useState(false);
  const [activeTab, setActiveTab] = useState<'topic' | 'text' | 'file'>(
    'topic'
  );
  const [topic, setTopic] = useState('');
  const [textContent, setTextContent] = useState('');
  const [textTitle, setTextTitle] = useState('');
  const [textTopic, setTextTopic] = useState('');
  const [files, setFiles] = useState<File[]>([]);
  const [contentLoading, setContentLoading] = useState(false);

  // Use refs to avoid race conditions with SSE events
  const currentJobIdRef = useRef<string | null>(null);
  const toastIdRef = useRef<string | null>(null);

  // Delete state
  const [deleteContentId, setDeleteContentId] = useState<string | null>(null);

  // Use React Query hooks for data fetching
  const [page, setPage] = useState(1);
  const {
    data: contentsData,
    isLoading: isLoadingContents,
    refetch,
  } = useContents(undefined, page, 6);
  const { data: popularTopics = [] } = usePopularTopics();

  const contents = contentsData?.data ?? [];
  const totalPages = contentsData?.meta?.totalPages ?? 1;

  const handleProgress = useCallback((event: AppEvent) => {
    if (event.eventType === 'content.progress' && currentJobIdRef.current) {
      const progressEvent = event as any;
      console.log('Content progress event received:', {
        jobId: progressEvent.jobId,
        currentJobId: currentJobIdRef.current,
        percentage: progressEvent.percentage,
        step: progressEvent.step,
        toastId: toastIdRef.current,
      });

      if (
        progressEvent.jobId === currentJobIdRef.current &&
        toastIdRef.current
      ) {
        toast.custom(
          (t) => (
            <ProgressToast
              t={t}
              title="Generating Content"
              message={progressEvent.step || progressEvent.message}
              progress={progressEvent.percentage}
              status="processing"
            />
          ),
          { id: toastIdRef.current }
        );
      }
    }
  }, []);

  const handleCompleted = useCallback(
    async (event: AppEvent) => {
      if (
        event.eventType === 'content.completed' &&
        currentJobIdRef.current &&
        toastIdRef.current
      ) {
        const completedEvent = event as any;
        console.log('Content completed event received:', {
          event: completedEvent,
          contentId: completedEvent.contentId,
          resourceId: completedEvent.resourceId,
          currentJobId: currentJobIdRef.current,
          toastId: toastIdRef.current,
        });

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
          navigate(`/content/${completedEvent.contentId}`);
        }, 500);

        setContentLoading(false);
        currentJobIdRef.current = null;
        toastIdRef.current = null;
        refetch();
      }
    },
    [navigate, refetch]
  );

  const handleFailed = useCallback((event: AppEvent) => {
    if (
      event.eventType === 'content.failed' &&
      currentJobIdRef.current &&
      toastIdRef.current
    ) {
      const failedEvent = event as any;
      if (failedEvent.jobId === currentJobIdRef.current) {
        toast.custom(
          (t) => (
            <ProgressToast
              t={t}
              title="Generation Failed"
              message={failedEvent.error}
              progress={0}
              status="error"
            />
          ),
          { id: toastIdRef.current, duration: 5000 }
        );

        setContentLoading(false);
        currentJobIdRef.current = null;
        toastIdRef.current = null;
      }
    }
  }, []);

  useSSEEvent('content.progress', handleProgress);
  useSSEEvent('content.completed', handleCompleted);
  useSSEEvent('content.failed', handleFailed);

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
        />
      ),
      { duration: Infinity }
    );

    toastIdRef.current = toastId;

    try {
      const { jobId } = await contentService.generateFromTopic(topic);
      currentJobIdRef.current = jobId;
      console.log('Content job started:', { jobId, toastId });
    } catch (_error) {
      toast.custom(
        (t) => (
          <ProgressToast
            t={t}
            title="Unable to Generate Content"
            message="Something went wrong"
            progress={0}
            status="error"
          />
        ),
        { id: toastId, duration: 5000 }
      );
      setContentLoading(false);
      currentJobIdRef.current = null;
      toastIdRef.current = null;
    }
  }, [topic]);

  const handleCreateFromText = useCallback(async () => {
    if (!textTitle.trim() || !textContent.trim()) {
      toast.error('Please fill in all fields');
      return;
    }

    setContentLoading(true);
    const toastId = toast.custom(
      (t) => (
        <ProgressToast
          t={t}
          title="Creating Content"
          message="Processing your text..."
          progress={20}
          status="processing"
        />
      ),
      { duration: Infinity }
    );

    try {
      const content = await contentService.createFromText({
        title: textTitle,
        content: textContent,
        topic: textTopic || 'General',
      });

      toast.custom(
        (t) => (
          <ProgressToast
            t={t}
            title="Content Created"
            message="Redirecting..."
            progress={100}
            status="success"
          />
        ),
        { id: toastId }
      );

      navigate(`/content/${content.id}`);
    } catch (_error) {
      toast.custom(
        (t) => (
          <ProgressToast
            t={t}
            title="Creation Failed"
            message="Failed to create content"
            progress={0}
            status="error"
          />
        ),
        { id: toastId }
      );
    } finally {
      setContentLoading(false);
    }
  }, [textTitle, textContent, textTopic, navigate]);

  const handleFileUpload = useCallback(async () => {
    if (files.length === 0) {
      toast.error('Please select at least one file');
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
      const { jobId } = await contentService.createFromFile(files, (progress) => {
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
      });
      
      currentJobIdRef.current = jobId;
      console.log('Content job started from files:', { jobId, toastId, fileCount: files.length });
    } catch (error: any) {
      toast.custom(
        (t) => (
          <ProgressToast
            t={t}
            title="Upload Failed"
            message={error.message || 'Failed to process files'}
            progress={0}
            status="error"
          />
        ),
        { id: toastId, duration: 5000 }
      );
      setContentLoading(false);
      currentJobIdRef.current = null;
      toastIdRef.current = null;
    }
  }, [files]);

  const confirmDeleteContent = useCallback(async () => {
    if (!deleteContentId) return;

    const loadingToast = toast.loading('Deleting content...');
    try {
      await contentService.delete(deleteContentId);
      toast.success('Content deleted successfully!', { id: loadingToast });
      // Refetch the contents list to update the UI
      refetch();
    } catch (_error) {
      toast.error('Failed to delete content', { id: loadingToast });
    } finally {
      setDeleteContentId(null);
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
            onClick={() => setShowCreator(false)}
            className="absolute top-4 right-4 p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
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
                  <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">
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

                <div>
                  <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
                    Popular topics:
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {popularTopics.slice(0, 5).map((t) => (
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
                  <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                    Title
                  </label>
                  <input
                    type="text"
                    value={textTitle}
                    onChange={(e) => setTextTitle(e.target.value)}
                    placeholder="Enter content title"
                    className="w-full px-4 py-3 border-2 border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-all"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
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
                  <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                    Content
                  </label>
                  <textarea
                    value={textContent}
                    onChange={(e) => setTextContent(e.target.value)}
                    placeholder="Paste your study material here..."
                    className="w-full px-4 py-3 border-2 border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-primary-500 resize-none transition-all h-40 md:h-64"
                  />
                </div>

                <button
                  onClick={handleCreateFromText}
                  disabled={
                    contentLoading || !textTitle.trim() || !textContent.trim()
                  }
                  className="w-full px-8 py-4 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-300 disabled:text-gray-500 text-white font-bold rounded-xl transition-all flex items-center justify-center gap-3 shadow-lg hover:shadow-xl disabled:shadow-none text-lg"
                >
                  {contentLoading ? (
                    <>
                      <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-white"></div>
                      Creating Content...
                    </>
                  ) : (
                    <>
                      <Plus className="w-6 h-6" />
                      Create Study Content
                    </>
                  )}
                </button>
              </div>
            )}

            {activeTab === 'file' && (
              <div className="space-y-6">
                <div className="bg-gradient-to-br from-green-50 to-blue-50 dark:from-gray-800 dark:to-gray-800 p-4 md:p-6 rounded-xl border border-green-200 dark:border-gray-700">
                  <div className="flex items-start gap-3 mb-4">
                    <Upload className="w-6 h-6 text-green-600 mt-1" />
                    <div>
                      <h3 className="font-semibold text-gray-900 dark:text-white mb-1">
                        Upload Documents
                      </h3>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        Upload up to 5 PDF files. The system will extract and organize
                        the content into study materials.
                      </p>
                    </div>
                  </div>
                </div>

                <label
                  htmlFor="file-upload"
                  className={`block border-3 border-dashed rounded-xl p-6 md:p-12 text-center transition-all cursor-pointer ${
                    files.length > 0
                      ? 'border-primary-500 bg-gradient-to-br from-primary-50 to-blue-50 dark:from-primary-900/20 dark:to-blue-900/20'
                      : 'border-gray-300 dark:border-gray-600 hover:border-primary-400 dark:hover:border-primary-500 hover:bg-gray-50 dark:hover:bg-gray-700'
                  }`}
                >
                  <Upload
                    className={`w-16 h-16 mx-auto mb-4 ${files.length > 0 ? 'text-primary-600' : 'text-gray-400'}`}
                  />
                  <input
                    type="file"
                    id="file-upload"
                    accept=".pdf"
                    multiple
                    onChange={(e) => {
                      const selectedFiles = Array.from(e.target.files || []);
                      if (selectedFiles.length > 5) {
                        toast.error('Maximum 5 files allowed');
                        setFiles(selectedFiles.slice(0, 5));
                      } else {
                        setFiles(selectedFiles);
                      }
                    }}
                    className="hidden"
                  />
                  <span className="text-primary-600 dark:text-primary-400 hover:text-primary-700 dark:hover:text-primary-300 font-bold text-lg">
                    Click to upload
                  </span>
                  <span className="text-gray-600 dark:text-gray-300 text-lg">
                    {' '}
                    or drag and drop
                  </span>
                  <p className="text-sm text-gray-500 dark:text-gray-400 mt-3">
                    PDF files (max 5 files, 5MB each)
                  </p>
                </label>

                {files.length > 0 && (
                  <div className="space-y-2">
                    {files.map((file, index) => (
                      <div
                        key={index}
                        className="flex items-center justify-between p-3 bg-white dark:bg-gray-700 rounded-lg border-2 border-primary-300 dark:border-primary-600 shadow-sm"
                      >
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-semibold text-gray-900 dark:text-white truncate">
                            {file.name}
                          </p>
                          <p className="text-xs text-gray-500 dark:text-gray-400">
                            {(file.size / (1024 * 1024)).toFixed(2)} MB
                          </p>
                        </div>
                        <button
                          onClick={() => {
                            setFiles(files.filter((_, i) => i !== index));
                          }}
                          className="ml-2 p-1 text-gray-400 hover:text-red-500 dark:hover:text-red-400 transition-colors"
                          type="button"
                        >
                          <X className="w-5 h-5" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}

                <button
                  onClick={handleFileUpload}
                  disabled={contentLoading || files.length === 0}
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
                      Upload & Process {files.length > 0 ? `${files.length} File${files.length > 1 ? 's' : ''}` : 'Files'}
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
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {contents.map((content) => (
                  <div
                    key={content.id}
                    className="bg-white dark:bg-gray-800 p-4 md:p-6 rounded-xl shadow-md hover:shadow-xl transition-all border border-gray-100 dark:border-gray-700 group relative"
                  >
                    <div
                      className="cursor-pointer"
                      onClick={() => navigate(`/content/${content.id}`)}
                    >
                      <div className="flex items-start justify-between mb-4">
                        <div className="p-3 bg-primary-50 dark:bg-primary-900/30 text-primary-600 dark:text-primary-400 rounded-lg group-hover:bg-primary-600 group-hover:text-white transition-colors">
                          <BookOpen className="w-6 h-6" />
                        </div>
                        <span className="text-xs font-medium text-gray-500 dark:text-gray-400 bg-gray-100 dark:bg-gray-700 px-2 py-1 rounded-full">
                          {content.topic}
                        </span>
                      </div>
                      <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-2 line-clamp-2 group-hover:text-primary-600 dark:group-hover:text-primary-400 transition-colors">
                        {content.title}
                      </h3>
                      <div className="text-gray-600 dark:text-gray-400 text-sm line-clamp-3 mb-4 prose prose-sm dark:prose-invert max-h-[4.5em] overflow-hidden">
                        <ReactMarkdown remarkPlugins={[remarkGfm]}>
                          {content.content}
                        </ReactMarkdown>
                      </div>
                      <div className="flex items-center text-sm text-gray-500 dark:text-gray-400 gap-1">
                        <Calendar className="w-3 h-3" />
                        <span>
                          {format(
                            new Date(content.createdAt),
                            'MMM d, yyyy · h:mm a'
                          )}
                        </span>
                      </div>
                    </div>

                    {/* Delete Button - Moved to bottom right to avoid overlap */}
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setDeleteContentId(content.id);
                      }}
                      className="absolute bottom-4 right-4 p-2 text-gray-400 hover:text-red-500 dark:text-gray-500 dark:hover:text-red-400 transition-colors opacity-0 group-hover:opacity-100 z-10 bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm rounded-lg"
                      title="Delete content"
                    >
                      <Trash2 className="w-5 h-5" />
                    </button>
                  </div>
                ))}
              </div>

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
            <div className="text-center py-12 bg-gray-50 dark:bg-gray-800 rounded-xl border-2 border-dashed border-gray-200 dark:border-gray-700">
              <div className="flex flex-col items-center">
                <BookOpen className="w-12 h-12 text-gray-400 dark:text-gray-500 mb-3" />
                <p className="text-gray-600 dark:text-gray-400 font-medium mb-1">
                  No study materials yet
                </p>
                <p className="text-sm text-gray-500 dark:text-gray-500 mb-4">
                  Create your first content to get started
                </p>
                <button
                  onClick={() => setShowCreator(true)}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors font-medium text-sm"
                >
                  Create Study Material
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Delete Confirmation Modal */}
      <Modal
        isOpen={!!deleteContentId}
        onClose={() => setDeleteContentId(null)}
        title="Delete Study Material"
        footer={
          <>
            <button
              onClick={() => setDeleteContentId(null)}
              className="px-4 py-2 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={confirmDeleteContent}
              className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
            >
              Delete
            </button>
          </>
        }
      >
        <p>
          Are you sure you want to delete this study material? This action
          cannot be undone.
        </p>
      </Modal>
    </div>
  );
};
