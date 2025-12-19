import { useState, useCallback, useMemo, useEffect } from 'react';
import { useParams, useNavigate, useSearchParams, useLocation } from 'react-router-dom';
import { useQueryClient } from '@tanstack/react-query';
import { Toast as toast } from '../utils/toast';
import { quizService } from '../services/quiz.service';
import type { AnswerValue } from '../types';

import { QuestionRenderer } from '../components/QuestionRenderer';
import { useQuiz } from '../hooks';
import { useQuizTimer } from '../hooks/useQuizTimer';
import { useQuizStorage } from '../hooks/useQuizStorage';
import { QuizHeader } from '../components/quiz/QuizHeader';
import { QuizNavigation } from '../components/quiz/QuizNavigation';
import { QuizAttemptsHistory } from '../components/quiz/QuizAttemptsHistory';

export const QuizTakePage = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [searchParams] = useSearchParams();
  const challengeId = searchParams.get('challengeId');
  const location = useLocation();

  const { data: quiz, isLoading: loading, error } = useQuiz(id);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [selectedAnswers, setSelectedAnswers] = useState<
    (AnswerValue | null)[]
  >([]);
  const [submitting, setSubmitting] = useState(false);
  const [initialized, setInitialized] = useState(false);
  const [showHistory, setShowHistory] = useState(false);

  const questions = useMemo(() => quiz?.questions ?? [], [quiz?.questions]);

  // Storage key generator
  const getStorageKey = useCallback((key: string) => `quiz_${id}_${key}`, [id]);

  // Custom hooks for storage
  const { saveAnswers, saveQuestionIndex, clearStorage } = useQuizStorage({
    getStorageKey,
  });

  // Handle submit
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

        // Handle challenge completion
        if (challengeId) {
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
              navigate(
                `/quiz/attempt/${submissionResult.attemptId}/review?challengeId=${challengeId}`,
                {
                  state: {
                    breadcrumb: quiz.studyPack
                      ? [
                          { label: quiz.studyPack.title, path: `/study-packs/${quiz.studyPack.id}` },
                          { label: quiz.title, path: null },
                          { label: 'Review', path: null },
                        ]
                      : [
                          { label: 'Quizzes', path: '/quiz' },
                          { label: quiz.title, path: null },
                          { label: 'Review', path: null },
                        ],
                  },
                }
              );
            }
          } catch {
            navigate(
              `/quiz/attempt/${submissionResult.attemptId}/review?challengeId=${challengeId}`,
              {
                state: {
                  breadcrumb: quiz.studyPack
                    ? [
                        { label: quiz.studyPack.title, path: `/study-packs/${quiz.studyPack.id}` },
                        { label: quiz.title, path: null },
                        { label: 'Review', path: null },
                      ]
                    : [
                        { label: 'Quizzes', path: '/quiz' },
                        { label: quiz.title, path: null },
                        { label: 'Review', path: null },
                      ],
                },
              }
            );
          }
        } else {
          navigate(`/quiz/attempt/${submissionResult.attemptId}/review`, {
            state: {
              breadcrumb: quiz.studyPack
                ? [
                    { label: quiz.studyPack.title, path: `/study-packs/${quiz.studyPack.id}` },
                    { label: quiz.title, path: null },
                    { label: 'Review', path: null },
                  ]
                : [
                    { label: 'Quizzes', path: '/quiz' },
                    { label: quiz.title, path: null },
                    { label: 'Review', path: null },
                  ],
            },
          });
        }
      } catch {
        toast.error('Failed to submit quiz. Please try again.');
      } finally {
        setSubmitting(false);
      }
    },
    [
      quiz,
      id,
      selectedAnswers,
      challengeId,
      clearStorage,
      queryClient,
      navigate,
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

    const hasAttempts = (quiz.attemptCount && quiz.attemptCount > 0) || 
                        (quiz.attempts && quiz.attempts.length > 0);

    const breadcrumbItems = [];

    // Add study pack if it exists
    if (quiz.studyPack) {
      breadcrumbItems.push(
        { label: quiz.studyPack.title, path: `/study-packs/${quiz.studyPack.id}` }
      );
    } else {
      breadcrumbItems.push(
        { label: 'Quizzes', path: '/quiz' }
      );
    }

    // Add quiz title (non-clickable)
    breadcrumbItems.push(
      { label: quiz.title, path: null }
    );

    // Add "Retake" if applicable
    if (hasAttempts) {
      breadcrumbItems.push(
        { label: 'Retake', path: null }
      );
    }

    navigate(location.pathname + location.search, {
      replace: true,
      state: {
        breadcrumb: breadcrumbItems,
      },
    });
  }, [quiz, id, loading, location, navigate]);

  // Check if quiz has attempts and show history view
  useEffect(() => {
    if (!quiz || loading) return;
    
    // Show history if quiz has attempts and user hasn't explicitly started retaking
    const hasAttempts = quiz.attempts && quiz.attempts.length > 0;
    const hasStoredProgress = localStorage.getItem(getStorageKey('answers'));
    
    // Show history only if there are attempts and no stored progress
    setShowHistory(Boolean(hasAttempts && !hasStoredProgress));
  }, [quiz, loading, getStorageKey]);

  // Initialize quiz state (runs once when quiz loads)
  useMemo(() => {
    if (!quiz || !id || initialized) return;

    const savedAnswers = localStorage.getItem(getStorageKey('answers'));
    const savedQuestionIndex = localStorage.getItem(
      getStorageKey('questionIndex')
    );
    const savedTimeRemaining = localStorage.getItem(
      getStorageKey('timeRemaining')
    );
    const savedTimestamp = localStorage.getItem(getStorageKey('timestamp'));

    // Restore answers
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

    // Restore question index
    if (savedQuestionIndex) {
      const index = parseInt(savedQuestionIndex, 10);
      if (!isNaN(index) && index >= 0 && index < questions.length) {
        setCurrentQuestionIndex(index);
      }
    }

    // Start timer for timed quizzes
    if (quiz.quizType === 'timed' && quiz.timeLimit) {
      startTimer(savedTimeRemaining, savedTimestamp);
    }

    setInitialized(true);
  }, [quiz, id, initialized, questions.length, getStorageKey, startTimer]);

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

  // Show attempts history if applicable
  if (showHistory && quiz.attempts && quiz.attempts.length > 0) {
    return (
      <QuizAttemptsHistory
        quizTitle={quiz.title}
        attempts={quiz.attempts}
        onRetake={() => setShowHistory(false)}
      />
    );
  }

  // Quiz taking view
  const currentQuestion = questions[currentQuestionIndex];
  const answeredCount = selectedAnswers.filter((a) => a !== null).length;
  const progressPercentage =
    questions.length > 0 ? (answeredCount / questions.length) * 100 : 0;

  return (
    <div className="max-w-4xl mx-auto space-y-4 sm:space-y-6 pb-6 sm:pb-8">
      <QuizHeader
        quiz={quiz}
        currentQuestionIndex={currentQuestionIndex}
        totalQuestions={questions.length}
        answeredCount={answeredCount}
        progressPercentage={progressPercentage}
        timeRemaining={timeRemaining}
        onBack={() => navigate('/quiz')}
      />

      <div
        className="card dark:bg-gray-800 border border-primary-200 dark:border-primary-700 shadow-lg p-4 sm:p-6 select-none"
        onCopy={(e) => e.preventDefault()}
        onCut={(e) => e.preventDefault()}
        onPaste={(e) => e.preventDefault()}
        onContextMenu={(e) => e.preventDefault()}
      >
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
      </div>
    </div>
  );
};
