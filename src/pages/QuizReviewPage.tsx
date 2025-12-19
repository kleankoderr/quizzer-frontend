import { useState, useEffect, useRef } from 'react';
import {
  useParams,
  useNavigate,
  useSearchParams,
  useLocation,
} from 'react-router-dom';
import { Toast as toast } from '../utils/toast';
import { quizService } from '../services/quiz.service';
import type { Quiz, QuizResult, AnswerValue } from '../types';
import { ResultsHeroCard } from '../components/quiz/ResultsHeroCard';
import { QuizReviewContent } from '../components/quiz/QuizReview';
import { useAuth } from '../contexts/AuthContext';

export const QuizReviewPage = () => {
  const { attemptId } = useParams<{ attemptId: string }>();
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams] = useSearchParams();
  const challengeId = searchParams.get('challengeId');
  const { user } = useAuth();

  const [loading, setLoading] = useState(true);
  const [quiz, setQuiz] = useState<Quiz | null>(null);
  const [result, setResult] = useState<QuizResult | null>(null);
  const [selectedAnswers, setSelectedAnswers] = useState<
    (AnswerValue | null)[]
  >([]);
  const [showExplanations, setShowExplanations] = useState(false);
  const [showConfetti, setShowConfetti] = useState(false);

  // Ref for smooth scrolling to review section
  const reviewSectionRef = useRef<HTMLDivElement>(null);

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

        // Show confetti if score >= 70%
        if (attemptReview.percentage && attemptReview.percentage >= 70) {
          setShowConfetti(true);
          const timer = setTimeout(() => setShowConfetti(false), 5000);
          return () => clearTimeout(timer);
        }
      } catch (_error) {
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

      // Add "Review"
      breadcrumbItems.push(
        { label: 'Review', path: null }
      );

      navigate(location.pathname + location.search, {
        replace: true,
        state: {
          breadcrumb: breadcrumbItems,
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

  // Smooth scroll to review section
  const handleReview = () => {
    reviewSectionRef.current?.scrollIntoView({
      behavior: 'smooth',
      block: 'start',
    });
    // Optionally expand explanations when reviewing
    if (!showExplanations) {
      setShowExplanations(true);
    }
  };

  // Navigate to retake quiz
  const handleRetake = () => {
    if (!quiz?.id) return;
    
    if (challengeId) {
      navigate(`/quiz/${quiz.id}?challengeId=${challengeId}`);
    } else {
      navigate(`/quiz/${quiz.id}`);
    }
  };

  // Navigate to study pack
  const handleStudyPackClick = () => {
    if (!quiz?.studyPackId) return;
    navigate(`/study-packs/${quiz.studyPackId}`);
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
      <ResultsHeroCard
        score={result.percentage}
        totalScore={result.score}
        totalQuestions={result.totalQuestions}
        userName={user?.name}
        title={quiz.title}
        showConfetti={showConfetti}
        onBack={handleBack}
        backLabel={challengeId ? 'Back to Challenge' : 'Back to Quizzes'}
        shareId={attemptId}
        shareTitle={quiz.title}
        onReview={handleReview}
        onRetake={handleRetake}
        onStudyPackClick={quiz.studyPack ? handleStudyPackClick : undefined}
        studyPackTitle={quiz.studyPack?.title}
      />

      <div ref={reviewSectionRef}>
        <QuizReviewContent
          quiz={quiz}
          result={result}
          selectedAnswers={selectedAnswers}
          showExplanations={showExplanations}
          onToggleExplanations={() => setShowExplanations(!showExplanations)}
        />
      </div>
    </div>
  );
};
