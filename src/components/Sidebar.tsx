import { Link, useLocation } from 'react-router-dom';
import {
  Home, BookOpen, Layers, Trophy, BarChart3, LogOut, ChevronLeft, ChevronRight, Medal, User, Settings, Brain
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

interface SidebarProps {
  isCollapsed: boolean;
  toggleCollapse: () => void;
  isOpen: boolean; // For mobile drawer
  closeMobile: () => void;
}

export const Sidebar = ({ isCollapsed, toggleCollapse, isOpen, closeMobile }: SidebarProps) => {
  const { logout } = useAuth();
  const location = useLocation();

  const navItems = [
    { path: '/dashboard', icon: Home, label: 'Dashboard' },
    { path: '/study', icon: BookOpen, label: 'Study' },
    { path: '/quiz', icon: Brain, label: 'Quizzes' },
    { path: '/flashcards', icon: Layers, label: 'Flashcards' },
    { path: '/challenges', icon: Trophy, label: 'Challenges' },
    { path: '/leaderboard', icon: Medal, label: 'Leaderboard' },
    { path: '/statistics', icon: BarChart3, label: 'Analytics' },
    { path: '/profile', icon: User, label: 'Profile' },
    { path: '/settings', icon: Settings, label: 'Settings' },
  ];

  const isActive = (path: string) => location.pathname === path;

  return (
    <>
      {/* Mobile Overlay */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-20 lg:hidden"
          onClick={closeMobile}
        />
      )}

      {/* Sidebar */}
      <aside 
        className={`
          fixed lg:static inset-y-0 left-0 z-30
          bg-white border-r border-gray-200 flex flex-col transition-all duration-300
          ${isOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
          ${isCollapsed ? 'w-20' : 'w-64'}
        `}
      >
        {/* Logo */}
        <div className="h-16 flex items-center justify-between px-4 border-b border-gray-200">
          {!isCollapsed && (
            <span className="text-xl font-bold text-primary-600 truncate">Quizzer</span>
          )}
          {isCollapsed && (
            <span className="text-xl font-bold text-primary-600 mx-auto">Q</span>
          )}
          <button 
            onClick={toggleCollapse}
            className="p-1 hover:bg-gray-100 rounded-lg hidden lg:block"
          >
            {isCollapsed ? <ChevronRight className="w-5 h-5" /> : <ChevronLeft className="w-5 h-5" />}
          </button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
          {navItems.map((item) => {
            const Icon = item.icon;
            const active = isActive(item.path);
            
            return (
              <Link
                key={item.path}
                to={item.path}
                className={`
                  flex items-center gap-3 px-3 py-2 rounded-lg transition-all relative
                  ${active 
                    ? 'bg-blue-50 text-primary-700' 
                    : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'}
                `}
                title={isCollapsed ? item.label : ''}
              >
                {active && <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-8 bg-primary-600 rounded-r-full"></div>}
                <Icon className={`w-5 h-5 ${active ? 'text-primary-600' : 'text-gray-500'}`} />
                {!isCollapsed && <span className={`font-medium ${active ? 'font-semibold' : ''}`}>{item.label}</span>}
              </Link>
            );
          })}
        </nav>

        {/* Footer Actions */}
        <div className="p-4 border-t border-gray-200">
          <button
            onClick={logout}
            className={`
              flex items-center gap-3 px-3 py-2 w-full rounded-lg text-gray-600 hover:bg-red-50 hover:text-red-600 transition-colors
              ${isCollapsed ? 'justify-center' : ''}
            `}
            title="Logout"
          >
            <LogOut className="w-5 h-5" />
            {!isCollapsed && <span className="font-medium">Logout</span>}
          </button>
        </div>
      </aside>
    </>
  );
};
