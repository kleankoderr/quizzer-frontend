import React from 'react';
import type { LucideIcon } from 'lucide-react';

interface StatCardProps {
  title: string;
  value: string | number;
  icon: LucideIcon;
  trend?: string | React.ReactNode;
  description?: React.ReactNode;
  color?:
    | 'blue'
    | 'green'
    | 'purple'
    | 'orange'
    | 'red'
    | 'indigo'
    | 'violet'
    | 'emerald'
    | 'cyan'
    | 'amber'
    | 'pink'
    | 'yellow';
  variant?: 'default' | 'gradient' | 'minimal';
  className?: string;
  onClick?: () => void;
}

const colorStyles = {
  blue: {
    bg: 'bg-blue-50 dark:bg-blue-900/10',
    border: 'border-blue-200 dark:border-blue-800',
    iconBg: 'bg-blue-100 dark:bg-blue-900/30',
    iconColor: 'text-blue-600 dark:text-blue-400',
    solidBg: 'bg-blue-500',
    gradient:
      'from-blue-50 to-blue-100 dark:from-blue-900/20 dark:to-blue-800/20',
  },
  green: {
    bg: 'bg-green-50 dark:bg-green-900/10',
    border: 'border-green-200 dark:border-green-800',
    iconBg: 'bg-green-100 dark:bg-green-900/30',
    iconColor: 'text-green-600 dark:text-green-400',
    solidBg: 'bg-green-500',
    gradient:
      'from-green-50 to-green-100 dark:from-green-900/20 dark:to-green-800/20',
  },
  emerald: {
    bg: 'bg-emerald-50 dark:bg-emerald-900/10',
    border: 'border-emerald-200 dark:border-emerald-800',
    iconBg: 'bg-emerald-100 dark:bg-emerald-900/30',
    iconColor: 'text-emerald-600 dark:text-emerald-400',
    solidBg: 'bg-emerald-500',
    gradient:
      'from-emerald-50 to-emerald-100 dark:from-emerald-900/20 dark:to-emerald-800/20',
  },
  purple: {
    bg: 'bg-purple-50 dark:bg-purple-900/10',
    border: 'border-purple-200 dark:border-purple-800',
    iconBg: 'bg-purple-100 dark:bg-purple-900/30',
    iconColor: 'text-purple-600 dark:text-purple-400',
    solidBg: 'bg-purple-500',
    gradient:
      'from-purple-50 to-purple-100 dark:from-purple-900/20 dark:to-purple-800/20',
  },
  violet: {
    bg: 'bg-violet-50 dark:bg-violet-900/10',
    border: 'border-violet-200 dark:border-violet-800',
    iconBg: 'bg-violet-100 dark:bg-violet-900/30',
    iconColor: 'text-violet-600 dark:text-violet-400',
    solidBg: 'bg-violet-500',
    gradient:
      'from-violet-50 to-violet-100 dark:from-violet-900/20 dark:to-violet-800/20',
  },
  indigo: {
    bg: 'bg-indigo-50 dark:bg-indigo-900/10',
    border: 'border-indigo-200 dark:border-indigo-800',
    iconBg: 'bg-indigo-100 dark:bg-indigo-900/30',
    iconColor: 'text-indigo-600 dark:text-indigo-400',
    solidBg: 'bg-indigo-500',
    gradient:
      'from-indigo-50 to-indigo-100 dark:from-indigo-900/20 dark:to-indigo-800/20',
  },
  orange: {
    bg: 'bg-orange-50 dark:bg-orange-900/10',
    border: 'border-orange-200 dark:border-orange-800',
    iconBg: 'bg-orange-100 dark:bg-orange-900/30',
    iconColor: 'text-orange-600 dark:text-orange-400',
    solidBg: 'bg-orange-500',
    gradient:
      'from-orange-50 to-orange-100 dark:from-orange-900/20 dark:to-orange-800/20',
  },
  amber: {
    bg: 'bg-amber-50 dark:bg-amber-900/10',
    border: 'border-amber-200 dark:border-amber-800',
    iconBg: 'bg-amber-100 dark:bg-amber-900/30',
    iconColor: 'text-amber-600 dark:text-amber-400',
    solidBg: 'bg-amber-500',
    gradient:
      'from-amber-50 to-amber-100 dark:from-amber-900/20 dark:to-amber-800/20',
  },
  red: {
    bg: 'bg-red-50 dark:bg-red-900/10',
    border: 'border-red-200 dark:border-red-800',
    iconBg: 'bg-red-100 dark:bg-red-900/30',
    iconColor: 'text-red-600 dark:text-red-400',
    solidBg: 'bg-red-500',
    gradient: 'from-red-50 to-red-100 dark:from-red-900/20 dark:to-red-800/20',
  },
  cyan: {
    bg: 'bg-cyan-50 dark:bg-cyan-900/10',
    border: 'border-cyan-200 dark:border-cyan-800',
    iconBg: 'bg-cyan-100 dark:bg-cyan-900/30',
    iconColor: 'text-cyan-600 dark:text-cyan-400',
    solidBg: 'bg-cyan-500',
    gradient:
      'from-cyan-50 to-cyan-100 dark:from-cyan-900/20 dark:to-cyan-800/20',
  },
  pink: {
    bg: 'bg-pink-50 dark:bg-pink-900/10',
    border: 'border-pink-200 dark:border-pink-800',
    iconBg: 'bg-pink-100 dark:bg-pink-900/30',
    iconColor: 'text-pink-600 dark:text-pink-400',
    solidBg: 'bg-pink-500',
    gradient:
      'from-pink-50 to-pink-100 dark:from-pink-900/20 dark:to-pink-800/20',
  },
  yellow: {
    bg: 'bg-yellow-50 dark:bg-yellow-900/10',
    border: 'border-yellow-200 dark:border-yellow-800',
    iconBg: 'bg-yellow-100 dark:bg-yellow-900/30',
    iconColor: 'text-yellow-600 dark:text-yellow-400',
    solidBg: 'bg-yellow-500',
    gradient:
      'from-yellow-50 to-yellow-100 dark:from-yellow-900/20 dark:to-yellow-800/20',
  },
};

