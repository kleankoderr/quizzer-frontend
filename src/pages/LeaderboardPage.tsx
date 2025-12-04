import { useState } from "react";
import { useLeaderboard } from "../hooks";
import { Trophy, Medal, Crown } from "lucide-react";
import { TableSkeleton } from "../components/skeletons";

export const LeaderboardPage = () => {
  const [activeTab, setActiveTab] = useState<"global" | "friends">("global");
  const { data: leaderboard, isLoading: loading } = useLeaderboard(activeTab);

  const getRankIcon = (rank: number) => {
    if (rank === 1) return <Crown className="w-6 h-6 text-yellow-500" />;
    if (rank === 2) return <Medal className="w-6 h-6 text-gray-400" />;
    if (rank === 3) return <Medal className="w-6 h-6 text-orange-600" />;
    return (
      <span className="text-gray-500 dark:text-gray-400 font-semibold">
        {rank}
      </span>
    );
  };

  return (
    <div className="space-y-6 pb-8">
      {/* Hero Header */}
      <header className="relative overflow-hidden rounded-xl bg-primary-600 dark:bg-primary-900 p-6 md:p-8 shadow-lg">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute -top-10 -right-10 w-40 h-40 bg-white rounded-full"></div>
          <div className="absolute -bottom-10 -left-10 w-40 h-40 bg-white rounded-full"></div>
        </div>

        <div className="relative z-10">
          <div className="flex items-center gap-2 mb-2">
            <Trophy className="w-6 h-6 text-yellow-300" />
            <span className="text-yellow-300 font-semibold text-sm">
              Rankings
            </span>
          </div>
          <h1 className="text-3xl md:text-4xl font-bold text-white mb-2">
            Leaderboard
          </h1>
          <p className="text-primary-100 dark:text-primary-200 text-lg">
            See how you rank against others
          </p>
        </div>
      </header>

      {/* Tabs Card */}
      <div className="card dark:bg-gray-800">
        <div className="flex gap-2 border-b border-gray-200 dark:border-gray-700">
          <button
            onClick={() => setActiveTab("global")}
            className={`px-6 py-3 font-medium transition-colors ${
              activeTab === "global"
                ? "text-primary-600 dark:text-primary-400 border-b-2 border-primary-600 dark:border-primary-400"
                : "text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200"
            }`}
          >
            Global
          </button>
          <button
            onClick={() => setActiveTab("friends")}
            className={`px-6 py-3 font-medium transition-colors ${
              activeTab === "friends"
                ? "text-primary-600 dark:text-primary-400 border-b-2 border-primary-600 dark:border-primary-400"
                : "text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200"
            }`}
          >
            Friends
          </button>
        </div>
      </div>

      {loading ? (
        <div className="card dark:bg-gray-800">
          <TableSkeleton rows={10} columns={3} />
        </div>
      ) : (
        <div className="card dark:bg-gray-800">
          {leaderboard && leaderboard.entries.length > 0 ? (
            <div className="space-y-2">
              {leaderboard.entries.map((entry) => (
                <div
                  key={entry.userId}
                  className={`flex items-center justify-between p-4 rounded-lg transition-colors ${
                    entry.rank <= 3
                      ? "bg-primary-50 dark:bg-primary-900/20 border border-primary-100 dark:border-primary-800"
                      : "hover:bg-gray-50 dark:hover:bg-gray-700"
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
                          {(entry.userName || "U").charAt(0).toUpperCase()}
                        </div>
                      )}
                      <span className="font-medium text-gray-900 dark:text-white">
                        {entry.userName}
                      </span>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-2xl font-bold text-primary-600 dark:text-primary-400">
                      {entry.score}
                    </div>
                    <div className="text-xs text-gray-500 dark:text-gray-400">
                      points
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <Trophy className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-gray-600 dark:text-gray-300 mb-2">
                No entries yet
              </h3>
              <p className="text-gray-500 dark:text-gray-400">
                Complete quizzes to appear on the leaderboard!
              </p>
            </div>
          )}
        </div>
      )}

      {leaderboard?.userRank && (
        <div className="card bg-primary-50 dark:bg-primary-900/20 border border-primary-100 dark:border-primary-800">
          <h3 className="font-semibold mb-2 text-gray-900 dark:text-white">
            Your Rank
          </h3>
          <p className="text-3xl font-bold text-primary-600 dark:text-primary-400">
            #{leaderboard.userRank}
          </p>
        </div>
      )}
    </div>
  );
};
