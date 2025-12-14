import { useState, useEffect, useRef, useCallback } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Toast as toast } from '../utils/toast';
import { flashcardService } from '../services/flashcard.service';
import type { FlashcardGenerateRequest } from '../types';
import type { AppEvent, FlashcardCompletedEvent } from '../types/events';
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
import { useFlashcardSets } from '../hooks';
import { CardSkeleton, StatCardSkeleton } from '../components/skeletons';
import { ProgressToast } from '../components/ProgressToast';
import { useQueryClient } from '@tanstack/react-query';
import { useSSEEvent } from '../hooks/useSSE';

export const FlashcardsPage = () => {
  const queryClient = useQueryClient();
  const location = useLocation();
  const navigate = useNavigate();
  const [showGenerator, setShowGenerator] = useState(false);
  const { data: flashcardSets = [], isLoading } = useFlashcardSets();
  const [loading, setLoading] = useState(false);
  const [deleteSetId, setDeleteSetId] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [initialValues, setInitialValues] = useState<
    | {
        topic?: string;
        content?: string;
        mode?: 'topic' | 'content' | 'files';
        contentId?: string;
        studyPackId?: string;
      }
    | undefined
  >(undefined);

  // Use refs to avoid race conditions with SSE events
  const currentJobIdRef = useRef<string | null>(null);
  const toastIdRef = useRef<string | null>(null);

  useEffect(() => {
    if (location.state) {
      const { topic, contentText, contentId, openGenerator } =
        location.state as {
          topic?: string;
          contentText?: string;
          contentId?: string;
          openGenerator?: boolean; // Added flag
          studyPackId?: string;
        };

      if (topic || contentText || openGenerator) {
        setInitialValues({
          topic,
          content: contentText,
          mode: contentText ? 'content' : 'topic',
          contentId,
          studyPackId: (location.state as any).studyPackId,
        });
        setShowGenerator(true);
      }
    }
  }, [location.state]);

  const handleProgress = useCallback((event: AppEvent) => {
    // Progress is now handled automatically by the toast component
    if (event.eventType === 'flashcard.progress' && currentJobIdRef.current) {
      // Toast updates disabled to allow auto-progress
    }
  }, []);

  const handleCompleted = useCallback(
    async (event: AppEvent) => {
      if (
        event.eventType === 'flashcard.completed' &&
        currentJobIdRef.current &&
        toastIdRef.current
      ) {
        // TypeScript automatically narrows event to FlashcardCompletedEvent here
        const completedEvent = event as FlashcardCompletedEvent;

        // Verify that this completion event matches our current job
        if (completedEvent.jobId !== currentJobIdRef.current) {
          return;
        }

        await queryClient.invalidateQueries({ queryKey: ['flashcardSets'] });

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
            />
          ),
          { id: toastIdRef.current, duration: 2000 }
        );

        setTimeout(() => {
          navigate(`/flashcards/${completedEvent.flashcardSetId}`);
        }, 500);

        setLoading(false);
        currentJobIdRef.current = null;
        toastIdRef.current = null;
      }
    },
    [queryClient, initialValues, navigate]
  );

  const handleFailed = useCallback((event: AppEvent) => {
    if (
      event.eventType === 'flashcard.failed' &&
      currentJobIdRef.current &&
      toastIdRef.current
    ) {
      const failedEvent = event as any;
      if (failedEvent.jobId === currentJobIdRef.current) {
        toast.custom(
          (t) => (
            <ProgressToast
              t={t}
              title="Creation Failed"
              message={failedEvent.error}
              progress={0}
              status="error"
            />
          ),
          { id: toastIdRef.current, duration: 5000 }
        );

        setLoading(false);
        currentJobIdRef.current = null;
        toastIdRef.current = null;
      }
    }
  }, []);

  useSSEEvent('flashcard.progress', handleProgress);
  useSSEEvent('flashcard.completed', handleCompleted);
  useSSEEvent('flashcard.failed', handleFailed);

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
        />
      ),
      { duration: Infinity }
    );

    toastIdRef.current = toastId;

    try {
      const { jobId } = await flashcardService.generate(request, files);
      currentJobIdRef.current = jobId;
    } catch (_error) {
      toast.custom(
        (t) => (
          <ProgressToast
            t={t}
            title="Unable to Create Flashcards"
            message="Something went wrong"
            progress={0}
            status="error"
          />
        ),
        { id: toastId, duration: 5000 }
      );
      setLoading(false);
      currentJobIdRef.current = null;
      toastIdRef.current = null;
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
    (sum, set) => sum + (Array.isArray(set.cards) ? set.cards.length : 0),
    0
  );
  const studiedSets = flashcardSets.filter((set) => set.lastStudiedAt).length;

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
          View All Flashcard Attempts
        </button>
      )}

      {showGenerator && (
        <div className="relative animate-in fade-in slide-in-from-top-4 duration-300">
          <button
            onClick={() => setShowGenerator(false)}
            className="absolute top-4 right-4 p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors z-10"
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
