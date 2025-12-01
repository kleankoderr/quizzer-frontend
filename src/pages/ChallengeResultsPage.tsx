import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Breadcrumb } from '../components/Breadcrumb';
import { challengeService } from '../services';
import type { Challenge, ChallengeProgress } from '../types';
import { Trophy, TrendingUp, ArrowLeft, Share2, Eye, Sparkles } from 'lucide-react';
import Confetti from 'react-confetti';
import { useWindowSize } from 'react-use';
import toast from 'react-hot-toast';

export const ChallengeResultsPage = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { width, height } = useWindowSize();
  const [challenge, setChallenge] = useState<Challenge | null>(null);
  const [progress, setProgress] = useState<ChallengeProgress | null>(null);
  const [loading, setLoading] = useState(true);
  const [showConfetti, setShowConfetti] = useState(false);

  useEffect(() => {
    if (id) {
      loadResults();
    }
  }, [id]);

  const loadResults = async () => {
    try {
      setLoading(true);
      const [challengeData, progressData] = await Promise.all([
        challengeService.getChallengeById(id!),
        challengeService.getChallengeProgress(id!),
      ]);
      setChallenge(challengeData);
      setProgress(progressData);

      // Show confetti if score >= 70%
      if (progressData.finalScore && progressData.finalScore >= 70) {
        setShowConfetti(true);
        setTimeout(() => setShowConfetti(false), 5000);
      }
    } catch (error: any) {

      toast.error('Failed to load results');
      navigate('/challenges');
    } finally {
      setLoading(false);
    }
  };

  const handleShare = () => {
    const text = `I just completed the "${challenge?.title}" challenge and scored ${progress?.finalScore}%! 🎉`;
    if (navigator.share) {
      navigator.share({
        title: 'Challenge Completed!',
        text,
      }).catch(() => {});
    } else {
      navigator.clipboard.writeText(text);
      toast.success('Results copied to clipboard!');
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

  const finalScore = progress.finalScore || 0;
  const isSuccess = finalScore >= 70;

  return (
    <div className="space-y-6 pb-8">
      {/* Confetti */}
      {showConfetti && <Confetti width={width} height={height} recycle={false} numberOfPieces={500} />}

      {/* Breadcrumb */}
      <Breadcrumb
        items={[
          { label: challenge.category || challenge.type.charAt(0).toUpperCase() + challenge.type.slice(1) + ' Challenges', path: '/challenges' },
          { label: challenge.title, path: `/challenges/${id}` },
          { label: 'Results' },
        ]}
      />

      {/* Results Header */}
      <div className={`card p-8 text-center ${
        isSuccess
          ? 'bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 border-green-200 dark:border-green-800'
          : 'bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 border-blue-200 dark:border-blue-800'
      }`}>
        <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-gradient-to-br from-yellow-400 to-orange-500 mb-4">
          <Trophy className="w-10 h-10 text-white" />
        </div>
        
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
          {isSuccess ? '🎉 Congratulations!' : 'Challenge Completed!'}
        </h1>
        
        <p className="text-gray-600 dark:text-gray-400 mb-6">
          {isSuccess
            ? "You've successfully completed the challenge!"
            : "You've completed the challenge. Keep practicing to improve!"}
        </p>

        {/* Final Score */}
        <div className="inline-block">
          <div className="text-6xl font-bold bg-gradient-to-r from-primary-600 to-primary-800 dark:from-primary-400 dark:to-primary-600 bg-clip-text text-transparent mb-2">
            {finalScore}%
          </div>
          <div className="text-sm text-gray-600 dark:text-gray-400">Final Score</div>
        </div>

        {/* Percentile */}
        {progress.percentile !== undefined && progress.percentile !== null && (
          <div className="mt-6 inline-flex items-center gap-2 px-6 py-3 bg-white dark:bg-gray-800 rounded-full shadow-lg">
            <TrendingUp className="w-5 h-5 text-primary-600 dark:text-primary-400" />
            <span className="font-semibold text-gray-900 dark:text-white">
              Top {Math.round(100 - progress.percentile)}% of participants
            </span>
          </div>
        )}

        {/* Reward */}
        <div className="mt-6 inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-yellow-400 to-orange-500 text-white rounded-full font-bold shadow-lg">
          <Sparkles className="w-5 h-5" />
          <span>+{challenge.reward} XP Earned!</span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Quiz Breakdown */}
        <div className="lg:col-span-2">
          <div className="card dark:bg-gray-800">
            <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">Quiz Breakdown</h2>
            <div className="space-y-3">
              {progress.quizAttempts.map((attempt, index) => {
                const percentage = (attempt.score / attempt.totalQuestions) * 100;
                const quiz = challenge.quizzes?.[index];
                
                return (
                  <div
                    key={index}
                    className="p-4 bg-gray-50 dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700"
                  >
                    <div className="flex items-center justify-between mb-2">
                      <div>
                        <div className="font-semibold text-gray-900 dark:text-white">
                          Quiz {index + 1}: {quiz?.quiz.title || 'Quiz'}
                        </div>
                        <div className="text-sm text-gray-500 dark:text-gray-400">
                          {attempt.score} / {attempt.totalQuestions} correct
                        </div>
                      </div>
                      <div className={`text-2xl font-bold ${
                        percentage >= 70
                          ? 'text-green-600 dark:text-green-400'
                          : percentage >= 50
                          ? 'text-yellow-600 dark:text-yellow-400'
                          : 'text-red-600 dark:text-red-400'
                      }`}>
                        {Math.round(percentage)}%
                      </div>
                    </div>
                    <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                      <div
                        className={`h-2 rounded-full transition-all ${
                          percentage >= 70
                            ? 'bg-green-500'
                            : percentage >= 50
                            ? 'bg-yellow-500'
                            : 'bg-red-500'
                        }`}
                        style={{ width: `${percentage}%` }}
                      ></div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="space-y-4">
          <div className="card dark:bg-gray-800">
            <h3 className="font-semibold text-gray-900 dark:text-white mb-4">Actions</h3>
            <div className="space-y-3">
              <button
                onClick={() => navigate('/challenges')}
                className="w-full flex items-center justify-center gap-2 px-6 py-3 bg-primary-600 hover:bg-primary-700 text-white font-bold rounded-lg transition-all"
              >
                <ArrowLeft className="w-5 h-5" />
                Back to Challenges
              </button>
              
              <button
                onClick={() => navigate(`/challenges/${id}/leaderboard`)}
                className="w-full flex items-center justify-center gap-2 px-6 py-3 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-900 dark:text-white font-semibold rounded-lg transition-all"
              >
                <TrendingUp className="w-5 h-5" />
                View Leaderboard
              </button>
              
              <button
                onClick={() => navigate('/attempts')}
                className="w-full flex items-center justify-center gap-2 px-6 py-3 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-900 dark:text-white font-semibold rounded-lg transition-all"
              >
                <Eye className="w-5 h-5" />
                Review Attempts
              </button>
              
              <button
                onClick={handleShare}
                className="w-full flex items-center justify-center gap-2 px-6 py-3 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-900 dark:text-white font-semibold rounded-lg transition-all"
              >
                <Share2 className="w-5 h-5" />
                Share Results
              </button>
            </div>
          </div>

          {/* Stats */}
          <div className="card bg-gradient-to-br from-purple-50 to-pink-50 dark:from-purple-900/20 dark:to-pink-900/20 border-purple-200 dark:border-purple-800">
            <h3 className="font-semibold text-gray-900 dark:text-white mb-3">Challenge Stats</h3>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-600 dark:text-gray-400">Total Quizzes:</span>
                <span className="font-semibold text-gray-900 dark:text-white">{progress.totalQuizzes}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600 dark:text-gray-400">Completed:</span>
                <span className="font-semibold text-gray-900 dark:text-white">{progress.completedQuizzes}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600 dark:text-gray-400">XP Earned:</span>
                <span className="font-semibold text-yellow-600 dark:text-yellow-400">+{challenge.reward}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
