import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { quizService } from '../services/quiz.service';
import type { Quiz, QuizResult, Streak, AnswerValue } from '../types';
import { ArrowLeft, CheckCircle, XCircle, Brain, Trophy, Target, ChevronLeft, ChevronRight, Clock } from 'lucide-react';
import { XPProgressBar } from '../components/XPProgressBar';
import { QuestionRenderer } from '../components/QuestionRenderer';

export const QuizTakePage = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [quiz, setQuiz] = useState<Quiz | null>(null);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [selectedAnswers, setSelectedAnswers] = useState<(AnswerValue | null)[]>([]);
  const [showResults, setShowResults] = useState(false);
  const [result, setResult] = useState<QuizResult | null>(null);
  const [streak, setStreak] = useState<Streak | null>(null);
  const [loading, setLoading] = useState(true);
  const [timeRemaining, setTimeRemaining] = useState<number | null>(null);

  // Get localStorage key for this quiz
  const getStorageKey = (key: string) => `quiz_${id}_${key}`;

  useEffect(() => {
    const loadQuiz = async () => {
      if (!id) return;

      try {
        setLoading(true);
        const loadedQuiz = await quizService.getById(id);
        setQuiz(loadedQuiz);
        
        // Try to restore saved state from localStorage
        const savedAnswers = localStorage.getItem(getStorageKey('answers'));
        const savedQuestionIndex = localStorage.getItem(getStorageKey('questionIndex'));
        const savedTimeRemaining = localStorage.getItem(getStorageKey('timeRemaining'));
        const savedTimestamp = localStorage.getItem(getStorageKey('timestamp'));
        
        if (savedAnswers) {
          try {
            const parsedAnswers = JSON.parse(savedAnswers);
            if (Array.isArray(parsedAnswers) && parsedAnswers.length === loadedQuiz.questions.length) {
              setSelectedAnswers(parsedAnswers);
            } else {
              setSelectedAnswers(new Array(loadedQuiz.questions.length).fill(null));
            }
          } catch {
            setSelectedAnswers(new Array(loadedQuiz.questions.length).fill(null));
          }
        } else {
          setSelectedAnswers(new Array(loadedQuiz.questions.length).fill(null));
        }
        
        if (savedQuestionIndex) {
          const index = parseInt(savedQuestionIndex, 10);
          if (!isNaN(index) && index >= 0 && index < loadedQuiz.questions.length) {
            setCurrentQuestionIndex(index);
          }
        }
        
        // Initialize or restore timer for timed quizzes
        if (loadedQuiz.quizType === 'timed' && loadedQuiz.timeLimit) {
          if (savedTimeRemaining && savedTimestamp) {
            const timeRemaining = parseInt(savedTimeRemaining, 10);
            const timestamp = parseInt(savedTimestamp, 10);
            const now = Date.now();
            const elapsedSeconds = Math.floor((now - timestamp) / 1000);
            const adjustedTime = Math.max(0, timeRemaining - elapsedSeconds);
            setTimeRemaining(adjustedTime);
          } else {
            setTimeRemaining(loadedQuiz.timeLimit);
          }
        }
      } catch (error) {
        toast.error('Failed to load quiz');
        navigate('/quiz');
      } finally {
        setLoading(false);
      }
    };

    loadQuiz();
  }, [id, navigate]);

  // Save state to localStorage whenever it changes
  useEffect(() => {
    if (!id || !quiz || showResults) return;
    
    localStorage.setItem(getStorageKey('answers'), JSON.stringify(selectedAnswers));
    localStorage.setItem(getStorageKey('questionIndex'), currentQuestionIndex.toString());
    if (timeRemaining !== null) {
      localStorage.setItem(getStorageKey('timeRemaining'), timeRemaining.toString());
      localStorage.setItem(getStorageKey('timestamp'), Date.now().toString());
    }
  }, [id, quiz, selectedAnswers, currentQuestionIndex, timeRemaining, showResults]);

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
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [timeRemaining, showResults]);

  const checkAnswerCorrect = (questionType: string, userAnswer: AnswerValue | null, correctAnswer: AnswerValue): boolean => {
    if (userAnswer === null) return false;

    switch (questionType) {
      case 'multi-select': {
        if (!Array.isArray(userAnswer) || !Array.isArray(correctAnswer)) return false;
        if (userAnswer.length !== correctAnswer.length) return false;
        const sortedUser = [...userAnswer].sort((a, b) => Number(a) - Number(b));
        const sortedCorrect = [...correctAnswer].sort((a, b) => Number(a) - Number(b));
        return sortedUser.every((val, idx) => val === sortedCorrect[idx]);
      }

      case 'matching': {
        if (typeof userAnswer !== 'object' || typeof correctAnswer !== 'object') return false;
        if (Array.isArray(userAnswer) || Array.isArray(correctAnswer)) return false;
        const userObj = userAnswer as { [key: string]: string };
        const correctObj = correctAnswer as { [key: string]: string };
        const userKeys = Object.keys(userObj).sort((a, b) => a.localeCompare(b));
        const correctKeys = Object.keys(correctObj).sort((a, b) => a.localeCompare(b));
        if (userKeys.length !== correctKeys.length) return false;
        if (!userKeys.every((key, idx) => key === correctKeys[idx])) return false;
        return userKeys.every(key => userObj[key] === correctObj[key]);
      }

      default:
        return JSON.stringify(userAnswer) === JSON.stringify(correctAnswer);
    }
  };

  const handleAnswerSelect = (answer: AnswerValue) => {
    const newAnswers = [...selectedAnswers];
    newAnswers[currentQuestionIndex] = answer;
    setSelectedAnswers(newAnswers);
  };

  const handleNext = () => {
    if (quiz && currentQuestionIndex < quiz.questions.length - 1) {
      setCurrentQuestionIndex(currentQuestionIndex + 1);
    }
  };

  const handlePrevious = () => {
    if (currentQuestionIndex > 0) {
      setCurrentQuestionIndex(currentQuestionIndex - 1);
    }
  };

  const handleSubmit = async (force = false) => {
    if (!quiz || !id) return;

    // If not forced, require all questions to be answered
    if (!force && selectedAnswers.some((answer) => answer === null)) {
      toast.error('Please answer all questions before submitting.');
      return;
    }

    try {
      const { result: submissionResult, gamification } = await quizService.submit(id, {
        answers: selectedAnswers as AnswerValue[],
      });
      setResult(submissionResult);
      setStreak(gamification.streak);
      setShowResults(true);
      
      // Clear saved state from localStorage after submission
      localStorage.removeItem(getStorageKey('answers'));
      localStorage.removeItem(getStorageKey('questionIndex'));
      localStorage.removeItem(getStorageKey('timeRemaining'));
      localStorage.removeItem(getStorageKey('timestamp'));
      
      toast.success(force ? 'Time is up! Quiz submitted.' : 'Quiz submitted successfully!');
    } catch (error) {
      toast.error('Failed to submit quiz. Please try again.');
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
      <div className="card text-center py-12">
        <h3 className="text-xl font-semibold text-gray-600 mb-2">Quiz not found</h3>
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
      <div className="max-w-4xl mx-auto space-y-6 pb-8">
        {/* Results Hero */}
        <div className="relative overflow-hidden rounded-xl bg-gradient-to-br from-blue-600 via-indigo-600 to-purple-700 p-8 shadow-lg">
          <div className="absolute inset-0 opacity-10">
            <div className="absolute -top-10 -right-10 w-40 h-40 bg-white rounded-full"></div>
            <div className="absolute -bottom-10 -left-10 w-40 h-40 bg-white rounded-full"></div>
          </div>
          
          <div className="relative z-10">
            <button
              onClick={() => navigate('/quiz')}
              className="flex items-center gap-2 text-white hover:text-blue-100 mb-6 transition-colors"
            >
              <ArrowLeft className="w-5 h-5" />
              Back to Quizzes
            </button>

            <div className="text-center py-8">
              {/* Score Circle */}
              <div className="inline-flex items-center justify-center w-44 h-44 rounded-full bg-white shadow-2xl mb-6 relative">
                <div className="text-center">
                  <div className="text-6xl font-bold text-gray-900 mb-1">
                    {result.percentage}%
                  </div>
                  <div className="text-gray-500 text-sm font-medium">
                    {result.score} of {result.totalQuestions} correct
                  </div>
                </div>
                {/* Decorative ring */}
                <div className={`absolute inset-0 rounded-full border-4 ${
                  isPerfect ? 'border-yellow-400' : isExcellent ? 'border-green-400' : isGood ? 'border-blue-400' : 'border-gray-300'
                }`}></div>
              </div>
              
              {/* Message */}
              <h1 className="text-3xl font-bold text-white mb-2">
                {isPerfect
                  ? '🎉 Perfect Score!'
                  : isExcellent
                  ? '🌟 Excellent Work!'
                  : isGood
                  ? '👍 Good Job!'
                  : '💪 Keep Practicing!'}
              </h1>
              <p className="text-blue-100 text-lg">
                {isPerfect
                  ? 'You got every question right!'
                  : isExcellent
                  ? 'You really know your stuff!'
                  : isGood
                  ? 'Nice work, keep it up!'
                  : 'Review the answers and try again!'}
              </p>
            </div>
          </div>
        </div>

        {/* XP and Level Progress */}
        {streak && (
          <XPProgressBar streak={streak} showLevelUp={true} />
        )}

        <div className="card">
          <div className="flex items-center gap-3 mb-6">
            <div className="p-2 bg-gradient-to-br from-blue-100 to-indigo-100 rounded-lg">
              <Target className="w-6 h-6 text-blue-600" />
            </div>
            <h2 className="text-2xl font-bold text-gray-900">Review Answers</h2>
          </div>
          <div className="space-y-6">
            {quiz.questions.map((question, index) => {
              const userAnswer = selectedAnswers[index];
              const correctAnswer = result.correctAnswers[index];
              
              // Determine if answer is correct based on question type
              const isCorrect = checkAnswerCorrect(question.questionType, userAnswer, correctAnswer);

              return (
                <div
                  key={index}
                  className={`p-6 rounded-xl border-2 transition-all ${
                    isCorrect 
                      ? 'border-green-300 bg-gradient-to-br from-green-50 to-emerald-50' 
                      : 'border-red-300 bg-gradient-to-br from-red-50 to-pink-50'
                  }`}
                >
                  <div className="flex items-start gap-3 mb-4">
                    {isCorrect ? (
                      <CheckCircle className="w-6 h-6 text-green-600 flex-shrink-0 mt-1" />
                    ) : (
                      <XCircle className="w-6 h-6 text-red-600 flex-shrink-0 mt-1" />
                    )}
                    <div className="flex-1">
                      <QuestionRenderer
                        question={question}
                        questionIndex={index}
                        selectedAnswer={userAnswer}
                        onAnswerSelect={() => {}}
                        showResults={true}
                        correctAnswer={correctAnswer}
                      />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    );
  }

  const currentQuestion = quiz.questions[currentQuestionIndex];
  const answeredCount = selectedAnswers.filter((a) => a !== null).length;
  const progressPercentage = quiz.questions.length > 0 
    ? (answeredCount / quiz.questions.length) * 100 
    : 0;

  return (
    <div className="max-w-4xl mx-auto space-y-6 pb-8">
      {/* Header */}
      <div className="relative overflow-hidden rounded-xl bg-primary-600 p-6 shadow-lg">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute -top-10 -right-10 w-40 h-40 bg-white rounded-full"></div>
          <div className="absolute -bottom-10 -left-10 w-40 h-40 bg-white rounded-full"></div>
        </div>
        
        <div className="relative z-10">
          <button
            onClick={() => navigate('/quiz')}
            className="flex items-center gap-2 text-white hover:text-primary-100 mb-4 transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
            Back to Quizzes
          </button>

          <div className="flex items-start justify-between gap-3 mb-4">
            <div className="flex items-start gap-3">
              <div className="p-2 bg-white/20 backdrop-blur-sm rounded-lg">
                <Brain className="w-6 h-6 text-white" />
              </div>
              <div className="flex-1">
                <h1 className="text-3xl font-bold text-white mb-2">{quiz.title}</h1>
                <div className="flex items-center gap-3 text-sm text-primary-100">
                  <span>{quiz.topic}</span>
                  {quiz.difficulty && (
                    <>
                      <span>•</span>
                      <span className="px-2 py-1 bg-white/20 backdrop-blur-sm rounded capitalize font-medium">
                        {quiz.difficulty}
                      </span>
                    </>
                  )}
                </div>
              </div>
            </div>
            {quiz.quizType === 'timed' && timeRemaining !== null && (
              <div className={`flex items-center gap-2 ${
                timeRemaining < 60 
                  ? 'animate-pulse' 
                  : ''
              }`}>
                <Clock className="w-8 h-8 text-white" />
                <span className="font-mono font-bold text-white text-4xl">
                  {Math.floor(timeRemaining / 60)}:{(timeRemaining % 60).toString().padStart(2, '0')}
                </span>
              </div>
            )}
          </div>

          {/* Progress */}
          <div className="mt-6">
            <div className="flex justify-between text-sm text-white mb-2">
              <span className="font-medium">
                Question {currentQuestionIndex + 1} of {quiz.questions.length}
              </span>
              <span className="font-medium">
                {answeredCount} / {quiz.questions.length} answered
              </span>
            </div>
            <div className="w-full bg-white/20 rounded-full h-2.5 overflow-hidden">
              <div
                className="bg-green-400 h-2.5 rounded-full transition-all duration-300 shadow-lg"
                style={{ width: `${progressPercentage}%` }}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Question */}
      <div className="card border border-primary-200 shadow-lg">
        <QuestionRenderer
          question={currentQuestion}
          questionIndex={currentQuestionIndex}
          selectedAnswer={selectedAnswers[currentQuestionIndex]}
          onAnswerSelect={handleAnswerSelect}
        />

        {/* Navigation */}
        <div className="flex items-center justify-between pt-6 border-t border-gray-200 mt-6">
          <button
            onClick={handlePrevious}
            disabled={currentQuestionIndex === 0}
            className="flex items-center gap-2 px-5 py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-700 font-medium rounded-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <ChevronLeft className="w-5 h-5" />
            Previous
          </button>

          {currentQuestionIndex === quiz.questions.length - 1 ? (
            <button 
              onClick={() => handleSubmit()} 
              className="flex items-center gap-2 px-6 py-2.5 bg-primary-600 hover:bg-primary-700 text-white font-semibold rounded-lg transition-all shadow-md hover:shadow-lg"
            >
              <Trophy className="w-5 h-5" />
              Submit Quiz
            </button>
          ) : (
            <button 
              onClick={handleNext} 
              className="flex items-center gap-2 px-6 py-2.5 bg-primary-600 hover:bg-primary-700 text-white font-semibold rounded-lg transition-all shadow-md hover:shadow-lg"
            >
              Next
              <ChevronRight className="w-5 h-5" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
