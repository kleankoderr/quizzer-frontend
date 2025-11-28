import { useEffect, useState } from 'react';
import { Lock } from 'lucide-react';
import type { Streak } from '../types';

interface XPProgressBarProps {
  streak: Streak;
  showLevelUp?: boolean;
}

export const XPProgressBar = ({ streak, showLevelUp = false }: XPProgressBarProps) => {
  const [showAnimation, setShowAnimation] = useState(false);

  useEffect(() => {
    if (showLevelUp && streak.leveledUp) {
      setShowAnimation(true);
      const timer = setTimeout(() => setShowAnimation(false), 3000);
      return () => clearTimeout(timer);
    }
  }, [showLevelUp, streak.leveledUp]);

  return (
    <div className="space-y-4">
      {/* Level Up Animation */}
      {showAnimation && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 animate-fade-in">
          <div className="bg-white rounded-lg p-8 max-w-md w-full mx-4 text-center animate-scale-in">
            <div className="text-6xl mb-4">🎉</div>
            <h2 className="text-3xl font-bold text-purple-600 mb-2">Level Up!</h2>
            <p className="text-xl text-gray-700">
              You reached Level {streak.level}!
            </p>
            {streak.earnedXP && (
              <p className="text-sm text-gray-600 mt-4">
                +{streak.earnedXP} XP earned
              </p>
            )}
          </div>
        </div>
      )}



      {/* Progress Bar */}
      <div>
        <div className="flex justify-between text-sm mb-1">
          <span className="font-medium text-gray-700">Level {streak.level}</span>
          <span className="text-gray-500">{streak.xpProgress} / {streak.xpNeeded} XP</span>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-2.5 overflow-hidden">
          <div
            className="bg-gradient-to-r from-purple-600 to-blue-500 h-2.5 rounded-full transition-all duration-500 ease-out"
            style={{ width: `${streak.progressPercentage}%` }}
          ></div>
        </div>
        <p className="text-xs text-gray-500 mt-1 text-right">
          {streak.xpForNextLevel} XP to next level
        </p>
      </div>

        {/* Milestones */}
        {streak.milestones && streak.milestones.length > 0 && (
          <div className="mt-6 pt-6 border-t border-gray-200">
            <p className="text-sm font-semibold text-gray-900 mb-4">Streak Milestones</p>
            <div className="grid grid-cols-6 gap-3">
              {streak.milestones.map((milestone) => (
                <div
                  key={`milestone-${milestone.days}`}
                  className="text-center"
                  title={milestone.unlocked ? `${milestone.name} - Unlocked!` : `${milestone.name} - Reach ${milestone.days} day streak`}
                >
                  <div
                    className={`relative w-full aspect-square rounded-lg flex items-center justify-center mb-2 transition-all ${
                      milestone.unlocked
                        ? 'bg-gradient-to-br from-yellow-400 to-orange-500 shadow-md scale-100'
                        : 'bg-gray-100 opacity-40 scale-95'
                    }`}
                  >
                    {milestone.unlocked ? (
                      <div className="text-2xl">{milestone.icon}</div>
                    ) : (
                      <Lock className="w-5 h-5 text-gray-400" />
                    )}
                  </div>
                  <p className={`text-xs font-medium ${
                    milestone.unlocked ? 'text-gray-900' : 'text-gray-400'
                  }`}>
                    {milestone.days}d
                  </p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Achievements */}
        {streak.achievements && streak.achievements.length > 0 && (
          <div className="mt-6 pt-6 border-t border-gray-200">
            <p className="text-sm font-semibold text-gray-900 mb-4">Recent Achievements</p>
            <div className="grid grid-cols-5 gap-3">
              {streak.achievements.slice(0, 5).map((achievement) => (
                <div
                  key={`achievement-${achievement.name}`}
                  className="text-center group cursor-pointer"
                  title={achievement.description}
                >
                  <div className="w-full aspect-square bg-gradient-to-br from-purple-100 to-blue-100 rounded-lg flex items-center justify-center mb-2 border-2 border-purple-200 group-hover:border-purple-400 transition-all group-hover:scale-105">
                    <div className="text-2xl">{achievement.icon}</div>
                  </div>
                  <p className="text-xs font-medium text-gray-700 truncate">
                    {achievement.name}
                  </p>
                </div>
              ))}
            </div>
          </div>
        )}
    </div>
  );
};
