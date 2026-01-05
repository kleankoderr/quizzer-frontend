import { useState, useEffect, useRef } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Toast as toast } from '../utils/toast';
import { quizService } from '../services/quiz.service';
import type { QuizGenerateRequest } from '../types';
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
import { DeleteModal } from '../components/DeleteModal';
import { CardSkeleton, StatCardSkeleton } from '../components/skeletons';
import { ProgressToast } from '../components/ProgressToast';
import { useQueryClient } from '@tanstack/react-query';
import { useInvalidateQuota, useQuizzes, useJobEvents, useTour } from '../hooks';
import { quizTour, quizGeneratorTour } from '../tours';

export const QuizPage = () => {
  const queryClient = useQueryClient();
  const invalidateQuota = useInvalidateQuota();
  const location = useLocation();
  const navigate = useNavigate();
  const { startIfNotCompleted } = useTour();
  const [showGenerator, setShowGenerator] = useState(false);

  useEffect(() => {
    startIfNotCompleted('quiz-onboarding', quizTour);
  }, [startIfNotCompleted]);

  useEffect(() => {
    if (showGenerator) {
      startIfNotCompleted('quiz-generator-onboarding', quizGeneratorTour);
    }
  }, [showGenerator, startIfNotCompleted]);
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
        studyPackId?: string;
      }
    | undefined
  >(undefined);
  const [deleteQuizId, setDeleteQuizId] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Job polling state
  const [currentJobId, setCurrentJobId] = useState<string | undefined>(undefined);
  const toastIdRef = useRef<string | undefined>(undefined);

  useEffect(() => {
    if (location.state) {
      const {
        topic,
        contentText,
        sourceId,
        sourceTitle,
        contentId,
        openGenerator,
        studyPackId,
      } = location.state as {
        topic?: string;
        contentText?: string;
        sourceId?: string;
        sourceTitle?: string;
        contentId?: string;
        breadcrumb?: any[];
        openGenerator?: boolean;
        studyPackId?: string;
      };

      if (topic || contentText || openGenerator) {
        // Check flag
        setInitialValues({
          topic,
          content: contentText,
          mode: contentText ? 'content' : 'topic',
          sourceId,
          sourceTitle,
          contentId,
          breadcrumb: location.state.breadcrumb,
          studyPackId,
        });
        setShowGenerator(true);
      }
    }

    // Cleanup function to reset state when leaving the page
    return () => {
      setInitialValues(undefined);
      setShowGenerator(false);
    };
  }, [location.state]);

  useJobEvents({
    jobId: currentJobId,
    type: 'quiz',
    onCompleted: async (result: any) => {
      await queryClient.invalidateQueries({ queryKey: ['quizzes'] });
      await invalidateQuota();

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
        navigate(`/quiz/${result.id}`, {
          state: {
            breadcrumb: initialValues?.breadcrumb
              ? [
                  ...initialValues.breadcrumb.slice(0, -1),
                  { label: result.title || 'Quiz', path: null },
                ]
              : undefined,
          },
        });
      }, 500);

      setGenerating(false);
      setCurrentJobId(undefined);
      toastIdRef.current = undefined;
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

      setGenerating(false);
      setCurrentJobId(undefined);
      toastIdRef.current = undefined;
    },
    enabled: !!currentJobId,
  });

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
          autoProgress={true}
        />
      ),
      { duration: Infinity }
    );

    toastIdRef.current = toastId;

    try {
      const { jobId } = await quizService.generate(request, files);
      setCurrentJobId(jobId);
    } catch (error: any) {
      let errorMessage = error?.response?.data?.message || 'Failed to generate quiz';
      
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
            title="Unable to Generate Quiz"
            message={errorMessage}
            progress={0}
            status="error"
          />
        ),
        { id: toastId, duration: 5000 }
      );
      setGenerating(false);
      setCurrentJobId(undefined);
      toastIdRef.current = undefined;
    }
  };

  const handleDelete = (id: string) => {
    setDeleteQuizId(id);
  };

  const confirmDeleteQuiz = async () => {
    if (!deleteQuizId) return;

    setIsDeleting(true);
    const loadingToast = toast.loading('Deleting quiz...');
    try {
      await quizService.delete(deleteQuizId);

      // Refresh the quiz list
      await queryClient.invalidateQueries({ queryKey: ['quizzes'] });

      toast.success('Quiz deleted successfully!', { id: loadingToast });
      setDeleteQuizId(null);
    } catch (_error) {
      toast.error('Failed to delete quiz. Please try again.', {
        id: loadingToast,
      });
    } finally {
      setIsDeleting(false);
    }
  };

  // Calculate stats
  const totalQuizzes = quizzes.length;
  const totalQuestions = quizzes.reduce(
    (sum, quiz) => sum + (quiz.questionCount || 0),
    0
  );
  const completedQuizzes = quizzes.filter(
    (quiz) => quiz.attemptCount && quiz.attemptCount > 0
  ).length;

  return (
    <div className="space-y-6 pb-8">
      {/* Hero Header */}
      <header className="relative overflow-hidden rounded-xl bg-primary-600 dark:bg-primary-700 p-6 md:p-8 shadow-lg">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute -top-10 -right-10 w-40 h-40 bg-white rounded-full"></div>
          <div className="absolute -bottom-10 -left-10 w-40 h-40 bg-white rounded-full"></div>
        </div>
        <div className="relative z-10">
          <div className="flex items-center gap-2 mb-2">
            <Sparkles className="w-6 h-6 text-primary-200" />
            <span className="text-primary-100 font-semibold text-sm">
              Smart Learning
            </span>
          </div>
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <h1 className="text-3xl md:text-4xl font-bold text-white mb-2 flex items-center gap-3">
                <Brain className="w-10 h-10" />
                Quiz Generator
              </h1>
              <p className="text-primary-100 text-lg">
                Create intelligent quizzes from any topic, content, or file
              </p>
            </div>
            {!showGenerator && (
              <button
                id="new-quiz-btn"
                onClick={() => setShowGenerator(true)}
                className="group flex items-center gap-2 px-6 py-3 bg-white dark:bg-gray-800 text-primary-600 dark:text-primary-400 hover:bg-primary-50 dark:hover:bg-gray-700 rounded-xl transition-all hover:scale-105 font-semibold shadow-lg"
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
                <div className="card p-4 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 hover:border-primary-300 dark:hover:border-primary-700 hover:shadow-md transition-all">
                  <div className="flex items-center justify-between">
                    <div className="flex-shrink-0 p-3 rounded-lg bg-primary-100 dark:bg-primary-900/30">
                      <Brain className="w-6 h-6 text-primary-600 dark:text-primary-400" />
                    </div>
                    <div className="text-right">
                      <p className="text-2xl font-bold text-gray-900 dark:text-white">
                        {totalQuizzes}
                      </p>
                      <p className="text-xs text-gray-600 dark:text-gray-400 mt-1 font-medium uppercase tracking-wide">
                        Total Quizzes
                      </p>
                    </div>
                  </div>
                </div>
                <div className="card p-4 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 hover:border-primary-300 dark:hover:border-primary-700 hover:shadow-md transition-all">
                  <div className="flex items-center justify-between">
                    <div className="flex-shrink-0 p-3 rounded-lg bg-indigo-100 dark:bg-indigo-900/30">
                      <Target className="w-6 h-6 text-indigo-600 dark:text-indigo-400" />
                    </div>
                    <div className="text-right">
                      <p className="text-2xl font-bold text-gray-900 dark:text-white">
                        {totalQuestions}
                      </p>
                      <p className="text-xs text-gray-600 dark:text-gray-400 mt-1 font-medium uppercase tracking-wide">
                        Questions Created
                      </p>
                    </div>
                  </div>
                </div>
                <div className="card p-4 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 hover:border-primary-300 dark:hover:border-primary-700 hover:shadow-md transition-all">
                  <div className="flex items-center justify-between">
                    <div className="flex-shrink-0 p-3 rounded-lg bg-green-100 dark:bg-green-900/30">
                      <CheckCircle className="w-6 h-6 text-green-600 dark:text-green-400" />
                    </div>
                    <div className="text-right">
                      <p className="text-2xl font-bold text-gray-900 dark:text-white">
                        {completedQuizzes}
                      </p>
                      <p className="text-xs text-gray-600 dark:text-gray-400 mt-1 font-medium uppercase tracking-wide">
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
            id="practice-history-btn"
            onClick={() => navigate('/attempts?type=quiz')}
            className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors text-gray-700 dark:text-gray-300 font-medium"
          >
            <History className="w-5 h-5" />
            View Your Practice History
          </button>
        </>
      )}

      {showGenerator && (
        <div className="relative animate-in fade-in slide-in-from-top-4 duration-300">
          <button
            onClick={() => {
              if (location.state?.cancelRoute) {
                navigate(location.state.cancelRoute);
              } else if (initialValues?.studyPackId) {
                navigate(`/study-pack/${initialValues.studyPackId}?tab=quizzes`);
              } else {
                setShowGenerator(false);
                setInitialValues(undefined);
              }
            }}
            className="absolute top-3 right-3 sm:top-4 sm:right-4 p-2 bg-white/90 dark:bg-gray-800/90 text-gray-500 hover:text-gray-700 dark:hover:text-gray-200 rounded-xl transition-all z-20 shadow-sm border border-gray-100 dark:border-gray-700"
            aria-label="Close generator"
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
            onItemMoved={(itemId, pack) => {
              queryClient.setQueryData(
                ['quizzes'],
                (old: any[] | undefined) => {
                  if (!old) return old;
                  return old.map((q) => {
                    if (q.id === itemId) {
                      return {
                        ...q,
                        studyPackId: pack?.id,
                        studyPack: pack
                          ? { id: pack.id, title: pack.title }
                          : undefined,
                      };
                    }
                    return q;
                  });
                }
              );
              queryClient.invalidateQueries({ queryKey: ['quizzes'] });
            }}
          />
        ))}

      <DeleteModal
        isOpen={!!deleteQuizId}
        onClose={() => setDeleteQuizId(null)}
        onConfirm={confirmDeleteQuiz}
        title="Delete Quiz"
        message="Are you sure you want to delete this quiz? This action cannot be undone."
        isDeleting={isDeleting}
      />
    </div>
  );
};
