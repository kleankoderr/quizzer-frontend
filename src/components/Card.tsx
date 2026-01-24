import React from 'react';
import { Link } from 'react-router-dom';

interface CardProps {
  title: React.ReactNode;
  subtitle?: React.ReactNode;
  icon?: React.ReactNode;
  gradientColor?: string;
  actions?: React.ReactNode;
  children?: React.ReactNode;
  footer?: React.ReactNode;
  onClick?: () => void;
  onTitleClick?: () => void;
  onIconClick?: () => void;
  to?: string;
  className?: string;
  testId?: string;
}

export const Card: React.FC<CardProps> = ({
  title,
  subtitle,
  icon,
  gradientColor = 'bg-primary-500',
  actions,
  children,
  footer,
  onClick,
  onTitleClick,
  onIconClick,
  to,
  className = '',
  testId,
}) => {
  const Container = to ? Link : ('div' as any);

  const containerProps = to
    ? {
        to,
        className: `group relative ${actions ? 'overflow-visible' : 'overflow-hidden'} border border-gray-200 dark:border-gray-700 rounded-xl p-5 hover:border-primary-400 dark:hover:border-primary-500 hover:shadow-xl transition-all duration-300 bg-white dark:bg-gray-800 hover:-translate-y-1 block ${className}`,
      }
    : {
        onClick,
        className: `group relative ${actions ? 'overflow-visible' : 'overflow-hidden'} border border-gray-200 dark:border-gray-700 rounded-xl p-5 hover:border-primary-400 dark:hover:border-primary-500 hover:shadow-xl transition-all duration-300 bg-white dark:bg-gray-800 hover:-translate-y-1 ${onClick ? 'cursor-pointer' : ''} ${className}`,
      };

  return (
    <Container {...containerProps} data-testid={testId}>
      {/* Gradient accent */}
      <div
        className={`absolute top-0 left-0 right-0 h-1 ${gradientColor} overflow-hidden rounded-t-xl`}
      ></div>

      {/* Top right actions */}
      {actions && (
        <div className="absolute top-4 right-4 flex items-center gap-2 z-10">
          {actions}
        </div>
      )}

      {/* Icon */}
      {icon && (
        <div 
          className="inline-flex p-2.5 bg-primary-100 dark:bg-primary-900/30 rounded-lg mb-3 group-hover:bg-primary-200 dark:group-hover:bg-primary-900/50 transition-colors"
          onClick={(e) => {
            if (onIconClick) {
              e.preventDefault();
              e.stopPropagation();
              onIconClick();
            }
          }}
        >
          {icon}
        </div>
      )}

      {/* Content */}
      <div className="mb-4">
        <h3
          className={`font-bold text-lg mb-1.5 text-gray-900 dark:text-white group-hover:text-primary-600 dark:group-hover:text-primary-400 transition-colors line-clamp-2 ${
            actions ? 'pr-20' : ''
          }`}
          onClick={(e) => {
            if (onTitleClick) {
              e.preventDefault();
              e.stopPropagation();
              onTitleClick();
            }
          }}
        >
          {title}
        </h3>
        {subtitle && (
          <div className="text-sm text-gray-600 dark:text-gray-400 line-clamp-2">
            {subtitle}
          </div>
        )}
      </div>

      {/* Body/Stats */}
      {children && <div className="space-y-2">{children}</div>}

      {/* Footer / Action Hint */}
      {footer && (
        <div className="mt-4 pt-3 border-t border-gray-100 dark:border-gray-700 flex items-center justify-between">
          {footer}
        </div>
      )}
    </Container>
  );
};
