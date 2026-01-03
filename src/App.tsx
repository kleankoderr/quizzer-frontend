import { lazy, Suspense } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import {QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Toaster } from 'react-hot-toast';

import { AuthProvider } from './contexts/AuthContext';
import { ThemeProvider } from './contexts/ThemeContext';

import { ProtectedRoute } from './components/ProtectedRoute';
import { Layout } from './components/Layout';
import { MaintenanceBanner } from './components/MaintenanceOverlay';
import { AssessmentPopup } from './components/AssessmentPopup';

// Lazy load all page components for code splitting
const LoginPage = lazy(() =>
  import('./pages/LoginPage').then((m) => ({ default: m.LoginPage }))
);
const SignupPage = lazy(() =>
  import('./pages/SignupPage').then((m) => ({ default: m.SignupPage }))
);
const VerifyEmailPage = lazy(() =>
  import('./pages/VerifyEmailPage').then((m) => ({ default: m.VerifyEmailPage }))
);
const SummaryPage = lazy(() =>
  import('./pages/SummaryPage').then((m) => ({ default: m.SummaryPage }))
);
const OnboardingPage = lazy(() =>
  import('./pages/OnboardingPage').then((m) => ({ default: m.OnboardingPage }))
);


const DashboardPage = lazy(() =>
  import('./pages/DashboardPage').then((m) => ({ default: m.DashboardPage }))
);
const StudyPage = lazy(() =>
  import('./pages/StudyPage').then((m) => ({ default: m.StudyPage }))
);
const ContentPage = lazy(() =>
  import('./pages/ContentPage').then((m) => ({ default: m.ContentPage }))
);
const QuizPage = lazy(() =>
  import('./pages/QuizPage').then((m) => ({ default: m.QuizPage }))
);
const QuizTakePage = lazy(() =>
  import('./pages/QuizTakePage').then((m) => ({ default: m.QuizTakePage }))
);
const QuizReviewPage = lazy(() =>
  import('./pages/QuizReviewPage').then((m) => ({ default: m.QuizReviewPage }))
);
const FlashcardsPage = lazy(() =>
  import('./pages/FlashcardsPage').then((m) => ({ default: m.FlashcardsPage }))
);
const FlashcardStudyPage = lazy(() =>
  import('./pages/FlashcardStudyPage').then((m) => ({
    default: m.FlashcardStudyPage,
  }))
);
const ProfilePage = lazy(() =>
  import('./pages/ProfilePage').then((m) => ({ default: m.ProfilePage }))
);
const SettingsPage = lazy(() =>
  import('./pages/SettingsPage').then((m) => ({ default: m.SettingsPage }))
);
const StatisticsPage = lazy(() =>
  import('./pages/StatisticsPage').then((m) => ({ default: m.StatisticsPage }))
);
const LeaderboardPage = lazy(() =>
  import('./pages/LeaderboardPage').then((m) => ({
    default: m.LeaderboardPage,
  }))
);
const ChallengesPage = lazy(() =>
  import('./pages/ChallengesPage').then((m) => ({ default: m.ChallengesPage }))
);
const ChallengeDetailsPage = lazy(() =>
  import('./pages/ChallengeDetailsPage').then((m) => ({
    default: m.ChallengeDetailsPage,
  }))
);

const ChallengeResultsPage = lazy(() =>
  import('./pages/ChallengeResultsPage').then((m) => ({
    default: m.ChallengeResultsPage,
  }))
);
const AttemptsPage = lazy(() =>
  import('./pages/AttemptsPage').then((m) => ({ default: m.AttemptsPage }))
);
const DiscoverPage = lazy(() =>
  import('./pages/DiscoverPage').then((m) => ({ default: m.DiscoverPage }))
);
const FilesPage = lazy(() =>
  import('./pages/FilesPage').then((m) => ({ default: m.FilesPage }))
);
const StudyPacksPage = lazy(() =>
  import('./pages/StudyPacksPage').then((m) => ({ default: m.StudyPacksPage }))
);
const StudyPackDetailsPage = lazy(() =>
  import('./pages/StudyPackDetailsPage').then((m) => ({
    default: m.StudyPackDetailsPage,
  }))
);

