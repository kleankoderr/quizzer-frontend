import { useEffect, useMemo, useRef, useState } from 'react';
import type { Variants } from 'framer-motion';
import { AnimatePresence, motion } from 'framer-motion';

import { useLocation, useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { useQueryClient } from '@tanstack/react-query';
import { Toast as toast } from '../utils/toast';
import { eventsService, flashcardService } from '../services';
import { ArrowLeft, ChevronLeft, ChevronRight, Layers, Sparkles, Target, ThumbsDown, ThumbsUp } from 'lucide-react';
import { useFlashcardSet } from '../hooks';
import { ResultsHeroCard, type ResultsStat } from '../components/quiz/ResultsHeroCard';
import { useAuth } from '../contexts/AuthContext';
import { AttemptsAnalyticsView } from '../components/AttemptsAnalyticsView';
import type { FlashcardAttempt } from '../types';
import ReactMarkdown from 'react-markdown';
import remarkMath from 'remark-math';
import rehypeKatex from 'rehype-katex';
import remarkGfm from 'remark-gfm';

// Helper function to build breadcrumb items
const buildBreadcrumbItems = (
  flashcardSet: any,
  includeResults = false,
  includeHistory = false
) => {
  return [
    flashcardSet.studyPack
      ? {
          label: flashcardSet.studyPack.title,
          path: `/study-pack/${flashcardSet.studyPack.id}?tab=flashcards`,
        }
      : { label: 'Flashcards', path: '/flashcards' },
    {
      label: flashcardSet.title,
      path:
        includeResults || includeHistory
          ? `/flashcards/${flashcardSet.id}`
          : null,
    },
    ...(includeResults ? [{ label: 'Results', path: null }] : []),
    ...(includeHistory ? [{ label: 'Practice History', path: null }] : []),
  ];
};

const MarkdownParagraph = ({ _node, ...props }: any) => <div {...props} />;

const FlashcardMarkdown = ({
  content,
  className = '',
}: {
  content: string;
  className?: string;
}) => (
  <div
    className={`prose prose-lg dark:prose-invert max-w-none ${className} [&_p]:m-0 prose-code:before:content-none prose-code:after:content-none`}
  >
    <ReactMarkdown
      remarkPlugins={[remarkGfm, remarkMath]}
      rehypePlugins={[rehypeKatex]}
      components={{
        p: MarkdownParagraph,
      }}
    >
      {content}
    </ReactMarkdown>
  </div>
);

export const FlashcardStudyPage = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams] = useSearchParams();
  const viewHistory = searchParams.get('view') === 'history';
  const viewStudy = searchParams.get('view') === 'study';
  const attemptId = searchParams.get('attemptId');
  const { data: flashcardSet, isLoading: loading, error } = useFlashcardSet(id);
  const { user } = useAuth();
  const [currentCardIndex, setCurrentCardIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);
  const [direction, setDirection] = useState(0); // -1 for prev, 1 for next
  const [cardResponses, setCardResponses] = useState<
    Array<{ cardIndex: number; response: 'know' | 'dont-know' | 'skipped' }>
  >([]);
  const [showResults, setShowResults] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [attempts, setAttempts] = useState<FlashcardAttempt[]>([]);
  const [loadingAttempts, setLoadingAttempts] = useState(false);
  const [isStudying, setIsStudying] = useState<boolean | null>(null);
  const fetchedIdRef = useRef<string | null>(null);

  // Calculate stats (must be before any conditional returns)
  const knowCount = cardResponses.filter((r) => r.response === 'know').length;
  const dontKnowCount = cardResponses.filter(
    (r) => r.response === 'dont-know'
  ).length;
  const totalCards = flashcardSet?.cards?.length || 0;
  const percentage =
    totalCards > 0 ? Math.round((knowCount / totalCards) * 100) : 0;

  // Flashcard-specific stats for ResultsHeroCard (must be before any conditional returns)
  const flashcardStats: ResultsStat[] = useMemo(
    () => [
      {
        icon: ThumbsUp,
        label: 'Knew It',
        value: knowCount,
        color: 'text-green-200',
        valueColor: 'text-white',
      },
      {
        icon: ThumbsDown,
        label: "Didn't Know",
        value: dontKnowCount,
        color: 'text-red-200',
        valueColor: 'text-white',
      },
      {
        icon: Target,
        label: 'Total Cards',
        value: totalCards,
        color: 'text-blue-200',
        valueColor: 'text-white',
      },
    ],
    [knowCount, dontKnowCount, totalCards]
  );

  // Handle breadcrumbs
  useEffect(() => {
    if (!flashcardSet || !id || loading || location.state?.breadcrumb) return;
    const breadcrumbItems = buildBreadcrumbItems(
      flashcardSet,
      false,
      isStudying === false
    );
    // Preserve existing search params (like ?view=study) when updating breadcrumbs
    navigate(location.pathname + location.search, {
      replace: true,
      state: { breadcrumb: breadcrumbItems },
    });
  }, [
    flashcardSet,
    id,
    loading,
    location.pathname,
    location.search,
    location.state?.breadcrumb,
    navigate,
    isStudying,
  ]);

  // Initializing isStudying state
  useEffect(() => {
    if (!flashcardSet || isStudying !== null) return;

    const hasAttempts = (flashcardSet._count?.attempts || 0) > 0;

    if (viewHistory) {
      setIsStudying(false);
    } else if (viewStudy) {
      setIsStudying(true);
    } else if (hasAttempts) {
      setIsStudying(false);
    } else {
      setIsStudying(true);
    }
  }, [flashcardSet, isStudying, viewHistory, viewStudy]);

  // Sync isStudying with URL changes - this ensures URL is the source of truth
  useEffect(() => {
    if (viewHistory && isStudying !== false) {
      setIsStudying(false);
    } else if (viewStudy && isStudying !== true) {
      setIsStudying(true);
      // Also clear showResults when explicitly switching to study mode
      if (showResults) {
        setShowResults(false);
      }
    }
  }, [viewHistory, viewStudy, isStudying, showResults, location.search]);

  // Fetch attempts when history view is active
  useEffect(() => {
    const shouldFetch = isStudying === false || viewHistory;
    const isValidId = id && id !== 'undefined';

    if (
      shouldFetch &&
      isValidId &&
      !loadingAttempts &&
      fetchedIdRef.current !== id
    ) {
      const fetchAttempts = async () => {
        try {
          setLoadingAttempts(true);
          fetchedIdRef.current = id;
          const data = await flashcardService.getAttempts(id);
          setAttempts(data);
        } catch (err: any) {
          console.error('Failed to load attempt history:', err);
          toast.error('Failed to load attempt history');
        } finally {
          setLoadingAttempts(false);
        }
      };
      fetchAttempts();
    }
  }, [isStudying, viewHistory, id, loadingAttempts]);

  // Handle specific attempt review
  useEffect(() => {
    if (attemptId && attempts.length > 0 && isStudying === false) {
      const targetAttempt = attempts.find((a) => a.id === attemptId);
      if (targetAttempt) {
        setCardResponses((targetAttempt.answers as any) || []);
        setShowResults(true);
        // Note: isStudying is already false from the viewHistory logic
      }
    }
  }, [attemptId, attempts, isStudying]);

  const queryClient = useQueryClient();

  // Listen for progressive updates
  useEffect(() => {
    if (!id) return;

    eventsService.connect();

    const handleProgress = (event: any) => {
      // Check if this progress event is for our current flashcard set
      if (
        event.eventType === 'flashcard.progress' &&
        event.metadata?.flashcardSetId === id
      ) {
        // Force re-fetch by invalidating query
        queryClient.invalidateQueries({ queryKey: ['flashcardSet', id] });
      }
    };

    const unsubscribe = eventsService.on('flashcard.progress', handleProgress);
    return () => {
      unsubscribe?.();
    };
  }, [id, queryClient]);

  const updateBreadcrumb = (includeResults = false) => {
    if (!flashcardSet) return;

    const breadcrumbItems = buildBreadcrumbItems(
      flashcardSet,
      includeResults,
      false
    );

    navigate(location.pathname + location.search, {
      replace: true,
      state: {
        breadcrumb: breadcrumbItems,
      },
    });
  };

  const advanceToNextCard = (responses: typeof cardResponses) => {
    if (currentCardIndex < (flashcardSet?.cards.length || 0) - 1) {
      setDirection(1);
      setCurrentCardIndex(currentCardIndex + 1);
      setIsFlipped(false);
    } else {
      handleFinishSession(responses);
    }
  };

  const updateCardResponse = (response: 'know' | 'dont-know') => {
    const existingIndex = cardResponses.findIndex(
      (r) => r.cardIndex === currentCardIndex
    );

    if (existingIndex >= 0) {
      const updatedResponses = [...cardResponses];
      updatedResponses[existingIndex] = {
        cardIndex: currentCardIndex,
        response,
      };
      return updatedResponses;
    }

    return [...cardResponses, { cardIndex: currentCardIndex, response }];
  };

  if (error) {
    toast.error('Failed to load flashcard set');
    return (
      <div className="text-center py-12">Failed to load flashcard set</div>
    );
  }

  const handleNext = () => {
    if (currentCardIndex < (flashcardSet?.cards.length || 0) - 1) {
      setDirection(1);
      setCurrentCardIndex(currentCardIndex + 1);
      setIsFlipped(false);
    } else if (
      flashcardSet &&
      currentCardIndex === flashcardSet.cards.length - 1
    ) {
      const hasResponse = cardResponses.some(
        (r) => r.cardIndex === currentCardIndex
      );
      if (hasResponse) {
        handleFinishSession(cardResponses);
      } else {
        toast.error('Please rate how well you knew this card');
      }
    }
  };

  const handlePrevious = () => {
    if (currentCardIndex > 0) {
      setDirection(-1);
      setCurrentCardIndex(currentCardIndex - 1);
      setIsFlipped(false);
    }
  };

  const handleFlip = () => {
    setIsFlipped(!isFlipped);
  };

  const handleResponse = (response: 'know' | 'dont-know') => {
    const updatedResponses = updateCardResponse(response);
    setCardResponses(updatedResponses);

    if (response === 'know') {
      setTimeout(() => advanceToNextCard(updatedResponses), 300);
    } else {
      setIsFlipped(true);
    }
  };

  const handleFinishSession = async (responses: typeof cardResponses) => {
    if (!id || !flashcardSet) return;

    try {
      setSubmitting(true);
      await flashcardService.recordSession(id, responses);
      setShowResults(true);
      toast.success('Session completed! 🎉');
      updateBreadcrumb(true);
    } catch {
      toast.error('Failed to save session');
    } finally {
      setSubmitting(false);
    }
  };

  const handleRetake = () => {
    setCurrentCardIndex(0);
    setIsFlipped(false);
    setDirection(0);
    setCardResponses([]);
    setShowResults(false);
    setIsStudying(true);

    // Consolidate navigation and breadcrumb update into a single call
    const breadcrumbItems = flashcardSet
      ? buildBreadcrumbItems(flashcardSet, false, false)
      : [];
    navigate(location.pathname + '?view=study', {
      replace: true,
      state: { breadcrumb: breadcrumbItems },
    });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading flashcards...</p>
        </div>
      </div>
    );
  }

  if (!flashcardSet?.cards?.length) {
    return (
      <div className="card text-center py-12 dark:bg-gray-800">
        <h3 className="text-xl font-semibold text-gray-600 dark:text-gray-400 mb-2">
          No flashcards found
        </h3>
        <button
          onClick={() => navigate('/flashcards')}
          className="mt-4 px-6 py-2 bg-primary-600 hover:bg-primary-700 text-white font-semibold rounded-lg transition-colors"
        >
          Back to Flashcards
        </button>
      </div>
    );
  }

  const currentCard = flashcardSet.cards[currentCardIndex];
  const progress = ((currentCardIndex + 1) / flashcardSet.cards.length) * 100;

  // Render Results View
  if (showResults) {
    return (
      <div className="max-w-4xl mx-auto space-y-6 pb-8">
        <ResultsHeroCard
          score={percentage}
          totalScore={knowCount}
          totalQuestions={totalCards}
          userName={user?.name}
          title={flashcardSet.title}
          stats={flashcardStats}
          showConfetti={percentage >= 70}
          onBack={() => {
            setShowResults(false);
            setIsStudying(false);
            // Clear attemptId from URL if present
            if (attemptId) {
              navigate(location.pathname + '?view=history', { replace: true });
            }
          }}
          backLabel="View Performance"
          shareId={id}
          shareTitle={flashcardSet.title}
          completionType="quiz"
          customTitle="Study Session Complete!"
          contentContext="flashcard"
          onRetake={handleRetake}
          onStudyPackClick={
            flashcardSet.studyPack
              ? () => navigate(`/study-pack/${flashcardSet.studyPack?.id}`)
              : undefined
          }
          studyPackTitle={flashcardSet.studyPack?.title}
        />
      </div>
    );
  }

  // Show history view
  if (isStudying === false && flashcardSet) {
    return (
      <AttemptsAnalyticsView
        title={flashcardSet.title}
        type="flashcard"
        attempts={attempts}
        onRetake={handleRetake}
        onBack={() => navigate('/flashcards')}
        defaultTotalQuestions={flashcardSet.cards?.length}
      />
    );
  }

  // Loading state while determining mode
  if (isStudying === null) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  // Animation variants for a more premium "stacked" card feel
  const cardVariants: Variants = {
    enter: (direction: number) => ({
      x: direction > 0 ? '100%' : '-100%',
      y: 0,
      opacity: 0,
      scale: 0.9,
      rotateZ: direction > 0 ? 10 : -10,
      zIndex: 0,
    }),
    center: {
      x: 0,
      y: 0,
      opacity: 1,
      scale: 1,
      rotateZ: 0,
      zIndex: 1,
      transition: {
        x: { type: 'spring', stiffness: 260, damping: 30 },
        opacity: { duration: 0.2 },
        scale: { duration: 0.4 },
        rotateZ: { type: 'spring', stiffness: 200, damping: 25 },
      },
    },
    exit: (direction: number) => ({
      x: direction < 0 ? '100%' : '-100%',
      opacity: 0,
      scale: 0.9,
      rotateZ: direction < 0 ? 10 : -10,
      zIndex: 0,
      transition: {
        x: { type: 'spring', stiffness: 260, damping: 30 },
        opacity: { duration: 0.2 },
      },
    }),
  };

  return (
    <div className="max-w-6xl mx-auto flex flex-col min-h-[calc(100vh-120px)] space-y-2 md:space-y-4 pb-4 overflow-hidden">
      <FlashcardHeader
        title={flashcardSet.title}
        topic={flashcardSet.topic}
        progress={progress}
        currentCardIndex={currentCardIndex}
        totalCards={flashcardSet.cards.length}
        attemptsCount={flashcardSet._count?.attempts || 0}
      />

      <div className="flex-1 flex items-center justify-center gap-4 relative px-2 sm:px-12 min-h-[350px] md:min-h-[420px] mb-4 md:mb-8 mt-2 md:mt-0">
        {/* Previous Button */}
        <button
          onClick={handlePrevious}
          disabled={currentCardIndex === 0}
          className="absolute left-4 lg:left-0 z-20 p-4 bg-white dark:bg-gray-800 rounded-full shadow-xl border border-gray-100 dark:border-gray-700 disabled:opacity-20 hover:scale-110 active:scale-95 transition-all hidden md:flex"
          aria-label="Previous Card"
        >
          <ChevronLeft className="w-7 h-7 text-gray-800 dark:text-gray-200" />
        </button>

        <div className="relative w-full max-w-2xl mx-auto h-[320px] sm:h-[480px]">
          {/* Generating Indicator */}
          {flashcardSet.totalCardsRequested && flashcardSet.cards.length < flashcardSet.totalCardsRequested && (
            <div className="absolute -top-12 inset-x-0 flex items-center justify-center animate-fade-in z-20">
              <div className="bg-primary-50 dark:bg-primary-900/40 backdrop-blur-md border border-primary-200 dark:border-primary-800/50 px-4 py-2 rounded-full flex items-center gap-2.5 shadow-sm">
                <div className="w-1.5 h-1.5 bg-primary-500 rounded-full animate-ping" />
                <span className="text-xs font-bold text-primary-700 dark:text-primary-300">
                  Generating more cards... ({flashcardSet.cards.length} / {flashcardSet.totalCardsRequested})
                </span>
              </div>
            </div>
          )}

          {/* Stacked Card Background Effects - Balanced for mobile */}
          <div className="absolute inset-x-6 -bottom-6 translate-y-2 scale-[0.92] bg-white dark:bg-gray-800 rounded-[2rem] shadow-lg border border-gray-200/50 dark:border-gray-700/50 z-0 opacity-30 h-full transition-transform"></div>
          <div className="absolute inset-x-3 -bottom-3 translate-y-1 scale-[0.96] bg-white dark:bg-gray-800 rounded-[2rem] shadow-md border border-gray-200/50 dark:border-gray-700/50 z-[1] opacity-60 h-full transition-transform"></div>

          {/* Main Card with Animation and Gestures */}
          <div className="relative z-[2] h-full w-full perspective-[1500px]">
            <AnimatePresence
              mode="popLayout"
              initial={false}
              custom={direction}
            >
              <motion.div
                key={currentCardIndex}
                custom={direction}
                variants={cardVariants}
                initial="enter"
                animate="center"
                exit="exit"
                drag="x"
                dragConstraints={{ left: 0, right: 0 }}
                dragElastic={0.7}
                onDragEnd={(_, info) => {
                  const swipe = info.offset.x;
                  if (swipe > 100) handlePrevious();
                  else if (swipe < -100) handleNext();
                }}
                onTap={handleFlip}
                whileTap={{ cursor: 'grabbing' }}
                className="absolute inset-0 cursor-grab w-full h-full"
              >
                <FlashcardItem
                  card={currentCard}
                  isFlipped={isFlipped}
                  onFlip={handleFlip}
                />
              </motion.div>
            </AnimatePresence>
          </div>
        </div>

        {/* Next Button */}
        <button
          onClick={handleNext}
          disabled={
            currentCardIndex === flashcardSet.cards.length - 1 &&
            !cardResponses.some((r) => r.cardIndex === currentCardIndex)
          }
          className="absolute right-4 lg:right-0 z-20 p-4 bg-white dark:bg-gray-800 rounded-full shadow-xl border border-gray-100 dark:border-gray-700 disabled:opacity-20 hover:scale-110 active:scale-95 transition-all hidden md:flex"
          aria-label="Next Card"
        >
          <ChevronRight className="w-7 h-7 text-gray-800 dark:text-gray-200" />
        </button>
      </div>

      {/* Mobile Navigation and Selection Controls */}
      <div className="flex flex-col gap-1 md:gap-4 mt-0 md:mt-6">
        <FlashcardControls
          submitting={submitting}
          currentCardIndex={currentCardIndex}
          totalCards={flashcardSet.cards.length}
          hasResponse={cardResponses.some(
            (r) => r.cardIndex === currentCardIndex
          )}
          onResponse={handleResponse}
          onNext={handleNext}
          onPrevious={handlePrevious}
        />
      </div>
    </div>
  );
};

