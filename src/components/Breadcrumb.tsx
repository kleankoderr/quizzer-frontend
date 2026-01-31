import { Link, useLocation } from 'react-router-dom';
import { ChevronRight, Home } from 'lucide-react';
import React from 'react';

export interface BreadcrumbItem {
  label: string;
  path?: string;
}

interface BreadcrumbProps {
  items: BreadcrumbItem[];
}

export const Breadcrumb: React.FC<BreadcrumbProps> = ({ items }) => {
  const location = useLocation();

  // Determine if we're on an admin route
  const isAdminRoute = location.pathname.startsWith('/admin');
  const homePath = isAdminRoute ? '/admin' : '/dashboard';

  return (
    <nav
      className="flex items-center space-x-1 sm:space-x-2 text-sm mb-6 w-full overflow-hidden"
      aria-label="Breadcrumb"
    >
      {/* Home */}
      <div className="flex items-center space-x-1 sm:space-x-2 min-w-0 flex-shrink">
        <Link
          to={homePath}
          className="flex items-center text-gray-500 hover:text-primary-600 dark:text-gray-400 dark:hover:text-primary-400 transition-colors"
          aria-label="Home"
        >
          <Home className="w-4 h-4" />
        </Link>
      </div>

      {/* Other breadcrumb items */}
      {items.map((item, index) => {
        const isLast = index === items.length - 1;

        return (
          <div
            key={index}
            className="flex items-center space-x-1 sm:space-x-2 min-w-0 flex-shrink"
          >
            <ChevronRight className="w-4 h-4 text-gray-400 dark:text-gray-600 flex-shrink-0" />

            {item.path && !isLast ? (
              <Link
                to={item.path}
                className="text-gray-600 hover:text-primary-600 dark:text-gray-400 dark:hover:text-primary-400 transition-colors font-medium truncate max-w-[70px] sm:max-w-[120px] md:max-w-xs"
              >
                {item.label}
              </Link>
            ) : (
              <span
                className={`${
                  isLast
                    ? 'text-gray-900 dark:text-white font-semibold'
                    : 'text-gray-600 dark:text-gray-400'
                } truncate`}
              >
                {item.label}
              </span>
            )}
          </div>
        );
      })}
    </nav>
  );
};