const PricingPage = lazy(() =>
  import('./pages/PricingPage').then((m) => ({ default: m.PricingPage }))
);


const VerifyPaymentPage = lazy(() =>
  import('./pages/VerifyPaymentPage').then((m) => ({ default: m.VerifyPaymentPage }))
);

const ManageSubscriptionPage = lazy(() =>
  import('./pages/ManageSubscriptionPage').then((m) => ({ default: m.ManageSubscriptionPage }))
);

// Lazy load admin pages
const AdminDashboard = lazy(() =>
  import('./pages/admin/AdminDashboard').then((m) => ({
    default: m.AdminDashboard,
  }))
);
const UserManagement = lazy(() =>
  import('./pages/admin/UserManagement').then((m) => ({
    default: m.UserManagement,
  }))
);
const ContentManagement = lazy(() =>
  import('./pages/admin/ContentManagement').then((m) => ({
    default: m.ContentManagement,
  }))
);
const ContentModeration = lazy(() =>
  import('./pages/admin/ContentModeration').then((m) => ({
    default: m.ContentModeration,
  }))
);
const SchoolManagement = lazy(() =>
  import('./pages/admin/SchoolManagement').then((m) => ({
    default: m.SchoolManagement,
  }))
);
const AiAnalytics = lazy(() =>
  import('./pages/admin/AiAnalytics').then((m) => ({ default: m.AiAnalytics }))
);
const PlatformSettings = lazy(() =>
  import('./pages/admin/PlatformSettings').then((m) => ({
    default: m.PlatformSettings,
  }))
);
const AnalyticsDashboard = lazy(() =>
  import('./pages/admin/AnalyticsDashboard').then((m) => ({
    default: m.AnalyticsDashboard,
  }))
);
const UserDetailsPage = lazy(() => import('./pages/admin/UserDetailsPage'));
const SubscriptionPlanManagement = lazy(() =>
  import('./pages/admin/SubscriptionPlanManagement').then((m) => ({
    default: m.SubscriptionPlanManagement,
  }))
);
const SubscriptionsPage = lazy(() =>
  import('./pages/admin/SubscriptionsPage').then((m) => ({
    default: m.SubscriptionsPage,
  }))
);
const PaymentFailuresPage = lazy(() =>
  import('./pages/admin/payments/PaymentFailuresPage').then((m) => ({
    default: m.PaymentFailuresPage,
  }))
);

const RecommendationsPage = lazy(() =>
  import('./pages/RecommendationsPage').then((m) => ({
    default: m.RecommendationsPage,
  }))
);

const WeakAreasPage = lazy(() =>
  import('./pages/WeakAreasPage').then((m) => ({
    default: m.WeakAreasPage,
  }))
);

const ReviewPage = lazy(() =>
  import('./pages/ReviewPage').then((m) => ({
    default: m.ReviewPage,
  }))
);

const SummariesPage = lazy(() =>
  import('./pages/SummariesPage').then((m) => ({
    default: m.SummariesPage,
  }))
);

// Import AdminRoute (keep this as direct import since it's small)
import { AdminRoute } from './components/AdminRoute';

import { LoadingScreen } from './components/LoadingScreen';

// Loading component for Suspense fallback
const PageLoader = () => (
  <LoadingScreen
    message="Loading Quizzer"
    subMessage="Preparing your learning environment..."
  />
);

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry: 1,
    },
  },
});

function App() {
  return (
      <QueryClientProvider client={queryClient}>
        <ThemeProvider>
          <AuthProvider>
            <BrowserRouter>
              <MaintenanceBanner />
              <AssessmentPopup />
              <AppRoutes />
              <Toaster position="top-right" />
            </BrowserRouter>
          </AuthProvider>
        </ThemeProvider>
      </QueryClientProvider>

  );
}



