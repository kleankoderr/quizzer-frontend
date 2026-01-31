import { Link, useLocation, useNavigate } from 'react-router-dom';
import {
  AlertTriangle,
  BarChart3,
  BookOpen,
  Brain,
  Calendar,
  ChevronLeft,
  ChevronRight,
  CreditCard,
  FileText,
  Folder,
  Home,
  Layers,
  LogOut,
  type LucideProps,
  Medal,
  Package,
  School,
  Settings,
  Sparkles,
  Trophy,
  User,
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

interface SidebarProps {
  isCollapsed: boolean;
  toggleCollapse: () => void;
  isOpen: boolean; // For mobile drawer
  closeMobile: () => void;
}

interface NavItem {
  path: string;
  icon: React.ForwardRefExoticComponent<
    Omit<LucideProps, 'ref'> & React.RefAttributes<SVGSVGElement>
  >;
  label: string;
}

interface NavSection {
  label?: string;
  items: NavItem[];
}

export const Sidebar = ({
  isCollapsed,
  toggleCollapse,
  isOpen,
  closeMobile,
}: SidebarProps) => {
  const { user, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  // Organized navigation sections for better UX
  const navSections: NavSection[] = [
    {
      // Core - Most frequently accessed
      items: [{ path: '/dashboard', icon: Home, label: 'Dashboard' }],
    },
    {
      label: 'Learning Tools',
      items: [
        { path: '/study', icon: BookOpen, label: 'Study Material' },
        { path: '/summaries', icon: Sparkles, label: 'Summaries' },
        { path: '/quiz', icon: Brain, label: 'Quizzes' },
        { path: '/flashcards', icon: Layers, label: 'Flashcards' },
        { path: '/study-pack', icon: Folder, label: 'Study Sets' },
      ],
    },
    {
      label: 'My Progress',
      items: [
        { path: '/challenges', icon: Trophy, label: 'Challenges' },
        { path: '/leaderboard', icon: Medal, label: 'Leaderboard' },
        { path: '/attempts', icon: Calendar, label: 'Practice History' },
        { path: '/weak-areas', icon: AlertTriangle, label: 'Focus Areas' },
      ],
    },
    {
      label: 'Library',
      items: [
        { path: '/files', icon: FileText, label: 'Documents' },
        { path: '/statistics', icon: BarChart3, label: 'Performance' },
      ],
    },
    {
      label: 'Account',
      items: [
        { path: '/profile', icon: User, label: 'Profile' },
        { path: '/settings', icon: Settings, label: 'Settings' },
      ],
    },
  ];

  // Admin navigation sections
  const adminNavSections: NavSection[] = [
    {
      items: [{ path: '/admin', icon: Home, label: 'Dashboard' }],
    },
    {
      label: 'Management',
      items: [
        { path: '/admin/users', icon: User, label: 'Users' },
        { path: '/admin/content', icon: Layers, label: 'Content' },
        { path: '/admin/quizzes', icon: Brain, label: 'Quizzes' },
        { path: '/admin/plans', icon: Package, label: 'Subscription Plans' },
        { path: '/admin/schools', icon: School, label: 'Schools' },
      ],
    },
    {
      label: 'System',
      items: [
        { path: '/admin/analytics', icon: BarChart3, label: 'Analytics' },
        { path: '/admin/settings', icon: Settings, label: 'Settings' },
      ],
    },
  ];

  const isAdmin = user?.role === 'ADMIN' || user?.role === 'SUPER_ADMIN';

  const sections = isAdmin ? adminNavSections : navSections;

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
        <button
          type="button"
          aria-label="Close sidebar"
          className="fixed inset-0 bg-black/50 z-[90] lg:hidden w-full h-full border-none outline-none cursor-default"
          onClick={closeMobile}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`
          fixed inset-y-0 left-0 z-[100] h-screen
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
            id="sidebar-collapse-btn"
            onClick={toggleCollapse}
            className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg hidden lg:block flex-shrink-0"
            aria-label={isCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
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
          {sections.map((section, sectionIndex) => (
            <div key={section.label || `section-${sectionIndex}`}>
              {/* Section Label */}
              {section.label && !isCollapsed && (
                <div className="px-3 py-2 mt-4 first:mt-0">
                  <span className="text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wider">
                    {section.label}
                  </span>
                </div>
              )}

              {/* Section Items */}
              {section.items.map((item) => {
                const Icon = item.icon;
                const active = isActive(item.path);
                const linkIdMap: Record<string, string> = {
                  '/study': 'sidebar-study-btn',
                  '/quiz': 'sidebar-quiz-btn',
                };
                const linkId = linkIdMap[item.path];

                return (
                  <Link
                    key={item.path}
                    to={item.path}
                    id={linkId}
                    onClick={() => isOpen && closeMobile()} // Close mobile sidebar on navigation
                    className={`
                      flex items-center gap-3 px-3 py-3 sm:py-2.5 rounded-lg transition-all relative touch-manipulation
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

              {/* Visual separator between sections (except last) */}
              {!isCollapsed && sectionIndex < sections.length - 1 && (
                <div className="my-3 border-t border-gray-200 dark:border-gray-700"></div>
              )}
            </div>
          ))}
        </nav>

        {/* Footer Actions */}
        <div className="p-3 sm:p-4 border-t border-gray-200 dark:border-gray-600 flex-shrink-0 space-y-1">
          {/* Subscription Link - Only for non-admin users */}
          {!isAdmin && (
            <Link
              to="/subscription/manage"
              onClick={() => isOpen && closeMobile()}
              className={`
                flex items-center gap-3 px-3 py-3 sm:py-2.5 w-full rounded-lg text-gray-600 dark:text-gray-300 hover:bg-primary-50 dark:hover:bg-primary-900/30 hover:text-primary-600 dark:hover:text-primary-400 transition-colors touch-manipulation
                ${isCollapsed ? 'justify-center' : ''}
              `}
              title="Subscription"
            >
              <CreditCard className="w-5 h-5 flex-shrink-0" />
              {!isCollapsed && (
                <span className="font-medium whitespace-nowrap">
                  Subscription
                </span>
              )}
            </Link>
          )}

          {/* Logout Button */}
          <button
            onClick={async () => {
              // Navigate to login first to prevent "redirect to last place" behavior
              // This ensures clean state for the next login
              navigate('/login', { replace: true });
              await logout();
            }}
            className={`
              flex items-center gap-3 px-3 py-3 sm:py-2.5 w-full rounded-lg text-gray-600 dark:text-gray-300 hover:bg-red-50 dark:hover:bg-red-900/30 hover:text-red-600 dark:hover:text-red-400 transition-colors touch-manipulation
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
