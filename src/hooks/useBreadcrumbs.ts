import { useLocation } from 'react-router-dom';
import { useMemo } from 'react';

export interface BreadcrumbItem {
  label: string;
  path?: string;
}

const ROUTE_LABELS: Record<string, string> = {
  dashboard: 'Dashboard',
  study: 'Study Material',
  summaries: 'Summaries',
  discover: 'Discover',
  quiz: 'Quizzes',
  flashcards: 'Flashcards',
  'study-pack': 'Study Sets',
  leaderboard: 'Leaderboard',
  challenges: 'Challenges',
  statistics: 'Statistics',
  attempts: 'Attempts',
  profile: 'Profile',
  settings: 'Settings',
  admin: 'Admin',
  users: 'Users',
  content: 'Content',
  moderation: 'Moderation',
  schools: 'Schools',
  'generation-analytics': 'Generation Analytics',
  analytics: 'Analytics',
};

export const useBreadcrumbs = () => {
  const location = useLocation();

  const breadcrumbs = useMemo(() => {
    // 1. Check for custom breadcrumb trail in state (passed from previous page)
    if (location.state?.breadcrumb) {
      return location.state.breadcrumb as BreadcrumbItem[];
    }

    // 2. Generate default hierarchy based on URL
    const pathnames = location.pathname.split('/').filter(Boolean);
    const items: BreadcrumbItem[] = [];

    // Always start with Home/Dashboard if not already there
    // (The Breadcrumb component adds the Home icon link to /dashboard, so we don't need to duplicate it here unless we want text)
    // Let's stick to the path segments.

    let currentPath = '';

    pathnames.forEach((value, index) => {
      currentPath += `/${value}`;
      const isLast = index === pathnames.length - 1;

      // Skip IDs (simple heuristic: if it looks like a UUID or is very long/numeric, treat as ID)
      // For now, we'll just use the route map or capitalize.
      // Ideally, we'd look up the title, but for generic routes:

      let label =
        ROUTE_LABELS[value] || value.charAt(0).toUpperCase() + value.slice(1);

      // If it's an ID (often 2nd segment in /content/:id), we might want to skip it or show "Details"
      // But for now, let's keep it simple. If it's a known route, use the label.
      // If it's not known and looks like an ID, maybe ignore it or show "Details"?
      // Let's rely on the state passing for "nice" names (like Content Title).
      // For default URL parsing, showing the ID is ugly.

      // Heuristic: if value has numbers and length > 10, it's probably an ID.
      if (value.length > 10 && /\d/.test(value)) {
        label = 'Details';
      }

      // Handle specific non-linkable segments to prevent broken breadcrumbs
      // 'results', 'attempt', 'review' are typically part of a longer path and don't have their own index pages
      const isNonLinkable = ['results', 'attempt', 'review'].includes(
        value.toLowerCase()
      );

      items.push({
        label,
        path: isLast || isNonLinkable ? undefined : currentPath,
      });
    });

    return items;
  }, [location]);

  return breadcrumbs;
};
