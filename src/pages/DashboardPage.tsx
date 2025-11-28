import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { gamificationService, leaderboardService, recommendationService } from '../services';
import type { Streak, Recommendation, LeaderboardEntry } from '../types';
import { Trophy, Brain, Flame, Zap, Crown, Medal, Star, TrendingUp, Sparkles, BookOpen, ArrowRight, Layers } from 'lucide-react';
import { XPProgressBar } from '../components/XPProgressBar';

export const DashboardPage = () => {
  const { user } = useAuth();
  const [streak, setStreak] = useState<Streak | null>(null);
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
      setLeaderboard(leaderboardData.entries.slice(0, 5));
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
          <div className="animate-spin rounded-full h-12 w-12 border-b-3 border-primary-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading your dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-8">
      {/* Hero Header */}
      <header className="relative overflow-hidden rounded-xl bg-primary-600 p-6 md:p-8 shadow-lg">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute -top-10 -right-10 w-40 h-40 bg-white rounded-full"></div>
          <div className="absolute -bottom-10 -left-10 w-40 h-40 bg-white rounded-full"></div>
        </div>
        <div className="relative z-10">
          <div className="flex items-center gap-2 mb-2">
            <Zap className="w-6 h-6 text-yellow-300" />
            <span className="text-yellow-300 font-semibold text-sm">Welcome back!</span>
          </div>
          <h1 className="text-3xl md:text-4xl font-bold text-white mb-2">
            Hello, {user?.name || 'Learner'}! 👋
          </h1>
          <p className="text-primary-100 text-lg">
            Create content, take quizzes, or study flashcards to level up your knowledge
          </p>
        </div>
      </header>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Link
          to="/quiz"
          className="card hover:shadow-lg transition-all cursor-pointer border-2 border-transparent hover:border-primary-300"
        >
          <div className="flex items-center gap-4">
            <div className="p-3 bg-blue-100 rounded-lg">
              <Brain className="w-6 h-6 text-blue-600" />
            </div>
            <div>
              <h3 className="font-bold text-gray-900">Create Quiz</h3>
              <p className="text-sm text-gray-600">Generate AI-powered quizzes</p>
            </div>
          </div>
        </Link>

        <Link
          to="/flashcards"
          className="card hover:shadow-lg transition-all cursor-pointer border-2 border-transparent hover:border-primary-300"
        >
          <div className="flex items-center gap-4">
            <div className="p-3 bg-purple-100 rounded-lg">
              <Layers className="w-6 h-6 text-purple-600" />
            </div>
            <div>
              <h3 className="font-bold text-gray-900">Create Flashcards</h3>
              <p className="text-sm text-gray-600">Build flashcard sets</p>
            </div>
          </div>
        </Link>

        <Link
          to="/challenges"
          className="card hover:shadow-lg transition-all cursor-pointer border-2 border-transparent hover:border-primary-300"
        >
          <div className="flex items-center gap-4">
            <div className="p-3 bg-orange-100 rounded-lg">
              <Trophy className="w-6 h-6 text-orange-600" />
            </div>
            <div>
              <h3 className="font-bold text-gray-900">Join Challenges</h3>
              <p className="text-sm text-gray-600">Compete with others</p>
            </div>
          </div>
        </Link>
      </div>

      {/* Call to Action - Create Study Content */}
      <Link 
        to="/study"
        className="block group"
      >
        <div className="card bg-gradient-to-br from-primary-600 via-primary-700 to-blue-700 border-0 shadow-xl hover:shadow-2xl transition-all transform hover:-translate-y-1 cursor-pointer">
          <div className="relative overflow-hidden">
            <div className="absolute inset-0 opacity-10">
              <div className="absolute -top-10 -right-10 w-40 h-40 bg-white rounded-full blur-2xl"></div>
              <div className="absolute -bottom-10 -left-10 w-40 h-40 bg-white rounded-full blur-2xl"></div>
            </div>
            
            <div className="relative z-10 flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="p-4 bg-white/20 backdrop-blur-sm rounded-xl group-hover:scale-110 transition-transform">
                  <BookOpen className="w-8 h-8 text-white" />
                </div>
                <div>
                  <h2 className="text-2xl font-bold text-white mb-1">Ready to Study?</h2>
                  <p className="text-primary-100 text-base">Create AI-powered study materials from topics, text, or files</p>
                </div>
              </div>
              
              <div className="flex items-center gap-2 text-white group-hover:gap-4 transition-all">
                <span className="font-semibold text-lg">Get Started</span>
                <ArrowRight className="w-6 h-6 group-hover:translate-x-1 transition-transform" />
              </div>
            </div>
          </div>
        </div>
      </Link>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="card bg-primary-50 border border-primary-200">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-primary-500 rounded-lg">
              <Brain className="w-6 h-6 text-white" />
            </div>
            <div>
              <p className="text-sm text-gray-600">Total Content</p>
              <p className="text-2xl font-bold text-gray-900">0</p>
            </div>
          </div>
        </div>

        <div className="card bg-green-50 border border-green-200">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-green-500 rounded-lg">
              <TrendingUp className="w-6 h-6 text-white" />
            </div>
            <div>
              <p className="text-sm text-gray-600">This Week</p>
              <p className="text-2xl font-bold text-gray-900">0</p>
            </div>
          </div>
        </div>

        <div className="card bg-yellow-50 border border-yellow-200">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-yellow-500 rounded-lg">
              <Sparkles className="w-6 h-6 text-white" />
            </div>
            <div>
              <p className="text-sm text-gray-600">Popular Topic</p>
              <p className="text-lg font-bold text-gray-900">-</p>
            </div>
          </div>
        </div>
      </div>

      {/* Rest of dashboard content */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Streak & XP */}
        <div className="card">
          <div className="flex items-center gap-3 mb-4">
            <Flame className="w-6 h-6 text-orange-500" />
            <h2 className="text-xl font-bold text-gray-900">Your Progress</h2>
          </div>
          
          {streak && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Current Streak</p>
                  <p className="text-3xl font-bold text-orange-600">{streak.currentStreak} days</p>
                </div>
                <div className="text-right">
                  <p className="text-sm text-gray-600">Longest Streak</p>
                  <p className="text-2xl font-bold text-gray-900">{streak.longestStreak} days</p>
                </div>
              </div>
              
              <XPProgressBar streak={streak} />
            </div>
          )}
        </div>

        {/* Leaderboard Preview */}
        <div className="card">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <Trophy className="w-6 h-6 text-yellow-500" />
              <h2 className="text-xl font-bold text-gray-900">Leaderboard</h2>
            </div>
            <Link to="/leaderboard" className="text-sm text-primary-600 hover:text-primary-700 font-medium">
              View All
            </Link>
          </div>
          
          <div className="space-y-2">
            {leaderboard.map((entry, index) => (
              <div key={entry.id} className="flex items-center gap-3 p-2 rounded-lg hover:bg-gray-50">
                <div className="flex-shrink-0 w-8 text-center">
                  {index === 0 && <Crown className="w-5 h-5 text-yellow-500 mx-auto" />}
                  {index === 1 && <Medal className="w-5 h-5 text-gray-400 mx-auto" />}
                  {index === 2 && <Medal className="w-5 h-5 text-orange-600 mx-auto" />}
                  {index > 2 && <span className="text-sm font-semibold text-gray-500">#{index + 1}</span>}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900 truncate">{entry.userName || entry.user?.name}</p>
                </div>
                <div className="flex items-center gap-1 text-primary-600">
                  <Star className="w-4 h-4" />
                  <span className="text-sm font-semibold">{entry.score}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Recommendations */}
      {recommendations.length > 0 && (
        <div className="card">
          <div className="flex items-center gap-3 mb-4">
            <TrendingUp className="w-6 h-6 text-green-500" />
            <h2 className="text-xl font-bold text-gray-900">Recommended for You</h2>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {recommendations.map((rec, index) => (
              <div key={rec.topic + index} className="p-4 bg-gradient-to-br from-primary-50 to-blue-50 rounded-lg border border-primary-200">
                <div className="flex items-start justify-between mb-2">
                  <h3 className="font-semibold text-gray-900">{rec.topic}</h3>
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                    rec.priority === 'high' ? 'bg-red-100 text-red-700' :
                    rec.priority === 'medium' ? 'bg-yellow-100 text-yellow-700' :
                    'bg-green-100 text-green-700'
                  }`}>
                    {rec.priority}
                  </span>
                </div>
                <p className="text-sm text-gray-600">{rec.reason}</p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
