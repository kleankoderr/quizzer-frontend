import { useState, useEffect, useRef, useMemo } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Toast as toast } from '../utils/toast';
import { flashcardService } from '../services';
import type { FlashcardGenerateRequest } from '../types';
import {
  CreditCard,
  Plus,
  Sparkles,
  Layers,
  BookOpen,
  X,
  History,
} from 'lucide-react';
import { FlashcardGenerator } from '../components/FlashcardGenerator';
import { FlashcardSetList } from '../components/FlashcardSetList';
import { DeleteModal } from '../components/DeleteModal';
import { useFlashcardSets, useJobEvents, useInvalidateQuota } from '../hooks';
import { useQueryClient } from '@tanstack/react-query';
import { CardSkeleton, StatCardSkeleton } from '../components/skeletons';
import { ProgressToast } from '../components/ProgressToast';
import { useAutoTour } from '../hooks/useAutoTour';

export const FlashcardsPage = () => {
  // Trigger flashcard tour
  useAutoTour('flashcard-generator');
  const queryClient = useQueryClient();
  const invalidateQuota = useInvalidateQuota();
  const location = useLocation();
  const navigate = useNavigate();
  const [showGenerator, setShowGenerator] = useState(false);
  const {
    data: setsData,
    isLoading,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
  } = useFlashcardSets();
  const flashcardSets = useMemo(
    () => setsData?.pages.flatMap((page) => page.data) ?? [],
    [setsData]
  );
  const [loading, setLoading] = useState(false);
  const [deleteSetId, setDeleteSetId] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [initialValues, setInitialValues] = useState<
    | {
        topic?: string;
        content?: string;
        mode?: 'topic' | 'content' | 'files';
        sourceTitle?: string;
        contentId?: string;
        studyPackId?: string;
      }
    | undefined
  >(undefined);

  // Job polling state
  const [currentJobId, setCurrentJobId] = useState<string | undefined>(
    undefined
  );
  const toastIdRef = useRef<string | undefined>(undefined);

  useEffect(() => {
    if (location.state) {
      const {
        topic,
        contentText,
        sourceTitle,
        contentId,
        openGenerator,
        studyPackId,
      } = location.state as {
        topic?: string;
        contentText?: string;
        sourceTitle?: string;
        contentId?: string;
        openGenerator?: boolean;
        studyPackId?: string;
      };

      if (topic || contentText || openGenerator) {
        setInitialValues({
          topic,
          content: contentText,
          mode: contentText ? 'content' : 'topic',
          sourceTitle,
          contentId,
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

  useEffect(() => {
    const mainContent = document.getElementById('main-content-area');
    if (!mainContent) return;

    let lastScrollTime = 0;
    const throttleDelay = 200;

    const handleScroll = () => {
      const now = Date.now();
      if (now - lastScrollTime < throttleDelay) return;
      lastScrollTime = now;

      const { scrollTop, scrollHeight, clientHeight } = mainContent;
      if (
        scrollHeight - scrollTop <= clientHeight + 500 &&
        hasNextPage &&
        !isFetchingNextPage
      ) {
        fetchNextPage();
      }
    };

    mainContent.addEventListener('scroll', handleScroll);
    return () => mainContent.removeEventListener('scroll', handleScroll);
  }, [hasNextPage, isFetchingNextPage, fetchNextPage]);

  // Poll for job status with exponential backoff
  useJobEvents({
    jobId: currentJobId,
    type: 'flashcard',
    onCompleted: async (result: any) => {
      await queryClient.invalidateQueries({ queryKey: ['flashcardSets'] });
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
            title="Flashcards Ready!"
            message="Opening your flashcards..."
            progress={100}
            status="success"
            onClose={() => setLoading(false)}
          />
        ),
        { id: toastIdRef.current, duration: 2000 }
      );

      setTimeout(() => {
        navigate(`/flashcards/${result.id}`);
      }, 500);

      setLoading(false);
      setCurrentJobId(undefined);
      toastIdRef.current = undefined;
    },
    onFailed: (error: string) => {
      toast.custom(
        (t) => (
          <ProgressToast
            t={t}
            title="Creation Failed"
            message={error}
            progress={0}
            status="error"
            onClose={() => setLoading(false)}
          />
        ),
        { id: toastIdRef.current, duration: 5000 }
      );

      setLoading(false);
      setCurrentJobId(undefined);
      toastIdRef.current = undefined;
    },
    enabled: !!currentJobId,
  });

  const handleGenerate = async (
    request: FlashcardGenerateRequest,
    files?: File[]
  ) => {
    setLoading(true);
    setShowGenerator(false);

    const toastId = toast.custom(
      (t) => (
        <ProgressToast
          t={t}
          title="Creating Flashcards"
          message="Preparing your study materials..."
          progress={0}
          status="processing"
          autoProgress={true}
          onClose={() => setLoading(false)}
        />
      ),
      { duration: Infinity }
    );

    toastIdRef.current = toastId;

    try {
      const response = await flashcardService.generate(request, files);
      
      // Handle immediate completion (e.g. cached result)
      if (response.status === 'completed' || response.cached) {
        await queryClient.invalidateQueries({ queryKey: ['flashcardSets'] });
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
              title="Flashcards Ready!"
              message="Opening your flashcards... (loaded from cache)"
              progress={100}
              status="success"
              onClose={() => setLoading(false)}
            />
          ),
          { id: toastIdRef.current, duration: 2000 }
        );

        setTimeout(() => {
          navigate(`/flashcards/${response.recordId || response.jobId}`);
        }, 500);

        setLoading(false);
        setCurrentJobId(undefined);
        toastIdRef.current = undefined;
        return;
      }

      setCurrentJobId(response.jobId);
    } catch (error: any) {
      let errorMessage =
        error?.response?.data?.message || 'Failed to create flashcards';

      if (error?.response?.data?.exception) {
        errorMessage = error.response.data.exception;
      }

      toast.custom(
        (t) => (
          <ProgressToast
            t={t}
            title="Unable to Create Flashcards"
            message={errorMessage}
            progress={0}
            status="error"
            onClose={() => setLoading(false)}
          />
        ),
        { id: toastId, duration: 5000 }
      );
      setLoading(false);
      setCurrentJobId(undefined);
      toastIdRef.current = undefined;
    }
  };

  const handleDelete = (id: string) => {
    setDeleteSetId(id);
  };

  const confirmDeleteSet = async () => {
    if (!deleteSetId) return;

    setIsDeleting(true);
    const loadingToast = toast.loading('Deleting flashcard set...');
    try {
      await flashcardService.delete(deleteSetId);

      // Refresh the flashcard list
      await queryClient.invalidateQueries({ queryKey: ['flashcardSets'] });

      toast.success('Flashcard set deleted successfully!', {
        id: loadingToast,
      });
      setDeleteSetId(null);
    } catch (_error) {
      toast.error('Failed to delete flashcard set. Please try again.', {
        id: loadingToast,
      });
    } finally {
      setIsDeleting(false);
    }
  };

  // Calculate stats
  const totalSets = flashcardSets.length;
  const totalCards = flashcardSets.reduce(
    (sum, set) => sum + (set.cardCount || 0),
    0
  );
  const studiedSets = flashcardSets.filter((set) => set.lastStudiedAt).length;

  return (
    <div className="space-y-6 pb-8 px-4 sm:px-0">
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
              Smart Learning Cards
            </span>
          </div>
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <h1 className="text-3xl md:text-4xl font-bold text-white mb-2 flex items-center gap-3">
                <CreditCard className="w-10 h-10" />
                Flashcard Generator
              </h1>
              <p className="text-primary-100 text-lg">
                Transform any content into effective study flashcards
              </p>
            </div>
            {!showGenerator && (
              <button
                onClick={() => setShowGenerator(true)}
                className="group flex items-center gap-2 px-6 py-3 bg-white/10 hover:bg-white/20 text-white rounded-xl transition-all hover:scale-105 font-semibold shadow-lg backdrop-blur-sm border border-white/20"
              >
                <Plus className="w-5 h-5" />
                New Set
              </button>
            )}
          </div>
        </div>
      </header>

      {/* Stats Overview */}
      {!showGenerator && (isLoading || totalSets > 0) && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {isLoading ? (
            <StatCardSkeleton count={3} />
          ) : (
            <>
              <div className="card p-4 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 hover:border-primary-300 dark:hover:border-primary-700 hover:shadow-md transition-all">
                <div className="flex items-center justify-between">
                  <div className="flex-shrink-0 p-3 rounded-lg bg-primary-100 dark:bg-primary-900/30">
                    <Layers className="w-6 h-6 text-primary-600 dark:text-primary-400" />
                  </div>
                  <div className="text-right">
                    <p className="text-2xl font-bold text-gray-900 dark:text-white">
                      {totalSets}
                    </p>
                    <p className="text-xs text-gray-600 dark:text-gray-400 mt-1 font-medium uppercase tracking-wide">
                      Total Sets
                    </p>
                  </div>
                </div>
              </div>
              <div className="card p-4 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 hover:border-primary-300 dark:hover:border-primary-700 hover:shadow-md transition-all">
                <div className="flex items-center justify-between">
                  <div className="flex-shrink-0 p-3 rounded-lg bg-blue-100 dark:bg-blue-900/30">
                    <CreditCard className="w-6 h-6 text-blue-600 dark:text-blue-400" />
                  </div>
                  <div className="text-right">
                    <p className="text-2xl font-bold text-gray-900 dark:text-white">
                      {totalCards}
                    </p>
                    <p className="text-xs text-gray-600 dark:text-gray-400 mt-1 font-medium uppercase tracking-wide">
                      Total Cards
                    </p>
                  </div>
                </div>
              </div>
              <div className="card p-4 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 hover:border-primary-300 dark:hover:border-primary-700 hover:shadow-md transition-all">
                <div className="flex items-center justify-between">
                  <div className="flex-shrink-0 p-3 rounded-lg bg-indigo-100 dark:bg-indigo-900/30">
                    <BookOpen className="w-6 h-6 text-indigo-600 dark:text-indigo-400" />
                  </div>
                  <div className="text-right">
                    <p className="text-2xl font-bold text-gray-900 dark:text-white">
                      {studiedSets}
                    </p>
                    <p className="text-xs text-gray-600 dark:text-gray-400 mt-1 font-medium uppercase tracking-wide">
                      Studied Sets
                    </p>
                  </div>
                </div>
              </div>
            </>
          )}
        </div>
      )}

      {/* View All Attempts Button */}
      {!showGenerator && (isLoading || totalSets > 0) && (
        <button
          onClick={() => navigate('/attempts?type=flashcard')}
          className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors text-gray-700 dark:text-gray-300 font-medium"
        >
          <History className="w-5 h-5" />
          View Your Practice History
        </button>
      )}

      {showGenerator && (
        <div className="relative animate-in fade-in slide-in-from-top-4 duration-300">
          <button
            onClick={() => {
              if (location.state?.cancelRoute) {
                navigate(location.state.cancelRoute);
              } else if (initialValues?.studyPackId) {
                navigate(
                  `/study-pack/${initialValues.studyPackId}?tab=flashcards`
                );
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
          <FlashcardGenerator
            onGenerate={handleGenerate}
            loading={loading}
            initialValues={initialValues}
          />
        </div>
      )}

      {!showGenerator &&
        (isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <CardSkeleton count={6} />
          </div>
        ) : (
          <FlashcardSetList
            sets={flashcardSets}
            onDelete={handleDelete}
            onCreateNew={() => setShowGenerator(true)}
            onItemMoved={(itemId, pack) => {
              queryClient.setQueryData(
                ['flashcardSets'],
                (old: any[] | undefined) => {
                  if (!old) return old;
                  return old.map((s) => {
                    if (s.id === itemId) {
                      return {
                        ...s,
                        studyPackId: pack?.id,
                        studyPack: pack
                          ? { id: pack.id, title: pack.title }
                          : undefined,
                      };
                    }
                    return s;
                  });
                }
              );
              queryClient.invalidateQueries({ queryKey: ['flashcardSets'] });
            }}
          />
        ))}

      {isFetchingNextPage && (
        <div className="flex justify-center p-4">
          <div className="w-6 h-6 border-2 border-primary-600 border-t-transparent rounded-full animate-spin" />
        </div>
      )}

      <DeleteModal
        isOpen={!!deleteSetId}
        onClose={() => setDeleteSetId(null)}
        onConfirm={confirmDeleteSet}
        title="Delete Flashcard Set"
        message="Are you sure you want to delete this flashcard set? This action cannot be undone."
        isDeleting={isDeleting}
      />
    </div>
  );
};
