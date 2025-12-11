import { useState, useEffect, useRef } from 'react';
import {
  useParams,
  useNavigate,
  useSearchParams,
  useLocation,
} from 'react-router-dom';
import toast from 'react-hot-toast';
import { quizService } from '../services/quiz.service';
import type { Quiz, QuizResult, AnswerValue } from '../types';
import { QuizScoreCard } from '../components/quiz/QuizScoreCard';
import { QuizReviewContent } from '../components/quiz/QuizReview';

export const QuizReviewPage = () => {
  const { attemptId } = useParams<{ attemptId: string }>();
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams] = useSearchParams();
  const challengeId = searchParams.get('challengeId');

  const [loading, setLoading] = useState(true);
  const [quiz, setQuiz] = useState<Quiz | null>(null);
  const [result, setResult] = useState<QuizResult | null>(null);
  const [selectedAnswers, setSelectedAnswers] = useState<
    (AnswerValue | null)[]
  >([]);
  const [showExplanations, setShowExplanations] = useState(false);

  // Use a ref to track if we've already fetched for this attemptId to prevent double calls in Strict Mode
  const fetchedAttemptIdRef = useRef<string | null>(null);

  useEffect(() => {
    const loadAttempt = async () => {
      if (!attemptId) {
        toast.error('No attempt ID provided');
        navigate('/quiz');
        return;
      }

      // Skip if we already fetched this attempt (fix for double API call)
      if (fetchedAttemptIdRef.current === attemptId) {
        return;
      }

      try {
        setLoading(true);
        fetchedAttemptIdRef.current = attemptId;

        const attemptReview = await quizService.getAttemptReview(attemptId);

        // Extract quiz data
        if (attemptReview.quiz) {
          setQuiz({
            ...attemptReview.quiz,
            questions: attemptReview.questions || [],
          });
        }

        // Adapt the API response to match QuizResult interface
        const correctAnswers = attemptReview.questions
          ? attemptReview.questions.map((q: any) => q.correctAnswer)
          : [];

        const userAnswers = attemptReview.questions
          ? attemptReview.questions.map((q: any) => q.userAnswer)
          : [];

        setResult({
          ...attemptReview,
          correctAnswers,
        });

        setSelectedAnswers(userAnswers);
      } catch (error) {
        console.error('Failed to load attempt:', error);
        toast.error('Failed to load attempt details');
        navigate('/quiz');
      } finally {
        setLoading(false);
      }
    };

    loadAttempt();
  }, [attemptId, navigate]);

  // Handle breadcrumb update separately after quiz data is loaded
  useEffect(() => {
    if (!loading && quiz && !location.state?.breadcrumb) {
      navigate(location.pathname + location.search, {
        replace: true,
        state: {
          breadcrumb: [
            { label: 'Quizzes', path: '/quiz' },
            { label: quiz.title, path: `/quiz/${quiz.id}` },
            { label: 'Attempt', path: null },
          ],
        },
      });
    }
  }, [loading, quiz, location, navigate]);

  const handleBack = () => {
    if (challengeId) {
      navigate(`/challenges/${challengeId}`);
    } else {
      navigate('/quiz');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto mb-4" />
          <p className="text-gray-600">Loading review...</p>
        </div>
      </div>
    );
  }

  if (!quiz || !result) {
    return (
      <div className="card dark:bg-gray-800 text-center py-12">
        <h3 className="text-xl font-semibold text-gray-600 dark:text-gray-300 mb-2">
          Review not found
        </h3>
        <button onClick={handleBack} className="btn-primary mt-4">
          {challengeId ? 'Back to Challenge' : 'Back to Quizzes'}
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-4 sm:space-y-6 pb-6 sm:pb-8">
      <QuizScoreCard
        result={result}
        title={quiz.title}
        onBack={handleBack}
        backLabel={challengeId ? 'Back to Challenge' : 'Back to Quizzes'}
      />

      <QuizReviewContent
        quiz={quiz}
        result={result}
        selectedAnswers={selectedAnswers}
        showExplanations={showExplanations}
        onToggleExplanations={() => setShowExplanations(!showExplanations)}
      />
    </div>
  );
};
