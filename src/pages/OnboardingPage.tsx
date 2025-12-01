import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { School, ArrowRight } from 'lucide-react';
import { apiClient } from '../services/api';
import { USER_ENDPOINTS } from '../config/api';

export const OnboardingPage = () => {
  const [schoolName, setSchoolName] = useState('');
  const [loading, setLoading] = useState(false);
  const { user } = useAuth();
  const navigate = useNavigate();

  const handleContinue = async () => {
    if (!schoolName.trim()) {
      // If no school name entered, just skip
      navigate('/dashboard');
      return;
    }

    setLoading(true);
    try {
      // Update user profile with school name
      await apiClient.patch(USER_ENDPOINTS.UPDATE_PROFILE, {
        schoolName: schoolName.trim(),
      });
      navigate('/dashboard');
    } catch (error) {

      // Still navigate to dashboard even if update fails
      navigate('/dashboard');
    } finally {
      setLoading(false);
    }
  };

  const handleSkip = () => {
    navigate('/dashboard');
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-950 p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-primary-600 dark:text-primary-500 mb-2">Welcome to Quizzer!</h1>
          <p className="text-gray-600 dark:text-gray-400">Let's personalize your experience</p>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-8 space-y-6">
          <div className="text-center">
            <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-2">
              Hi, {user?.name || 'there'}! 👋
            </h2>
            <p className="text-gray-600 dark:text-gray-400 text-sm">
              Help us tailor your learning experience
            </p>
          </div>

          <div className="space-y-4">
            <div>
              <label htmlFor="school" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                School Name <span className="text-gray-400 dark:text-gray-500">(Optional)</span>
              </label>
              <div className="relative">
                <School className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 dark:text-gray-500" />
                <input
                  id="school"
                  type="text"
                  value={schoolName}
                  onChange={(e) => setSchoolName(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500"
                  placeholder="Springfield High School"
                  onKeyPress={(e) => {
                    if (e.key === 'Enter') {
                      handleContinue();
                    }
                  }}
                />
              </div>
              <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                This helps us provide relevant content and connect you with classmates
              </p>
            </div>

            <button
              onClick={handleContinue}
              disabled={loading}
              className="w-full bg-primary-600 text-white py-2.5 rounded-lg font-medium hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {loading ? 'Saving...' : 'Continue'}
              {!loading && <ArrowRight className="w-5 h-5" />}
            </button>

            <button
              onClick={handleSkip}
              disabled={loading}
              className="w-full bg-transparent text-gray-600 dark:text-gray-400 py-2.5 rounded-lg font-medium hover:bg-gray-100 dark:hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-300 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Skip for now
            </button>
          </div>

          <div className="pt-4 border-t border-gray-100 dark:border-gray-700">
            <p className="text-xs text-center text-gray-500 dark:text-gray-400">
              You can always update this information later in your profile settings
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
