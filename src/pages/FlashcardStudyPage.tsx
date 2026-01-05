import { useState, useMemo, useEffect, useRef } from 'react';

import { useParams, useNavigate, useLocation, useSearchParams } from 'react-router-dom';
import { Toast as toast } from '../utils/toast';
import { flashcardService } from '../services/flashcard.service';
import {
  ChevronLeft,
  ChevronRight,
  RotateCw,
  ArrowLeft,
  Layers,
  Sparkles,
  BookOpen,
  ThumbsUp,
  ThumbsDown,
  Target,
} from 'lucide-react';
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
      ? { label: flashcardSet.studyPack.title, path: `/study-pack/${flashcardSet.studyPack.id}?tab=flashcards` }
      : { label: 'Flashcards', path: '/flashcards' },
    { label: flashcardSet.title, path: null },
    ...(includeResults ? [{ label: 'Results', path: null }] : []),
    ...(includeHistory ? [{ label: 'Practice History', path: null }] : []),
  ];
};

const FlashcardMarkdown = ({ content, className = '' }: { content: string; className?: string }) => (
  <div className={`prose prose-lg dark:prose-invert max-w-none ${className} [&_p]:m-0`}>
    <ReactMarkdown
      remarkPlugins={[remarkGfm, remarkMath]}
      rehypePlugins={[rehypeKatex]}
      components={{
        p: ({node, ...props}) => <div {...props} />
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
  const percentage = totalCards > 0 ? Math.round((knowCount / totalCards) * 100) : 0;

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
    const breadcrumbItems = buildBreadcrumbItems(flashcardSet, false, isStudying === false);
    // Preserve existing search params (like ?view=study) when updating breadcrumbs
    navigate(location.pathname + location.search, {
      replace: true,
      state: { breadcrumb: breadcrumbItems },
    });
  }, [flashcardSet, id, loading, location.pathname, location.state?.breadcrumb, navigate, isStudying]);

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
  }, [viewHistory, viewStudy, isStudying, showResults]);

  // Fetch attempts when history view is active
  useEffect(() => {
    const shouldFetch = isStudying === false || viewHistory;
    const isValidId = id && id !== 'undefined';
    
    if (shouldFetch && isValidId && !loadingAttempts && fetchedIdRef.current !== id) {
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
        setCardResponses(targetAttempt.answers as any || []);
        setShowResults(true);
        // Note: isStudying is already false from the viewHistory logic
      }
    }
  }, [attemptId, attempts, isStudying]);

  const updateBreadcrumb = (includeResults = false) => {
    if (!flashcardSet) return;

    const breadcrumbItems = buildBreadcrumbItems(flashcardSet, includeResults, false);

    navigate(location.pathname + location.search, {
      replace: true,
      state: {
        breadcrumb: breadcrumbItems,
      },
    });
  };

  const advanceToNextCard = (responses: typeof cardResponses) => {
    if (currentCardIndex < (flashcardSet?.cards.length || 0) - 1) {
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

    return [
      ...cardResponses,
      { cardIndex: currentCardIndex, response },
    ];
  };

  if (error) {
    toast.error('Failed to load flashcard set');
    return (
      <div className="text-center py-12">Failed to load flashcard set</div>
    );
  }

  const handleNext = () => {
    if (currentCardIndex < (flashcardSet?.cards.length || 0) - 1) {
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
    setCardResponses([]);
    setShowResults(false);
    setIsStudying(true);
    
    // Consolidate navigation and breadcrumb update into a single call
    const breadcrumbItems = flashcardSet ? buildBreadcrumbItems(flashcardSet, false, false) : [];
    navigate(location.pathname + '?view=study', { 
      replace: true,
      state: { breadcrumb: breadcrumbItems }
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

  return (
    <div className="max-w-4xl mx-auto space-y-6 pb-8">
      <FlashcardHeader 
        id={id!} 
        title={flashcardSet.title} 
        topic={flashcardSet.topic} 
        progress={progress}
        currentCardIndex={currentCardIndex}
        totalCards={flashcardSet.cards.length}
        attemptsCount={flashcardSet._count?.attempts || 0}
      />

      <FlashcardItem 
        card={currentCard}
        isFlipped={isFlipped}
        onFlip={handleFlip}
      />

      <FlashcardControls
        submitting={submitting}
        currentCardIndex={currentCardIndex}
        totalCards={flashcardSet.cards.length}
        hasResponse={cardResponses.some((r) => r.cardIndex === currentCardIndex)}
        onResponse={handleResponse}
        onFlip={handleFlip}
        onNext={handleNext}
        onPrevious={handlePrevious}
      />

      <FlashcardList
        cards={flashcardSet.cards}
        currentIndex={currentCardIndex}
        onSelect={(idx: number) => {
          setCurrentCardIndex(idx);
          setIsFlipped(false);
        }}
      />
    </div>
  );
};

// Sub-components to reduce complexity
const FlashcardHeader = ({ title, topic, progress, currentCardIndex, totalCards }: any) => {
  const navigate = useNavigate();
  return (
    <div className="relative overflow-hidden rounded-xl bg-primary-600 dark:bg-primary-700 p-4 md:p-6 shadow-lg">
      <div className="absolute inset-0 opacity-10">
        <div className="absolute -top-10 -right-10 w-40 h-40 bg-white rounded-full"></div>
        <div className="absolute -bottom-10 -left-10 w-40 h-40 bg-white rounded-full"></div>
      </div>

      <div className="relative z-10">
        <button
          onClick={() => navigate('/flashcards')}
          className="flex items-center gap-2 text-white bg-white/10 hover:bg-white/20 px-3 py-1.5 rounded-lg backdrop-blur-sm mb-4 transition-all w-fit"
        >
          <ArrowLeft className="w-4 h-4" />
          <span className="text-sm font-medium">Back to Flashcards</span>
        </button>

        <div className="flex items-center gap-2 mb-3">
          <Sparkles className="w-6 h-6 text-yellow-300" />
          <span className="text-yellow-300 font-semibold text-sm">Study Session</span>
        </div>

        <div className="flex items-start gap-3 mb-4">
          <div className="p-2 bg-white/20 backdrop-blur-sm rounded-lg">
            <Layers className="w-6 h-6 text-white" />
          </div>
          <div className="flex-1">
            <div className="flex items-start justify-between gap-4">
              <div className="flex-1">
                <h1 className="text-3xl font-bold text-white mb-2">{title}</h1>
                <p className="text-primary-100">{topic}</p>
              </div>
            </div>
          </div>
        </div>

        <div className="mt-6 p-4 bg-white/10 backdrop-blur-sm rounded-lg border border-white/20">
          <div className="flex justify-between text-sm text-white mb-2">
            <span>Card {currentCardIndex + 1} of {totalCards}</span>
            <span>{Math.round(progress)}% Complete</span>
          </div>
          <div className="w-full bg-white/20 rounded-full h-2.5 overflow-hidden">
            <div
              className="bg-green-500 h-2.5 rounded-full transition-all duration-300"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>
      </div>
    </div>
  );
};

const FlashcardControls = ({ submitting, currentCardIndex, totalCards, hasResponse, onResponse, onFlip, onNext, onPrevious }: any) => (
  <div className="space-y-4 mt-6 pt-6 border-t border-gray-200 dark:border-gray-700">
    <div className="flex items-center justify-center gap-4 pb-4">
      <button
        onClick={() => onResponse('dont-know')}
        disabled={submitting}
        className="group px-6 py-3 md:px-8 md:py-4 bg-red-50 dark:bg-red-900/20 hover:bg-red-100 dark:hover:bg-red-900/30 border-2 border-red-300 dark:border-red-700 rounded-2xl transition-all"
      >
        <span className="text-2xl md:text-3xl">👎🏼</span>
      </button>

      <button
        onClick={() => onResponse('know')}
        disabled={submitting}
        className="group px-6 py-3 md:px-8 md:py-4 bg-green-50 dark:bg-primary-900/20 hover:bg-primary-100 dark:hover:bg-primary-900/30 border-2 border-primary-300 dark:border-primary-700 rounded-2xl transition-all"
      >
        <span className="text-2xl md:text-3xl">👍🏼</span>
      </button>
    </div>

    <div className="flex items-center justify-between">
      <button
        onClick={onPrevious}
        disabled={currentCardIndex === 0}
        className="flex items-center gap-2 px-3 md:px-5 py-2.5 bg-gray-100 dark:bg-gray-700 rounded-lg disabled:opacity-50"
      >
        <ChevronLeft className="w-5 h-5" />
        <span className="hidden sm:inline">Previous</span>
      </button>

      <button
        onClick={onFlip}
        className="flex items-center gap-2 px-4 md:px-6 py-2.5 bg-primary-600 hover:bg-primary-700 text-white font-semibold rounded-lg shadow-md"
      >
        <RotateCw className="w-5 h-5" />
        <span>Flip Card</span>
      </button>

      <button
        onClick={onNext}
        disabled={currentCardIndex === totalCards - 1 && !hasResponse}
        className="flex items-center gap-2 px-3 md:px-5 py-2.5 bg-gray-100 dark:bg-gray-700 rounded-lg disabled:opacity-50"
      >
        <span className="hidden sm:inline">{currentCardIndex === totalCards - 1 ? 'Finish' : 'Next'}</span>
        <ChevronRight className="w-5 h-5" />
      </button>
    </div>
  </div>
);

const FlashcardList = ({ cards, currentIndex, onSelect }: any) => (
  <div className="card dark:bg-gray-800">
    <div className="flex items-center gap-3 mb-6">
      <div className="p-2 bg-primary-100 dark:bg-primary-900/30 rounded-lg">
        <Layers className="w-5 h-5 text-primary-600 dark:text-primary-400" />
      </div>
      <h3 className="text-xl font-bold text-gray-900 dark:text-white">All Cards</h3>
      <span className="px-3 py-1 bg-primary-100 dark:bg-primary-900/30 text-primary-700 dark:text-primary-300 rounded-full text-sm font-semibold">{cards.length}</span>
    </div>
    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
      {cards.map((card: any, index: number) => {
        const cardKey = `card-${index}-${card.front.substring(0, 20)}`;
        return (
          <button
            key={cardKey}
            onClick={() => onSelect(index)}
            className={`text-left p-4 rounded-xl border-2 transition-all group ${
              index === currentIndex ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/20 shadow-md' : 'border-gray-200 dark:border-gray-700 hover:border-primary-300 hover:bg-gray-50'
            }`}
          >
            <div className="flex items-start gap-3">
              <span className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold ${index === currentIndex ? 'bg-primary-500 text-white' : 'bg-gray-100 dark:bg-gray-700 text-gray-600'}`}>
                {index + 1}
              </span>
              <p className="text-sm font-medium text-gray-800 dark:text-gray-200 line-clamp-2 flex-1">{card.front}</p>
            </div>
          </button>
        );
      })}
    </div>
  </div>
);

const FlashcardItem = ({ card, isFlipped, onFlip }: any) => (
  <div
    className="card border border-primary-200 dark:border-gray-700 shadow-xl dark:bg-gray-800"
    style={{ perspective: '1000px' }}
  >
    <div
      className="min-h-[350px] sm:min-h-[450px] relative rounded-xl"
      style={{
        transformStyle: 'preserve-3d',
        transition: 'transform 0.6s',
        transform: isFlipped ? 'rotateY(180deg)' : 'rotateY(0deg)',
      }}
    >
      <div
        className="absolute top-4 right-4 z-10"
        style={{
          transform: isFlipped ? 'rotateY(180deg)' : 'rotateY(0deg)',
        }}
      >
        <button
          onClick={onFlip}
          className="inline-flex items-center gap-2 px-3 py-2 sm:px-4 sm:py-2 rounded-full text-sm font-semibold shadow-md border-2 transition-all hover:scale-105 active:scale-95 bg-primary-600 text-white border-white/30 hover:bg-primary-700"
        >
          <RotateCw
            className="w-4 h-4 transition-transform duration-600"
            style={{
              transform: isFlipped ? 'rotate(180deg)' : 'rotate(0deg)',
            }}
          />
          <span className="hidden sm:inline">
            {isFlipped ? 'Show Question' : 'Show Answer'}
          </span>
        </button>
      </div>

      {/* Front of card */}
      <div
        className="flex flex-col items-center justify-center min-h-[350px] sm:min-h-[450px] text-center px-4 py-8 md:px-8 md:py-12 bg-gray-50 dark:bg-gray-700 rounded-xl"
        style={{
          backfaceVisibility: 'hidden',
          WebkitBackfaceVisibility: 'hidden',
          position: isFlipped ? 'absolute' : 'relative',
          width: '100%',
        }}
      >
        <div className="inline-flex items-center justify-center w-16 h-16 bg-primary-500 rounded-full mb-6 shadow-lg">
          <BookOpen className="w-8 h-8 text-white" />
        </div>
        <div className="text-3xl font-bold text-gray-900 dark:text-white mb-6 leading-relaxed w-full">
            <FlashcardMarkdown content={card.front} />
        </div>
      </div>

      {/* Back of card */}
      <div
        className="flex flex-col items-center justify-center min-h-[350px] sm:min-h-[450px] text-center px-4 py-8 md:px-8 md:py-12 bg-gray-50 dark:bg-gray-700 rounded-xl"
        style={{
          backfaceVisibility: 'hidden',
          WebkitBackfaceVisibility: 'hidden',
          transform: 'rotateY(180deg)',
          position: isFlipped ? 'relative' : 'absolute',
          top: 0,
          width: '100%',
        }}
      >
        <div className="inline-flex items-center justify-center w-16 h-16 bg-primary-500 rounded-full mb-6 shadow-lg">
          <Sparkles className="w-8 h-8 text-white" />
        </div>
        <div className="text-2xl font-semibold text-gray-900 dark:text-white mb-6 leading-relaxed max-w-2xl w-full">
          <FlashcardMarkdown content={card.back} />
        </div>
        {card.explanation && (
          <div className="mt-6 pt-6 border-t-2 border-primary-200 dark:border-gray-600 max-w-2xl w-full">
            <div className="inline-flex items-center gap-2 mb-3">
              <span className="text-2xl">💡</span>
              <p className="text-sm font-bold text-primary-900 dark:text-primary-300 uppercase tracking-wide">
                Explanation
              </p>
            </div>
            <div className="text-base text-gray-700 dark:text-gray-300 leading-relaxed bg-white dark:bg-gray-800 p-4 rounded-lg text-left">
               <FlashcardMarkdown content={card.explanation} />
            </div>
          </div>
        )}
      </div>
    </div>
  </div>
);