// Sub-components to reduce complexity
const FlashcardHeader = ({
  title,
  topic,
  progress,
  currentCardIndex,
  totalCards,
}: any) => {
  const navigate = useNavigate();
  return (
    <div className="relative overflow-hidden rounded-xl bg-primary-600 dark:bg-primary-700 p-3.5 md:p-6 shadow-lg mb-2 md:mb-2">
      <div className="absolute inset-0 opacity-10">
        <div className="absolute -top-10 -right-10 w-40 h-40 bg-white rounded-full"></div>
        <div className="absolute -bottom-10 -left-10 w-40 h-40 bg-white rounded-full"></div>
      </div>

      <div className="relative z-10">
        <div className="flex flex-row items-center justify-between mb-4">
          <button
            onClick={() => navigate('/flashcards')}
            className="flex items-center gap-2 text-white bg-white/10 hover:bg-white/20 px-3 py-1.5 rounded-lg backdrop-blur-sm transition-all w-fit"
          >
            <ArrowLeft className="w-4 h-4" />
            <span className="text-sm font-medium">Back</span>
          </button>

          <div className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-yellow-300" />
            <span className="text-yellow-300 font-semibold text-xs uppercase tracking-wider">
              Study Session
            </span>
          </div>
        </div>

        <div className="flex items-start gap-3 mb-4">
          <div className="p-1.5 bg-white/20 backdrop-blur-sm rounded-lg hidden sm:block">
            <Layers className="w-5 h-5 text-white" />
          </div>
          <div className="flex-1">
            <h1 className="text-xl md:text-2xl font-bold text-white line-clamp-1">
              {title}
            </h1>
            <p className="text-primary-100 text-sm line-clamp-1 opacity-90">
              {topic}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <div className="flex-1 bg-white/20 rounded-full h-2 overflow-hidden">
            <div
              className="bg-green-400 h-full rounded-full transition-all duration-300"
              style={{ width: `${progress}%` }}
            />
          </div>
          <span className="text-xs font-bold text-white whitespace-nowrap">
            {currentCardIndex + 1} / {totalCards}
          </span>
        </div>
      </div>
    </div>
  );
};

