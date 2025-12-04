import { useCallback, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import { challengeService } from "../services";
import { useChallenges, useLeaderboard } from "../hooks";
import {
  Trophy,
  Target,
  Users,
  Crown,
  Medal,
  Flame,
  Zap,
  TrendingUp,
  Clock,
  UserPlus,
  CheckCircle,
} from "lucide-react";
import { CardSkeleton, TableSkeleton } from "../components/skeletons";

export const ChallengesPage = () => {
  const navigate = useNavigate();
  const {
    data: challenges = [],
    isLoading: challengesLoading,
    refetch: refetchChallenges,
  } = useChallenges();
  const { data: leaderboardData, isLoading: leaderboardLoading } =
    useLeaderboard("global");

  const [filter, setFilter] = useState<"all" | "available" | "completed">(
    "all",
  );
  const [joiningChallengeId, setJoiningChallengeId] = useState<string | null>(
    null,
  );

  const loading = challengesLoading || leaderboardLoading;
  const leaderboard = useMemo(
    () => leaderboardData?.entries.slice(0, 10) ?? [],
    [leaderboardData],
  );

  // Track which challenges user has joined (based on progress > 0 or completed)
  const joinedChallenges = useMemo(() => {
    return new Set(
      challenges.filter((c) => c.progress > 0 || c.completed).map((c) => c.id),
    );
  }, [challenges]);

  const filteredChallenges = useMemo(() => {
    let result = challenges;

    if (filter === "available") {
      result = challenges.filter(
        (c) => !c.completed && !joinedChallenges.has(c.id),
      );
    } else if (filter === "completed") {
      result = challenges.filter((c) => c.completed);
    }

    // Sort: Completed first if "all" is selected (as per user request), otherwise standard sort
    if (filter === "all") {
      return [...result].sort((a, b) => {
        if (a.completed && !b.completed) return -1;
        if (!a.completed && b.completed) return 1;
        return 0;
      });
    }

    return result;
  }, [challenges, filter, joinedChallenges]);

  const handleJoinChallenge = useCallback(
    async (challengeId: string) => {
      setJoiningChallengeId(challengeId);
      try {
        await challengeService.join(challengeId);
        toast.success("Challenge joined successfully!");
        await refetchChallenges();

        // Navigate to challenge details page
        navigate(`/challenges/${challengeId}`);
      } catch (error: any) {
        toast.error(
          error?.response?.data?.message ||
            "Failed to join challenge. Please try again.",
        );
      } finally {
        setJoiningChallengeId(null);
      }
    },
    [refetchChallenges, navigate],
  );

  const handleLeaveChallenge = useCallback(
    async (challengeId: string) => {
      if (!window.confirm("Are you sure you want to leave this challenge?"))
        return;

      try {
        await challengeService.leave(challengeId);
        toast.success("Left challenge successfully.");
        await refetchChallenges();
      } catch (error: any) {
        toast.error(
          error?.response?.data?.message || "Failed to leave challenge.",
        );
      }
    },
    [refetchChallenges],
  );

  if (loading) {
    return (
      <div className="space-y-6 pb-8">
        <div className="card bg-primary-600 dark:bg-primary-900 p-6 md:p-8">
          <div className="h-32" />
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-4">
            <CardSkeleton count={4} />
          </div>
          <div className="card dark:bg-gray-800">
            <TableSkeleton rows={10} columns={2} />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-8">
      {/* Hero Header */}
      <header className="relative overflow-hidden rounded-xl bg-gradient-to-br from-orange-600 to-red-700 dark:from-orange-800 dark:to-red-900 p-6 md:p-8 shadow-lg">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute -top-10 -right-10 w-40 h-40 bg-white rounded-full"></div>
          <div className="absolute -bottom-10 -left-10 w-40 h-40 bg-white rounded-full"></div>
        </div>
        <div className="relative z-10">
          <div className="flex items-center gap-2 mb-2">
            <Flame className="w-6 h-6 text-yellow-300" />
            <span className="text-yellow-300 font-semibold text-sm">
              Global Competition
            </span>
          </div>
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <h1 className="text-3xl md:text-4xl font-bold text-white mb-2 flex items-center gap-3">
                <Trophy className="w-10 h-10" />
                Challenges
              </h1>
              <p className="text-primary-100 dark:text-primary-200 text-lg">
                Compete in Daily, Weekly, and Monthly challenges
              </p>
            </div>
            <div className="flex items-center gap-3">
              <div className="text-center px-4 py-2 bg-white/10 backdrop-blur-sm rounded-lg border border-white/20">
                <div className="text-2xl font-bold text-white">
                  {
                    challenges.filter(
                      (c) => !c.completed && !joinedChallenges.has(c.id),
                    ).length
                  }
                </div>
                <div className="text-xs text-primary-100">Available</div>
              </div>
              <div className="text-center px-4 py-2 bg-white/10 backdrop-blur-sm rounded-lg border border-white/20">
                <div className="text-2xl font-bold text-white">
                  {challenges.filter((c) => c.completed).length}
                </div>
                <div className="text-xs text-primary-100 dark:text-primary-200">
                  Completed
                </div>
              </div>
            </div>
          </div>
        </div>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6">
        {/* Challenges Section */}
        <section className="lg:col-span-2 space-y-6">
          <div className="card dark:bg-gray-800 p-4 md:p-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-primary-100 dark:bg-primary-900/30 rounded-lg">
                  <Trophy className="w-6 h-6 text-primary-600 dark:text-primary-400" />
                </div>
                <div>
                  <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                    Challenges
                  </h2>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Compete and earn rewards
                  </p>
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-2 p-1 bg-gray-100 dark:bg-gray-700/50 rounded-lg">
                {(["all", "available", "completed"] as const).map(
                  (filterType) => (
                    <button
                      key={filterType}
                      onClick={() => setFilter(filterType)}
                      className={`px-3 py-1.5 text-sm font-medium rounded-md transition-all whitespace-nowrap ${
                        filter === filterType
                          ? "bg-white dark:bg-gray-600 text-primary-600 dark:text-primary-400 shadow-sm"
                          : "text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200"
                      }`}
                    >
                      {filterType.charAt(0).toUpperCase() + filterType.slice(1)}
                    </button>
                  ),
                )}
              </div>
            </div>

            <div className="space-y-4">
              {filteredChallenges.length === 0 ? (
                <div className="text-center py-12">
                  <div className="inline-flex items-center justify-center w-16 h-16 bg-gray-100 dark:bg-gray-700 rounded-full mb-4">
                    <Trophy className="w-8 h-8 text-gray-400 dark:text-gray-500" />
                  </div>
                  <h3 className="text-lg font-semibold text-gray-700 dark:text-gray-300 mb-2">
                    No challenges found
                  </h3>
                  <p className="text-gray-500 dark:text-gray-400 text-sm">
                    Try changing the filter or check back later.
                  </p>
                </div>
              ) : (
                filteredChallenges.map((challenge) => {
                  const isJoined = joinedChallenges.has(challenge.id);
                  const isCompleted = challenge.completed;
                  const percentage = Math.min(
                    ((challenge.progress || 0) / challenge.target) * 100,
                    100,
                  );
                  const timeLeft = getTimeLeft(challenge.endDate);

                  return (
                    <div
                      key={challenge.id}
                      className={`p-4 sm:p-5 rounded-xl border transition-all duration-300 hover:shadow-lg hover:-translate-y-1 ${
                        isCompleted
                          ? "bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-900/10 dark:to-emerald-900/10 border-green-200 dark:border-green-800"
                          : isJoined
                            ? "bg-gradient-to-br from-orange-50 to-red-50 dark:from-orange-900/10 dark:to-red-900/10 border-orange-200 dark:border-orange-800 hover:border-orange-300 dark:hover:border-orange-700"
                            : "bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 hover:border-orange-300 dark:hover:border-orange-600"
                      }`}
                    >
                      <div className="flex items-start gap-4">
                        <div
                          className={`flex-shrink-0 w-14 h-14 rounded-full flex items-center justify-center shadow-md ${
                            isCompleted
                              ? "bg-gradient-to-br from-green-500 to-emerald-600"
                              : isJoined
                                ? "bg-gradient-to-br from-orange-500 to-red-600"
                                : "bg-gradient-to-br from-gray-500 to-gray-600"
                          }`}
                        >
                          {isCompleted ? (
                            <span className="text-white text-lg font-bold">
                              ✓
                            </span>
                          ) : (
                            <Target className="w-7 h-7 text-white" />
                          )}
                        </div>

                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between gap-2 mb-2">
                            <div>
                              <div className="flex items-center gap-2 mb-1">
                                <h3 className="font-bold text-base text-gray-900 dark:text-white flex items-center gap-2">
                                  {challenge.title}
                                  {challenge.format &&
                                    challenge.format !== "STANDARD" && (
                                      <span className="px-2 py-0.5 bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300 rounded-full text-xs font-semibold">
                                        {challenge.format}
                                      </span>
                                    )}
                                </h3>
                                {isCompleted && (
                                  <span className="px-2 py-0.5 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300 rounded-full text-xs font-semibold flex items-center gap-1">
                                    <CheckCircle className="w-3 h-3" />
                                    Completed
                                  </span>
                                )}
                                {!isCompleted && isJoined && (
                                  <span className="px-2 py-0.5 bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-300 rounded-full text-xs font-semibold flex items-center gap-1">
                                    <Flame className="w-3 h-3" />
                                    Active
                                  </span>
                                )}
                              </div>
                              <p className="text-sm text-gray-600 dark:text-gray-400">
                                {challenge.description}
                              </p>
                            </div>
                            <div className="flex flex-col items-end gap-2">
                              <div className="flex-shrink-0 flex items-center gap-1 px-3 py-1.5 bg-gradient-to-r from-yellow-400 to-orange-500 text-white rounded-full text-sm font-bold shadow-sm border border-white/20">
                                <Trophy className="w-4 h-4" />
                                {challenge.reward}
                              </div>

                              {!isCompleted && isJoined && challenge.quizId && (
                                <button
                                  onClick={() =>
                                    navigate(`/challenges/${challenge.id}`)
                                  }
                                  className="flex items-center gap-1 px-3 py-1 bg-orange-600 hover:bg-orange-700 text-white text-xs font-bold rounded-lg transition-colors shadow-sm"
                                >
                                  <Zap className="w-3 h-3" />
                                  {challenge.progress > 0
                                    ? "Continue"
                                    : "Start"}
                                </button>
                              )}

                              {!isCompleted && !isJoined && (
                                <button
                                  onClick={() =>
                                    handleJoinChallenge(challenge.id)
                                  }
                                  disabled={joiningChallengeId === challenge.id}
                                  className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-orange-600 to-red-600 hover:from-orange-700 hover:to-red-700 text-white text-sm font-bold rounded-lg transition-all shadow-md hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed transform hover:scale-105"
                                >
                                  {joiningChallengeId === challenge.id ? (
                                    <>
                                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                                      <span>Joining...</span>
                                    </>
                                  ) : (
                                    <>
                                      <UserPlus className="w-4 h-4" />
                                      Join
                                    </>
                                  )}
                                </button>
                              )}

                              {!isCompleted &&
                                isJoined &&
                                (!challenge.progress ||
                                  challenge.progress === 0) && (
                                  <button
                                    onClick={() =>
                                      handleLeaveChallenge(challenge.id)
                                    }
                                    className="flex items-center gap-1 px-3 py-1 bg-red-100 hover:bg-red-200 text-red-600 text-xs font-bold rounded-lg transition-colors shadow-sm"
                                  >
                                    Leave
                                  </button>
                                )}
                            </div>
                          </div>

                          <div className="mt-3 space-y-2">
                            <div className="flex items-center justify-between text-xs">
                              <span className="text-gray-600 dark:text-gray-400">
                                <span
                                  className={`font-bold ${isCompleted ? "text-green-600 dark:text-green-400" : isJoined ? "text-orange-600 dark:text-orange-400" : "text-primary-600 dark:text-primary-400"}`}
                                >
                                  {challenge.progress || 0}
                                </span>
                                <span className="text-gray-500 dark:text-gray-500">
                                  {" "}
                                  / {challenge.target}
                                </span>
                              </span>
                              <div className="flex items-center gap-3">
                                <span className="flex items-center gap-1 text-gray-500 dark:text-gray-400">
                                  <Users className="w-3.5 h-3.5" />
                                  {challenge.participantCount || 0}
                                </span>
                                {!isCompleted && (
                                  <span className="flex items-center gap-1 text-gray-500 dark:text-gray-400">
                                    <Clock className="w-3.5 h-3.5" />
                                    {timeLeft}
                                  </span>
                                )}
                                <span
                                  className={`font-semibold ${isCompleted ? "text-green-600 dark:text-green-400" : isJoined ? "text-orange-600 dark:text-orange-400" : "text-primary-600 dark:text-primary-400"}`}
                                >
                                  {Math.round(percentage)}%
                                </span>
                              </div>
                            </div>
                            <div
                              className={`relative w-full rounded-full h-2.5 overflow-hidden ${
                                isCompleted
                                  ? "bg-green-200 dark:bg-green-900/30"
                                  : isJoined
                                    ? "bg-orange-200 dark:bg-orange-900/30"
                                    : "bg-gray-200 dark:bg-gray-700"
                              }`}
                            >
                              <div
                                className={`h-2.5 rounded-full transition-all duration-500 shadow-sm ${
                                  isCompleted
                                    ? "bg-gradient-to-r from-green-400 to-emerald-500"
                                    : isJoined
                                      ? "bg-gradient-to-r from-orange-400 to-red-500"
                                      : "bg-primary-500"
                                }`}
                                style={{ width: `${percentage}%` }}
                              ></div>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </section>

        {/* Leaderboard Sidebar */}
        <aside className="space-y-6">
          <div className="card dark:bg-gray-800 p-4 md:p-6">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-primary-100 dark:bg-primary-900/30 rounded-lg">
                  <Crown className="w-6 h-6 text-primary-600 dark:text-primary-400" />
                </div>
                <h3 className="text-xl font-bold text-gray-900 dark:text-white">
                  Global Leaderboard
                </h3>
              </div>
              <TrendingUp className="w-5 h-5 text-primary-600 dark:text-primary-400" />
            </div>

            {leaderboard.length === 0 ? (
              <div className="text-center py-6">
                <Users className="w-12 h-12 text-gray-300 dark:text-gray-600 mx-auto mb-3" />
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  No rankings yet
                </p>
              </div>
            ) : (
              <div className="space-y-2">
                {leaderboard.map((entry) => {
                  let rankStyle =
                    "bg-primary-50 dark:bg-primary-900/20 text-primary-600 dark:text-primary-400 border-primary-200 dark:border-primary-800";
                  let rankIcon = (
                    <span className="font-bold">{entry.rank}</span>
                  );

                  if (entry.rank === 1) {
                    rankStyle =
                      "bg-gradient-to-br from-yellow-400 to-yellow-600 text-white border-yellow-400 shadow-md";
                    rankIcon = <Crown className="w-4 h-4" />;
                  } else if (entry.rank === 2) {
                    rankStyle =
                      "bg-gradient-to-br from-gray-300 to-gray-500 text-white border-gray-300 shadow-md";
                    rankIcon = <Medal className="w-4 h-4" />;
                  } else if (entry.rank === 3) {
                    rankStyle =
                      "bg-gradient-to-br from-orange-400 to-orange-600 text-white border-orange-400 shadow-md";
                    rankIcon = <Medal className="w-4 h-4" />;
                  }

                  return (
                    <div
                      key={entry.userId}
                      className="flex items-center gap-3 p-3 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors border border-transparent hover:border-gray-200 dark:hover:border-gray-600"
                    >
                      <div
                        className={`flex-shrink-0 w-9 h-9 rounded-full flex items-center justify-center border-2 shadow-sm ${rankStyle}`}
                      >
                        {rankIcon}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-gray-900 dark:text-white truncate">
                          {entry.userName}
                        </p>
                        {entry.schoolName && (
                          <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
                            {entry.schoolName}
                          </p>
                        )}
                      </div>
                      <div className="flex items-center gap-1 text-sm font-bold text-purple-600 dark:text-purple-400">
                        <Zap className="w-4 h-4" />
                        {entry.score}
                      </div>
                    </div>
                  );
                })}

                {/* Current User Rank if not in top list */}
                {leaderboardData?.currentUser &&
                  !leaderboard.some(
                    (e) => e.userId === leaderboardData.currentUser?.userId,
                  ) && (
                    <>
                      <div className="flex items-center justify-center py-2">
                        <div className="w-1 h-1 bg-gray-300 rounded-full mx-1"></div>
                        <div className="w-1 h-1 bg-gray-300 rounded-full mx-1"></div>
                        <div className="w-1 h-1 bg-gray-300 rounded-full mx-1"></div>
                      </div>
                      <div className="flex items-center gap-3 p-3 rounded-xl bg-primary-50 dark:bg-primary-900/20 border border-primary-200 dark:border-primary-800">
                        <div className="flex-shrink-0 w-9 h-9 rounded-full flex items-center justify-center border-2 shadow-sm bg-primary-100 dark:bg-primary-800 text-primary-600 dark:text-primary-400 border-primary-200 dark:border-primary-700">
                          <span className="font-bold">
                            {leaderboardData.currentUser.rank}
                          </span>
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-semibold text-gray-900 dark:text-white truncate">
                            You
                          </p>
                          {leaderboardData.currentUser.schoolName && (
                            <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
                              {leaderboardData.currentUser.schoolName}
                            </p>
                          )}
                        </div>
                        <div className="flex items-center gap-1 text-sm font-bold text-purple-600 dark:text-purple-400">
                          <Zap className="w-4 h-4" />
                          {leaderboardData.currentUser.score}
                        </div>
                      </div>
                    </>
                  )}
              </div>
            )}
          </div>

          {/* Info Cards */}
          <div className="space-y-4">
            <div className="card bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 border-blue-200 dark:border-blue-800 p-4 md:p-6">
              <div className="flex items-start gap-3">
                <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
                  <Trophy className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                </div>
                <div>
                  <h4 className="font-bold text-sm text-gray-900 dark:text-white mb-1">
                    How It Works
                  </h4>
                  <ul className="text-xs text-gray-600 dark:text-gray-400 space-y-1">
                    <li>• Join challenges that interest you</li>
                    <li>• Complete tasks to earn XP rewards</li>
                    <li>• XP boosts your leaderboard ranking</li>
                    <li>• Compete globally with other learners</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
};

function getTimeLeft(endDate: string | Date): string {
  const now = new Date();
  const end = new Date(endDate);
  const diff = end.getTime() - now.getTime();

  if (diff <= 0) return "Expired";

  const hours = Math.floor(diff / (1000 * 60 * 60));
  const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));

  if (hours > 0) return `${hours}h ${minutes}m`;
  return `${minutes}m`;
}
