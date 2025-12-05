import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { challengeService } from "../services";
import type { Challenge } from "../types";
import {
  Trophy,
  Clock,
  Target,
  Users,
  Zap,
  ArrowLeft,
  TrendingUp,
  CheckCircle,
} from "lucide-react";
import toast from "react-hot-toast";

export const ChallengeDetailsPage = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [challenge, setChallenge] = useState<Challenge | null>(null);
  const [loading, setLoading] = useState(true);
  const [leaderboard, setLeaderboard] = useState<any>(null);
  const [starting, setStarting] = useState(false);

  useEffect(() => {
    const loadChallenge = async () => {
      try {
        setLoading(true);
        const data = await challengeService.getChallengeById(id!);
        setChallenge(data);
      } catch (_error) {
        toast.error("Failed to load challenge details");
        navigate("/challenges");
      } finally {
        setLoading(false);
      }
    };

    const loadLeaderboard = async () => {
      try {
        const data = await challengeService.getChallengeLeaderboard(id!);
        setLeaderboard(data);
      } catch (_error) {}
    };

    if (id) {
      loadChallenge();
      loadLeaderboard();
    }
  }, [id, navigate]);

  const handleStartChallenge = async () => {
    setStarting(true);
    try {
      const result = await challengeService.startChallenge(id!);

      // Check if challenge has quizzes
      if (result.totalQuizzes === 0) {
        toast.error(
          "This challenge has no quizzes associated. Please contact support.",
        );
        setStarting(false);
        return;
      }

      // Navigate to first quiz with challengeId parameter
      if (challenge?.quizzes && challenge.quizzes.length > 0) {
        const firstQuiz = challenge.quizzes[0];
        navigate(`/quiz/${firstQuiz.quizId}?challengeId=${id}`);
      } else if (challenge?.quizId) {
        // Legacy single quiz support
        navigate(`/quiz/${challenge.quizId}?challengeId=${id}`);
      } else {
        toast.error("Unable to start challenge. No quiz found.");
      }
    } catch (_error) {
      toast.error("Failed to start challenge");
    } finally {
      setStarting(false);
    }
  };

  if (loading) {
    return (
      <div className="space-y-6 pb-8">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-1/3 mb-4"></div>
          <div className="h-64 bg-gray-200 dark:bg-gray-700 rounded"></div>
        </div>
      </div>
    );
  }

  if (!challenge) {
    return null;
  }

  const totalQuizzes = challenge.quizzes?.length || (challenge.quizId ? 1 : 0);
  const completedQuizzes = challenge.currentQuizIndex || 0;
  const progressPercentage =
    totalQuizzes > 0 ? (completedQuizzes / totalQuizzes) * 100 : 0;

  return (
    <div className="space-y-6 pb-8">
      {/* Back Button */}
      <button
        onClick={() => navigate("/challenges")}
        className="flex items-center gap-2 text-gray-600 dark:text-gray-400 hover:text-primary-600 dark:hover:text-primary-400 transition-colors"
      >
        <ArrowLeft className="w-4 h-4" />
        <span>Back to Challenges</span>
      </button>

      {/* Challenge Header */}
      <div className="card bg-gradient-to-br from-primary-600 to-primary-800 dark:from-primary-900 dark:to-primary-950 p-6 md:p-8">
        <div className="flex flex-col md:flex-row items-start justify-between gap-4">
          <div className="flex-1 w-full">
            <div className="flex items-center gap-3 mb-3">
              <div className="p-3 bg-white/20 backdrop-blur-sm rounded-xl">
                <Trophy className="w-8 h-8 text-white" />
              </div>
              <div>
                <h1 className="text-3xl font-bold text-white mb-1">
                  {challenge.title}
                </h1>
                <p className="text-primary-100 text-sm">
                  {challenge.category ||
                    challenge.type.charAt(0).toUpperCase() +
                      challenge.type.slice(1)}{" "}
                  Challenge
                </p>
              </div>
            </div>
            <p className="text-primary-50 text-lg">{challenge.description}</p>
          </div>

          <div className="flex flex-row md:flex-col items-center md:items-end gap-2 w-full md:w-auto justify-between md:justify-start mt-4 md:mt-0">
            <div className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-full font-bold shadow-lg">
              <Trophy className="w-5 h-5" />
              <span>{challenge.reward} XP</span>
            </div>
            {challenge.format && challenge.format !== "STANDARD" && (
              <span className="px-3 py-1 bg-red-500 text-white rounded-full text-xs font-semibold">
                {challenge.format}
              </span>
            )}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Challenge Info */}
          <div className="card dark:bg-gray-800 p-4 md:p-6">
            <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">
              Challenge Details
            </h2>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
              <div className="text-center p-4 bg-blue-50 dark:bg-blue-900/20 rounded-xl">
                <Target className="w-6 h-6 text-blue-600 dark:text-blue-400 mx-auto mb-2" />
                <div className="text-2xl font-bold text-gray-900 dark:text-white">
                  {totalQuizzes}
                </div>
                <div className="text-xs text-gray-600 dark:text-gray-400">
                  Quizzes
                </div>
              </div>

              <div className="text-center p-4 bg-purple-50 dark:bg-purple-900/20 rounded-xl">
                <Users className="w-6 h-6 text-purple-600 dark:text-purple-400 mx-auto mb-2" />
                <div className="text-2xl font-bold text-gray-900 dark:text-white">
                  {challenge.participantCount || 0}
                </div>
                <div className="text-xs text-gray-600 dark:text-gray-400">
                  Participants
                </div>
              </div>

              {challenge.timeLimit && (
                <div className="text-center p-4 bg-orange-50 dark:bg-orange-900/20 rounded-xl">
                  <Clock className="w-6 h-6 text-orange-600 dark:text-orange-400 mx-auto mb-2" />
                  <div className="text-2xl font-bold text-gray-900 dark:text-white">
                    {Math.floor(challenge.timeLimit / 60)}
                  </div>
                  <div className="text-xs text-gray-600 dark:text-gray-400">
                    Minutes
                  </div>
                </div>
              )}

              <div className="text-center p-4 bg-green-50 dark:bg-green-900/20 rounded-xl">
                <Target className="w-6 h-6 text-green-600 dark:text-green-400 mx-auto mb-2" />
                <div className="text-2xl font-bold text-gray-900 dark:text-white">
                  {challenge.target}
                </div>
                <div className="text-xs text-gray-600 dark:text-gray-400">
                  Target
                </div>
              </div>
            </div>

            {/* Rules */}
            {challenge.rules && (
              <div className="mb-6">
                <h3 className="font-semibold text-gray-900 dark:text-white mb-2">
                  Rules
                </h3>
                <p className="text-gray-600 dark:text-gray-400 text-sm whitespace-pre-line">
                  {challenge.rules}
                </p>
              </div>
            )}

            {/* Quiz List */}
            {challenge.quizzes && challenge.quizzes.length > 0 && (
              <div>
                <h3 className="font-semibold text-gray-900 dark:text-white mb-3">
                  Quizzes in this Challenge
                </h3>
                <div className="space-y-2">
                  {challenge.quizzes.map((cq, index) => (
                    <div
                      key={cq.id}
                      className={`p-3 rounded-lg border ${
                        index < completedQuizzes
                          ? "bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800"
                          : "bg-gray-50 dark:bg-gray-800 border-gray-200 dark:border-gray-700"
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div
                            className={`w-8 h-8 rounded-full flex items-center justify-center font-bold ${
                              index < completedQuizzes
                                ? "bg-green-500 text-white"
                                : "bg-gray-300 dark:bg-gray-600 text-gray-700 dark:text-gray-300"
                            }`}
                          >
                            {index < completedQuizzes ? (
                              <CheckCircle className="w-5 h-5" />
                            ) : (
                              index + 1
                            )}
                          </div>
                          <div>
                            <div className="font-medium text-gray-900 dark:text-white">
                              {cq.quiz.title}
                            </div>
                            <div className="text-xs text-gray-500 dark:text-gray-400">
                              {cq.quiz.topic} • {cq.quiz.difficulty}
                            </div>
                          </div>
                        </div>
                        {index < completedQuizzes && (
                          <span className="text-green-600 dark:text-green-400 text-sm font-semibold">
                            Completed
                          </span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Progress (if already started) */}
          {challenge.joined && completedQuizzes > 0 && (
            <div className="card bg-orange-50 dark:bg-orange-900/20 border-orange-200 dark:border-orange-800">
              <h3 className="font-semibold text-gray-900 dark:text-white mb-3">
                Your Progress
              </h3>
              <div className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-600 dark:text-gray-400">
                    {completedQuizzes} of {totalQuizzes} quizzes completed
                  </span>
                  <span className="font-bold text-orange-600 dark:text-orange-400">
                    {Math.round(progressPercentage)}%
                  </span>
                </div>
                <div className="w-full bg-orange-200 dark:bg-orange-900/30 rounded-full h-3">
                  <div
                    className="bg-gradient-to-r from-orange-400 to-red-500 h-3 rounded-full transition-all duration-500"
                    style={{ width: `${progressPercentage}%` }}
                  ></div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Actions */}
          <div className="card dark:bg-gray-800 p-4 md:p-6">
            <h3 className="font-semibold text-gray-900 dark:text-white mb-4">
              Actions
            </h3>
            <div className="space-y-3">
              {!challenge.completed && (
                <button
                  onClick={handleStartChallenge}
                  disabled={starting}
                  className="w-full flex items-center justify-center gap-2 px-6 py-3 bg-primary-600 hover:bg-primary-700 text-white font-bold rounded-lg transition-all shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {starting ? (
                    <>
                      <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      <span>Starting...</span>
                    </>
                  ) : (
                    <>
                      <Zap className="w-5 h-5" />
                      {challenge.joined && completedQuizzes > 0
                        ? "Continue Challenge"
                        : "Start Challenge"}
                    </>
                  )}
                </button>
              )}

              <button
                onClick={() => navigate("/leaderboard")}
                className="w-full flex items-center justify-center gap-2 px-6 py-3 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-900 dark:text-white font-semibold rounded-lg transition-all"
              >
                <TrendingUp className="w-5 h-5" />
                View Leaderboard
              </button>
            </div>
          </div>

          {/* Leaderboard Preview */}
          {leaderboard && leaderboard.entries.length > 0 && (
            <div className="card dark:bg-gray-800 p-4 md:p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-semibold text-gray-900 dark:text-white">
                  Top Ranked
                </h3>
                <button
                  onClick={() => navigate("/leaderboard")}
                  className="text-sm text-primary-600 dark:text-primary-400 hover:underline"
                >
                  View All
                </button>
              </div>
              <div className="space-y-3">
                {leaderboard.entries
                  .slice(0, 3)
                  .map((entry: any, index: number) => (
                    <div
                      key={entry.userId}
                      className="flex items-center justify-between p-2 rounded bg-gray-50 dark:bg-gray-700/50"
                    >
                      <div className="flex items-center gap-3">
                        <div
                          className={`w-6 h-6 flex items-center justify-center rounded-full text-xs font-bold ${
                            index === 0
                              ? "bg-yellow-100 text-yellow-700"
                              : index === 1
                                ? "bg-gray-100 text-gray-700"
                                : index === 2
                                  ? "bg-orange-100 text-orange-700"
                                  : "bg-gray-100 text-gray-500"
                          }`}
                        >
                          {index + 1}
                        </div>
                        <span className="text-sm font-medium text-gray-900 dark:text-white truncate max-w-[100px]">
                          {entry.userName}
                        </span>
                      </div>
                      <span className="text-sm font-bold text-primary-600 dark:text-primary-400">
                        {entry.score}
                      </span>
                    </div>
                  ))}

                {/* Current User if not in top 3 */}
                {leaderboard.currentUser &&
                  !leaderboard.entries
                    .slice(0, 3)
                    .find(
                      (e: any) => e.userId === leaderboard.currentUser.userId,
                    ) && (
                    <div className="mt-2 pt-2 border-t border-gray-200 dark:border-gray-700">
                      <div className="flex items-center justify-between p-2 rounded bg-primary-50 dark:bg-primary-900/20 border border-primary-100 dark:border-primary-800">
                        <div className="flex items-center gap-3">
                          <div className="w-6 h-6 flex items-center justify-center rounded-full text-xs font-bold bg-primary-100 text-primary-700">
                            {leaderboard.currentUser.rank || "-"}
                          </div>
                          <span className="text-sm font-medium text-gray-900 dark:text-white">
                            You
                          </span>
                        </div>
                        <span className="text-sm font-bold text-primary-600 dark:text-primary-400">
                          {leaderboard.currentUser.score}
                        </span>
                      </div>
                    </div>
                  )}
              </div>
            </div>
          )}

          {/* Time Remaining */}
          <div className="card bg-gradient-to-br from-red-50 to-orange-50 dark:from-red-900/20 dark:to-orange-900/20 border-red-200 dark:border-red-800 p-4 md:p-6">
            <div className="flex items-center gap-3 mb-2">
              <Clock className="w-5 h-5 text-red-600 dark:text-red-400" />
              <h3 className="font-semibold text-gray-900 dark:text-white">
                Time Remaining
              </h3>
            </div>
            <p className="text-2xl font-bold text-red-600 dark:text-red-400">
              {getTimeLeft(challenge.endDate)}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

function getTimeLeft(endDate: string | Date): string {
  const now = new Date();
  const end = new Date(endDate);
  const diff = end.getTime() - now.getTime();

  if (diff <= 0) return "Expired";

  const days = Math.floor(diff / (1000 * 60 * 60 * 24));
  const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
  const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));

  if (days > 0) return `${days}d ${hours}h`;
  if (hours > 0) return `${hours}h ${minutes}m`;
  return `${minutes}m`;
}
