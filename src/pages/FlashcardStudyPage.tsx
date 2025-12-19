import { useState, useMemo, useEffect } from 'react';

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
  Clock,
} from 'lucide-react';
import { useFlashcardSet } from '../hooks';
import { ResultsHeroCard, type ResultsStat } from '../components/quiz/ResultsHeroCard';
import { useAuth } from '../contexts/AuthContext';

// Simple markdown renderer for bold text
const renderMarkdown = (text: string) => {
  // Convert **text** to <strong>text</strong>
  const formatted = text.replaceAll(/\*\*(.+?)\*\*/g, '<strong>$1</strong>');
  return { __html: formatted };
};

// Helper function to build breadcrumb items
const buildBreadcrumbItems = (
  flashcardSet: any,
  includeResults = false,
  includeHistory = false
) => {
  return [
    { label: 'Home', path: '/dashboard' },
    flashcardSet.studyPack
      ? { label: flashcardSet.studyPack.title, path: `/study-packs/${flashcardSet.studyPack.id}` }
      : { label: 'Flashcards', path: '/flashcards' },
    { label: flashcardSet.title, path: null },
    ...(includeResults ? [{ label: 'Results', path: null }] : []),
    ...(includeHistory ? [{ label: 'History', path: null }] : []),
  ];
};

