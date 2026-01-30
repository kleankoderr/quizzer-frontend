import { useCallback, useEffect, useMemo, useState } from 'react';
import { useLocation, useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { useQueryClient } from '@tanstack/react-query';
import { Toast as toast } from '../utils/toast';
import { eventsService, quizService } from '../services';
import type { AnswerValue } from '../types';

import { QuestionRenderer } from '../components/QuestionRenderer';
import { useQuiz, useQuizStorage, useQuizTimer } from '../hooks';
import { QuizHeader } from '../components/quiz/QuizHeader';
import { QuizNavigation } from '../components/quiz/QuizNavigation';
import { QuizAttemptsView } from '../components/quiz/QuizAttemptsView';

export const QuizTakePage = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [searchParams] = useSearchParams();
  const challengeId = searchParams.get('challengeId');
  const mode = searchParams.get('mode');
  const location = useLocation();

  const { data: quiz, isLoading: loading, error } = useQuiz(id);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [selectedAnswers, setSelectedAnswers] = useState<
    (AnswerValue | null)[]
  >([]);
  const [submitting, setSubmitting] = useState(false);
  const [initialized, setInitialized] = useState(false);
  const [isTaking, setIsTaking] = useState<boolean | null>(null);

  const questions = useMemo(() => quiz?.questions ?? [], [quiz?.questions]);

  // Storage key generator
  const getStorageKey = useCallback((key: string) => `quiz_${id}_${key}`, [id]);

  // Custom hooks for storage
  const { saveAnswers, saveQuestionIndex, clearStorage } = useQuizStorage({
    getStorageKey,
  });

  const navigateToReview = useCallback(
    (attemptId: string, isChallenge = false) => {
      if (!quiz) return;

      const breadcrumb = quiz.studyPack
        ? [
            {
              label: quiz.studyPack.title,
              path: `/study-pack/${quiz.studyPack.id}`,
            },
            { label: quiz.title, path: `/quiz/${quiz.id}` },
            { label: 'Review', path: null },
          ]
        : [
            { label: 'Quizzes', path: '/quiz' },
            { label: quiz.title, path: `/quiz/${quiz.id}` },
            { label: 'Review', path: null },
          ];

      const path = isChallenge
        ? `/quiz/attempt/${attemptId}/review?challengeId=${challengeId}`
        : `/quiz/attempt/${attemptId}/review`;

      navigate(path, { state: { breadcrumb } });
    },
    [quiz, challengeId, navigate]
  );

  // Handle submit
  // Extract challenge completion logic to reduce complexity
  const handleChallengeCompletion = useCallback(
    async (submissionResult: any) => {
      if (!challengeId || !id || !quiz) return;

      try {
        const { challengeService } = await import('../services');
        const challengeCompletionResult =
          await challengeService.completeQuizInChallenge(challengeId, id, {
            score: submissionResult.score,
            totalQuestions: submissionResult.totalQuestions,
            attemptId: submissionResult.attemptId,
          });

        await queryClient.invalidateQueries({ queryKey: ['challenges'] });

        if (challengeCompletionResult.completed) {
          navigate(`/challenges/${challengeId}/results`);
        } else {
          navigateToReview(submissionResult.attemptId, true);
        }
      } catch {
        navigateToReview(submissionResult.attemptId, true);
      }
    },
    [challengeId, id, quiz, queryClient, navigate, navigateToReview]
  );

  const handleSubmit = useCallback(
    async (force = false) => {
      if (!quiz || !id) return;

      if (!force && selectedAnswers.includes(null)) {
        toast.error('Please answer all questions before submitting.');
        return;
      }

      setSubmitting(true);
      try {
        const { result: submissionResult } = await quizService.submit(id, {
          answers: selectedAnswers as AnswerValue[],
          challengeId: challengeId || undefined,
        });

        clearStorage();
        toast.success(
          force ? 'Time is up! Quiz submitted.' : 'Quiz submitted successfully!'
        );

        // Invalidate quiz query to update attempt count/history
        await queryClient.invalidateQueries({ queryKey: ['quiz', id] });

        if (challengeId) {
          await handleChallengeCompletion(submissionResult);
        } else {
          navigateToReview(submissionResult.attemptId);
        }
      } catch {
        toast.error('Failed to submit quiz. Please try again.');
      }
    },
    [
      quiz,
      id,
      selectedAnswers,
      challengeId,
      clearStorage,
      queryClient,
      handleChallengeCompletion,
      navigateToReview,
    ]
  );

  // Auto-submit handler for timer
  const handleAutoSubmit = useCallback(() => {
    handleSubmit(true);
  }, [handleSubmit]);

  // Timer hook
  const { timeRemaining, startTimer } = useQuizTimer({
    quiz,
    getStorageKey,
    onTimeUp: handleAutoSubmit,
    showResults: false,
  });

  // Set breadcrumb based on whether quiz has been attempted before
  useEffect(() => {
    if (!quiz || !id || loading || location.state?.breadcrumb) return;

    const hasAttempts =
      (quiz.attemptCount && quiz.attemptCount > 0) ||
      (quiz.attempts && quiz.attempts.length > 0);

    const breadcrumbItems = [];

    // Add study pack if it exists
    if (quiz.studyPack) {
      breadcrumbItems.push({
        label: quiz.studyPack.title,
        path: `/study-pack/${quiz.studyPack.id}`,
      });
    } else {
      breadcrumbItems.push({ label: 'Quizzes', path: '/quiz' });
    }

    // Add quiz title (clickable if there are attempts)
    breadcrumbItems.push({
      label: quiz.title,
      path: hasAttempts ? `/quiz/${id}` : null,
    });

    navigate(location.pathname + location.search, {
      replace: true,
      state: {
        breadcrumb: breadcrumbItems,
      },
    });
  }, [quiz, id, loading, location, navigate, isTaking]);

  // Initialize answers
  useEffect(() => {
    if (!quiz || !id || initialized) return;

    const savedAnswers = localStorage.getItem(getStorageKey('answers'));
    if (savedAnswers) {
      try {
        const parsedAnswers = JSON.parse(savedAnswers);
        if (
          Array.isArray(parsedAnswers) &&
          parsedAnswers.length === questions.length
        ) {
          setSelectedAnswers(parsedAnswers);
        } else {
          setSelectedAnswers(new Array(questions.length).fill(null));
        }
      } catch {
        setSelectedAnswers(new Array(questions.length).fill(null));
      }
    } else {
      setSelectedAnswers(new Array(questions.length).fill(null));
    }
  }, [quiz, id, initialized, questions.length, getStorageKey]);

  // Initialize remaining state
  useEffect(() => {
    if (!quiz || !id || initialized) return;

    const savedQuestionIndex = localStorage.getItem(
      getStorageKey('questionIndex')
    );
    const savedTimeRemaining = localStorage.getItem(
      getStorageKey('timeRemaining')
    );
    const savedTimestamp = localStorage.getItem(getStorageKey('timestamp'));

    if (savedQuestionIndex) {
      const index = Number.parseInt(savedQuestionIndex, 10);
      if (!Number.isNaN(index) && index >= 0 && index < questions.length) {
        setCurrentQuestionIndex(index);
      }
    }

    if (quiz.quizType === 'timed' && quiz.timeLimit) {
      startTimer(savedTimeRemaining, savedTimestamp);
    }

    if (isTaking === null) {
      const hasAttempts =
        (quiz.attemptCount && quiz.attemptCount > 0) ||
        (quiz.attempts && quiz.attempts.length > 0);
      setIsTaking(mode === 'retake' || !hasAttempts);
    }

    setInitialized(true);
  }, [
    quiz,
    id,
    initialized,
    questions.length,
    getStorageKey,
    startTimer,
    isTaking,
  ]);

  // Listen for progressive updates
  useEffect(() => {
    if (!id) return;

    eventsService.connect();

    const handleProgress = (event: any) => {
      // Check if this progress event is for our current quiz
      if (event.metadata?.quizId === id) {
        // Force re-fetch by invalidating query
        queryClient.invalidateQueries({ queryKey: ['quiz', id] });
      }
    };

    const unsubscribe = eventsService.on('quiz.progress', handleProgress);
    return () => {
      unsubscribe?.();
    };
  }, [id, queryClient]);

  // Grow answers array if questions are added in background
  useEffect(() => {
    if (initialized && questions.length > selectedAnswers.length) {
      setSelectedAnswers((prev) => {
        const next = [...prev];
        while (next.length < questions.length) {
          next.push(null);
        }
        return next;
      });
    }
  }, [questions.length, initialized, selectedAnswers.length]);

  // Answer selection handler
  const handleAnswerSelect = useCallback(
    (answer: AnswerValue) => {
      const newAnswers = [...selectedAnswers];
      newAnswers[currentQuestionIndex] = answer;
      setSelectedAnswers(newAnswers);
      saveAnswers(newAnswers);
    },
    [selectedAnswers, currentQuestionIndex, saveAnswers]
  );

  // Navigation handlers
  const handleNext = useCallback(() => {
    if (questions && currentQuestionIndex < questions.length - 1) {
      const newIndex = currentQuestionIndex + 1;
      setCurrentQuestionIndex(newIndex);
      saveQuestionIndex(newIndex);
    }
  }, [currentQuestionIndex, questions, saveQuestionIndex]);

  const handlePrevious = useCallback(() => {
    if (currentQuestionIndex > 0) {
      const newIndex = currentQuestionIndex - 1;
      setCurrentQuestionIndex(newIndex);
      saveQuestionIndex(newIndex);
    }
  }, [currentQuestionIndex, saveQuestionIndex]);

  // Handle error
  if (error) {
    toast.error('Failed to load quiz');
    navigate('/quiz');
    return null;
  }

  // Loading state
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto mb-4" />
          <p className="text-gray-600">Loading quiz...</p>
        </div>
      </div>
    );
  }

  // Quiz not found
  if (!quiz) {
    return (
      <div className="card dark:bg-gray-800 text-center py-12">
        <h3 className="text-xl font-semibold text-gray-600 dark:text-gray-300 mb-2">
          Quiz not found
        </h3>
        <button onClick={() => navigate('/quiz')} className="btn-primary mt-4">
          Back to Quizzes
        </button>
      </div>
    );
  }

  // Quiz taking view
  const currentQuestion = questions[currentQuestionIndex];
  const answeredCount = selectedAnswers.filter((a) => a !== null).length;
  const displayTotalQuestions = quiz.totalQuestionsRequested || questions.length;
  const progressPercentage =
    displayTotalQuestions > 0 ? (answeredCount / displayTotalQuestions) * 100 : 0;

  if (isTaking === false) {
    return (
      <QuizAttemptsView
        quiz={quiz}
        attempts={quiz.attempts || []}
        onRetake={() => setIsTaking(true)}
        onBack={() => navigate('/quiz')}
      />
    );
  }

  // Loading state while determining mode
  if (isTaking === null) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600" />
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-4 sm:space-y-6 pb-6 sm:pb-8">
      <QuizHeader
        quiz={quiz}
        currentQuestionIndex={currentQuestionIndex}
        totalQuestions={displayTotalQuestions}
        answeredCount={answeredCount}
        progressPercentage={progressPercentage}
        timeRemaining={timeRemaining}
        onBack={() => {
          if (quiz.attemptCount && quiz.attemptCount > 0) {
            setIsTaking(false);
          } else {
            navigate('/quiz');
          }
        }}
      />

      <section
        className="card dark:bg-gray-800 border border-primary-200 dark:border-primary-700 shadow-lg p-4 sm:p-6 select-none"
        aria-label="Quiz Questions"
        onCopy={(e) => e.preventDefault()}
        onCut={(e) => e.preventDefault()}
        onPaste={(e) => e.preventDefault()}
        onContextMenu={(e) => e.preventDefault()}
      >
        {quiz.totalQuestionsRequested && questions.length < quiz.totalQuestionsRequested && (
          <div className="mb-6 p-4 bg-primary-50 dark:bg-primary-900/30 border border-primary-100 dark:border-primary-800 rounded-lg flex items-center justify-between animate-pulse">
            <div className="flex items-center gap-3">
              <div className="w-2 h-2 bg-primary-500 rounded-full animate-ping" />
              <p className="text-sm font-medium text-primary-700 dark:text-primary-300">
                Generating more questions... ({questions.length} / {quiz.totalQuestionsRequested})
              </p>
            </div>
            <span className="text-xs text-primary-600 dark:text-primary-400 font-medium">
              You can start now!
            </span>
          </div>
        )}

        <QuestionRenderer
          question={currentQuestion}
          questionIndex={currentQuestionIndex}
          selectedAnswer={selectedAnswers[currentQuestionIndex]}
          onAnswerSelect={handleAnswerSelect}
        />

        <QuizNavigation
          currentQuestionIndex={currentQuestionIndex}
          totalQuestions={questions.length}
          submitting={submitting}
          onPrevious={handlePrevious}
          onNext={handleNext}
          onSubmit={() => handleSubmit()}
        />
      </section>
    </div>
  );
};
