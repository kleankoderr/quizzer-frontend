import { Bell, Search, Menu } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

interface HeaderProps {
  toggleSidebar: () => void;
}

export const Header = ({ toggleSidebar }: HeaderProps) => {
  const { user } = useAuth();

  return (
    <header className="bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-600 h-16 flex items-center justify-between px-3 sm:px-4 sticky top-0 z-10">
      <div className="flex items-center gap-2 sm:gap-4">
        <button
          onClick={toggleSidebar}
          className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg lg:hidden"
        >
          <Menu className="w-5 h-5 text-gray-600 dark:text-gray-200" />
        </button>
        <div className="relative hidden md:block">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 dark:text-gray-400" />
          <input
            type="text"
            placeholder="Search topics..."
            className="pl-10 pr-4 py-2 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg text-sm text-gray-900 dark:text-gray-100 placeholder:text-gray-500 dark:placeholder:text-gray-300 focus:outline-none focus:ring-2 focus:ring-primary-500 w-48 lg:w-64"
          />
        </div>
      </div>

      <div className="flex items-center gap-2 sm:gap-4">
        <button className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full relative">
          <Bell className="w-5 h-5 text-gray-600 dark:text-gray-200" />
          <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full border-2 border-white"></span>
        </button>
        
        <Link to="/profile" className="flex items-center gap-2 sm:gap-3 pl-2 sm:pl-4 border-l border-gray-200 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors rounded-lg p-1">
          <div className="text-right hidden sm:block">
            <p className="text-sm font-medium text-gray-900 dark:text-gray-100">{user?.name || 'Guest'}</p>
            <p className="text-xs text-gray-500 dark:text-gray-400">{user?.schoolName || 'Student'}</p>
          </div>
          <div className="w-8 h-8 bg-primary-100 rounded-full flex items-center justify-center text-primary-700 font-medium">
            {user?.name?.[0] || 'U'}
          </div>
        </Link>
      </div>
    </header>
  );
};
