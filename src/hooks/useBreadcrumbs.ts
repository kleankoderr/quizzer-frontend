import { useLocation } from 'react-router-dom';
import { useMemo } from 'react';

export interface BreadcrumbItem {
  label: string;
  path?: string;
}

/**
 * Example:
 *
 * URL: /admin/content/12345/analytics
 *
 * Resulting breadcrumbs:
 * [
 *   { label: 'Admin', path: '/admin' },
 *   { label: 'Content', path: '/admin/content' },
 *   { label: 'Details', path: '/admin/content/12345' },
 *   { label: 'Analytics' }
 * ]
 */
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
  'weak-areas': 'Focus Areas',
};

/**
 * URL segments that should appear in breadcrumbs
 * but should not be clickable
 */
const NON_LINKABLE_SEGMENTS = new Set([
  'results',
  'attempt',
  'review',
]);

/**
 * Heuristic to detect IDs in URLs and avoid
 * showing raw identifiers in breadcrumbs
 */
const isLikelyId = (segment: string) =>
  segment.length > 10 && /\d/.test(segment);

/**
 * Returns a readable label for a route segment
 */
const formatLabel = (segment: string) =>
  ROUTE_LABELS[segment] ??
  segment.charAt(0).toUpperCase() + segment.slice(1);

export const useBreadcrumbs = () => {
  const location = useLocation();

  return useMemo<BreadcrumbItem[]>(() => {
    // Prefer explicitly provided breadcrumbs (e.g. dynamic titles)
    const customBreadcrumb = location.state?.breadcrumb as
      | BreadcrumbItem[]
      | undefined;

    if (customBreadcrumb) {
      return customBreadcrumb;
    }

    // Split current URL into path segments
    const segments = location.pathname.split('/').filter(Boolean);
    const breadcrumbs: BreadcrumbItem[] = [];

    let accumulatedPath = '';

    segments.forEach((segment, index) => {
      // Build the path progressively for clickable breadcrumb items
      accumulatedPath += `/${segment}`;

      const isLast = index === segments.length - 1;
      const isNonLinkable = NON_LINKABLE_SEGMENTS.has(segment.toLowerCase());

      // Replace IDs with a generic label to keep breadcrumbs readable
      const label = isLikelyId(segment)
        ? 'Details'
        : formatLabel(segment);

      breadcrumbs.push({
        label,
        // Only intermediate routes should be clickable
        path: isLast || isNonLinkable ? undefined : accumulatedPath,
      });
    });

    return breadcrumbs;
  }, [location]);
};