const FlashcardControls = ({
  submitting,
  currentCardIndex,
  totalCards,
  hasResponse,
  onResponse,
  onNext,
  onPrevious,
}: any) => (
  <div className="flex flex-col gap-4">
    {/* Combined Controls Row */}
    <div className="flex items-stretch justify-center gap-2 md:gap-4 px-2">
      {/* Mobile Prev Button */}
      <button
        onClick={onPrevious}
        disabled={currentCardIndex === 0}
        className="flex md:hidden items-center justify-center px-4 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-2xl shadow-sm disabled:opacity-20 transition-all active:scale-90"
        aria-label="Previous"
      >
        <ChevronLeft className="w-6 h-6 text-gray-700 dark:text-gray-300" />
      </button>

      {/* Main Feedback Buttons */}
      <div className="flex-1 flex items-center justify-center gap-2 md:gap-4">
        <button
          onClick={() => onResponse('dont-know')}
          disabled={submitting}
          className="flex-1 flex flex-col items-center justify-center gap-1 group px-2 py-3 bg-white dark:bg-gray-800 hover:bg-red-50 dark:hover:bg-red-900/10 border-2 border-transparent hover:border-red-200 dark:hover:border-red-900/30 rounded-2xl shadow-sm transition-all"
        >
          <span className="text-xl">😟</span>
          <span className="text-[10px] md:text-sm font-bold text-gray-700 dark:text-gray-300 uppercase tracking-tight">
            I don't know
          </span>
        </button>

        <button
          onClick={() => onResponse('know')}
          disabled={submitting}
          className="flex-1 flex flex-col items-center justify-center gap-1 group px-2 py-3 bg-white dark:bg-gray-800 hover:bg-green-50 dark:hover:bg-green-900/10 border-2 border-transparent hover:border-green-200 dark:hover:border-green-900/30 rounded-2xl shadow-sm transition-all"
        >
          <span className="text-xl">😃</span>
          <span className="text-[10px] md:text-sm font-bold text-gray-700 dark:text-gray-300 uppercase tracking-tight">
            I know it!
          </span>
        </button>
      </div>

      {/* Mobile Next Button */}
      <button
        onClick={onNext}
        disabled={currentCardIndex === totalCards - 1 && !hasResponse}
        className="flex md:hidden items-center justify-center px-4 bg-primary-600 rounded-2xl shadow-lg shadow-primary-500/20 disabled:opacity-20 transition-all active:scale-90"
        aria-label="Next"
      >
        <ChevronRight className="w-6 h-6 text-white" />
      </button>
    </div>
  </div>
);