export const StatCard: React.FC<StatCardProps> = ({
  title,
  value,
  icon: Icon,
  trend,
  description,
  color = 'blue',
  variant = 'default',
  className = '',
  onClick,
}) => {
  const styles = colorStyles[color];
  const Component = onClick ? 'button' : 'div';

  // Base classes for the card
  let cardClasses = `relative rounded-xl border p-6 shadow-sm transition-all duration-300 w-full text-left ${className}`;

  if (onClick) {
    cardClasses += ' hover:shadow-md hover:-translate-y-1 cursor-pointer';
  }

  // Apply variant styles
  if (variant === 'gradient') {
    cardClasses += ` bg-gradient-to-br ${styles.gradient} ${styles.border}`;
  } else if (variant === 'minimal') {
    cardClasses += ` bg-white dark:bg-gray-800 ${styles.border}`;
  } else {
    // Default style (typically used in Admin dashboard)
    cardClasses += ` bg-white dark:bg-gray-800 ${styles.border}`;
  }

  return (
    <Component className={cardClasses} onClick={onClick}>
      <div className="flex items-center justify-between mb-2">
        <div>
          <p className="text-sm font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide">
            {title}
          </p>
        </div>
        {variant === 'default' ? (
          <div className={`p-3 rounded-lg ${styles.solidBg}`}>
            <Icon className="w-5 h-5 text-white" />
          </div>
        ) : (
          <div className={`p-2 rounded-lg ${styles.iconBg}`}>
            <Icon className={`w-5 h-5 ${styles.iconColor}`} />
          </div>
        )}
      </div>

      <div className="mt-2">
        <p className="text-3xl font-bold text-gray-900 dark:text-white">
          {value}
        </p>

        {(trend || description) && (
          <div className="mt-2 text-sm flex items-center gap-2">
            {trend && (
              <span className={`font-medium ${styles.iconColor}`}>{trend}</span>
            )}
            {description && (
              <span className="text-gray-500 dark:text-gray-400 font-medium">
                {description}
              </span>
            )}
          </div>
        )}
      </div>
    </Component>
  );
};
