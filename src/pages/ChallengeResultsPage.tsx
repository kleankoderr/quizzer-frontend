import { useState, useEffect, useCallback, useMemo } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { challengeService } from '../services';
import type { Challenge, ChallengeProgress } from '../types';
import {
  TrendingUp,
  ArrowLeft,
  CheckCircle,
  Sparkles,
  Award,
  Target,
  Trophy,
} from 'lucide-react';
import { Toast as toast } from '../utils/toast';
import { QuizReview } from '../components/quiz/QuizReview';
import { quizService } from '../services/quiz.service';
import { useAuth } from '../contexts/AuthContext';
import { ResultsHeroCard, type ResultsStat } from '../components/quiz/ResultsHeroCard';

// Constants
const CONFETTI_DURATION = 5000;
const TOP_LEADERBOARD_COUNT = 10;
const SCORE_THRESHOLDS = {
  GOOD: 70,
} as const;

const parseAnswers = (answers: any) => {
  return typeof answers === 'string' ? JSON.parse(answers) : answers;
};

export const ChallengeResultsPage = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();

  // State
  const [challenge, setChallenge] = useState<Challenge | null>(null);
  const [progress, setProgress] = useState<ChallengeProgress | null>(null);
  const [loading, setLoading] = useState(true);
  const [showConfetti, setShowConfetti] = useState(false);
  const [leaderboard, setLeaderboard] = useState<any[]>([]);
  const [currentUserEntry, setCurrentUserEntry] = useState<any>(null);
  const [attemptDetails, setAttemptDetails] = useState<any>(null);
  const [quizDetails, setQuizDetails] = useState<any>(null);
  const [loadingAttempt, setLoadingAttempt] = useState(false);

  // Memoized values
  const finalScore = progress?.finalScore || 0;

  const userRank = useMemo(() => {
    if (!user?.id) return null;
    return leaderboard.findIndex((e) => e.userId === user.id) + 1 || null;
  }, [leaderboard, user?.id]);

  const totalScore = useMemo(() => {
    if (!progress?.quizAttempts) return 0;
    return progress.quizAttempts.reduce(
      (acc: number, curr: any) => acc + (curr.score || 0),
      0
    );
  }, [progress]);

  const totalQuestions = useMemo(() => {
    if (!progress?.quizAttempts) return 0;
    return progress.quizAttempts.reduce(
      (acc: number, curr: any) => acc + (curr.totalQuestions || 0),
      0
    );
  }, [progress]);

  const statsData: ResultsStat[] = useMemo(
    () => [
      {
        icon: TrendingUp,
        label: 'Ranking',
        value:
          progress?.percentile !== null && progress?.percentile !== undefined
            ? `Top ${Math.max(1, Math.round(100 - progress.percentile))}%`
            : userRank
              ? `#${userRank}`
              : '-',
        color: 'text-blue-200',
        valueColor: 'text-white',
      },
      {
        icon: Sparkles,
        label: 'XP Earned',
        value: `+${challenge?.reward || 0}`,
        color: 'text-yellow-200',
        valueColor: 'text-white',
      },
      {
        icon: Target,
        label: 'Score',
        value: `${totalScore}/${totalQuestions}`,
        color: 'text-green-200',
        valueColor: 'text-white',
      },
      {
        icon: Award,
        label: 'Grade',
        value: '', // Will be calculated by ResultsHeroCard
        color: 'text-white',
        valueColor: 'text-white',
      },
    ],
    [progress, challenge, userRank, totalScore, totalQuestions]
  );

  const breadcrumbItems = useMemo(() => {
    if (!challenge) return null;
    return [
      {
        label:
          challenge.category ||
          challenge.type.charAt(0).toUpperCase() +
            challenge.type.slice(1) +
            ' Challenges',
        path: '/challenges',
      },
      { label: challenge.title, path: `/challenges/${id}` },
      { label: 'Results' },
    ];
  }, [challenge, id]);

  const topLeaderboard = useMemo(
    () => leaderboard.slice(0, TOP_LEADERBOARD_COUNT),
    [leaderboard]
  );

  const parsedAnswers = useMemo(
    () => (attemptDetails ? parseAnswers(attemptDetails.answers) : null),
    [attemptDetails]
  );

  const quizReviewResult = useMemo(() => {
    if (!attemptDetails || !quizDetails) return null;
    return {
      attemptId: attemptDetails.id,
      score: attemptDetails.score,
      totalQuestions: attemptDetails.totalQuestions,
      percentage: Math.round(
        (attemptDetails.score / attemptDetails.totalQuestions) * 100
      ),
      correctAnswers: quizDetails.questions.map((q: any) => q.correctAnswer),
      feedback: { message: '' },
    };
  }, [attemptDetails, quizDetails]);

  // Load results
  const loadResults = useCallback(async () => {
    if (!id) return;

    try {
      setLoading(true);
      const [challengeData, progressData, leaderboardData] = await Promise.all([
        challengeService.getChallengeById(id),
        challengeService.getChallengeProgress(id),
        challengeService.getChallengeLeaderboard(id),
      ]);

      setChallenge(challengeData);
      setProgress(progressData);
      setLeaderboard(leaderboardData.entries || []);
      setCurrentUserEntry(leaderboardData.currentUser);

      // Show confetti if score >= 70%
      if (
        progressData.finalScore &&
        progressData.finalScore >= SCORE_THRESHOLDS.GOOD
      ) {
        setShowConfetti(true);
        const timer = setTimeout(
          () => setShowConfetti(false),
          CONFETTI_DURATION
        );
        return () => clearTimeout(timer);
      }

      // Load the latest attempt details for review
      if (progressData.quizAttempts?.length > 0) {
        const lastAttempt =
          progressData.quizAttempts[progressData.quizAttempts.length - 1];
        setLoadingAttempt(true);
        try {
          const attempt = await quizService.getAttemptById(
            lastAttempt.attemptId
          );
          setAttemptDetails(attempt);
          setQuizDetails(attempt.quiz);
        } catch (_err) {
        } finally {
          setLoadingAttempt(false);
        }
      }
    } catch (_error) {
      toast.error('Failed to load results');
      navigate('/challenges');
    } finally {
      setLoading(false);
    }
  }, [id, navigate]);

  // Update breadcrumbs
  useEffect(() => {
    if (!breadcrumbItems) return;

    const currentBreadcrumb = location.state?.breadcrumb;
    if (JSON.stringify(currentBreadcrumb) === JSON.stringify(breadcrumbItems)) {
      return;
    }

    navigate('.', {
      replace: true,
      state: { ...location.state, breadcrumb: breadcrumbItems },
    });
  }, [breadcrumbItems, location.state, navigate]);

  // Initial load
  useEffect(() => {
    loadResults();
  }, [loadResults]);

  // Loading state
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

  return (
    <div className="space-y-6 pb-8 md:pb-12 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <ResultsHeroCard
        score={finalScore}
        totalScore={totalScore}
        totalQuestions={totalQuestions}
        userName={user?.name}
        stats={statsData}
        showConfetti={showConfetti}
        shareId={id}
        shareTitle={challenge.title}
        completionType="challenge"
      />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 md:gap-8">
        {/* Main Content: Quiz Review */}
        <div className="lg:col-span-2 space-y-8">
          {attemptDetails &&
          quizDetails &&
          quizReviewResult &&
          parsedAnswers ? (
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden">
              <div className="p-6 md:p-8">
                <div className="flex items-center gap-3 mb-6">
                  <div className="p-2.5 bg-green-100 dark:bg-green-900/40 rounded-xl">
                    <CheckCircle className="w-5 h-5 text-green-600 dark:text-green-400" />
                  </div>
                  <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                    Review: {quizDetails.title}
                  </h2>
                </div>

                <QuizReview
                  quiz={quizDetails}
                  result={quizReviewResult}
                  selectedAnswers={parsedAnswers}
                />
              </div>
            </div>
          ) : loadingAttempt ? (
            <div className="h-64 bg-gray-100 dark:bg-gray-800 rounded-2xl animate-pulse flex items-center justify-center">
              <p className="text-gray-500">Loading review...</p>
            </div>
          ) : null}
        </div>

        {/* Sidebar: Leaderboard & Actions */}
        <div className="space-y-6">
          {/* Challenge Leaderboard */}
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 p-5">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-yellow-100 dark:bg-yellow-900/30 rounded-lg">
                  <Trophy className="w-5 h-5 text-yellow-600 dark:text-yellow-400" />
                </div>
                <h3 className="font-bold text-gray-900 dark:text-white text-lg">
                  Top Performers
                </h3>
              </div>
            </div>

            <div className="space-y-2 max-h-80 overflow-y-auto pr-1">
              {topLeaderboard.length === 0 ? (
                <p className="text-center text-gray-500 py-4 text-sm">
                  No rankings yet.
                </p>
              ) : (
                topLeaderboard.map((entry, idx) => (
                  <div
                    key={entry.userId || idx}
                    className={`flex items-center gap-3 p-3 rounded-xl ${
                      entry.userId === user?.id
                        ? 'bg-primary-50 dark:bg-primary-900/20 border border-primary-100 dark:border-primary-800'
                        : 'hover:bg-gray-50 dark:hover:bg-gray-700/50'
                    }`}
                  >
                    <div
                      className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs ${
                        idx < 3
                          ? 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/40 dark:text-yellow-300'
                          : 'bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-400'
                      }`}
                    >
                      {idx + 1}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-gray-900 dark:text-white truncate">
                        {entry.userName || 'Unknown User'}
                      </p>
                      <p className="text-xs text-gray-500 truncate">
                        {entry.score} pts
                      </p>
                    </div>
                    {entry.userId === user?.id && (
                      <span className="text-[10px] font-bold uppercase tracking-wider bg-primary-100 text-primary-600 px-2 py-0.5 rounded">
                        You
                      </span>
                    )}
                  </div>
                ))
              )}

              {/* Current User Entry (if not in top list) */}
              {currentUserEntry &&
                !topLeaderboard.some((e) => e.userId === user?.id) && (
                  <>
                    <div className="flex items-center justify-center my-2">
                      <div className="h-px bg-gray-200 dark:bg-gray-700 w-1/2"></div>
                    </div>
                    <div className="flex items-center gap-3 p-3 rounded-xl bg-primary-50 dark:bg-primary-900/20 border border-primary-100 dark:border-primary-800">
                      <div className="w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-400">
                        {currentUserEntry.rank || '-'}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-gray-900 dark:text-white truncate">
                          {currentUserEntry.userName || 'You'}
                        </p>
                        <p className="text-xs text-gray-500 truncate">
                          {currentUserEntry.score} pts
                        </p>
                      </div>
                      <span className="text-[10px] font-bold uppercase tracking-wider bg-primary-100 text-primary-600 px-2 py-0.5 rounded">
                        You
                      </span>
                    </div>
                  </>
                )}
            </div>

            <button
              onClick={() => navigate('/leaderboard')}
              className="w-full mt-4 flex items-center justify-center gap-2 py-2 text-sm font-medium text-primary-600 hover:text-primary-700 dark:text-primary-400 dark:hover:text-primary-300 transition-colors"
            >
              <span>View Global Rankings</span>
              <TrendingUp className="w-4 h-4" />
            </button>
          </div>

          {/* Actions */}
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 p-5">
            <h3 className="font-bold text-gray-900 dark:text-white mb-4 text-base uppercase tracking-wider opacity-80">
              Actions
            </h3>
            <button
              onClick={() => navigate('/challenges')}
              className="w-full flex items-center justify-center gap-2 px-6 py-4 bg-primary-600 hover:bg-primary-700 text-white font-bold rounded-xl transition-all shadow-lg shadow-primary-600/20 active:scale-[0.98]"
            >
              <ArrowLeft className="w-5 h-5" />
              Back to Challenges
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
