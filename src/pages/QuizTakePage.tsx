import { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import { useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { quizService } from '../services/quiz.service';
import type { QuizResult, AnswerValue } from '../types';
import {
  ArrowLeft,
  Brain,
  Trophy,
  ChevronLeft,
  ChevronRight,
  Clock,
} from 'lucide-react';

import { QuestionRenderer } from '../components/QuestionRenderer';
import { QuizReview } from '../components/quiz/QuizReview';
import { useQuiz } from '../hooks';

export const QuizTakePage = () => {
  const { id, attemptId } = useParams<{ id: string; attemptId?: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [searchParams] = useSearchParams();
  const challengeId = searchParams.get('challengeId');
  const { data: quiz, isLoading: loading, error } = useQuiz(id);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [selectedAnswers, setSelectedAnswers] = useState<
    (AnswerValue | null)[]
  >([]);
  const [showResults, setShowResults] = useState(false);
  const [result, setResult] = useState<QuizResult | null>(null);

  const [timeRemaining, setTimeRemaining] = useState<number | null>(null);
  const [challengeResult, setChallengeResult] = useState<any>(null);
  const [submitting, setSubmitting] = useState(false);

  // Use questions directly from the API without shuffling
  const questions = quiz?.questions || [];

  // Get localStorage key for this quiz (memoized to prevent dependency issues)
  const getStorageKey = useCallback((key: string) => `quiz_${id}_${key}`, [id]);

  // Handle submit (defined early to be used in timer useEffect)
  const handleSubmit = useCallback(
    async (force = false) => {
      if (!quiz || !id) return;

      // If not forced, require all questions to be answered
      if (!force && selectedAnswers.some((answer) => answer === null)) {
        toast.error('Please answer all questions before submitting.');
        return;
      }

      setSubmitting(true);
      try {
        const { result: submissionResult } = await quizService.submit(id, {
          answers: selectedAnswers as AnswerValue[],
          challengeId: challengeId || undefined,
        });
        setResult(submissionResult);

        // Clear saved state from localStorage after submission
        localStorage.removeItem(getStorageKey('answers'));
        localStorage.removeItem(getStorageKey('questionIndex'));
        localStorage.removeItem(getStorageKey('timeRemaining'));
        localStorage.removeItem(getStorageKey('timestamp'));

        toast.success(
          force ? 'Time is up! Quiz submitted.' : 'Quiz submitted successfully!'
        );

        // If this is a challenge quiz, handle challenge completion
        if (challengeId) {
          try {
            const { challengeService } = await import('../services');
            const challengeCompletionResult =
              await challengeService.completeQuizInChallenge(challengeId, id, {
                score: submissionResult.score,
                totalQuestions: submissionResult.totalQuestions,
                attemptId: submissionResult.attemptId,
              });

            setChallengeResult(challengeCompletionResult);

            // Invalidate challenges cache
            await queryClient.invalidateQueries({ queryKey: ['challenges'] });

            // Navigate based on challenge completion status
            if (challengeCompletionResult.completed) {
              // All quizzes completed, go to results
              navigate(`/challenges/${challengeId}/results`);
            } else {
              // More quizzes to complete, show results first then user can continue
              setShowResults(true);
            }
          } catch (_error) {
            // Still show results even if challenge update fails
            setShowResults(true);
          }
        } else {
          // Regular quiz, just show results
          setShowResults(true);
        }

        // Calculate duration if possible, otherwise 0
        // Calculate duration if possible, otherwise 0
        // const duration = quiz.timeLimit && timeRemaining !== null ? quiz.timeLimit - timeRemaining : 0;
      } catch (_error) {
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
      getStorageKey,
      queryClient,
      navigate,
    ]
  );

  // Handle errors
  if (error) {
    toast.error('Failed to load quiz');
    navigate('/quiz');
  }

  // Effect to load attempt for review if attemptId is present
  useEffect(() => {
    if (attemptId && quiz) {
      const loadAttempt = async () => {
        try {
          const attempt = await quizService.getAttemptById(attemptId);

          // Reconstruct result object
          const score = attempt.score ?? 0;
          const totalQuestions = attempt.totalQuestions ?? 0;

          const mockResult: QuizResult = {
            attemptId: attempt.id,
            score: score,
            totalQuestions: totalQuestions,
            percentage:
              totalQuestions > 0
                ? Math.round((score / totalQuestions) * 100)
                : 0,
            correctAnswers: quiz.questions.map((q) => q.correctAnswer),
            feedback: { message: 'Reviewing past attempt' }, // Simplified feedback
          };

          setResult(mockResult);

          // Parse answers if they are stored as JSON strings in the attempt
          // Ensure your backend returns 'answers' field. If not, we might need to update backend or ignore user answers in review.
          // Assuming attempt.answers is available and matches format.
          // If answers are NOT in the fetch, we can't show user selections, only correct ones.
          // For now, let's assume we can treat it as nulls if missing, preventing errors.
          if ((attempt as any).answers) {
            const answers = (attempt as any).answers;
            // If answer is string/json, parse it
            if (typeof answers === 'string') {
              try {
                setSelectedAnswers(JSON.parse(answers));
              } catch {
                // ignore
              }
            } else if (Array.isArray(answers)) {
              setSelectedAnswers(answers);
            }
          }

          setShowResults(true);
        } catch (_error) {
          toast.error('Failed to load attempt details');
        }
      };

      loadAttempt();
    }
  }, [attemptId, quiz]);

  // Restore state from localStorage when quiz loads (only if NOT reviewing)
  useEffect(() => {
    if (!quiz || !id || attemptId) return;

    // Try to restore saved state from localStorage
    const savedAnswers = localStorage.getItem(getStorageKey('answers'));
    const savedQuestionIndex = localStorage.getItem(
      getStorageKey('questionIndex')
    );
    const savedTimeRemaining = localStorage.getItem(
      getStorageKey('timeRemaining')
    );
    const savedTimestamp = localStorage.getItem(getStorageKey('timestamp'));

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

    if (savedQuestionIndex) {
      const index = parseInt(savedQuestionIndex, 10);
      if (!isNaN(index) && index >= 0 && index < questions.length) {
        setCurrentQuestionIndex(index);
      }
    }

    // Initialize or restore timer for timed quizzes
    if (quiz.quizType === 'timed' && quiz.timeLimit) {
      if (savedTimeRemaining && savedTimestamp) {
        const timeRemaining = parseInt(savedTimeRemaining, 10);
        const timestamp = parseInt(savedTimestamp, 10);
        const now = Date.now();
        const elapsedSeconds = Math.floor((now - timestamp) / 1000);
        const adjustedTime = Math.max(0, timeRemaining - elapsedSeconds);
        setTimeRemaining(adjustedTime);
      } else {
        setTimeRemaining(quiz.timeLimit);
      }
    }
  }, [quiz, id, attemptId, questions, getStorageKey]);

  // Timer effect for timed quizzes
  useEffect(() => {
    if (timeRemaining === null || timeRemaining <= 0 || showResults) return;

    const timer = setInterval(() => {
      setTimeRemaining((prev) => {
        if (prev === null || prev <= 1) {
          // Time's up - auto submit and score
          handleSubmit(true);
          return 0;
        }
        const newTime = prev - 1;
        // Save time to localStorage
        localStorage.setItem(
          getStorageKey('timeRemaining'),
          newTime.toString()
        );
        localStorage.setItem(getStorageKey('timestamp'), Date.now().toString());
        return newTime;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [timeRemaining, showResults, getStorageKey, handleSubmit]);

  const handleAnswerSelect = (answer: AnswerValue) => {
    const newAnswers = [...selectedAnswers];
    newAnswers[currentQuestionIndex] = answer;
    setSelectedAnswers(newAnswers);
    // Save to localStorage
    localStorage.setItem(getStorageKey('answers'), JSON.stringify(newAnswers));
  };

  const handleNext = () => {
    if (
      questions &&
      currentQuestionIndex < questions.length - 1
    ) {
      const newIndex = currentQuestionIndex + 1;
      setCurrentQuestionIndex(newIndex);
      localStorage.setItem(getStorageKey('questionIndex'), newIndex.toString());
    }
  };

  const handlePrevious = () => {
    if (currentQuestionIndex > 0) {
      const newIndex = currentQuestionIndex - 1;
      setCurrentQuestionIndex(newIndex);
      localStorage.setItem(getStorageKey('questionIndex'), newIndex.toString());
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading quiz...</p>
        </div>
      </div>
    );
  }

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

  if (showResults && result) {
    const isPerfect = result.percentage === 100;
    const isExcellent = result.percentage >= 80;
    const isGood = result.percentage >= 60;

    return (
      <div className="max-w-4xl mx-auto space-y-4 sm:space-y-6 pb-6 sm:pb-8">
        {/* Results Hero */}
        <div className="relative overflow-hidden rounded-lg sm:rounded-xl bg-gradient-to-br from-blue-600 via-indigo-600 to-purple-700 dark:from-blue-900 dark:via-indigo-900 dark:to-purple-900 p-6 sm:p-8 shadow-lg">
          <div className="absolute inset-0 opacity-10">
            <div className="absolute -top-10 -right-10 w-40 h-40 bg-white rounded-full"></div>
            <div className="absolute -bottom-10 -left-10 w-40 h-40 bg-white rounded-full"></div>
          </div>

          <div className="relative z-10">
            <button
              onClick={() =>
                challengeId
                  ? navigate(`/challenges/${challengeId}`)
                  : navigate('/quiz')
              }
              className="flex items-center gap-2 text-white hover:text-blue-100 dark:hover:text-blue-200 mb-4 sm:mb-6 transition-colors touch-manipulation"
            >
              <ArrowLeft className="w-4 h-4 sm:w-5 sm:h-5" />
              <span className="text-sm sm:text-base">
                {challengeId ? 'Back to Challenge' : 'Back to Quizzes'}
              </span>
            </button>

            <div className="text-center py-4 sm:py-8">
              {/* Score Circle */}
              <div className="inline-flex items-center justify-center w-32 h-32 sm:w-40 sm:h-40 md:w-44 md:h-44 rounded-full bg-white dark:bg-gray-800 shadow-2xl mb-4 sm:mb-6 relative">
                <div className="text-center">
                  <div className="text-4xl sm:text-5xl md:text-6xl font-bold text-gray-900 dark:text-white mb-1">
                    {result.percentage}%
                  </div>
                  <div className="text-gray-500 dark:text-gray-400 text-xs sm:text-sm font-medium">
                    {result.score} of {result.totalQuestions} correct
                  </div>
                </div>
                {/* Decorative ring */}
                <div
                  className={`absolute inset-0 rounded-full border-3 sm:border-4 ${
                    isPerfect
                      ? 'border-yellow-400'
                      : isExcellent
                        ? 'border-green-400'
                        : isGood
                          ? 'border-blue-400'
                          : 'border-gray-300'
                  }`}
                ></div>
              </div>

              {/* Message */}
              <h1 className="text-xl sm:text-2xl md:text-3xl font-bold text-white mb-2">
                {isPerfect
                  ? '🎉 Perfect Score!'
                  : isExcellent
                    ? '🌟 Excellent Work!'
                    : isGood
                      ? '👍 Good Job!'
                      : '💪 Keep Practicing!'}
              </h1>
              <p className="text-blue-100 dark:text-blue-200 text-sm sm:text-base md:text-lg px-4">
                {(() => {
                  const message =
                    result.feedback?.message ||
                    (isPerfect
                      ? 'You got every question right!'
                      : isExcellent
                        ? 'You really know your stuff!'
                        : isGood
                          ? 'Nice work, keep it up!'
                          : 'Review the answers and try again!');

                  return message.split('**').map((part, index) =>
                    index % 2 === 1 ? (
                      <strong key={index} className="font-bold text-white">
                        {part}
                      </strong>
                    ) : (
                      part
                    )
                  );
                })()}
              </p>
            </div>
          </div>
        </div>

        {/* Continue to Next Quiz button for challenges */}
        {challengeId && challengeResult && !challengeResult.completed && (
          <div className="card dark:bg-gray-800 p-4 sm:p-6 bg-gradient-to-r from-primary-50 to-indigo-50 dark:from-primary-900/20 dark:to-indigo-900/20 border-primary-200 dark:border-primary-800">
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
              <div>
                <h3 className="font-bold text-gray-900 dark:text-white mb-1">
                  Challenge Progress
                </h3>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Quiz {challengeResult.currentQuizIndex} of{' '}
                  {challengeResult.totalQuizzes} completed
                </p>
              </div>
              <button
                onClick={async () => {
                  try {
                    const { challengeService } = await import('../services');
                    const challenge =
                      await challengeService.getChallengeById(challengeId);
                    const nextQuiz =
                      challenge.quizzes?.[challengeResult.currentQuizIndex];
                    if (nextQuiz) {
                      navigate(
                        `/quiz/${nextQuiz.quizId}?challengeId=${challengeId}`
                      );
                    }
                  } catch (_error) {
                    toast.error('Failed to load next quiz');
                  }
                }}
                className="flex items-center gap-2 px-6 py-3 bg-primary-600 hover:bg-primary-700 text-white font-bold rounded-lg transition-all shadow-lg hover:shadow-xl"
              >
                <span>Continue to Next Quiz</span>
                <ChevronRight className="w-5 h-5" />
              </button>
            </div>
          </div>
        )}

        <QuizReview
          quiz={quiz}
          result={result}
          selectedAnswers={selectedAnswers}
          challengeId={challengeId || undefined}
        />
      </div>
    );
  }

  const currentQuestion = questions[currentQuestionIndex];
  const answeredCount = selectedAnswers.filter((a) => a !== null).length;
  const progressPercentage =
    questions.length > 0
      ? (answeredCount / questions.length) * 100
      : 0;

  return (
    <div className="max-w-4xl mx-auto space-y-4 sm:space-y-6 pb-6 sm:pb-8">
      {/* Header */}
      <div className="relative overflow-hidden rounded-lg sm:rounded-xl bg-gradient-to-br from-primary-600 to-primary-800 dark:from-primary-900 dark:to-primary-950 p-4 sm:p-6 shadow-lg">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute -top-10 -right-10 w-40 h-40 bg-white rounded-full"></div>
          <div className="absolute -bottom-10 -left-10 w-40 h-40 bg-white rounded-full"></div>
        </div>

        <div className="relative z-10">
          <button
            onClick={() => navigate('/quiz')}
            className="flex items-center gap-2 text-white bg-white/10 hover:bg-white/20 px-3 py-1.5 rounded-lg backdrop-blur-sm mb-3 sm:mb-4 transition-all touch-manipulation w-fit"
          >
            <ArrowLeft className="w-4 h-4 sm:w-5 sm:h-5" />
            <span className="text-sm sm:text-base font-medium">
              Back to Quizzes
            </span>
          </button>

          <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3 sm:gap-4 mb-3 sm:mb-4">
            <div className="flex items-start gap-2 sm:gap-3 flex-1 min-w-0">
              <div className="p-1.5 sm:p-2 bg-white/20 backdrop-blur-sm rounded-lg flex-shrink-0">
                <Brain className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
              </div>
              <div className="flex-1 min-w-0">
                <h1 className="text-lg sm:text-2xl md:text-3xl font-bold text-white mb-1 sm:mb-2 break-words">
                  {quiz.title}
                </h1>
                <div className="flex flex-wrap items-center gap-2 sm:gap-3 text-xs sm:text-sm text-primary-100 dark:text-primary-200">
                  <span className="truncate">{quiz.topic}</span>
                  {quiz.difficulty && (
                    <>
                      <span className="hidden sm:inline">•</span>
                      <span className="px-2 py-0.5 sm:py-1 bg-white/20 backdrop-blur-sm rounded capitalize font-medium text-xs sm:text-sm">
                        {quiz.difficulty}
                      </span>
                    </>
                  )}
                </div>
              </div>
            </div>
            {quiz.quizType === 'timed' && timeRemaining !== null && (
              <div
                className={`flex items-center gap-1.5 sm:gap-2 self-start sm:self-auto ${
                  timeRemaining < 60 ? 'animate-pulse' : ''
                }`}
              >
                <Clock className="w-5 h-5 sm:w-6 sm:h-6 md:w-8 md:h-8 text-white flex-shrink-0" />
                <span className="font-mono font-bold text-white text-xl sm:text-2xl md:text-4xl">
                  {Math.floor(timeRemaining / 60)}:
                  {(timeRemaining % 60).toString().padStart(2, '0')}
                </span>
              </div>
            )}
          </div>

          {/* Progress */}
          <div className="mt-4 sm:mt-6">
            <div className="flex justify-between text-xs sm:text-sm text-white mb-2">
              <span className="font-medium">
                Q {currentQuestionIndex + 1}/{questions.length}
              </span>
              <span className="font-medium">
                {answeredCount}/{questions.length} answered
              </span>
            </div>
            <div className="w-full bg-white/20 rounded-full h-2 sm:h-2.5 overflow-hidden">
              <div
                className="bg-green-400 h-2 sm:h-2.5 rounded-full transition-all duration-300 shadow-lg"
                style={{ width: `${progressPercentage}%` }}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Question */}
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

        {/* Navigation */}
        <div className="flex items-center justify-between gap-2 sm:gap-3 pt-4 sm:pt-6 border-t border-gray-200 dark:border-gray-700 mt-4 sm:mt-6">
          <button
            onClick={handlePrevious}
            disabled={currentQuestionIndex === 0}
            className="flex items-center gap-1 sm:gap-2 px-3 sm:px-5 py-2.5 sm:py-3 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-200 font-medium rounded-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed touch-manipulation text-sm sm:text-base"
          >
            <ChevronLeft className="w-4 h-4 sm:w-5 sm:h-5 flex-shrink-0" />
            <span className="hidden sm:inline">Previous</span>
            <span className="sm:hidden">Prev</span>
          </button>

          {currentQuestionIndex === questions.length - 1 ? (
            <button
              onClick={() => handleSubmit()}
              disabled={submitting}
              className="flex items-center gap-1 sm:gap-2 px-4 sm:px-6 py-2.5 sm:py-3 bg-primary-600 hover:bg-primary-700 text-white font-semibold rounded-lg transition-all shadow-md hover:shadow-lg touch-manipulation text-sm sm:text-base disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {submitting ? (
                <>
                  <div className="w-4 h-4 sm:w-5 sm:h-5 border-2 border-white border-t-transparent rounded-full animate-spin flex-shrink-0" />
                  <span>Submitting...</span>
                </>
              ) : (
                <>
                  <Trophy className="w-4 h-4 sm:w-5 sm:h-5 flex-shrink-0" />
                  <span>Submit Quiz</span>
                </>
              )}
            </button>
          ) : (
            <button
              onClick={handleNext}
              disabled={submitting}
              className="flex items-center gap-1 sm:gap-2 px-4 sm:px-6 py-2.5 sm:py-3 bg-primary-600 hover:bg-primary-700 text-white font-semibold rounded-lg transition-all shadow-md hover:shadow-lg touch-manipulation text-sm sm:text-base disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {submitting ? (
                <>
                  <div className="w-4 h-4 sm:w-5 sm:h-5 border-2 border-white border-t-transparent rounded-full animate-spin flex-shrink-0" />
                  <span>Submitting...</span>
                </>
              ) : (
                <>
                  <span>Next</span>
                  <ChevronRight className="w-4 h-4 sm:w-5 sm:h-5 flex-shrink-0" />
                </>
              )}
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
