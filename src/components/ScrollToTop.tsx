import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';

export function ScrollToTop() {
  const { pathname } = useLocation();

  useEffect(() => {
    // Try to find the custom scroll container first
    const mainContent = document.getElementById('main-content-area');
    
    if (mainContent) {
      mainContent.scrollTo(0, 0);
    } else {
      window.scrollTo(0, 0);
    }
  }, [pathname]);

  return null;
}
