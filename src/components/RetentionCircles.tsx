import React from 'react';
import { Brain, Zap, Repeat, Award } from 'lucide-react';

interface RetentionCirclesProps {
  distribution: {
    LEARNING: number;
    REINFORCEMENT: number;
    RECALL: number;
    MASTERY: number;
  };
}

export const RetentionCircles: React.FC<RetentionCirclesProps> = ({
  distribution,
}) => {
  const circles = [
    {
      level: 'LEARNING',
      label: 'Learning',
      count: distribution.LEARNING,
      icon: Brain,
      color: 'text-blue-500',
      bg: 'bg-blue-100 dark:bg-blue-900/30',
      border: 'border-blue-200 dark:border-blue-800',
    },
    {
      level: 'REINFORCEMENT',
      label: 'Reinforcement',
      count: distribution.REINFORCEMENT,
      icon: Zap,
      color: 'text-yellow-500',
      bg: 'bg-yellow-100 dark:bg-yellow-900/30',
      border: 'border-yellow-200 dark:border-yellow-800',
    },
    {
      level: 'RECALL',
      label: 'Recall',
      count: distribution.RECALL,
      icon: Repeat,
      color: 'text-orange-500',
      bg: 'bg-orange-100 dark:bg-orange-900/30',
      border: 'border-orange-200 dark:border-orange-800',
    },
    {
      level: 'MASTERY',
      label: 'Mastery',
      count: distribution.MASTERY,
      icon: Award,
      color: 'text-green-500',
      bg: 'bg-green-100 dark:bg-green-900/30',
      border: 'border-green-200 dark:border-green-800',
    },
  ];

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
      {circles.map((circle) => (
        <div
          key={circle.level}
          className={`flex flex-col items-center justify-center p-4 rounded-xl border ${circle.bg} ${circle.border} transition-all hover:scale-105`}
        >
          <div
            className={`p-3 rounded-full bg-white dark:bg-gray-800 mb-3 shadow-sm`}
          >
            <circle.icon className={`w-6 h-6 ${circle.color}`} />
          </div>
          <span className="text-2xl font-bold text-gray-900 dark:text-white mb-1">
            {circle.count}
          </span>
          <span className="text-sm font-medium text-gray-600 dark:text-gray-400">
            {circle.label}
          </span>
        </div>
      ))}
    </div>
  );
};