const FlashcardItem = ({ card, isFlipped, onFlip }: any) => (
  <div
    className="w-full h-full bg-white dark:bg-gray-800 rounded-2xl shadow-xl overflow-hidden border border-gray-100 dark:border-gray-700"
    style={{ perspective: '1200px' }}
  >
    <div
      className="h-full relative transition-transform duration-700"
      style={{
        transformStyle: 'preserve-3d',
        transform: isFlipped ? 'rotateY(180deg)' : 'rotateY(0deg)',
      }}
    >
      {/* Front Face */}
      <div
        className="absolute inset-0 flex flex-col items-center justify-center p-6 md:p-12 text-center"
        style={{
          backfaceVisibility: 'hidden',
          WebkitBackfaceVisibility: 'hidden',
          zIndex: isFlipped ? 0 : 2,
        }}
      >
        <div className="absolute top-4 left-6 text-[10px] font-black text-primary-500 uppercase tracking-[0.2em] opacity-40">
          Question
        </div>
        <div className="w-full max-h-[70%] overflow-y-auto custom-scrollbar px-2">
          <div className="text-xl md:text-3xl font-extrabold text-gray-900 dark:text-white leading-tight">
            <FlashcardMarkdown content={card.front} />
          </div>
        </div>
        <button
          onClick={(e) => {
            e.stopPropagation();
            onFlip();
          }}
          className="mt-6 md:mt-10 px-6 py-2.5 bg-gray-50 dark:bg-gray-700 hover:bg-primary-50 dark:hover:bg-primary-900/10 text-gray-500 dark:text-gray-400 hover:text-primary-600 dark:hover:text-primary-300 rounded-full text-xs font-black uppercase tracking-widest transition-all"
        >
          Tap to flip
        </button>
      </div>

      {/* Back Face */}
      <div
        className="absolute inset-0 flex flex-col items-center justify-start p-6 md:p-12 text-center"
        style={{
          backfaceVisibility: 'hidden',
          WebkitBackfaceVisibility: 'hidden',
          transform: 'rotateY(180deg)',
          zIndex: isFlipped ? 2 : 0,
        }}
      >
        <div className="absolute top-4 left-6 text-[10px] font-black text-green-500 uppercase tracking-[0.2em] opacity-40">
          Answer
        </div>
        <div className="w-full overflow-y-auto custom-scrollbar flex-1 px-2 space-y-6 pt-2">
          <div className="text-xl md:text-2xl font-bold text-gray-900 dark:text-white leading-snug">
            <FlashcardMarkdown content={card.back} />
          </div>

          {card.explanation && (
            <div className="pt-6 border-t border-gray-100 dark:border-gray-700 w-full text-left">
              <div className="flex items-center gap-2 mb-3">
                <div className="w-5 h-5 flex items-center justify-center bg-yellow-400 rounded-full text-[10px] text-white">
                  💡
                </div>
                <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">
                  Deep Dive
                </span>
              </div>
              <div className="text-sm font-medium text-gray-600 dark:text-gray-400 bg-gray-50/50 dark:bg-gray-900/50 p-4 rounded-xl leading-relaxed">
                <FlashcardMarkdown content={card.explanation} />
              </div>
            </div>
          )}
        </div>

        <button
          onClick={(e) => {
            e.stopPropagation();
            onFlip();
          }}
          className="mt-6 px-6 py-2 bg-gray-50 dark:bg-gray-700 hover:bg-gray-100 text-gray-400 hover:text-gray-600 rounded-full text-[10px] font-black uppercase tracking-widest transition-all"
        >
          Back to Question
        </button>
      </div>
    </div>
  </div>
);