export const FlashcardStudyPage = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams] = useSearchParams();
  const viewHistory = searchParams.get('view') === 'history';
  const { data: flashcardSet, isLoading: loading, error } = useFlashcardSet(id);
  const { user } = useAuth();
  const [currentCardIndex, setCurrentCardIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);
  const [cardResponses, setCardResponses] = useState<
    Array<{ cardIndex: number; response: 'know' | 'dont-know' | 'skipped' }>
  >([]);
  const [showResults, setShowResults] = useState(false);
  const [submitting, setSubmitting] = useState(false);

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

  // Set breadcrumb when flashcard set loads
  useEffect(() => {
    if (!flashcardSet || !id || loading || location.state?.breadcrumb) return;

    const breadcrumbItems = buildBreadcrumbItems(flashcardSet, false, viewHistory);

    navigate(location.pathname + location.search, {
      replace: true,
      state: {
        breadcrumb: breadcrumbItems,
      },
    });
  }, [flashcardSet, id, loading, location, navigate, viewHistory]);

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
    } catch (_error) {
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
    updateBreadcrumb(false);
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


  // Show results screen
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
          onBack={() => navigate('/flashcards')}
          backLabel="Back to Flashcards"
          shareId={id}
          shareTitle={flashcardSet.title}
          completionType="quiz"
          customTitle="Study Session Complete!"
          contentContext="flashcard"
          onRetake={handleRetake}
          onStudyPackClick={
            flashcardSet.studyPack
              ? () => navigate(`/study-packs/${flashcardSet.studyPack?.id}`)
              : undefined
          }
          studyPackTitle={flashcardSet.studyPack?.title}
        />
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6 pb-8">
      {/* Header */}
      <div className="relative overflow-hidden rounded-xl bg-primary-600 dark:bg-primary-700 p-4 md:p-6 shadow-lg">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute -top-10 -right-10 w-40 h-40 bg-white rounded-full"></div>
          <div className="absolute -bottom-10 -left-10 w-40 h-40 bg-white rounded-full"></div>
        </div>

        <div className="relative z-10">
          <button
            onClick={() => navigate('/flashcards')}
            className="flex items-center gap-2 text-white bg-white/10 hover:bg-white/20 px-3 py-1.5 rounded-lg backdrop-blur-sm mb-4 transition-all touch-manipulation w-fit"
          >
            <ArrowLeft className="w-4 h-4 sm:w-5 sm:h-5" />
            <span className="text-sm sm:text-base font-medium">
              Back to Flashcards
            </span>
          </button>

          <div className="flex items-center gap-2 mb-3">
            <Sparkles className="w-6 h-6 text-yellow-300" />
            <span className="text-yellow-300 font-semibold text-sm">
              Study Session
            </span>
          </div>

          <div className="flex items-start gap-3 mb-4">
            <div className="p-2 bg-white/20 backdrop-blur-sm rounded-lg">
              <Layers className="w-6 h-6 text-white" />
            </div>
            <div className="flex-1">
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1">
                  <h1 className="text-3xl font-bold text-white mb-2">
                    {flashcardSet.title}
                  </h1>
                  <p className="text-primary-100 dark:text-primary-200">
                    {flashcardSet.topic}
                  </p>
                </div>
                {flashcardSet._count && flashcardSet._count.attempts > 0 && (
                  <button
                    onClick={() => navigate(`/flashcards/${id}?view=history`)}
                    className="flex items-center gap-2 px-4 py-2 bg-white/20 hover:bg-white/30 backdrop-blur-sm text-white font-medium rounded-lg transition-colors border border-white/30"
                  >
                    <Clock className="w-4 h-4" />
                    <span className="hidden sm:inline">View Attempts</span>
                    <span className="sm:hidden">{flashcardSet._count.attempts}</span>
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* Progress bar */}
          <div className="mt-6 p-4 bg-white/10 backdrop-blur-sm rounded-lg border border-white/20">
            <div className="flex justify-between text-sm text-white mb-2">
              <span className="font-medium">
                Card {currentCardIndex + 1} of {flashcardSet.cards.length}
              </span>
              <span className="font-medium">
                {Math.round(progress)}% Complete
              </span>
            </div>
            <div className="w-full bg-white/20 rounded-full h-2.5 overflow-hidden">
              <div
                className="bg-green-500 h-2.5 rounded-full transition-all duration-300 shadow-lg"
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Flashcard */}
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
              onClick={handleFlip}
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
            <p
              className="text-3xl font-bold text-gray-900 dark:text-white mb-6 leading-relaxed"
              dangerouslySetInnerHTML={renderMarkdown(currentCard.front)}
            />
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
            <p
              className="text-2xl font-semibold text-gray-900 dark:text-white mb-6 leading-relaxed max-w-2xl"
              dangerouslySetInnerHTML={renderMarkdown(currentCard.back)}
            />
            {currentCard.explanation && (
              <div className="mt-6 pt-6 border-t-2 border-primary-200 dark:border-gray-600 max-w-2xl">
                <div className="inline-flex items-center gap-2 mb-3">
                  <span className="text-2xl">💡</span>
                  <p className="text-sm font-bold text-primary-900 dark:text-primary-300 uppercase tracking-wide">
                    Explanation
                  </p>
                </div>
                <p
                  className="text-base text-gray-700 dark:text-gray-300 leading-relaxed bg-white dark:bg-gray-800 p-4 rounded-lg"
                  dangerouslySetInnerHTML={renderMarkdown(
                    currentCard.explanation
                  )}
                />
              </div>
            )}
          </div>
        </div>

        {/* Navigation */}
        <div className="space-y-4 mt-6 pt-6 border-t border-gray-200 dark:border-gray-700">
          {/* Response buttons - always visible */}
          <div className="flex items-center justify-center gap-4 pb-4">
            <button
              onClick={() => handleResponse('dont-know')}
              disabled={submitting}
              className="group relative flex items-center justify-center gap-3 px-6 py-3 md:px-8 md:py-4 bg-red-50 dark:bg-red-900/20 hover:bg-red-100 dark:hover:bg-red-900/30 border-2 border-red-300 dark:border-red-700 hover:border-red-400 dark:hover:border-red-600 rounded-2xl transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed hover:shadow-lg hover:-translate-y-0.5 active:translate-y-0 active:shadow-md"
            >
              <span className="text-2xl md:text-3xl group-hover:scale-110 group-active:scale-95 transition-transform duration-200">
                👎🏼
              </span>
            </button>

            <button
              onClick={() => handleResponse('know')}
              disabled={submitting}
              className="group relative flex items-center justify-center gap-3 px-6 py-3 md:px-8 md:py-4 bg-green-50 dark:bg-primary-900/20 hover:bg-primary-100 dark:hover:bg-primary-900/30 border-2 border-primary-300 dark:border-primary-700 hover:border-primary-400 dark:hover:border-primary-600 rounded-2xl transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed hover:shadow-lg hover:-translate-y-0.5 active:translate-y-0 active:shadow-md"
            >
              <span className="text-2xl md:text-3xl group-hover:scale-110 group-active:scale-95 transition-transform duration-200">
                👍🏼
              </span>
            </button>
          </div>

          <div className="flex items-center justify-between">
            <button
              onClick={handlePrevious}
              disabled={currentCardIndex === 0}
              className="flex items-center gap-2 px-3 md:px-5 py-2.5 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-200 font-medium rounded-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <ChevronLeft className="w-5 h-5" />
              <span className="hidden sm:inline">Previous</span>
            </button>

            <button
              onClick={handleFlip}
              className="flex items-center gap-2 px-4 md:px-6 py-2.5 bg-primary-600 hover:bg-primary-700 text-white font-semibold rounded-lg transition-all shadow-md hover:shadow-lg"
            >
              <RotateCw className="w-5 h-5" />
              <span className="hidden sm:inline">Flip Card</span>
              <span className="sm:hidden">Flip</span>
            </button>

            <button
              onClick={handleNext}
              disabled={
                currentCardIndex === flashcardSet.cards.length - 1 &&
                !cardResponses.some((r) => r.cardIndex === currentCardIndex)
              }
              className="flex items-center gap-2 px-3 md:px-5 py-2.5 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-200 font-medium rounded-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <span className="hidden sm:inline">
                {currentCardIndex === flashcardSet.cards.length - 1
                  ? 'Finish'
                  : 'Next'}
              </span>
              <span className="sm:hidden">
                {currentCardIndex === flashcardSet.cards.length - 1
                  ? 'Done'
                  : 'Next'}
              </span>
              <ChevronRight className="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>

      {/* Card List */}
      <div className="card dark:bg-gray-800">
        <div className="flex items-center gap-3 mb-6">
          <div className="p-2 bg-primary-100 dark:bg-primary-900/30 rounded-lg">
            <Layers className="w-5 h-5 text-primary-600 dark:text-primary-400" />
          </div>
          <h3 className="text-xl font-bold text-gray-900 dark:text-white">
            All Cards
          </h3>
          <span className="px-3 py-1 bg-primary-100 dark:bg-primary-900/30 text-primary-700 dark:text-primary-300 rounded-full text-sm font-semibold">
            {flashcardSet.cards.length}
          </span>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {flashcardSet.cards.map((card, index) => {
            const cardId = `card-${index}-${card.front.substring(0, 20)}`;
            return (
              <button
                key={cardId}
                onClick={() => {
                  setCurrentCardIndex(index);
                  setIsFlipped(false);
                }}
                className={`text-left p-4 rounded-xl border-2 transition-all duration-200 group ${
                  index === currentCardIndex
                    ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/20 shadow-md'
                    : 'border-gray-200 dark:border-gray-700 hover:border-primary-300 dark:hover:border-primary-700 hover:bg-gray-50 dark:hover:bg-gray-700 hover:shadow-sm'
                }`}
              >
                <div className="flex items-start gap-3">
                  <span
                    className={`flex-shrink-0 w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold ${
                      index === currentCardIndex
                        ? 'bg-primary-500 text-white'
                        : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 group-hover:bg-primary-100 dark:group-hover:bg-primary-900/30 group-hover:text-primary-700 dark:group-hover:text-primary-300'
                    }`}
                  >
                    {index + 1}
                  </span>
                  <p className="text-sm font-medium text-gray-800 dark:text-gray-200 line-clamp-2 flex-1">
                    {card.front}
                  </p>
                </div>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
};
