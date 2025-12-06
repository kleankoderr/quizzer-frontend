import { useState, useEffect, useRef, useCallback, useMemo } from "react";
import { useParams, useNavigate, useLocation } from "react-router-dom";
import { challengeService } from "../services";
import type { Challenge, ChallengeProgress } from "../types";
import {
  Trophy,
  TrendingUp,
  ArrowLeft,
  Share2,
  Target,
  CheckCircle,
  Sparkles,
  Award,
} from "lucide-react";
import Confetti from "react-confetti";
import { useWindowSize } from "react-use";
import toast from "react-hot-toast";
import { toPng } from "html-to-image";
import { QuizReview } from "../components/quiz/QuizReview";
import { quizService } from "../services/quiz.service";
import { useAuth } from "../contexts/AuthContext";

// Constants
const CONFETTI_DURATION = 5000;
const SCORE_THRESHOLDS = {
  EXCELLENT: 90,
  GOOD: 70,
  PASS: 50,
} as const;

const CIRCLE_CIRCUMFERENCE = 280;
const TOP_LEADERBOARD_COUNT = 10;

// Helper functions
const getGradeInfo = (score: number) => {
  if (score >= SCORE_THRESHOLDS.EXCELLENT) {
    return {
      color: "text-emerald-400",
      grade: "A+",
      message: "Outstanding Performance!",
      description: "You've mastered this challenge with exceptional skill.",
    };
  }
  if (score >= SCORE_THRESHOLDS.GOOD) {
    return {
      color: "text-blue-400",
      grade: "A",
      message: "Great Job!",
      description: "Solid performance! You're on the right track.",
    };
  }
  if (score >= SCORE_THRESHOLDS.PASS) {
    return {
      color: "text-amber-400",
      grade: "B",
      message: "Well Done!",
      description: "Good effort. Keep practicing to reach the top.",
    };
  }
  return {
    color: "text-rose-400",
    grade: "C",
    message: "Challenge Completed",
    description: "Review your answers and try again to improve.",
  };
};

const getGradeColorHex = (grade: string) => {
  switch (grade) {
    case "A+": return "#34d399"; // emerald-400
    case "A": return "#60a5fa"; // blue-400
    case "B": return "#fbbf24"; // amber-400
    case "C": return "#fb7185"; // rose-400
    default: return "#ffffff";
  }
};

const parseAnswers = (answers: any) => {
  return typeof answers === "string" ? JSON.parse(answers) : answers;
};

