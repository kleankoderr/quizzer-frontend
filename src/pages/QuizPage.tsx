import { useState, useEffect, useRef, useCallback } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { quizService } from '../services/quiz.service';
import type { QuizGenerateRequest } from '../types';
import type { AppEvent } from '../types/events';
import {
  Brain,
  Plus,
  Sparkles,
  Target,
  CheckCircle,
  X,
  History,
} from 'lucide-react';
import { QuizGenerator } from '../components/QuizGenerator';
import { QuizList } from '../components/QuizList';
import { Modal } from '../components/Modal';
import { CardSkeleton, StatCardSkeleton } from '../components/skeletons';
import { ProgressToast } from '../components/ProgressToast';
import { useQuizzes } from '../hooks';
import { useQueryClient } from '@tanstack/react-query';
import { useSSEEvent } from '../hooks/useSSE';

export const QuizPage = () => {
  const queryClient = useQueryClient();
  const location = useLocation();
  const navigate = useNavigate();
  const [showGenerator, setShowGenerator] = useState(false);
  const { data: quizzes = [], isLoading: loading } = useQuizzes();
  const [generating, setGenerating] = useState(false);
  const [initialValues, setInitialValues] = useState<
    | {
        topic?: string;
        content?: string;
        mode?: 'topic' | 'content' | 'files';
        sourceId?: string;
        sourceTitle?: string;
        contentId?: string;
        breadcrumb?: any[];
      }
    | undefined
  >(undefined);
  const [deleteQuizId, setDeleteQuizId] = useState<string | null>(null);

  // Use refs to avoid race conditions with SSE events
  const currentJobIdRef = useRef<string | null>(null);
  const toastIdRef = useRef<string | null>(null);

  useEffect(() => {
    if (location.state) {
      const { topic, contentText, sourceId, sourceTitle, contentId } =
        location.state as {
          topic?: string;
          contentText?: string;
          sourceId?: string;
          sourceTitle?: string;
          contentId?: string;
          breadcrumb?: any[];
        };

      if (topic || contentText) {
        setInitialValues({
          topic,
          content: contentText,
          mode: contentText ? 'content' : 'topic',
          sourceId,
          sourceTitle,
          contentId,
          breadcrumb: (location.state as any).breadcrumb,
        });
        setShowGenerator(true);
      }
    }
  }, [location.state]);

  const handleProgress = useCallback((event: AppEvent) => {
    if (event.eventType === 'quiz.progress' && currentJobIdRef.current) {
      const progressEvent = event as any;
      if (
        progressEvent.jobId === currentJobIdRef.current &&
        toastIdRef.current
      ) {
        toast.custom(
          (t) => (
            <ProgressToast
              t={t}
              title="Generating Quiz"
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
        event.eventType === 'quiz.completed' &&
        currentJobIdRef.current &&
        toastIdRef.current
      ) {
        const completedEvent = event as any;

        await queryClient.invalidateQueries({ queryKey: ['quizzes'] });

        if (initialValues?.contentId) {
          await queryClient.invalidateQueries({
            queryKey: ['content', initialValues.contentId],
          });
        }

        toast.custom(
          (t) => (
            <ProgressToast
              t={t}
              title="Quiz Ready!"
              message="Opening your quiz..."
              progress={100}
              status="success"
            />
          ),
          { id: toastIdRef.current, duration: 2000 }
        );

        setTimeout(() => {
          navigate(`/quiz/${completedEvent.quizId}`, {
            state: {
              breadcrumb: initialValues?.breadcrumb
                ? [
                    ...initialValues.breadcrumb,
                    { label: 'Quiz', path: `/quiz/${completedEvent.quizId}` },
                  ]
                : undefined,
            },
          });
        }, 500);

        setGenerating(false);
        currentJobIdRef.current = null;
        toastIdRef.current = null;
      }
    },
    [queryClient, initialValues, navigate]
  );

  const handleFailed = useCallback((event: AppEvent) => {
    if (
      event.eventType === 'quiz.failed' &&
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

        setGenerating(false);
        currentJobIdRef.current = null;
        toastIdRef.current = null;
      }
    }
  }, []);

  useSSEEvent('quiz.progress', handleProgress);
  useSSEEvent('quiz.completed', handleCompleted);
  useSSEEvent('quiz.failed', handleFailed);

  const handleGenerate = async (
    request: QuizGenerateRequest,
    files?: File[]
  ) => {
    setGenerating(true);
    setShowGenerator(false);

    const toastId = toast.custom(
      (t) => (
        <ProgressToast
          t={t}
          title="Generating Quiz"
          message="Preparing your quiz..."
          progress={0}
          status="processing"
        />
      ),
      { duration: Infinity }
    );

    toastIdRef.current = toastId;

    try {
      const { jobId } = await quizService.generate(request, files);
      currentJobIdRef.current = jobId;
    } catch (_error) {
      toast.custom(
        (t) => (
          <ProgressToast
            t={t}
            title="Unable to Generate Quiz"
            message="Something went wrong"
            progress={0}
            status="error"
          />
        ),
        { id: toastId, duration: 5000 }
      );
      setGenerating(false);
      currentJobIdRef.current = null;
      toastIdRef.current = null;
    }
  };

  const handleDelete = (id: string) => {
    setDeleteQuizId(id);
  };

  const confirmDeleteQuiz = async () => {
    if (!deleteQuizId) return;

    const loadingToast = toast.loading('Deleting quiz...');
    try {
      await quizService.delete(deleteQuizId);

      // Refresh the quiz list
      await queryClient.invalidateQueries({ queryKey: ['quizzes'] });

      toast.success('Quiz deleted successfully!', { id: loadingToast });
    } catch (_error) {
      toast.error('Failed to delete quiz. Please try again.', {
        id: loadingToast,
      });
    } finally {
      setDeleteQuizId(null);
    }
  };

  // Calculate stats
  const totalQuizzes = quizzes.length;
  const totalQuestions = quizzes.reduce(
    (sum, quiz) => sum + quiz.questions.length,
    0
  );
  const completedQuizzes = quizzes.filter(
    (quiz) => quiz.attempts && quiz.attempts.length > 0
  ).length;

  return (
    <div className="space-y-6 pb-8">
      {/* Hero Header */}
      <header className="relative overflow-hidden rounded-xl bg-gradient-to-br from-blue-600 via-indigo-600 to-purple-700 dark:from-blue-900 dark:via-indigo-900 dark:to-purple-900 p-6 md:p-8 shadow-lg">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute -top-10 -right-10 w-40 h-40 bg-white rounded-full"></div>
          <div className="absolute -bottom-10 -left-10 w-40 h-40 bg-white rounded-full"></div>
        </div>
        <div className="relative z-10">
          <div className="flex items-center gap-2 mb-2">
            <Sparkles className="w-6 h-6 text-yellow-300" />
            <span className="text-yellow-300 font-semibold text-sm">
              Smart Learning
            </span>
          </div>
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <h1 className="text-3xl md:text-4xl font-bold text-white mb-2 flex items-center gap-3">
                <Brain className="w-10 h-10" />
                Quiz Generator
              </h1>
              <p className="text-blue-100 dark:text-blue-200 text-lg">
                Create intelligent quizzes from any topic, content, or file
              </p>
            </div>
            {!showGenerator && (
              <button
                onClick={() => setShowGenerator(true)}
                className="group flex items-center gap-2 px-6 py-3 bg-white dark:bg-gray-800 text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-gray-700 rounded-xl transition-all hover:scale-105 font-semibold shadow-lg"
              >
                <Plus className="w-5 h-5" />
                New Quiz
              </button>
            )}
          </div>
        </div>
      </header>

      {/* Stats Overview */}
      {!showGenerator && (loading || totalQuizzes > 0) && (
        <>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {loading ? (
              <StatCardSkeleton count={3} />
            ) : (
              <>
                <div className="card p-4 bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 border-blue-200 dark:border-blue-800">
                  <div className="flex items-center justify-between">
                    <div className="flex-shrink-0 p-3 rounded-lg bg-gradient-to-br from-blue-500 to-indigo-500">
                      <Brain className="w-6 h-6 text-white" />
                    </div>
                    <div className="text-right">
                      <p className="text-2xl font-bold text-gray-900 dark:text-white">
                        {totalQuizzes}
                      </p>
                      <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">
                        Total Quizzes
                      </p>
                    </div>
                  </div>
                </div>
                <div className="card p-4 bg-gradient-to-br from-purple-50 to-pink-50 dark:from-purple-900/20 dark:to-pink-900/20 border-purple-200 dark:border-purple-800">
                  <div className="flex items-center justify-between">
                    <div className="flex-shrink-0 p-3 rounded-lg bg-gradient-to-br from-purple-500 to-pink-500">
                      <Target className="w-6 h-6 text-white" />
                    </div>
                    <div className="text-right">
                      <p className="text-2xl font-bold text-gray-900 dark:text-white">
                        {totalQuestions}
                      </p>
                      <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">
                        Questions Created
                      </p>
                    </div>
                  </div>
                </div>
                <div className="card p-4 bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 border-green-200 dark:border-green-800">
                  <div className="flex items-center justify-between">
                    <div className="flex-shrink-0 p-3 rounded-lg bg-gradient-to-br from-green-500 to-emerald-500">
                      <CheckCircle className="w-6 h-6 text-white" />
                    </div>
                    <div className="text-right">
                      <p className="text-2xl font-bold text-gray-900 dark:text-white">
                        {completedQuizzes}
                      </p>
                      <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">
                        Completed
                      </p>
                    </div>
                  </div>
                </div>
              </>
            )}
          </div>

          {/* View All Attempts Button */}
          <button
            onClick={() => navigate('/attempts?type=quiz')}
            className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors text-gray-700 dark:text-gray-300 font-medium"
          >
            <History className="w-5 h-5" />
            View All Quiz Attempts
          </button>
        </>
      )}

      {showGenerator && (
        <div className="relative animate-in fade-in slide-in-from-top-4 duration-300">
          <button
            onClick={() => setShowGenerator(false)}
            className="absolute top-4 right-4 p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors z-10"
          >
            <X className="w-5 h-5" />
          </button>
          <QuizGenerator
            onGenerate={handleGenerate}
            loading={generating}
            initialValues={initialValues}
          />
        </div>
      )}

      {!showGenerator &&
        (loading && quizzes.length === 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <CardSkeleton count={6} />
          </div>
        ) : (
          <QuizList
            quizzes={quizzes}
            onDelete={handleDelete}
            onCreateNew={() => setShowGenerator(true)}
          />
        ))}

      <Modal
        isOpen={!!deleteQuizId}
        onClose={() => setDeleteQuizId(null)}
        title="Delete Quiz"
        footer={
          <>
            <button
              onClick={() => setDeleteQuizId(null)}
              className="px-4 py-2 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={confirmDeleteQuiz}
              className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
            >
              Delete Quiz
            </button>
          </>
        }
      >
        <p>
          Are you sure you want to delete this quiz? This action cannot be
          undone.
        </p>
      </Modal>
    </div>
  );
};
