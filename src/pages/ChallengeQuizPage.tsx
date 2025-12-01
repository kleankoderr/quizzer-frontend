import { useState, useEffect } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import { Breadcrumb } from '../components/Breadcrumb';
import { challengeService } from '../services';
import type { Challenge, ChallengeProgress } from '../types';
import { Zap, ArrowRight } from 'lucide-react';
import toast from 'react-hot-toast';

export const ChallengeQuizPage = () => {
  const { id, quizIndex } = useParams<{ id: string; quizIndex: string }>();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [challenge, setChallenge] = useState<Challenge | null>(null);
  const [progress, setProgress] = useState<ChallengeProgress | null>(null);
  const [loading, setLoading] = useState(true);

  const quizId = searchParams.get('quizId');
  const currentIndex = parseInt(quizIndex || '0');

  useEffect(() => {
    if (id) {
      loadChallengeData();
    }
  }, [id]);

  const loadChallengeData = async () => {
    try {
      setLoading(true);
      const [challengeData, progressData] = await Promise.all([
        challengeService.getChallengeById(id!),
        challengeService.getChallengeProgress(id!),
      ]);
      setChallenge(challengeData);
      setProgress(progressData);
    } catch (error: any) {

      toast.error('Failed to load challenge');
      navigate('/challenges');
    } finally {
      setLoading(false);
    }
  };

  if (loading || !challenge || !progress) {
    return (
      <div className="space-y-6 pb-8">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-1/3 mb-4"></div>
          <div className="h-96 bg-gray-200 dark:bg-gray-700 rounded"></div>
        </div>
      </div>
    );
  }

  const currentQuiz = challenge.quizzes?.[currentIndex];
  
  if (!currentQuiz && !quizId) {
    toast.error('Quiz not found');
    navigate(`/challenges/${id}`);
    return null;
  }

  return (
    <div className="space-y-6 pb-8">
      {/* Breadcrumb */}
      <Breadcrumb
        items={[
          { label: challenge.category || challenge.type.charAt(0).toUpperCase() + challenge.type.slice(1) + ' Challenges', path: '/challenges' },
          { label: challenge.title, path: `/challenges/${id}` },
          { label: `Quiz ${currentIndex + 1}` },
        ]}
      />

      {/* Progress Indicator */}
      <div className="card bg-gradient-to-r from-primary-600 to-primary-800 dark:from-primary-900 dark:to-primary-950 p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Zap className="w-6 h-6 text-white" />
            <div>
              <div className="text-white font-bold text-lg">{challenge.title}</div>
              <div className="text-primary-100 text-sm">
                Quiz {currentIndex + 1} of {progress.totalQuizzes}
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {Array.from({ length: progress.totalQuizzes }).map((_, idx) => (
              <div
                key={idx}
                className={`w-3 h-3 rounded-full ${
                  idx < progress.completedQuizzes
                    ? 'bg-green-400'
                    : idx === currentIndex
                    ? 'bg-white'
                    : 'bg-white/30'
                }`}
              />
            ))}
          </div>
        </div>
      </div>

      {/* Quiz Content - This would integrate with your existing QuizPage/QuizTakePage */}
      <div className="card dark:bg-gray-800 p-8">
        <div className="text-center py-12">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
            {currentQuiz?.quiz.title || 'Quiz'}
          </h2>
          <p className="text-gray-600 dark:text-gray-400 mb-6">
            {currentQuiz?.quiz.topic}
          </p>
          
          {/* This is a placeholder - you would integrate your actual QuizTakePage component here */}
          <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-6">
            <p className="text-blue-800 dark:text-blue-200 mb-4">
              <strong>Integration Point:</strong> This is where you would render your QuizTakePage component
              with the quiz ID: {quizId || currentQuiz?.quizId}
            </p>
            <p className="text-sm text-blue-600 dark:text-blue-400">
              After completing the quiz, call <code>challengeService.completeQuizInChallenge()</code> 
              to record the attempt and navigate to the next quiz or results page.
            </p>
          </div>

          {/* Example navigation after quiz completion */}
          <button
            onClick={() => {
              // This would be called after actual quiz completion
              const nextIndex = currentIndex + 1;
              if (nextIndex < progress.totalQuizzes) {
                navigate(`/challenges/${id}/quiz/${nextIndex}?quizId=${challenge.quizzes?.[nextIndex]?.quizId}`);
              } else {
                navigate(`/challenges/${id}/results`);
              }
            }}
            className="mt-6 flex items-center gap-2 px-6 py-3 bg-primary-600 hover:bg-primary-700 text-white font-bold rounded-lg transition-all mx-auto"
          >
            <span>Continue to Next</span>
            <ArrowRight className="w-5 h-5" />
          </button>
        </div>
      </div>
    </div>
  );
};
