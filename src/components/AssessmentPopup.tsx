import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { motion, AnimatePresence } from 'framer-motion';
import { X, ArrowRight } from 'lucide-react';
import { apiClient } from '../services/api';

export const AssessmentPopup = () => {
  const [isVisible, setIsVisible] = useState(false);
  const [quizId, setQuizId] = useState<string | null>(null);
  const navigate = useNavigate();
  const { user, login } = useAuth();
  const location = useLocation();

  useEffect(() => {
    let pollInterval: ReturnType<typeof setInterval>;

    const checkStatus = async () => {
      try {
        if (!user) return;

        // Check if we've already shown it (DB flag)
        if (user.assessmentPopupShown) {
          return;
        }

        // Don't show if already on the quiz page or onboarding
        if (
          location.pathname.includes('/quiz/') ||
          location.pathname === '/onboarding'
        ) {
          return;
        }

        const { data } = await apiClient.get('/onboarding/status');

        if (data.status === 'NOT_STARTED') {
          // If onboarding hasn't started (no task), redirect to onboarding
          // But don't redirect if we're on login or signup pages
          const isAuthPage =
            location.pathname === '/login' ||
            location.pathname === '/signup' ||
            location.pathname === '/admin';
          if (location.pathname !== '/onboarding' && !isAuthPage) {
            navigate('/onboarding');
          }
        } else if (data.status === 'COMPLETED' && data.quizId) {
          setQuizId(data.quizId);
          setIsVisible(true);

          // Stop polling if completed
          if (pollInterval) clearInterval(pollInterval);
        } else if (data.status === 'PENDING') {
          // If PENDING, we set up polling if not already set
          if (!pollInterval) {
            pollInterval = setInterval(checkStatus, 5000); // Check every 5 seconds for faster feedback
          }
        }
      } catch (error) {
        console.error('Failed to check assessment status:', error);
      }
    };

    // Initial check
    if (user && !user.assessmentPopupShown) {
      checkStatus();
    }

    return () => {
      if (pollInterval) clearInterval(pollInterval);
    };
  }, [navigate, location.pathname, user]);

  const markAsShown = async () => {
    try {
      await apiClient.post('/user/assessment-popup-shown');
      if (user) {
        login({ ...user, assessmentPopupShown: true });
      }
    } catch (error) {
      console.error('Failed to mark popup as shown:', error);
    }
  };

  const handleTakeQuiz = () => {
    if (quizId) {
      markAsShown();
      navigate(`/quiz/${quizId}`);
      setIsVisible(false);
    }
  };

  const handleClose = async () => {
    await markAsShown();
    setIsVisible(false);
  };

  return createPortal(
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
        >
          <motion.div
            initial={{ scale: 0.9, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.95, opacity: 0, y: 10 }}
            className="w-full max-w-md bg-white dark:bg-gray-800 rounded-3xl shadow-2xl overflow-hidden relative border border-gray-100 dark:border-gray-700"
          >
            {/* Decorative Elements */}
            <div className="absolute top-0 left-0 w-full h-32 bg-gradient-to-b from-primary-50/50 to-transparent dark:from-primary-900/10" />
            <div className="absolute -top-10 -right-10 w-40 h-40 bg-primary-500/10 rounded-full blur-3xl" />
            <div className="absolute -bottom-10 -left-10 w-40 h-40 bg-purple-500/10 rounded-full blur-3xl" />

            <div className="relative p-8">
              <button
                onClick={handleClose}
                className="absolute top-4 right-4 p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition-colors rounded-full hover:bg-gray-100 dark:hover:bg-gray-700"
              >
                <X className="w-5 h-5" />
              </button>

              <div className="flex flex-col items-center text-center pt-4">
                <h3 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white mb-3">
                  Your Assessment is Ready
                </h3>

                <p className="text-sm sm:text-base text-gray-600 dark:text-gray-300 mb-6 leading-relaxed">
                  Take a quick assessment to help us tailor the learning
                  experience specifically for your goals.
                </p>

                <div className="flex flex-col w-full gap-3">
                  <button
                    onClick={handleTakeQuiz}
                    className="w-full py-3 px-6 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-xl shadow-md transition-colors flex items-center justify-center gap-2"
                  >
                    <span>Start Assessment</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>

                  <button
                    onClick={handleClose}
                    className="text-sm text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 font-medium transition-colors py-2"
                  >
                    Maybe later
                  </button>
                </div>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>,
    document.body
  );
};
