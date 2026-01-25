import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '../contexts/AuthContext';
import { userService, onboardingService } from '../services';

export const useAssessmentStatus = () => {
  const [isVisible, setIsVisible] = useState(false);
  const [quizId, setQuizId] = useState<string | null>(null);
  const { user, login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const queryClient = useQueryClient();

  // Onboarding status query
  const { data: onboardingData } = useQuery({
    queryKey: ['onboardingStatus'],
    queryFn: () => onboardingService.getStatus(),
    enabled: !!user && !user.assessmentPopupShown,
    refetchInterval: (query) => {
      const data = query.state.data;
      if (!user || user.assessmentPopupShown) return false;

      const isInternalPage =
        location.pathname.includes('/quiz/') ||
        location.pathname === '/onboarding';
      if (isInternalPage) return false;

      if (!data) return 5000;
      if (data.status === 'NOT_STARTED') return false;
      if (data.status === 'COMPLETED') {
        const isOnboardingTourDone = localStorage.getItem(
          'tour_completed_onboarding'
        );
        // If assessment is ready but tour isn't done, keep polling to check when tour finishes
        return isOnboardingTourDone ? false : 2000;
      }
      if (data.status === 'PENDING') return 5000;
      return false;
    },
  });

  // Track tour completion state reactively
  const [tourDone, setTourDone] = useState(
    !!localStorage.getItem('tour_completed_onboarding')
  );

  useEffect(() => {
    const checkTour = () => {
      const done = !!localStorage.getItem('tour_completed_onboarding');
      if (done !== tourDone) {
        setTourDone(done);
      }
    };

    const interval = setInterval(checkTour, 2000);
    return () => clearInterval(interval);
  }, [tourDone]);

  // Mark as shown mutation
  const markAsShownMutation = useMutation({
    mutationFn: () => userService.markAssessmentShown(),
    onSuccess: () => {
      if (user) {
        login({ ...user, assessmentPopupShown: true });
      }
      queryClient.invalidateQueries({ queryKey: ['onboardingStatus'] });
    },
  });

  // Handle side effects (redirection and initial visibility)
  useEffect(() => {
    if (!onboardingData || !user || user.assessmentPopupShown) return;

    if (onboardingData.status === 'NOT_STARTED') {
      const isAuthPage = ['/login', '/signup', '/admin'].includes(
        location.pathname
      );
      if (location.pathname !== '/onboarding' && !isAuthPage) {
        navigate('/onboarding');
      }
    } else if (
      onboardingData.status === 'COMPLETED' &&
      onboardingData.quizId &&
      tourDone
    ) {
      setIsVisible(true);
      setQuizId(onboardingData.quizId);
    }
  }, [onboardingData, location.pathname, navigate, user, tourDone]);

  return {
    isVisible,
    setIsVisible,
    quizId,
    markAsShown: markAsShownMutation.mutateAsync,
  };
};
