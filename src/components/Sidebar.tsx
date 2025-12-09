import { Link, useLocation } from 'react-router-dom';
import {
  Home,
  BookOpen,
  Layers,
  Trophy,
  BarChart3,
  LogOut,
  ChevronLeft,
  ChevronRight,
  Medal,
  User,
  Settings,
  Brain,
  Calendar,
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

interface SidebarProps {
  isCollapsed: boolean;
  toggleCollapse: () => void;
  isOpen: boolean; // For mobile drawer
  closeMobile: () => void;
}

export const Sidebar = ({
  isCollapsed,
  toggleCollapse,
  isOpen,
  closeMobile,
}: SidebarProps) => {
  const { logout } = useAuth();
  const location = useLocation();

  const navItems = [
    { path: '/dashboard', icon: Home, label: 'Dashboard' },
    { path: '/study', icon: BookOpen, label: 'Study' },
    { path: '/quiz', icon: Brain, label: 'Quizzes' },
    { path: '/flashcards', icon: Layers, label: 'Flashcards' },
    { path: '/challenges', icon: Trophy, label: 'Challenges' },
    { path: '/leaderboard', icon: Medal, label: 'Leaderboard' },
    { path: '/attempts', icon: Calendar, label: 'Attempts' },
    { path: '/statistics', icon: BarChart3, label: 'Analytics' },
    { path: '/profile', icon: User, label: 'Profile' },
    { path: '/settings', icon: Settings, label: 'Settings' },
  ];

  const { user } = useAuth();
  const isAdmin = user?.role === 'ADMIN' || user?.role === 'SUPER_ADMIN';

  let filteredNavItems = [...navItems];

  if (isAdmin) {
    // For admins, show Admin Dashboard, Users, Content, Analytics, and Settings
    filteredNavItems = [
      { path: '/admin', icon: Home, label: 'Dashboard' },
      { path: '/admin/users', icon: User, label: 'Users' },
      { path: '/admin/content', icon: Layers, label: 'Content' },
      { path: '/admin/analytics', icon: BarChart3, label: 'Analytics' },
      { path: '/admin/settings', icon: Settings, label: 'Settings' },
    ];
  } else {
    // For regular users, show standard navigation
    filteredNavItems = navItems;
  }

  const isActive = (path: string) => {
    if (location.pathname === path) return true;

    // Prevent /admin or /dashboard from matching sub-routes incorrectly
    if (path === '/admin' || path === '/dashboard') return false;

    // Map content pages to Study section
    if (path === '/study' && location.pathname.startsWith('/content'))
      return true;

    return location.pathname.startsWith(`${path}/`);
  };

  return (
    <>
      {/* Mobile Overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-[90] lg:hidden"
          onClick={closeMobile}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`
          fixed lg:static inset-y-0 left-0 z-[100]
          bg-white dark:bg-gray-900 border-r border-gray-200 dark:border-gray-600 flex flex-col transition-all duration-300
          ${isOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
          ${isCollapsed ? 'w-20' : 'w-64'}
        `}
      >
        {/* Logo */}
        <div className="h-16 flex items-center justify-between px-4 border-b border-gray-200 dark:border-gray-600 flex-shrink-0">
          {!isCollapsed && (
            <span className="text-xl font-bold text-primary-600 truncate">
              Quizzer
            </span>
          )}
          {isCollapsed && (
            <span className="text-xl font-bold text-primary-600 mx-auto">
              Q
            </span>
          )}
          <button
            onClick={toggleCollapse}
            className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg hidden lg:block flex-shrink-0"
          >
            {isCollapsed ? (
              <ChevronRight className="w-5 h-5" />
            ) : (
              <ChevronLeft className="w-5 h-5" />
            )}
          </button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 p-3 sm:p-4 space-y-1 overflow-y-auto">
          {filteredNavItems.map((item) => {
            const Icon = item.icon;
            const active = isActive(item.path);

            return (
              <Link
                key={item.path}
                to={item.path}
                onClick={() => isOpen && closeMobile()} // Close mobile sidebar on navigation
                className={`
                  flex items-center gap-3 px-3 py-3 sm:py-2 rounded-lg transition-all relative touch-manipulation
                  ${
                    active
                      ? 'bg-blue-50 dark:bg-blue-900/50 text-primary-700 dark:text-blue-300'
                      : 'text-gray-600 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700 hover:text-gray-900 dark:hover:text-white'
                  }
                `}
                title={isCollapsed ? item.label : ''}
              >
                {active && (
                  <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-8 bg-primary-600 rounded-r-full"></div>
                )}
                <Icon
                  className={`w-5 h-5 flex-shrink-0 ${active ? 'text-primary-600 dark:text-blue-400' : 'text-gray-500 dark:text-gray-300'}`}
                />
                {!isCollapsed && (
                  <span
                    className={`font-medium ${active ? 'font-semibold' : ''}`}
                  >
                    {item.label}
                  </span>
                )}
              </Link>
            );
          })}
        </nav>

        {/* Footer Actions */}
        <div className="p-3 sm:p-4 border-t border-gray-200 dark:border-gray-600 flex-shrink-0">
          <button
            onClick={logout}
            className={`
              flex items-center gap-3 px-3 py-3 sm:py-2 w-full rounded-lg text-gray-600 dark:text-gray-300 hover:bg-red-50 dark:hover:bg-red-900/30 hover:text-red-600 dark:hover:text-red-400 transition-colors touch-manipulation
              ${isCollapsed ? 'justify-center' : ''}
            `}
            title="Logout"
          >
            <LogOut className="w-5 h-5 flex-shrink-0" />
            {!isCollapsed && <span className="font-medium">Logout</span>}
          </button>
        </div>
      </aside>
    </>
  );
};