export const ChallengeResultsPage = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();
  const { width, height } = useWindowSize();
  
  // State
  const [isSharing, setIsSharing] = useState(false);
  const [challenge, setChallenge] = useState<Challenge | null>(null);
  const [progress, setProgress] = useState<ChallengeProgress | null>(null);
  const [loading, setLoading] = useState(true);
  const [showConfetti, setShowConfetti] = useState(false);
  const [leaderboard, setLeaderboard] = useState<any[]>([]);
  const [currentUserEntry, setCurrentUserEntry] = useState<any>(null);
  const [attemptDetails, setAttemptDetails] = useState<any>(null);
  const [quizDetails, setQuizDetails] = useState<any>(null);
  const [loadingAttempt, setLoadingAttempt] = useState(false);
  
  const resultsRef = useRef<HTMLDivElement>(null);

  // Memoized values
  const finalScore = progress?.finalScore || 0;
  const gradeInfo = useMemo(() => getGradeInfo(finalScore), [finalScore]);
  
  const userRank = useMemo(() => {
    if (!user?.id) return null;
    return leaderboard.findIndex((e) => e.userId === user.id) + 1 || null;
  }, [leaderboard, user?.id]);

  const totalScore = useMemo(() => {
    if (!progress?.quizAttempts) return 0;
    return progress.quizAttempts.reduce((acc: number, curr: any) => acc + (curr.score || 0), 0);
  }, [progress]);

  const totalQuestions = useMemo(() => {
    if (!progress?.quizAttempts) return 0;
    return progress.quizAttempts.reduce((acc: number, curr: any) => acc + (curr.totalQuestions || 0), 0);
  }, [progress]);

  const statsData = useMemo(() => [
    {
      icon: TrendingUp,
      label: "Ranking",
      value:
        progress?.percentile !== null && progress?.percentile !== undefined
          ? `Top ${Math.max(1, Math.round(100 - progress.percentile))}%`
          : userRank ? `#${userRank}` : "-",
      color: "text-blue-200",
      valueColor: "text-white",
    },
    {
      icon: Sparkles,
      label: "XP Earned",
      value: `+${challenge?.reward || 0}`,
      color: "text-yellow-200",
      valueColor: "text-white",
    },
    {
      icon: Target,
      label: "Score",
      value: `${totalScore}/${totalQuestions}`,
      color: "text-green-200",
      valueColor: "text-white",
    },
    {
      icon: Award,
      label: "Grade",
      value: gradeInfo.grade,
      color: gradeInfo.color,
      valueColor: gradeInfo.color,
    },
  ], [progress, challenge, userRank, gradeInfo, totalScore, totalQuestions]);

  const breadcrumbItems = useMemo(() => {
    if (!challenge) return null;
    return [
      {
        label:
          challenge.category ||
          challenge.type.charAt(0).toUpperCase() +
            challenge.type.slice(1) +
            " Challenges",
        path: "/challenges",
      },
      { label: challenge.title, path: `/challenges/${id}` },
      { label: "Results" },
    ];
  }, [challenge, id]);

  const topLeaderboard = useMemo(
    () => leaderboard.slice(0, TOP_LEADERBOARD_COUNT),
    [leaderboard]
  );

  const parsedAnswers = useMemo(
    () => attemptDetails ? parseAnswers(attemptDetails.answers) : null,
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
      feedback: { message: "" },
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
      if (progressData.finalScore && progressData.finalScore >= SCORE_THRESHOLDS.GOOD) {
        setShowConfetti(true);
        const timer = setTimeout(() => setShowConfetti(false), CONFETTI_DURATION);
        return () => clearTimeout(timer);
      }

      // Load the latest attempt details for review
      if (progressData.quizAttempts?.length > 0) {
        const lastAttempt = progressData.quizAttempts[progressData.quizAttempts.length - 1];
        setLoadingAttempt(true);
        try {
          const attempt = await quizService.getAttemptById(lastAttempt.attemptId);
          setAttemptDetails(attempt);
          setQuizDetails(attempt.quiz);
        } catch (err) {
          console.error("Failed to load attempt details", err);
        } finally {
          setLoadingAttempt(false);
        }
      }
    } catch (error) {
      console.error("Failed to load results:", error);
      toast.error("Failed to load results");
      navigate("/challenges");
    } finally {
      setLoading(false);
    }
  }, [id, navigate]);

  // Update breadcrumbs
  useEffect(() => {
    if (!breadcrumbItems) return;
    
    const currentBreadcrumb = (location.state)?.breadcrumb;
    if (JSON.stringify(currentBreadcrumb) === JSON.stringify(breadcrumbItems)) {
      return;
    }

    navigate(".", {
      replace: true,
      state: { ...(location.state), breadcrumb: breadcrumbItems },
    });
  }, [breadcrumbItems, location.state, navigate]);

  // Initial load
  useEffect(() => {
    loadResults();
  }, [loadResults]);

  // Share handler
  const handleShare = useCallback(async () => {
    if (!resultsRef.current || !challenge || isSharing) return;

    try {
      setIsSharing(true);
      const dataUrl = await toPng(resultsRef.current, {
        cacheBust: true,
        filter: (node) => {
          if (node instanceof HTMLElement && 
              node.getAttribute("data-html2canvas-ignore")) {
            return false;
          }
          return true;
        },
      });

      const blob = await (await fetch(dataUrl)).blob();
      const file = new File([blob], `challenge-result-${id}.png`, {
        type: "image/png",
      });

      if (navigator.share && navigator.canShare({ files: [file] })) {
        await navigator.share({
          files: [file],
          title: "Challenge Results",
          text: `I just completed the "${challenge.title}" challenge on Quizzer! Score: ${finalScore}%`,
        });
      } else {
        const link = document.createElement("a");
        link.download = `challenge-result-${id}.png`;
        link.href = dataUrl;
        link.click();
        toast.success("Image saved to device!");
      }
    } catch (error) {
      // Ignore abort errors which happen when user cancels share
      if (error instanceof Error && error.name === 'AbortError') return;
      
      console.error("Error sharing:", error);
      toast.error("Failed to share results");
    } finally {
      setIsSharing(false);
    }
  }, [challenge, finalScore, id, isSharing]);

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
      {/* Confetti */}
      {showConfetti && (
        <Confetti
          width={width}
          height={height}
          recycle={false}
          numberOfPieces={500}
        />
      )}

      {/* Results Hero */}
      <div
        ref={resultsRef}
        className="relative overflow-hidden rounded-3xl bg-primary-600 dark:bg-primary-900 shadow-xl border border-primary-500/30"
      >
        {/* Background Lighting */}
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-0 right-0 w-[30rem] h-[30rem] bg-white opacity-[0.03] rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
          <div className="absolute bottom-0 left-0 w-[20rem] h-[20rem] bg-white opacity-[0.03] rounded-full blur-2xl translate-y-1/3 -translate-x-1/3" />
        </div>

        <div className="relative z-10 px-6 py-8 md:p-12">
          {/* Share Button */}
          <div className="absolute top-4 right-4 md:top-6 md:right-6">
            <button
              onClick={handleShare}
              disabled={isSharing}
              data-html2canvas-ignore="true"
              className={`p-2 md:px-4 md:py-2 bg-white/10 hover:bg-white/20 rounded-full md:rounded-xl text-white transition-all flex items-center gap-2 border border-white/10 ${isSharing ? "opacity-50 cursor-not-allowed" : ""}`}
              aria-label="Share Results"
            >
              <Share2 className="w-5 h-5" />
              <span className="hidden md:inline font-medium text-sm">{isSharing ? "Sharing..." : "Share"}</span>
            </button>
          </div>

          {/* Hero Content */}
          <div className="flex flex-col items-center text-center max-w-4xl mx-auto">
            {/* Trophy Icon */}
            <div className="relative mb-6">
              <div className="absolute inset-0 bg-white/20 blur-xl rounded-full" />
              <div className="relative inline-flex items-center justify-center w-20 h-20 md:w-24 md:h-24 rounded-full bg-white/10 border border-white/20 shadow-2xl animate-float">
                <Trophy className="w-10 h-10 md:w-12 md:h-12 text-white drop-shadow-lg" />
              </div>
            </div>
            


            <h1 className="text-2xl md:text-4xl font-semibold text-white mb-2 md:mb-3 tracking-tight">
              Congratulations <span className="text-blue-200 font-bold">{user?.name || "Challenger"}</span>, you've completed the challenge!
            </h1>

            <p className="text-primary-100 text-base md:text-xl mb-8 md:mb-12 max-w-xl mx-auto leading-relaxed">
              {gradeInfo.description}
            </p>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 md:gap-16 w-full items-center">
              {/* Circular Progress */}
              <div className="flex flex-col items-center justify-center order-1 md:order-none">
                <div className="relative">
                  <div className="absolute inset-0 bg-white/5 blur-2xl rounded-full transform scale-110" />

                  <svg className="transform -rotate-90 w-48 h-48 md:w-56 md:h-56 drop-shadow-xl relative z-10">
                    <circle
                      cx="50%"
                      cy="50%"
                      r="42%"
                      stroke="currentColor"
                      strokeWidth="10"
                      fill="transparent"
                      className="text-white/10"
                    />
                   <circle
                      cx="50%"
                      cy="50%"
                      r="42%"
                      stroke={getGradeColorHex(gradeInfo.grade)}
                      strokeWidth="10"
                      fill="transparent"
                      strokeDasharray={`${2 * Math.PI * (window.innerWidth < 768 ? 80 : 96)}`}
                      style={{
                        strokeDasharray: "280",
                        strokeDashoffset: `${280 * (1 - finalScore / 100)}`,
                      }}
                      pathLength={280}
                      className={`${gradeInfo.color} transition-all duration-1000 ease-out shadow-[0_0_10px_currentColor]`}
                      strokeLinecap="round"
                    />
                  </svg>
                  <div className="absolute inset-0 flex flex-col items-center justify-center z-20">
                    <span className="text-5xl md:text-6xl font-bold tracking-tighter text-white">
                      {finalScore}%
                    </span>
                    <span className="text-sm font-medium text-white/70 uppercase tracking-widest mt-1">
                      Final Score
                    </span>

                  </div>
                </div>
              </div>

              {/* Stats Grid */}
              <div className="grid grid-cols-2 gap-3 md:gap-4 w-full order-2 md:order-none">
                {statsData.map((stat, idx) => (
                  <div
                    key={idx}
                    className="bg-white/10 rounded-2xl p-4 md:p-5 flex flex-col justify-between border border-white/5 hover:bg-white/15 transition-colors group"
                  >
                    <div className="flex items-center gap-2 mb-2 text-primary-100">
                      <stat.icon className={`w-4 h-4 ${stat.color} opacity-80`} />
                      <span className="text-xs font-medium uppercase tracking-wider opacity-70">
                        {stat.label}
                      </span>
                    </div>
                    <div className={`text-xl md:text-2xl font-bold tracking-tight ${stat.valueColor}`}>
                      {stat.value}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 md:gap-8">
        {/* Main Content: Quiz Review */}
        <div className="lg:col-span-2 space-y-8">
          {attemptDetails && quizDetails && quizReviewResult && parsedAnswers ? (
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
                        ? "bg-primary-50 dark:bg-primary-900/20 border border-primary-100 dark:border-primary-800"
                        : "hover:bg-gray-50 dark:hover:bg-gray-700/50"
                    }`}
                  >
                    <div
                      className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs ${
                        idx < 3
                          ? "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/40 dark:text-yellow-300"
                          : "bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-400"
                      }`}
                    >
                      {idx + 1}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-gray-900 dark:text-white truncate">
                        {entry.userName || "Unknown User"}
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
              {currentUserEntry && !topLeaderboard.find(e => e.userId === user?.id) && (
                 <>
                   <div className="flex items-center justify-center my-2">
                     <div className="h-px bg-gray-200 dark:bg-gray-700 w-1/2"></div>
                   </div>
                   <div className="flex items-center gap-3 p-3 rounded-xl bg-primary-50 dark:bg-primary-900/20 border border-primary-100 dark:border-primary-800">
                     <div className="w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-400">
                       {currentUserEntry.rank || "-"}
                     </div>
                     <div className="flex-1 min-w-0">
                       <p className="text-sm font-semibold text-gray-900 dark:text-white truncate">
                         {currentUserEntry.userName || "You"}
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
              onClick={() => navigate("/leaderboard")}
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
              onClick={() => navigate("/challenges")}
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