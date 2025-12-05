import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Breadcrumb } from "../components/Breadcrumb";
import { challengeService } from "../services";
import type { Challenge, ChallengeProgress } from "../types";
import {
  Trophy,
  TrendingUp,
  ArrowLeft,
  Share2,
  Eye,
  Sparkles,
  Award,
  Target,
  Zap,
} from "lucide-react";
import Confetti from "react-confetti";
import { useWindowSize } from "react-use";
import toast from "react-hot-toast";

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
    } catch (_error) {
      toast.error("Failed to load results");
      navigate("/challenges");
    } finally {
      setLoading(false);
    }
  };

  const handleShare = () => {
    const text = `I just completed the "${challenge?.title}" challenge and scored ${progress?.finalScore}%! 🎉`;
    if (navigator.share) {
      navigator
        .share({
          title: "Challenge Completed!",
          text,
        })
        .catch(() => {});
    } else {
      navigator.clipboard.writeText(text);
      toast.success("Results copied to clipboard!");
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
  const isExcellent = finalScore >= 90;
  const isGood = finalScore >= 70;
  const isPass = finalScore >= 50;

  return (
    <div className="space-y-6 pb-8">
      {/* Confetti */}
      {showConfetti && (
        <Confetti
          width={width}
          height={height}
          recycle={false}
          numberOfPieces={500}
        />
      )}

      {/* Breadcrumb */}
      <Breadcrumb
        items={[
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
        ]}
      />

      {/* Results Hero */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-primary-600 via-primary-700 to-primary-900 dark:from-primary-800 dark:via-primary-900 dark:to-gray-900 p-8 md:p-12 shadow-2xl">
        {/* Background decoration */}
        <div className="absolute inset-0 opacity-10">
          <div className="absolute -top-20 -right-20 w-64 h-64 bg-white rounded-full blur-3xl"></div>
          <div className="absolute -bottom-20 -left-20 w-64 h-64 bg-white rounded-full blur-3xl"></div>
        </div>

        <div className="relative z-10 text-center">
          {/* Trophy Icon */}
          <div className="inline-flex items-center justify-center w-24 h-24 rounded-full bg-gradient-to-br from-yellow-400 via-yellow-500 to-orange-500 mb-6 shadow-2xl animate-bounce">
            <Trophy className="w-12 h-12 text-white" />
          </div>

          <h1 className="text-4xl md:text-5xl font-bold text-white mb-3">
            {isExcellent
              ? "🌟 Outstanding!"
              : isGood
                ? "🎉 Excellent Work!"
                : isPass
                  ? "👍 Well Done!"
                  : "💪 Challenge Completed!"}
          </h1>

          <p className="text-primary-100 text-lg md:text-xl mb-8 max-w-2xl mx-auto">
            {isExcellent
              ? "You've mastered this challenge with an exceptional score!"
              : isGood
                ? "You've successfully completed the challenge with a great score!"
                : isPass
                  ? "You've completed the challenge. Keep practicing to improve!"
                  : "You've completed the challenge. Review the questions and try again!"}
          </p>

          {/* Score Circle */}
          <div className="flex flex-col md:flex-row items-center justify-center gap-8 mb-8">
            {/* Circular Progress */}
            <div className="relative">
              <svg className="transform -rotate-90 w-40 h-40 md:w-48 md:h-48">
                <circle
                  cx="96"
                  cy="96"
                  r="88"
                  stroke="currentColor"
                  strokeWidth="12"
                  fill="transparent"
                  className="text-white/20"
                />
                <circle
                  cx="96"
                  cy="96"
                  r="88"
                  stroke="currentColor"
                  strokeWidth="12"
                  fill="transparent"
                  strokeDasharray={`${2 * Math.PI * 88}`}
                  strokeDashoffset={`${2 * Math.PI * 88 * (1 - finalScore / 100)}`}
                  className={`${
                    isExcellent
                      ? "text-green-400"
                      : isGood
                        ? "text-yellow-400"
                        : isPass
                          ? "text-blue-400"
                          : "text-orange-400"
                  } transition-all duration-1000 ease-out`}
                  strokeLinecap="round"
                />
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <div className="text-5xl md:text-6xl font-bold text-white">
                  {finalScore}%
                </div>
                <div className="text-sm text-primary-100 font-medium">
                  Final Score
                </div>
              </div>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-2 gap-4">
              {/* Percentile */}
              {progress.percentile !== undefined &&
                progress.percentile !== null && (
                  <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4 border border-white/20">
                    <div className="flex items-center gap-2 mb-1">
                      <TrendingUp className="w-4 h-4 text-yellow-400" />
                      <span className="text-xs text-primary-100">Ranking</span>
                    </div>
                    <div className="text-2xl font-bold text-white">
                      Top {Math.round(100 - progress.percentile)}%
                    </div>
                  </div>
                )}

              {/* XP Earned */}
              <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4 border border-white/20">
                <div className="flex items-center gap-2 mb-1">
                  <Sparkles className="w-4 h-4 text-yellow-400" />
                  <span className="text-xs text-primary-100">XP Earned</span>
                </div>
                <div className="text-2xl font-bold text-yellow-400">
                  +{challenge.reward}
                </div>
              </div>

              {/* Quizzes Completed */}
              <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4 border border-white/20">
                <div className="flex items-center gap-2 mb-1">
                  <Target className="w-4 h-4 text-green-400" />
                  <span className="text-xs text-primary-100">Completed</span>
                </div>
                <div className="text-2xl font-bold text-white">
                  {progress.completedQuizzes}/{progress.totalQuizzes}
                </div>
              </div>

              {/* Achievement Badge */}
              <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4 border border-white/20">
                <div className="flex items-center gap-2 mb-1">
                  <Award className="w-4 h-4 text-purple-400" />
                  <span className="text-xs text-primary-100">Grade</span>
                </div>
                <div className="text-2xl font-bold text-white">
                  {isExcellent ? "A+" : isGood ? "A" : isPass ? "B" : "C"}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Quiz Breakdown */}
        <div className="lg:col-span-2">
          <div className="card dark:bg-gray-800">
            <div className="flex items-center gap-3 mb-6">
              <div className="p-2 bg-primary-100 dark:bg-primary-900/30 rounded-lg">
                <Zap className="w-5 h-5 text-primary-600 dark:text-primary-400" />
              </div>
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                Quiz Breakdown
              </h2>
            </div>
            <div className="space-y-4">
              {progress.quizAttempts.map((attempt, index) => {
                const percentage =
                  (attempt.score / attempt.totalQuestions) * 100;
                const quiz = challenge.quizzes?.[index];

                return (
                  <div
                    key={index}
                    className="group relative p-5 bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-800 dark:to-gray-900 rounded-xl border-2 border-gray-200 dark:border-gray-700 hover:border-primary-300 dark:hover:border-primary-700 transition-all hover:shadow-lg"
                  >
                    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-3 gap-3 sm:gap-0">
                      <div className="flex-1 w-full">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-primary-600 text-white text-xs font-bold">
                            {index + 1}
                          </span>
                          <div className="font-bold text-gray-900 dark:text-white">
                            {quiz?.quiz.title || "Quiz"}
                          </div>
                        </div>
                        <div className="text-sm text-gray-600 dark:text-gray-400 ml-8">
                          {attempt.score} / {attempt.totalQuestions} correct •{" "}
                          {quiz?.quiz.topic}
                        </div>
                      </div>
                      <div className="flex flex-row sm:flex-col items-center sm:items-end justify-between sm:justify-start w-full sm:w-auto ml-8 sm:ml-0">
                        <div
                          className={`text-3xl font-bold ${
                            percentage >= 90
                              ? "text-green-600 dark:text-green-400"
                              : percentage >= 70
                                ? "text-blue-600 dark:text-blue-400"
                                : percentage >= 50
                                  ? "text-yellow-600 dark:text-yellow-400"
                                  : "text-red-600 dark:text-red-400"
                          }`}
                        >
                          {Math.round(percentage)}%
                        </div>
                        <div className="text-xs text-gray-500 dark:text-gray-400">
                          {percentage >= 90
                            ? "Excellent"
                            : percentage >= 70
                              ? "Good"
                              : percentage >= 50
                                ? "Pass"
                                : "Review"}
                        </div>
                      </div>
                    </div>
                    <div className="relative w-full bg-gray-300 dark:bg-gray-700 rounded-full h-3 overflow-hidden">
                      <div
                        className={`h-3 rounded-full transition-all duration-1000 ease-out ${
                          percentage >= 90
                            ? "bg-gradient-to-r from-green-500 to-emerald-500"
                            : percentage >= 70
                              ? "bg-gradient-to-r from-blue-500 to-indigo-500"
                              : percentage >= 50
                                ? "bg-gradient-to-r from-yellow-500 to-orange-500"
                                : "bg-gradient-to-r from-red-500 to-pink-500"
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

        {/* Actions Sidebar */}
        <div className="space-y-4">
          <div className="card dark:bg-gray-800">
            <h3 className="font-bold text-gray-900 dark:text-white mb-4 text-lg">
              Actions
            </h3>
            <div className="space-y-3">
              <button
                onClick={() => navigate("/challenges")}
                className="w-full flex items-center justify-center gap-2 px-6 py-3.5 bg-gradient-to-r from-primary-600 to-primary-700 hover:from-primary-700 hover:to-primary-800 text-white font-bold rounded-xl transition-all shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
              >
                <ArrowLeft className="w-5 h-5" />
                Back to Challenges
              </button>

              <button
                onClick={() => navigate("/leaderboard")}
                className="w-full flex items-center justify-center gap-2 px-6 py-3 bg-gradient-to-br from-yellow-50 to-orange-50 dark:from-yellow-900/20 dark:to-orange-900/20 hover:from-yellow-100 hover:to-orange-100 dark:hover:from-yellow-900/30 dark:hover:to-orange-900/30 text-gray-900 dark:text-white font-semibold rounded-xl transition-all border-2 border-yellow-200 dark:border-yellow-800"
              >
                <TrendingUp className="w-5 h-5" />
                View Leaderboard
              </button>

              <button
                onClick={() => navigate("/attempts")}
                className="w-full flex items-center justify-center gap-2 px-6 py-3 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-900 dark:text-white font-semibold rounded-xl transition-all"
              >
                <Eye className="w-5 h-5" />
                Review Attempts
              </button>

              <button
                onClick={handleShare}
                className="w-full flex items-center justify-center gap-2 px-6 py-3 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-900 dark:text-white font-semibold rounded-xl transition-all"
              >
                <Share2 className="w-5 h-5" />
                Share Results
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
