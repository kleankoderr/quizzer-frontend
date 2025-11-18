import { useEffect, useState } from 'react';
import { leaderboardService } from '../services';
import type { Leaderboard } from '../types';
import { Trophy, Medal, Crown } from 'lucide-react';

export const LeaderboardPage = () => {
  const [activeTab, setActiveTab] = useState<'global' | 'friends'>('global');
  const [leaderboard, setLeaderboard] = useState<Leaderboard | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadLeaderboard();
  }, [activeTab]);

  const loadLeaderboard = async () => {
    setLoading(true);
    try {
      const data =
        activeTab === 'global'
          ? await leaderboardService.getGlobal()
          : await leaderboardService.getFriends();
      setLeaderboard(data);
    } catch (error) {
      console.error('Error loading leaderboard:', error);
    } finally {
      setLoading(false);
    }
  };

  const getRankIcon = (rank: number) => {
    if (rank === 1) return <Crown className="w-6 h-6 text-yellow-500" />;
    if (rank === 2) return <Medal className="w-6 h-6 text-gray-400" />;
    if (rank === 3) return <Medal className="w-6 h-6 text-orange-600" />;
    return <span className="text-gray-500 font-semibold">{rank}</span>;
  };

  return (
    <div className="space-y-6">
      <div className="card">
        <div className="flex items-center gap-3 mb-6">
          <Trophy className="w-8 h-8 text-primary-600" />
          <div>
            <h1 className="text-3xl font-bold">Leaderboard</h1>
            <p className="text-gray-600">See how you rank against others</p>
          </div>
        </div>

        <div className="flex gap-2 border-b border-gray-200">
          <button
            onClick={() => setActiveTab('global')}
            className={`px-6 py-3 font-medium transition-colors ${
              activeTab === 'global'
                ? 'text-primary-600 border-b-2 border-primary-600'
                : 'text-gray-600 hover:text-gray-800'
            }`}
          >
            Global
          </button>
          <button
            onClick={() => setActiveTab('friends')}
            className={`px-6 py-3 font-medium transition-colors ${
              activeTab === 'friends'
                ? 'text-primary-600 border-b-2 border-primary-600'
                : 'text-gray-600 hover:text-gray-800'
            }`}
          >
            Friends
          </button>
        </div>
      </div>

      {loading ? (
        <div className="card flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
        </div>
      ) : (
        <div className="card">
          {leaderboard && leaderboard.entries.length > 0 ? (
            <div className="space-y-2">
              {leaderboard.entries.map((entry) => (
                <div
                  key={entry.userId}
                  className={`flex items-center justify-between p-4 rounded-lg transition-colors ${
                    entry.rank <= 3
                      ? 'bg-gradient-to-r from-primary-50 to-primary-100'
                      : 'hover:bg-gray-50'
                  }`}
                >
                  <div className="flex items-center gap-4 flex-1">
                    <div className="w-12 flex justify-center">
                      {getRankIcon(entry.rank)}
                    </div>
                    <div className="flex items-center gap-3">
                      {entry.avatar ? (
                        <img
                          src={entry.avatar}
                          alt={entry.userName}
                          className="w-10 h-10 rounded-full"
                        />
                      ) : (
                        <div className="w-10 h-10 rounded-full bg-primary-600 flex items-center justify-center text-white font-semibold">
                          {entry.userName.charAt(0).toUpperCase()}
                        </div>
                      )}
                      <span className="font-medium">{entry.userName}</span>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-2xl font-bold text-primary-600">
                      {entry.score}
                    </div>
                    <div className="text-xs text-gray-500">points</div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <Trophy className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-gray-600 mb-2">
                No entries yet
              </h3>
              <p className="text-gray-500">
                Complete quizzes to appear on the leaderboard!
              </p>
            </div>
          )}
        </div>
      )}

      {leaderboard?.userRank && (
        <div className="card bg-gradient-to-br from-primary-50 to-primary-100">
          <h3 className="font-semibold mb-2">Your Rank</h3>
          <p className="text-3xl font-bold text-primary-600">
            #{leaderboard.userRank}
          </p>
        </div>
      )}
    </div>
  );
};