function AppRoutes() {


  return (
    <Suspense fallback={<PageLoader />}>
      <Routes>
        {/* Public Summary Route */}
        <Route path="/s/:shortCode" element={<SummaryPage />} />
        
        <Route path="/login" element={<LoginPage />} />
        <Route path="/signup" element={<SignupPage />} />
        <Route path="/verify-email" element={<VerifyEmailPage />} />

        <Route
          path="/onboarding"
          element={
            <ProtectedRoute>
              <OnboardingPage />
            </ProtectedRoute>
          }
        />

        <Route
          path="/"
          element={
            <ProtectedRoute>
              <Layout />
            </ProtectedRoute>
          }
        >
          <Route index element={<Navigate to="/dashboard" replace />} />
          <Route path="dashboard" element={<DashboardPage />} />
          <Route path="study" element={<StudyPage />} />
          <Route path="discover" element={<DiscoverPage />} />
          <Route path="content/generate" element={<ContentPage />} />
          <Route path="content/:id" element={<ContentPage />} />
          <Route path="quiz" element={<QuizPage />} />
          <Route path="quiz/:id" element={<QuizTakePage />} />
          <Route
            path="quiz/:id/results/:attemptId"
            element={<QuizReviewPage />}
          />
          <Route
            path="quiz/attempt/:attemptId/review"
            element={<QuizReviewPage />}
          />

          <Route path="flashcards" element={<FlashcardsPage />} />
          <Route path="flashcards/:id" element={<FlashcardStudyPage />} />
          <Route path="leaderboard" element={<LeaderboardPage />} />
          <Route path="challenges" element={<ChallengesPage />} />
          <Route path="challenges/:id" element={<ChallengeDetailsPage />} />

          <Route
            path="challenges/:id/results"
            element={<ChallengeResultsPage />}
          />
          <Route path="statistics" element={<StatisticsPage />} />
          <Route path="attempts" element={<AttemptsPage />} />
          <Route path="files" element={<FilesPage />} />
          <Route path="study-pack" element={<StudyPacksPage />} />
          <Route path="study-pack/:id" element={<StudyPackDetailsPage />} />
          <Route path="summaries" element={<SummariesPage />} />
          <Route path="profile" element={<ProfilePage />} />
          <Route path="settings" element={<SettingsPage />} />
          <Route path="pricing" element={<PricingPage />} />
          <Route path="subscription/manage" element={<ManageSubscriptionPage />} />
          <Route path="subscription/verify" element={<VerifyPaymentPage />} />
          <Route path="recommendations" element={<RecommendationsPage />} />
          <Route path="weak-areas" element={<WeakAreasPage />} />
          <Route path="review" element={<ReviewPage />} />

          {/* Admin Routes */}
          <Route
            path="admin"
            element={
              <AdminRoute>
                <AdminDashboard />
              </AdminRoute>
            }
          />
          <Route
            path="admin/users"
            element={
              <AdminRoute>
                <UserManagement />
              </AdminRoute>
            }
          />
          <Route
            path="admin/users/:id"
            element={
              <AdminRoute>
                <UserDetailsPage />
              </AdminRoute>
            }
          />
          <Route
            path="admin/content"
            element={
              <AdminRoute>
                <ContentManagement />
              </AdminRoute>
            }
          />
          <Route
            path="admin/moderation"
            element={
              <AdminRoute>
                <ContentModeration />
              </AdminRoute>
            }
          />
          <Route
            path="admin/schools"
            element={
              <AdminRoute>
                <SchoolManagement />
              </AdminRoute>
            }
          />
          <Route
            path="admin/generation-analytics"
            element={
              <AdminRoute>
                <AiAnalytics />
              </AdminRoute>
            }
          />
          <Route
            path="admin/analytics"
            element={
              <AdminRoute>
                <AnalyticsDashboard />
              </AdminRoute>
            }
          />
          <Route
            path="admin/settings"
            element={
              <AdminRoute>
                <PlatformSettings />
              </AdminRoute>
            }
          />
          <Route
            path="admin/plans"
            element={
              <AdminRoute>
                <SubscriptionPlanManagement />
              </AdminRoute>
            }
          />
          <Route
            path="admin/subscriptions"
            element={
              <AdminRoute>
                <SubscriptionsPage />
              </AdminRoute>
            }
          />
          <Route
            path="admin/payments/failures"
            element={
              <AdminRoute>
                <PaymentFailuresPage />
              </AdminRoute>
            }
          />
        </Route>

        <Route path="*" element={<Navigate to="/dashboard" replace />} />
      </Routes>
    </Suspense>
  );
}

export default App;
