import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { gamificationService, leaderboardService, recommendationService } from '../services';
import type { Streak, Challenge, Recommendation, LeaderboardEntry } from '../types';
import { Trophy, Brain, Flame, Target, BookOpen, Zap, Crown, Medal, Star, TrendingUp } from 'lucide-react';
import { XPProgressBar } from '../components/XPProgressBar';

export const DashboardPage = () => {
  const { user } = useAuth();
  const [streak, setStreak] = useState<Streak | null>(null);
  const [challenges, setChallenges] = useState<Challenge[]>([]);
  const [recommendations, setRecommendations] = useState<Recommendation[]>([]);
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      const [gamificationData, leaderboardData, recommendationsData] = await Promise.all([
        gamificationService.loadDashboardData(),
        leaderboardService.getGlobal(),
        recommendationService.getAll(),
      ]);

      setStreak(gamificationData.streak);
      setChallenges(gamificationData.challenges || []);
      setLeaderboard(leaderboardData.slice(0, 5));
      setRecommendations(recommendationsData.slice(0, 3));
    } catch (error) {
      console.error('Error loading dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-3 border-purple-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading your dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-8">
      {/* Hero Header */}
      <header className="relative overflow-hidden rounded-xl bg-gradient-to-br from-purple-600 via-purple-700 to-indigo-700 p-6 md:p-8 shadow-lg">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute -top-10 -right-10 w-40 h-40 bg-white rounded-full"></div>
          <div className="absolute -bottom-10 -left-10 w-40 h-40 bg-white rounded-full"></div>
        </div>
        <div className="relative z-10 flex items-center justify-between gap-6">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <Zap className="w-6 h-6 text-yellow-300" />
              <span className="text-yellow-300 font-semibold text-sm">Welcome back!</span>
            </div>
            <h1 className="text-3xl md:text-4xl font-bold text-white mb-2">
              Hello, {user?.name || 'Learner'}! 👋
            </h1>
            <p className="text-purple-100">Ready to level up your knowledge today?</p>
          </div>
          <div className="hidden md:flex gap-3 flex-shrink-0">
            <Link
              to="/quiz"
              className="group flex items-center gap-2 px-4 py-3 bg-white/20 hover:bg-white/30 backdrop-blur-sm rounded-lg transition-all hover:scale-105 border border-white/30"
            >
              <Brain className="w-5 h-5 text-white" />
              <div className="text-left">
                <div className="text-sm font-semibold text-white">Take a Quiz</div>
                <div className="text-xs text-purple-100">Test your knowledge</div>
              </div>
            </Link>
            <Link
              to="/flashcards"
              className="group flex items-center gap-2 px-4 py-3 bg-white/20 hover:bg-white/30 backdrop-blur-sm rounded-lg transition-all hover:scale-105 border border-white/30"
            >
              <BookOpen className="w-5 h-5 text-white" />
              <div className="text-left">
                <div className="text-sm font-semibold text-white">Study Flashcards</div>
                <div className="text-xs text-purple-100">Quick review session</div>
              </div>
            </Link>
          </div>
        </div>
        {/* Mobile buttons */}
        <div className="flex md:hidden gap-3 mt-4 relative z-10">
          <Link
            to="/quiz"
            className="flex-1 flex items-center justify-center gap-2 px-3 py-2 bg-white/20 backdrop-blur-sm rounded-lg border border-white/30"
          >
            <Brain className="w-4 h-4 text-white" />
            <span className="text-sm font-semibold text-white">Quiz</span>
          </Link>
          <Link
            to="/flashcards"
            className="flex-1 flex items-center justify-center gap-2 px-3 py-2 bg-white/20 backdrop-blur-sm rounded-lg border border-white/30"
          >
            <BookOpen className="w-4 h-4 text-white" />
            <span className="text-sm font-semibold text-white">Flashcards</span>
          </Link>
        </div>
      </header>

      {/* Stats Overview - Redesigned */}
      {streak && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {/* Day Streak */}
          <div className="relative bg-gradient-to-br from-orange-100 to-red-50 rounded-xl p-4 flex flex-col items-center shadow group hover:shadow-lg transition">
            <Flame className="w-8 h-8 text-orange-500 mb-2 animate-pulse" />
            <div className="text-3xl font-extrabold text-orange-600 flex items-center gap-1">
              {streak.currentStreak}
              <span className="text-base font-medium text-orange-400">days</span>
            </div>
            <div className="text-xs text-gray-500 mt-1">Day Streak</div>
            <div className="absolute top-2 right-2 text-xs text-orange-400 font-bold animate-bounce">🔥</div>
          </div>
          {/* Level */}
          <div className="relative bg-gradient-to-br from-purple-100 to-indigo-50 rounded-xl p-4 flex flex-col items-center shadow group hover:shadow-lg transition">
            <Star className="w-8 h-8 text-purple-500 mb-2" />
            <div className="text-3xl font-extrabold text-purple-700">{streak.level}</div>
            <div className="text-xs text-gray-500 mt-1">Level</div>
            <div className="w-full mt-2">
              <div className="h-2 bg-purple-200 rounded-full">
                <div
                  className="h-2 bg-gradient-to-r from-purple-400 to-indigo-500 rounded-full transition-all"
                  style={{ width: `${Math.min((streak.xpProgress / (streak.xpForNextLevel || 1)) * 100, 100)}%` }}
                ></div>
              </div>
              <div className="text-[10px] text-right text-purple-400 mt-1">
                {streak.xpProgress} / {streak.xpForNextLevel} XP
              </div>
            </div>
          </div>
          {/* Total XP */}
          <div className="relative bg-gradient-to-br from-blue-100 to-cyan-50 rounded-xl p-4 flex flex-col items-center shadow group hover:shadow-lg transition">
            <Zap className="w-8 h-8 text-blue-500 mb-2" />
            <div className="text-3xl font-extrabold text-blue-700">{streak.totalXP}</div>
            <div className="text-xs text-gray-500 mt-1">Total XP</div>
            <div className="absolute top-2 right-2 text-xs text-blue-400 font-bold">⚡</div>
          </div>
          {/* Longest Streak */}
          <div className="relative bg-gradient-to-br from-yellow-100 to-orange-50 rounded-xl p-4 flex flex-col items-center shadow group hover:shadow-lg transition">
            <Trophy className="w-8 h-8 text-yellow-500 mb-2" />
            <div className="text-3xl font-extrabold text-yellow-600 flex items-center gap-1">
              {streak.longestStreak}
              <span className="text-base font-medium text-yellow-400">days</span>
            </div>
            <div className="text-xs text-gray-500 mt-1">Longest Streak</div>
            <div className="absolute top-2 right-2 text-xs text-yellow-400 font-bold">🏆</div>
          </div>
        </div>
      )}

      <main className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main column */}
        <section className="lg:col-span-2 space-y-6">
          {/* XP Progress */}
          {streak && (
            <div>
              <XPProgressBar streak={streak} />
            </div>
          )}

          {/* Recommendations */}
          {recommendations.length > 0 && (
            <div className="card">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-bold text-lg flex items-center gap-2">
                  <TrendingUp className="w-5 h-5 text-purple-600" />
                  Recommended for You
                </h3>
                <Link to="/recommendations" className="text-sm text-purple-600 hover:text-purple-700 font-medium">
                  View all →
                </Link>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                {recommendations.slice(0, 3).map((r) => (
                  <div
                    key={r.topic}
                    className="p-3 bg-gradient-to-br from-purple-50 to-blue-50 rounded-lg border border-purple-100 hover:border-purple-300 transition-all cursor-pointer group"
                  >
                    <div className="flex items-start gap-2">
                      <div className="p-1.5 bg-purple-100 rounded group-hover:bg-purple-200 transition-colors">
                        <Brain className="w-4 h-4 text-purple-600" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-sm text-gray-900 truncate">{r.topic}</p>
                        <p className="text-xs text-gray-600 mt-1">
                          {r.reason === 'needs_improvement' ? 'Needs practice' : 'Based on your progress'}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </section>

        {/* Sidebar */}
        <aside className="space-y-6">
          {/* Daily Challenges */}
          <div className="card">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-bold flex items-center gap-2">
                <Target className="w-5 h-5 text-orange-500" />
                Daily Challenges
              </h3>
              <Link to="/challenges" className="text-xs text-purple-600 hover:text-purple-700 font-medium">
                View all →
              </Link>
            </div>
            {challenges.length === 0 ? (
              <div className="text-center py-6">
                <div className="inline-flex items-center justify-center w-12 h-12 bg-green-100 rounded-full mb-3">
                  <Trophy className="w-6 h-6 text-green-600" />
                </div>
                <p className="text-sm text-gray-600">All caught up! 🎉</p>
              </div>
            ) : (
              <ul className="space-y-3">
                {challenges.slice(0, 3).map((c) => {
                  const percentage = Math.min(((c.progress || 0) / c.target) * 100, 100);
                  const isComplete = (c.progress || 0) >= c.target;
                  const progressCount = c.progress || 0;
                  
                  return (
                  <li key={c.id} className="p-4 bg-gradient-to-r from-orange-50 to-yellow-50 rounded-xl border border-orange-200 hover:border-orange-300 transition-all hover:shadow-sm">
                    <div className="flex items-start gap-3">
                      {/* Challenge Circle Icon */}
                      <div className={`flex-shrink-0 w-12 h-12 rounded-full flex items-center justify-center shadow-md ${
                        isComplete 
                          ? 'bg-gradient-to-br from-green-400 to-green-500' 
                          : 'bg-gradient-to-br from-orange-400 to-orange-500'
                      }`}>
                        {isComplete ? (
                          <span className="text-white text-xl font-bold">✓</span>
                        ) : (
                          <Target className="w-6 h-6 text-white" />
                        )}
                      </div>
                      
                      {/* Challenge Content */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2 mb-2">
                          <div>
                            <h4 className="font-bold text-sm text-gray-900 mb-0.5">{c.title}</h4>
                            <p className="text-xs text-gray-600">{c.description}</p>
                          </div>
                          <div className="flex-shrink-0 flex items-center gap-1 px-2.5 py-1 bg-gradient-to-r from-orange-500 to-orange-600 text-white rounded-full text-xs font-bold shadow-sm">
                            <Zap className="w-3 h-3" />
                            {c.reward}
                          </div>
                        </div>
                        
                        {/* Progress Section */}
                        <div className="mt-3">
                          {isComplete ? (
                            <div className="bg-green-100 text-green-700 px-3 py-1.5 rounded-full text-xs font-semibold inline-flex items-center gap-1">
                              <span>🎉</span> Completed!
                            </div>
                          ) : (
                            <div className="space-y-2">
                              <div className="flex items-center justify-between text-xs">
                                <span className="text-gray-600">
                                  <span className="font-bold text-orange-600">{progressCount}</span>
                                  <span className="text-gray-500"> / {c.target}</span>
                                </span>
                                <span className="font-semibold text-orange-600">{Math.round(percentage)}%</span>
                              </div>
                              <div className="relative w-full bg-orange-200 rounded-full h-2 overflow-hidden">
                                <div
                                  className="bg-gradient-to-r from-orange-400 to-orange-500 h-2 rounded-full transition-all duration-500 shadow-sm"
                                  style={{ width: `${percentage}%` }}
                                ></div>
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </li>
                  );
                })}
              </ul>
            )}
          </div>

          {/* Leaderboard */}
          <div className="card">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-bold flex items-center gap-2">
                <Crown className="w-5 h-5 text-yellow-500" />
                Top Players
              </h3>
              <Link to="/leaderboard" className="text-xs text-purple-600 hover:text-purple-700 font-medium">
                Full board →
              </Link>
            </div>
            {leaderboard.length === 0 ? (
              <p className="text-sm text-gray-500 text-center py-4">No rankings yet</p>
            ) : (
              <ol className="space-y-2">
                {leaderboard.slice(0, 5).map((l, idx) => {
                  let rankStyle = 'bg-purple-50 text-purple-600';
                  if (idx === 0) rankStyle = 'bg-yellow-100 text-yellow-700';
                  else if (idx === 1) rankStyle = 'bg-gray-100 text-gray-700';
                  else if (idx === 2) rankStyle = 'bg-orange-100 text-orange-700';
                  
                  return (
                  <li
                    key={l.id}
                    className="flex items-center gap-3 p-2 rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    <div className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm ${rankStyle}`}>
                      {idx < 3 ? <Medal className="w-4 h-4" /> : idx + 1}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900 truncate">{l.user.name}</p>
                    </div>
                    <div className="flex items-center gap-1 text-xs font-semibold text-purple-600">
                      <Zap className="w-3 h-3" />
                      {l.score}
                    </div>
                  </li>
                  );
                })}
              </ol>
            )}
          </div>
        </aside>
      </main>
    </div>
  );
}

// ...existing code...




