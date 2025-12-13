import { useCallback, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Toast as toast } from '../utils/toast';
import { challengeService } from '../services';
import { useChallenges, useLeaderboard } from '../hooks';
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
  CheckCircle,
} from 'lucide-react';
import { CardSkeleton, TableSkeleton } from '../components/skeletons';

export const ChallengesPage = () => {
  const navigate = useNavigate();
  const {
    data: challenges = [],
    isLoading: challengesLoading,
    refetch: refetchChallenges,
  } = useChallenges();
  const { data: leaderboardData, isLoading: leaderboardLoading } =
    useLeaderboard('global');

  const [filter, setFilter] = useState<'all' | 'available' | 'completed'>(
    'all'
  );
  const [joiningChallengeId, setJoiningChallengeId] = useState<string | null>(
    null
  );

  const loading = challengesLoading || leaderboardLoading;
  const leaderboard = useMemo(
    () => leaderboardData?.entries.slice(0, 10) ?? [],
    [leaderboardData]
  );

  // Track which challenges user has joined (based on progress > 0 or completed)
  const joinedChallenges = useMemo(() => {
    return new Set(
      challenges.filter((c) => c.progress > 0 || c.completed).map((c) => c.id)
    );
  }, [challenges]);

  const filteredChallenges = useMemo(() => {
    let result = challenges;

    if (filter === 'available') {
      result = challenges.filter(
        (c) => !c.completed && !joinedChallenges.has(c.id)
      );
    } else if (filter === 'completed') {
      result = challenges.filter((c) => c.completed);
    }

    // Sort: Completed first if "all" is selected (as per user request), otherwise standard sort
    if (filter === 'all') {
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
        toast.success('Challenge joined successfully!');
        await refetchChallenges();

        // Navigate to challenge details page
        navigate(`/challenges/${challengeId}`);
      } catch (error: any) {
        toast.error(
          error?.response?.data?.message ||
            'Failed to join challenge. Please try again.'
        );
      } finally {
        setJoiningChallengeId(null);
      }
    },
    [refetchChallenges, navigate]
  );

  const handleLeaveChallenge = useCallback(
    async (challengeId: string) => {
      if (!window.confirm('Are you sure you want to leave this challenge?'))
        return;

      try {
        await challengeService.leave(challengeId);
        toast.success('Left challenge successfully.');
        await refetchChallenges();
      } catch (error: any) {
        toast.error(
          error?.response?.data?.message || 'Failed to leave challenge.'
        );
      }
    },
    [refetchChallenges]
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
      <header className="relative overflow-hidden rounded-xl bg-blue-600 dark:bg-blue-800 p-6 md:p-8 shadow-lg">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute -top-10 -right-10 w-40 h-40 bg-white rounded-full"></div>
          <div className="absolute -bottom-10 -left-10 w-40 h-40 bg-white rounded-full"></div>
        </div>
        <div className="relative z-10">
          <div className="flex items-center gap-2 mb-2">
            <Flame className="w-6 h-6 text-blue-200" />
            <span className="text-blue-200 font-semibold text-sm">
              Global Competition
            </span>
          </div>
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <h1 className="text-3xl md:text-4xl font-bold text-white mb-2 flex items-center gap-3">
                <Trophy className="w-10 h-10" />
                Challenges
              </h1>
              <p className="text-blue-100 dark:text-blue-200 text-lg">
                Compete in Daily, Weekly, and Monthly challenges
              </p>
            </div>
            <div className="flex items-center gap-3">
              <div className="text-center px-4 py-2 bg-white/10 backdrop-blur-sm rounded-lg border border-white/20">
                <div className="text-2xl font-bold text-white">
                  {
                    challenges.filter(
                      (c) => !c.completed && !joinedChallenges.has(c.id)
                    ).length
                  }
                </div>
                <div className="text-xs text-blue-200">Available</div>
              </div>
              <div className="text-center px-4 py-2 bg-white/10 backdrop-blur-sm rounded-lg border border-white/20">
                <div className="text-2xl font-bold text-white">
                  {challenges.filter((c) => c.completed).length}
                </div>
                <div className="text-xs text-blue-200 dark:text-blue-300">
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
                {(['all', 'available', 'completed'] as const).map(
                  (filterType) => (
                    <button
                      key={filterType}
                      onClick={() => setFilter(filterType)}
                      className={`px-3 py-1.5 text-sm font-medium rounded-md transition-all whitespace-nowrap ${
                        filter === filterType
                          ? 'bg-white dark:bg-gray-600 text-primary-600 dark:text-primary-400 shadow-sm'
                          : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200'
                      }`}
                    >
                      {filterType.charAt(0).toUpperCase() + filterType.slice(1)}
                    </button>
                  )
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
                    100
                  );

                  return (
                    <div
                      key={challenge.id}
                      className={`p-4 sm:p-5 rounded-xl border transition-all duration-300 hover:shadow-lg hover:-translate-y-1 ${
                        isCompleted
                          ? 'bg-green-50 dark:bg-green-900/10 border-green-200 dark:border-green-800'
                          : isJoined
                            ? 'bg-blue-50 dark:bg-blue-900/10 border-blue-200 dark:border-blue-800 hover:border-blue-300 dark:hover:border-blue-700'
                            : 'bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 hover:border-blue-300 dark:hover:border-blue-600'
                      }`}
                    >
                      <div className="flex flex-col h-full relative">
                        {/* Main Content Area */}
                        <div className="flex flex-col sm:flex-row gap-4 p-5 pb-0">
                          {/* Left Column: Info */}
                          <div className="flex-1 min-w-0 space-y-3">
                            <div className="flex items-start gap-3">
                              <div
                                className={`flex-shrink-0 w-10 h-10 rounded-lg flex items-center justify-center shadow-sm ${
                                  isCompleted
                                    ? 'bg-green-100 text-green-600 dark:bg-green-900/30 dark:text-green-400'
                                    : isJoined
                                      ? 'bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400'
                                      : 'bg-gray-100 text-gray-500 dark:bg-gray-700 dark:text-gray-400'
                                }`}
                              >
                                {isCompleted ? (
                                  <CheckCircle className="w-6 h-6" />
                                ) : (
                                  <Target className="w-6 h-6" />
                                )}
                              </div>
                              <div>
                                <h3 className="font-bold text-lg text-gray-900 dark:text-white leading-tight flex items-center gap-2">
                                  {challenge.title}
                                  {challenge.format &&
                                    challenge.format !== 'STANDARD' && (
                                      <span className="px-2 py-0.5 bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 rounded text-[10px] font-bold uppercase tracking-wider">
                                        {challenge.format}
                                      </span>
                                    )}
                                </h3>
                                <p className="text-sm text-gray-500 dark:text-gray-400 line-clamp-2 mt-1">
                                  {challenge.description}
                                </p>
                              </div>
                            </div>

                            {/* Meta Info Grid */}
                            <div className="flex flex-wrap items-center gap-x-6 gap-y-2 text-sm text-gray-600 dark:text-gray-400 pt-1">
                              <div
                                className="flex items-center gap-1.5"
                                title="Reward"
                              >
                                <Trophy className="w-4 h-4 text-yellow-500" />
                                <span className="font-semibold">
                                  {challenge.reward} XP
                                </span>
                              </div>
                              <div
                                className="flex items-center gap-1.5"
                                title="Time Limit"
                              >
                                <Clock className="w-4 h-4 text-blue-500" />
                                <span className="font-medium">
                                  {challenge.timeLimit
                                    ? `${Math.round(challenge.timeLimit / 60)}m`
                                    : 'No Limit'}
                                </span>
                              </div>
                              <div
                                className="flex items-center gap-1.5"
                                title="Participants"
                              >
                                <Users className="w-4 h-4 text-purple-500" />
                                <span className="font-medium">
                                  {challenge.participantCount || 0}
                                  <span className="text-gray-400 mx-1">/</span>
                                  {challenge.maxParticipants || 100}
                                </span>
                              </div>
                            </div>
                          </div>

                          {/* Right Column: Actions */}
                          <div className="flex flex-row sm:flex-col items-center sm:items-end justify-between sm:justify-center gap-4 border-t sm:border-t-0 pt-4 sm:pt-0 border-gray-100 dark:border-gray-700">
                            {isJoined && !isCompleted && (
                              <div className="flex items-center gap-2">
                                <div className="relative w-12 h-12">
                                  <svg className="w-full h-full transform -rotate-90">
                                    <circle
                                      cx="24"
                                      cy="24"
                                      r="20"
                                      fill="none"
                                      stroke="currentColor"
                                      strokeWidth="4"
                                      className="text-gray-100 dark:text-gray-700"
                                    />
                                    <circle
                                      cx="24"
                                      cy="24"
                                      r="20"
                                      fill="none"
                                      stroke="currentColor"
                                      strokeWidth="4"
                                      strokeDasharray={126}
                                      strokeDashoffset={
                                        126 - (126 * percentage) / 100
                                      }
                                      className="text-blue-500"
                                      strokeLinecap="round"
                                    />
                                  </svg>
                                  <div className="absolute inset-0 flex items-center justify-center text-xs font-bold text-blue-600 dark:text-blue-400">
                                    {Math.round(percentage)}%
                                  </div>
                                </div>
                              </div>
                            )}

                            <div className="flex items-center gap-2">
                              {/* Action Buttons */}
                              {!isCompleted && !isJoined && (
                                <button
                                  onClick={() =>
                                    handleJoinChallenge(challenge.id)
                                  }
                                  disabled={joiningChallengeId === challenge.id}
                                  className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-bold rounded-lg shadow-sm hover:shadow transition-all disabled:opacity-50 disabled:cursor-not-allowed whitespace-nowrap"
                                >
                                  {joiningChallengeId === challenge.id
                                    ? 'Joining...'
                                    : 'Join Challenge'}
                                </button>
                              )}

                              {isJoined &&
                                !isCompleted &&
                                challenge.progress > 0 && (
                                  <button
                                    onClick={() =>
                                      navigate(`/challenges/${challenge.id}`)
                                    }
                                    className="px-5 py-2 bg-primary-600 hover:bg-primary-700 text-white text-sm font-bold rounded-lg shadow-sm hover:shadow transition-all whitespace-nowrap"
                                  >
                                    Continue
                                  </button>
                                )}

                              {isJoined && isCompleted && (
                                <button
                                  onClick={() =>
                                    navigate(
                                      `/challenges/${challenge.id}/results`
                                    )
                                  }
                                  className="px-5 py-2 bg-green-600 hover:bg-green-700 text-white text-sm font-bold rounded-lg shadow-sm hover:shadow transition-all whitespace-nowrap"
                                >
                                  View Results
                                </button>
                              )}

                              {isJoined &&
                                !isCompleted &&
                                challenge.progress === 0 && (
                                  <div className="flex gap-2">
                                    <button
                                      onClick={() =>
                                        handleLeaveChallenge(challenge.id)
                                      }
                                      className="px-3 py-2 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 text-sm font-semibold rounded-lg transition-colors"
                                    >
                                      Leave
                                    </button>
                                    <button
                                      onClick={() =>
                                        navigate(`/challenges/${challenge.id}`)
                                      }
                                      className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-bold rounded-lg shadow-sm hover:shadow transition-all whitespace-nowrap"
                                    >
                                      Start
                                    </button>
                                  </div>
                                )}

                              {isCompleted && (
                                <span className="px-4 py-2 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300 text-sm font-bold rounded-lg">
                                  Completed
                                </span>
                              )}
                            </div>
                          </div>
                        </div>

                        {/* Bottom Capacity Bar */}
                        <div className="mt-5 w-full bg-gray-100 dark:bg-gray-700 h-1.5">
                          <div
                            className="h-full bg-blue-500/50 dark:bg-blue-400/50 rounded-r-full"
                            style={{
                              width: `${Math.min(((challenge.participantCount || 0) / (challenge.maxParticipants || 100)) * 100, 100)}%`,
                            }}
                          />
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
                    'bg-primary-50 dark:bg-primary-900/20 text-primary-600 dark:text-primary-400 border-primary-200 dark:border-primary-800';
                  let rankIcon = (
                    <span className="font-bold">{entry.rank}</span>
                  );

                  if (entry.rank === 1) {
                    rankStyle =
                      'bg-yellow-400 text-white border-yellow-400 shadow-md';
                    rankIcon = <Crown className="w-4 h-4" />;
                  } else if (entry.rank === 2) {
                    rankStyle =
                      'bg-gray-400 text-white border-gray-400 shadow-md';
                    rankIcon = <Medal className="w-4 h-4" />;
                  } else if (entry.rank === 3) {
                    rankStyle =
                      'bg-orange-500 text-white border-orange-500 shadow-md';
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
                    (e) => e.userId === leaderboardData.currentUser?.userId
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
            <div className="card bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800 p-4 md:p-6">
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
