import { useState, useEffect } from 'react';
import { X, Trophy, Crown, Medal, Zap } from 'lucide-react';
import { challengeService } from '../services';
import type { ChallengeLeaderboard } from '../types';

interface ChallengeLeaderboardModalProps {
  challengeId: string;
  challengeTitle: string;
  isOpen: boolean;
  onClose: () => void;
}

export const ChallengeLeaderboardModal: React.FC<ChallengeLeaderboardModalProps> = ({
  challengeId,
  challengeTitle,
  isOpen,
  onClose,
}) => {
  const [leaderboard, setLeaderboard] = useState<ChallengeLeaderboard | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (isOpen && challengeId) {
      loadLeaderboard();
    }
  }, [isOpen, challengeId]);

  const loadLeaderboard = async () => {
    try {
      setLoading(true);
      const data = await challengeService.getChallengeLeaderboard(challengeId);
      setLeaderboard(data);
    } catch (_error) {

    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700 bg-gradient-to-r from-primary-600 to-primary-800 dark:from-primary-900 dark:to-primary-950">
          <div className="flex items-center gap-3">
            <Crown className="w-6 h-6 text-yellow-300" />
            <div>
              <h2 className="text-xl font-bold text-white">Challenge Leaderboard</h2>
              <p className="text-primary-100 text-sm">{challengeTitle}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-white/20 rounded-lg transition-colors"
          >
            <X className="w-5 h-5 text-white" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto max-h-[calc(90vh-120px)]">
          {loading ? (
            <div className="space-y-3">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="animate-pulse flex items-center gap-3 p-3">
                  <div className="w-10 h-10 bg-gray-200 dark:bg-gray-700 rounded-full"></div>
                  <div className="flex-1">
                    <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/3 mb-2"></div>
                    <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-1/4"></div>
                  </div>
                </div>
              ))}
            </div>
          ) : leaderboard && leaderboard.entries.length > 0 ? (
            <div className="space-y-2">
              {leaderboard.entries.map((entry) => {
                let rankStyle = 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300';
                let rankIcon = <span className="font-bold">{entry.rank}</span>;

                if (entry.rank === 1) {
                  rankStyle = 'bg-yellow-500 text-white';
                  rankIcon = <Crown className="w-5 h-5" />;
                } else if (entry.rank === 2) {
                  rankStyle = 'bg-gray-400 text-white';
                  rankIcon = <Medal className="w-5 h-5" />;
                } else if (entry.rank === 3) {
                  rankStyle = 'bg-orange-500 text-white';
                  rankIcon = <Medal className="w-5 h-5" />;
                }

                const isCurrentUser = leaderboard.currentUser?.userId === entry.userId;

                return (
                  <div
                    key={entry.userId}
                    className={`flex items-center gap-3 p-4 rounded-xl transition-all ${
                      isCurrentUser
                        ? 'bg-primary-50 dark:bg-primary-900/20 border-2 border-primary-500 dark:border-primary-600'
                        : 'bg-gray-50 dark:bg-gray-800 hover:bg-gray-100 dark:hover:bg-gray-700'
                    }`}
                  >
                    {/* Rank */}
                    <div className={`flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center ${rankStyle}`}>
                      {rankIcon}
                    </div>

                    {/* User Info */}
                    <div className="flex-1 min-w-0">
                      <p className={`font-semibold truncate ${
                        isCurrentUser
                          ? 'text-primary-700 dark:text-primary-300'
                          : 'text-gray-900 dark:text-white'
                      }`}>
                        {entry.userName}
                        {isCurrentUser && <span className="ml-2 text-xs">(You)</span>}
                      </p>
                      {entry.completedAt && (
                        <p className="text-xs text-gray-500 dark:text-gray-400">
                          {new Date(entry.completedAt).toLocaleDateString()}
                        </p>
                      )}
                    </div>

                    {/* Score */}
                    <div className="flex items-center gap-1 font-bold text-primary-600 dark:text-primary-400">
                      <Zap className="w-4 h-4" />
                      <span>{entry.score}%</span>
                    </div>
                  </div>
                );
              })}

              {/* Current User (if not in top 11) */}
              {leaderboard.currentUser && !leaderboard.entries.some(e => e.userId === leaderboard.currentUser?.userId) && (
                <>
                  <div className="flex items-center justify-center py-2">
                    <div className="flex gap-1">
                      <div className="w-1 h-1 bg-gray-300 dark:bg-gray-600 rounded-full"></div>
                      <div className="w-1 h-1 bg-gray-300 dark:bg-gray-600 rounded-full"></div>
                      <div className="w-1 h-1 bg-gray-300 dark:bg-gray-600 rounded-full"></div>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 p-4 rounded-xl bg-primary-50 dark:bg-primary-900/20 border-2 border-primary-500 dark:border-primary-600">
                    <div className="flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center bg-primary-100 dark:bg-primary-800 text-primary-700 dark:text-primary-300">
                      <span className="font-bold">{leaderboard.currentUser.rank}</span>
                    </div>
                    <div className="flex-1">
                      <p className="font-semibold text-primary-700 dark:text-primary-300">
                        {leaderboard.currentUser.userName} (You)
                      </p>
                      {leaderboard.currentUser.completedAt && (
                        <p className="text-xs text-gray-500 dark:text-gray-400">
                          {new Date(leaderboard.currentUser.completedAt).toLocaleDateString()}
                        </p>
                      )}
                    </div>
                    <div className="flex items-center gap-1 font-bold text-primary-600 dark:text-primary-400">
                      <Zap className="w-4 h-4" />
                      <span>{leaderboard.currentUser.score}%</span>
                    </div>
                  </div>
                </>
              )}
            </div>
          ) : (
            <div className="text-center py-12">
              <Trophy className="w-16 h-16 text-gray-300 dark:text-gray-600 mx-auto mb-4" />
              <p className="text-gray-500 dark:text-gray-400">No rankings yet</p>
              <p className="text-sm text-gray-400 dark:text-gray-500 mt-2">
                Be the first to complete this challenge!
              </p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50">
          <button
            onClick={onClose}
            className="w-full px-4 py-2 bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 text-gray-900 dark:text-white font-semibold rounded-lg transition-all"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
