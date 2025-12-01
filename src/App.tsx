import { useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Toaster } from 'react-hot-toast';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { ThemeProvider } from './contexts/ThemeContext';
import { analytics } from './services/analytics.service';
import { ProtectedRoute } from './components/ProtectedRoute';
import { Layout } from './components/Layout';
import { LoginPage } from './pages/LoginPage';
import { SignupPage } from './pages/SignupPage';
import { OnboardingPage } from './pages/OnboardingPage';
import { DashboardPage } from './pages/DashboardPage';
import { StudyPage } from './pages/StudyPage';
import { ContentPage } from './pages/ContentPage';
import { QuizPage } from './pages/QuizPage';
import { QuizTakePage } from './pages/QuizTakePage';
import { FlashcardsPage } from './pages/FlashcardsPage';
import { FlashcardStudyPage } from './pages/FlashcardStudyPage';
import { ProfilePage } from './pages/ProfilePage';
import { SettingsPage } from './pages/SettingsPage';
import { StatisticsPage } from './pages/StatisticsPage';
import { LeaderboardPage } from './pages/LeaderboardPage';
import { ChallengesPage } from './pages/ChallengesPage';
import { ChallengeDetailsPage } from './pages/ChallengeDetailsPage';
import { ChallengeQuizPage } from './pages/ChallengeQuizPage';
import { ChallengeResultsPage } from './pages/ChallengeResultsPage';
import { AttemptsPage } from './pages/AttemptsPage';
import { DiscoverPage } from './pages/DiscoverPage';
import { AdminDashboard } from './pages/admin/AdminDashboard';
import { UserManagement } from './pages/admin/UserManagement';
import { ContentManagement } from './pages/admin/ContentManagement';
import { AdminRoute } from './components/AdminRoute';


const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry: 1,
    },
  },
});

function App() {
  useEffect(() => {
    // Initialize Analytics
    analytics.init();

    // Placeholder for FCM token registration
    // In a real app, you would initialize Firebase here and get the token
    const registerNotifications = async () => {
      try {
        if ('Notification' in window && Notification.permission === 'default') {
          const permission = await Notification.requestPermission();
          if (permission === 'granted') {

            // const token = await getToken(messaging, { vapidKey: 'YOUR_VAPID_KEY' });
            // await notificationService.registerToken(token);
          }
        }
      } catch (error) {

      }
    };

    registerNotifications();
  }, []);

  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider>
        <AuthProvider>
          <BrowserRouter>
            <AppRoutes />
            <Toaster position="top-right" />
          </BrowserRouter>
        </AuthProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
}

function AppRoutes() {
  const { user } = useAuth(); // Now we can use the hook




  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route path="/signup" element={<SignupPage />} />
      
      {/* Onboarding - Protected but outside main layout */}
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
        <Route index element={<Navigate to={user?.role === 'ADMIN' || user?.role === 'SUPER_ADMIN' ? "/admin" : "/dashboard"} replace />} />
        <Route path="dashboard" element={<DashboardPage />} />
        <Route path="study" element={<StudyPage />} />
        <Route path="discover" element={<DiscoverPage />} />
        <Route path="content/generate" element={<ContentPage />} />
        <Route path="content/:id" element={<ContentPage />} />
        <Route path="quiz" element={<QuizPage />} />
        <Route path="quiz/:id" element={<QuizTakePage />} />
        <Route path="quiz/:id/results/:attemptId" element={<QuizTakePage />} />
        <Route path="flashcards" element={<FlashcardsPage />} />
        <Route path="flashcards/:id" element={<FlashcardStudyPage />} />
        <Route path="leaderboard" element={<LeaderboardPage />} />
        <Route path="challenges" element={<ChallengesPage />} />
        <Route path="challenges/:id" element={<ChallengeDetailsPage />} />
        <Route path="challenges/:id/quiz/:quizIndex" element={<ChallengeQuizPage />} />
        <Route path="challenges/:id/results" element={<ChallengeResultsPage />} />
        <Route path="statistics" element={<StatisticsPage />} />
        <Route path="attempts" element={<AttemptsPage />} />
        <Route path="profile" element={<ProfilePage />} />
        <Route path="settings" element={<SettingsPage />} />
        
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
          path="admin/content"
          element={
            <AdminRoute>
              <ContentManagement />
            </AdminRoute>
          }
        />
      </Route>

      <Route path="*" element={<Navigate to={user?.role === 'ADMIN' || user?.role === 'SUPER_ADMIN' ? "/admin" : "/dashboard"} replace />} />
    </Routes>
  );
}

export default App;
