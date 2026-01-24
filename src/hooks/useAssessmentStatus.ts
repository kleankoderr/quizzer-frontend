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
        return isOnboardingTourDone ? false : 3000;
      }
      if (data.status === 'PENDING') return 5000;
      return false;
    },
  });

  // Mark as shown mutation
  const markAsShownMutation = useMutation({
    mutationFn: () => userService.markAssessmentShown(),
    onSuccess: () => {
      if (user) {
        login({ ...user, assessmentPopupShown: true });
      }
      queryClient.invalidateQueries({ queryKey: ['onboardingStatus'] });
    },
    onError: (error) => {
      console.error('Failed to mark assessment popup as shown', error);
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
    } else if (onboardingData.status === 'COMPLETED' && onboardingData.quizId) {
      const isOnboardingTourDone = localStorage.getItem(
        'tour_completed_onboarding'
      );
      if (isOnboardingTourDone) {
        setQuizId(onboardingData.quizId);
        setIsVisible(true);
      }
    }
  }, [onboardingData, location.pathname, navigate, user]);

  return {
    isVisible,
    setIsVisible,
    quizId,
    markAsShown: markAsShownMutation.mutateAsync,
  };
};
