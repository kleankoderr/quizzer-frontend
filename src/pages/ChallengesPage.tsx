import { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import { challengeService, leaderboardService } from '../services';
import type { Challenge, LeaderboardEntry } from '../types';
import { Trophy, Target, Users, Crown, Medal, Flame, Zap, TrendingUp, Clock, Sparkles, UserPlus, CheckCircle } from 'lucide-react';

export const ChallengesPage = () => {
  const [challenges, setChallenges] = useState<Challenge[]>([]);
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [joinedChallenges, setJoinedChallenges] = useState<Set<string>>(new Set());

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [challengesData, leaderboardData] = await Promise.all([
        challengeService.getAll(),
        leaderboardService.getGlobal(),
      ]);
      setChallenges(challengesData);
      setLeaderboard(leaderboardData.slice(0, 10));
      
      // Track which challenges user has joined (based on progress > 0 or completed)
      const joined = new Set(
        challengesData
          .filter(c => c.progress > 0 || c.completed)
          .map(c => c.id)
      );
      setJoinedChallenges(joined);
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleJoinChallenge = async (challengeId: string) => {
    try {
      await challengeService.join(challengeId);
      setJoinedChallenges(prev => new Set(prev).add(challengeId));
      toast.success('Challenge joined! Start completing tasks to earn rewards.');
      // Reload data to get updated challenge list
      await loadData();
    } catch (error: any) {
      console.error('Error joining challenge:', error);
      toast.error(error?.response?.data?.message || 'Failed to join challenge. Please try again.');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-3 border-purple-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading challenges...</p>
        </div>
      </div>
    );
  }

  // Separate challenges into categories
  const recommendedChallenges = challenges.filter(c => 
    !c.completed && !joinedChallenges.has(c.id) && c.description.includes('quiz')
  );
  const availableChallenges = challenges.filter(c => 
    !c.completed && !joinedChallenges.has(c.id) && !recommendedChallenges.includes(c)
  );
  const activeChallenges = challenges.filter(c => 
    !c.completed && joinedChallenges.has(c.id)
  );
  const completedChallenges = challenges.filter(c => c.completed);

  return (
    <div className="space-y-6 pb-8">
      {/* Hero Header */}
      <header className="relative overflow-hidden rounded-xl bg-gradient-to-br from-orange-600 via-red-600 to-pink-700 p-6 md:p-8 shadow-lg">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute -top-10 -right-10 w-40 h-40 bg-white rounded-full"></div>
          <div className="absolute -bottom-10 -left-10 w-40 h-40 bg-white rounded-full"></div>
        </div>
        <div className="relative z-10">
          <div className="flex items-center gap-2 mb-2">
            <Flame className="w-6 h-6 text-yellow-300" />
            <span className="text-yellow-300 font-semibold text-sm">Global Competition</span>
          </div>
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <h1 className="text-3xl md:text-4xl font-bold text-white mb-2 flex items-center gap-3">
                <Trophy className="w-10 h-10" />
                Daily Challenges
              </h1>
              <p className="text-orange-100 text-lg">
                Join global challenges and compete with learners worldwide
              </p>
            </div>
            <div className="flex items-center gap-3">
              <div className="text-center px-4 py-2 bg-white/20 backdrop-blur-sm rounded-lg border border-white/30">
                <div className="text-2xl font-bold text-white">{activeChallenges.length}</div>
                <div className="text-xs text-orange-100">Joined</div>
              </div>
              <div className="text-center px-4 py-2 bg-white/20 backdrop-blur-sm rounded-lg border border-white/30">
                <div className="text-2xl font-bold text-white">{availableChallenges.length + recommendedChallenges.length}</div>
                <div className="text-xs text-orange-100">Available</div>
              </div>
              <div className="text-center px-4 py-2 bg-white/20 backdrop-blur-sm rounded-lg border border-white/30">
                <div className="text-2xl font-bold text-white">{completedChallenges.length}</div>
                <div className="text-xs text-orange-100">Done</div>
              </div>
            </div>
          </div>
        </div>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Challenges Section */}
        <section className="lg:col-span-2 space-y-6">
          {/* Recommended Challenges */}
          {recommendedChallenges.length > 0 && (
            <div className="card border-2 border-purple-200 bg-gradient-to-br from-purple-50 to-pink-50">
              <div className="flex items-center gap-3 mb-6">
                <div className="p-2 bg-gradient-to-br from-purple-100 to-pink-100 rounded-lg">
                  <Sparkles className="w-6 h-6 text-purple-600" />
                </div>
                <div className="flex-1">
                  <h2 className="text-2xl font-bold text-gray-900">Recommended For You</h2>
                  <p className="text-sm text-purple-600">Based on your learning progress</p>
                </div>
              </div>
              <div className="space-y-3">
                {recommendedChallenges.map((challenge) => {
                  const timeLeft = getTimeLeft(challenge.endDate);
                  const participantCount = Math.floor(Math.random() * 500) + 100; // Mock participant count
                  
                  return (
                    <div
                      key={challenge.id}
                      className="p-5 bg-white rounded-xl border-2 border-purple-200 hover:border-purple-300 transition-all hover:shadow-md"
                    >
                      <div className="flex items-start gap-4">
                        <div className="flex-shrink-0 w-14 h-14 rounded-full flex items-center justify-center shadow-md bg-gradient-to-br from-purple-400 to-pink-500">
                          <Sparkles className="w-7 h-7 text-white" />
                        </div>
                        
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between gap-2 mb-2">
                            <div>
                              <div className="flex items-center gap-2 mb-1">
                                <h3 className="font-bold text-base text-gray-900">{challenge.title}</h3>
                                <span className="px-2 py-0.5 bg-purple-100 text-purple-700 rounded-full text-xs font-semibold">
                                  Recommended
                                </span>
                              </div>
                              <p className="text-sm text-gray-600">{challenge.description}</p>
                            </div>
                            <div className="flex-shrink-0 flex items-center gap-1 px-3 py-1.5 bg-gradient-to-r from-yellow-400 to-orange-500 text-white rounded-full text-sm font-bold shadow-sm">
                              <Trophy className="w-4 h-4" />
                              {challenge.reward}
                            </div>
                          </div>
                          
                          <div className="flex items-center justify-between mt-3">
                            <div className="flex items-center gap-4 text-xs text-gray-500">
                              <span className="flex items-center gap-1">
                                <Users className="w-3.5 h-3.5" />
                                {participantCount} joined
                              </span>
                              <span className="flex items-center gap-1">
                                <Clock className="w-3.5 h-3.5" />
                                {timeLeft}
                              </span>
                            </div>
                            <button
                              onClick={() => handleJoinChallenge(challenge.id)}
                              className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white font-semibold rounded-lg transition-all shadow-md hover:shadow-lg text-sm"
                            >
                              <UserPlus className="w-4 h-4" />
                              Join Challenge
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Available Challenges to Join */}
          {availableChallenges.length > 0 && (
            <div className="card">
              <div className="flex items-center gap-3 mb-6">
                <div className="p-2 bg-gradient-to-br from-blue-100 to-indigo-100 rounded-lg">
                  <Trophy className="w-6 h-6 text-blue-600" />
                </div>
                <div className="flex-1">
                  <h2 className="text-2xl font-bold text-gray-900">Available Challenges</h2>
                  <p className="text-sm text-gray-600">Join and start competing</p>
                </div>
              </div>
              <div className="space-y-3">
                {availableChallenges.map((challenge) => {
                  const timeLeft = getTimeLeft(challenge.endDate);
                  const participantCount = Math.floor(Math.random() * 500) + 100;
                  
                  return (
                    <div
                      key={challenge.id}
                      className="p-5 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl border-2 border-blue-200 hover:border-blue-300 transition-all hover:shadow-md"
                    >
                      <div className="flex items-start gap-4">
                        <div className="flex-shrink-0 w-14 h-14 rounded-full flex items-center justify-center shadow-md bg-gradient-to-br from-blue-400 to-indigo-500">
                          <Target className="w-7 h-7 text-white" />
                        </div>
                        
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between gap-2 mb-2">
                            <div>
                              <h3 className="font-bold text-base text-gray-900">{challenge.title}</h3>
                              <p className="text-sm text-gray-600">{challenge.description}</p>
                            </div>
                            <div className="flex-shrink-0 flex items-center gap-1 px-3 py-1.5 bg-gradient-to-r from-yellow-400 to-orange-500 text-white rounded-full text-sm font-bold shadow-sm">
                              <Trophy className="w-4 h-4" />
                              {challenge.reward}
                            </div>
                          </div>
                          
                          <div className="flex items-center justify-between mt-3">
                            <div className="flex items-center gap-4 text-xs text-gray-500">
                              <span className="flex items-center gap-1">
                                <Users className="w-3.5 h-3.5" />
                                {participantCount} joined
                              </span>
                              <span className="flex items-center gap-1">
                                <Clock className="w-3.5 h-3.5" />
                                {timeLeft}
                              </span>
                            </div>
                            <button
                              onClick={() => handleJoinChallenge(challenge.id)}
                              className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-semibold rounded-lg transition-all shadow-md hover:shadow-lg text-sm"
                            >
                              <UserPlus className="w-4 h-4" />
                              Join Challenge
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Active Challenges (Already Joined) */}
          {activeChallenges.length > 0 && (
            <div className="card">
              <div className="flex items-center gap-3 mb-6">
                <div className="p-2 bg-gradient-to-br from-orange-100 to-red-100 rounded-lg">
                  <Target className="w-6 h-6 text-orange-600" />
                </div>
                <div className="flex-1">
                  <h2 className="text-2xl font-bold text-gray-900">Your Active Challenges</h2>
                  <p className="text-sm text-gray-600">Challenges you've joined</p>
                </div>
              </div>
              <div className="space-y-4">
                {activeChallenges.map((challenge) => {
                  const percentage = Math.min(((challenge.progress || 0) / challenge.target) * 100, 100);
                  const timeLeft = getTimeLeft(challenge.endDate);
                  
                  return (
                    <div
                      key={challenge.id}
                      className="p-5 bg-gradient-to-r from-orange-50 to-red-50 rounded-xl border-2 border-orange-200 hover:border-orange-300 transition-all hover:shadow-md"
                    >
                      <div className="flex items-start gap-4">
                        <div className="flex-shrink-0 w-14 h-14 rounded-full flex items-center justify-center shadow-md bg-gradient-to-br from-orange-400 to-red-500">
                          <Target className="w-7 h-7 text-white" />
                        </div>
                        
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between gap-2 mb-2">
                            <div>
                              <div className="flex items-center gap-2 mb-1">
                                <h3 className="font-bold text-base text-gray-900">{challenge.title}</h3>
                                <span className="px-2 py-0.5 bg-green-100 text-green-700 rounded-full text-xs font-semibold flex items-center gap-1">
                                  <CheckCircle className="w-3 h-3" />
                                  Joined
                                </span>
                              </div>
                              <p className="text-sm text-gray-600">{challenge.description}</p>
                            </div>
                            <div className="flex-shrink-0 flex items-center gap-1 px-3 py-1.5 bg-gradient-to-r from-yellow-400 to-orange-500 text-white rounded-full text-sm font-bold shadow-sm">
                              <Trophy className="w-4 h-4" />
                              {challenge.reward}
                            </div>
                          </div>
                          
                          <div className="mt-3 space-y-2">
                            <div className="flex items-center justify-between text-xs">
                              <span className="text-gray-600">
                                <span className="font-bold text-orange-600">{challenge.progress || 0}</span>
                                <span className="text-gray-500"> / {challenge.target}</span>
                              </span>
                              <div className="flex items-center gap-3">
                                <span className="flex items-center gap-1 text-gray-500">
                                  <Clock className="w-3.5 h-3.5" />
                                  {timeLeft}
                                </span>
                                <span className="font-semibold text-orange-600">{Math.round(percentage)}%</span>
                              </div>
                            </div>
                            <div className="relative w-full bg-orange-200 rounded-full h-2.5 overflow-hidden">
                              <div
                                className="bg-gradient-to-r from-orange-400 to-red-500 h-2.5 rounded-full transition-all duration-500 shadow-sm"
                                style={{ width: `${percentage}%` }}
                              ></div>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Completed Challenges */}
          {completedChallenges.length > 0 && (
            <div className="card">
              <div className="flex items-center gap-3 mb-6">
                <div className="p-2 bg-gradient-to-br from-green-100 to-emerald-100 rounded-lg">
                  <Trophy className="w-6 h-6 text-green-600" />
                </div>
                <h2 className="text-2xl font-bold text-gray-900">Completed Today</h2>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {completedChallenges.map((challenge) => (
                  <div
                    key={challenge.id}
                    className="p-4 bg-gradient-to-r from-green-50 to-emerald-50 rounded-xl border-2 border-green-200"
                  >
                    <div className="flex items-center gap-3">
                      <div className="flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center bg-gradient-to-br from-green-400 to-emerald-500">
                        <span className="text-white text-lg font-bold">✓</span>
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="font-bold text-sm text-gray-900 truncate">{challenge.title}</h3>
                        <div className="flex items-center gap-2 mt-1">
                          <span className="flex items-center gap-1 text-xs text-green-700 font-semibold">
                            <Trophy className="w-3 h-3" />
                            +{challenge.reward} XP
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {challenges.length === 0 && (
            <div className="card text-center py-16">
              <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br from-orange-100 to-red-100 rounded-full mb-4">
                <Trophy className="w-10 h-10 text-orange-600" />
              </div>
              <h3 className="text-xl font-semibold text-gray-700 mb-2">No Challenges Available</h3>
              <p className="text-gray-500">New challenges coming soon! Check back later.</p>
            </div>
          )}

          {/* All sections empty state */}
          {challenges.length > 0 && recommendedChallenges.length === 0 && availableChallenges.length === 0 && activeChallenges.length === 0 && completedChallenges.length === 0 && (
            <div className="card text-center py-12">
              <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-blue-100 to-indigo-100 rounded-full mb-4">
                <UserPlus className="w-8 h-8 text-blue-600" />
              </div>
              <h3 className="text-lg font-semibold text-gray-700 mb-2">Join a Challenge</h3>
              <p className="text-gray-500 text-sm">Browse available challenges above and join to start competing!</p>
            </div>
          )}
        </section>

        {/* Leaderboard Sidebar */}
        <aside className="space-y-6">
          <div className="card">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-gradient-to-br from-purple-100 to-indigo-100 rounded-lg">
                  <Crown className="w-6 h-6 text-purple-600" />
                </div>
                <h3 className="text-xl font-bold text-gray-900">Global Leaderboard</h3>
              </div>
              <TrendingUp className="w-5 h-5 text-purple-600" />
            </div>

            {leaderboard.length === 0 ? (
              <div className="text-center py-6">
                <Users className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                <p className="text-sm text-gray-500">No rankings yet</p>
              </div>
            ) : (
              <div className="space-y-2">
                {leaderboard.map((entry, idx) => {
                  let rankStyle = 'bg-purple-50 text-purple-600 border-purple-200';
                  let rankIcon = <span className="font-bold">{idx + 1}</span>;
                  
                  if (idx === 0) {
                    rankStyle = 'bg-gradient-to-br from-yellow-400 to-yellow-500 text-white border-yellow-300';
                    rankIcon = <Crown className="w-4 h-4" />;
                  } else if (idx === 1) {
                    rankStyle = 'bg-gradient-to-br from-gray-300 to-gray-400 text-white border-gray-300';
                    rankIcon = <Medal className="w-4 h-4" />;
                  } else if (idx === 2) {
                    rankStyle = 'bg-gradient-to-br from-orange-400 to-orange-500 text-white border-orange-300';
                    rankIcon = <Medal className="w-4 h-4" />;
                  }
                  
                  return (
                    <div
                      key={entry.id}
                      className="flex items-center gap-3 p-3 rounded-xl hover:bg-gray-50 transition-colors border border-transparent hover:border-gray-200"
                    >
                      <div className={`flex-shrink-0 w-9 h-9 rounded-full flex items-center justify-center border-2 shadow-sm ${rankStyle}`}>
                        {rankIcon}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-gray-900 truncate">{entry.user.name}</p>
                        <p className="text-xs text-gray-500">Rank #{idx + 1}</p>
                      </div>
                      <div className="flex items-center gap-1 text-sm font-bold text-purple-600">
                        <Zap className="w-4 h-4" />
                        {entry.score}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Info Cards */}
          <div className="space-y-4">
            <div className="card bg-gradient-to-br from-purple-50 to-pink-50 border-purple-200">
              <div className="flex items-start gap-3">
                <div className="p-2 bg-purple-100 rounded-lg">
                  <Sparkles className="w-5 h-5 text-purple-600" />
                </div>
                <div>
                  <h4 className="font-bold text-sm text-gray-900 mb-1">Recommended Challenges</h4>
                  <p className="text-xs text-gray-600">
                    We analyze your learning patterns and recommend challenges to help improve your weak areas and boost your progress.
                  </p>
                </div>
              </div>
            </div>

            <div className="card bg-gradient-to-br from-blue-50 to-indigo-50 border-blue-200">
              <div className="flex items-start gap-3">
                <div className="p-2 bg-blue-100 rounded-lg">
                  <Trophy className="w-5 h-5 text-blue-600" />
                </div>
                <div>
                  <h4 className="font-bold text-sm text-gray-900 mb-1">How It Works</h4>
                  <ul className="text-xs text-gray-600 space-y-1">
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
  
  if (diff <= 0) return 'Expired';
  
  const hours = Math.floor(diff / (1000 * 60 * 60));
  const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
  
  if (hours > 0) return `${hours}h ${minutes}m`;
  return `${minutes}m`;
}
