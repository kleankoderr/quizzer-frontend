import { useState } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import { Header } from './Header';
import { Sidebar } from './Sidebar';
import { Breadcrumb } from './Breadcrumb';
import { FloatingReviewButton } from './FloatingReviewButton';
import { useBreadcrumbs } from '../hooks';

export const Layout = () => {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);

  const location = useLocation();
  const isContentPage = location.pathname.includes('/content/');
  const breadcrumbs = useBreadcrumbs();

  return (
    <div className="flex h-screen bg-gray-50 dark:bg-gray-950 overflow-hidden">
      <Sidebar
        isCollapsed={sidebarCollapsed}
        toggleCollapse={() => setSidebarCollapsed(!sidebarCollapsed)}
        isOpen={mobileSidebarOpen}
        closeMobile={() => setMobileSidebarOpen(false)}
      />

      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <Header
          toggleSidebar={() => setMobileSidebarOpen(!mobileSidebarOpen)}
        />

        <main
          className={`flex-1 overflow-y-auto overflow-x-hidden ${isContentPage ? '' : 'p-3 sm:p-4 md:p-6'}`}
        >
          <div
            className={`${isContentPage ? 'w-full' : 'max-w-7xl mx-auto w-full'}`}
          >
            {!isContentPage && <Breadcrumb items={breadcrumbs} />}
            <Outlet />
          </div>
        </main>
      </div>

      {/* Global Floating Review Button */}
      <FloatingReviewButton />
    </div>
  );
};
