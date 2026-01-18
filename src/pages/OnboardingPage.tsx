import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { ArrowRight, Check, BookOpen, GraduationCap } from 'lucide-react';
import { apiClient } from '../services/api';
import { motion, AnimatePresence } from 'framer-motion';
import { SchoolSearch } from '../components/SchoolSearch';

const GRADES = [
  'Primary School',
  'Junior Secondary School (JSS)',
  'Senior Secondary School (SSS)',
  'Undergraduate',
  'Graduate Student',
  'Lifelong Learner',
];

const SUBJECTS = [
  'Mathematics',
  'Physics',
  'Chemistry',
  'Biology',
  'History',
  'Geography',
  'Literature',
  'Computer Science',
  'Economics',
  'Psychology',
  'Sociology',
  'Philosophy',
  'Art',
  'Business Studies',
  'Environmental Science',
  'Health Education',
  'Medicine',
  'Engineering',
  'Law',
  'Architecture',
  'Political Science',
];

const USER_TYPES = [
  { id: 'student', label: 'Student', icon: GraduationCap },
  { id: 'teacher', label: 'Teacher', icon: BookOpen },
];

export const OnboardingPage = () => {
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const { user, login } = useAuth();
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    userType: 'student',
    grade: '',
    schoolName: '',
    subjects: [] as string[],
  });

  const handleNext = () => {
    setStep((prev) => prev + 1);
  };

  const handleBack = () => {
    setStep((prev) => prev - 1);
  };

  const toggleSubject = (subject: string) => {
    setFormData((prev) => ({
      ...prev,
      subjects: prev.subjects.includes(subject)
        ? prev.subjects.filter((s) => s !== subject)
        : [...prev.subjects, subject],
    }));
  };

  const handleFinish = async () => {
    setLoading(true);
    try {
      await apiClient.post('/onboarding/finish', formData);

      // Update local user context to reflect onboarding completion
      if (user) {
        login({ ...user, onboardingCompleted: true });
      }

      // Move to completion step (Step 4) which will auto-redirect
      setStep(4);
    } catch (error) {
      console.error('Error completing onboarding:', error);
      // Even if it fails, try to redirect to dashboard to avoid getting stuck
      navigate('/dashboard');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-950 p-4">
      <div className="w-full max-w-2xl">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-primary-600 dark:text-primary-500 mb-2">
            Welcome to Quizzer!
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Let's personalize your experience
          </p>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl overflow-hidden">
          {/* Progress Bar */}
          <div className="h-2 bg-gray-100 dark:bg-gray-700">
            <div
              className="h-full bg-primary-600 transition-all duration-500 ease-out"
              style={{ width: `${(step / 4) * 100}%` }}
            />
          </div>

          <div className="p-8">
            <AnimatePresence mode="wait">
              {/* Step 1: User Type */}
              {step === 1 && (
                <motion.div
                  key="step1"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  className="space-y-6"
                >
                  <h2 className="text-2xl font-semibold text-gray-900 dark:text-white">
                    Tell us about yourself
                  </h2>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {USER_TYPES.map((type) => (
                      <button
                        key={type.id}
                        onClick={() =>
                          setFormData({ ...formData, userType: type.id })
                        }
                        className={`p-4 rounded-xl border-2 flex flex-col items-center gap-3 transition-all ${
                          formData.userType === type.id
                            ? 'border-primary-600 bg-primary-50 dark:bg-primary-900/20 text-primary-600'
                            : 'border-gray-200 dark:border-gray-700 hover:border-primary-300 dark:hover:border-primary-700 text-gray-600 dark:text-gray-400'
                        }`}
                      >
                        <type.icon className="w-8 h-8" />
                        <span className="font-medium">{type.label}</span>
                      </button>
                    ))}
                  </div>
                </motion.div>
              )}

              {/* Step 2: Grade & School */}
              {step === 2 && (
                <motion.div
                  key="step2"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  className="space-y-6"
                >
                  <h2 className="text-2xl font-semibold text-gray-900 dark:text-white">
                    Current Grade / Level
                  </h2>

                  <div className="space-y-4">
                    <div>
                      <label
                        htmlFor="grade-select"
                        className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
                      >
                        Select your level
                      </label>
                      <select
                        id="grade-select"
                        value={formData.grade}
                        onChange={(e) =>
                          setFormData({ ...formData, grade: e.target.value })
                        }
                        className="w-full px-4 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                      >
                        <option value="">Select your level</option>
                        {GRADES.map((grade) => (
                          <option key={grade} value={grade}>
                            {grade}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label
                        htmlFor="school-search"
                        className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
                      >
                        School / Institution
                      </label>
                      <SchoolSearch
                        id="school-search"
                        value={formData.schoolName}
                        onChange={(value) =>
                          setFormData({ ...formData, schoolName: value })
                        }
                        placeholder="Select or search for your school..."
                      />
                    </div>
                  </div>
                </motion.div>
              )}

              {/* Step 3: Interests */}
              {step === 3 && (
                <motion.div
                  key="step3"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  className="space-y-6"
                >
                  <h2 className="text-2xl font-semibold text-gray-900 dark:text-white">
                    What are you interested in?
                  </h2>
                  <p className="text-gray-600 dark:text-gray-400">
                    Select subjects you'd like to improve in.
                  </p>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 max-h-[400px] overflow-y-auto pr-2">
                    {SUBJECTS.map((subject) => (
                      <button
                        key={subject}
                        onClick={() => toggleSubject(subject)}
                        className={`p-3 rounded-lg border text-left transition-all flex items-center justify-between ${
                          formData.subjects.includes(subject)
                            ? 'border-primary-600 bg-primary-50 dark:bg-primary-900/20 text-primary-600'
                            : 'border-gray-200 dark:border-gray-700 hover:border-primary-300 text-gray-700 dark:text-gray-300'
                        }`}
                      >
                        <span className="text-sm font-medium">{subject}</span>
                        {formData.subjects.includes(subject) && (
                          <Check className="w-4 h-4" />
                        )}
                      </button>
                    ))}
                  </div>
                </motion.div>
              )}

              {/* Step 4: Completion (Manual redirect) */}
              {step === 4 && (
                <motion.div
                  key="step4"
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 1.05 }}
                  className="text-center space-y-8 py-12"
                >
                  <div className="space-y-4">
                    <h2 className="text-3xl font-bold text-gray-900 dark:text-white">
                      You're all set, {user?.name?.split(' ')[0] || 'Learner'}!
                    </h2>
                    <p className="text-lg text-gray-600 dark:text-gray-300 max-w-md mx-auto leading-relaxed">
                      We're crafting a personalized learning path just for you.
                      Get ready to unlock your full potential!
                    </p>
                  </div>

                  <div className="flex flex-col items-center gap-6">
                    <div className="flex items-center gap-2 text-sm font-medium text-primary-600 dark:text-primary-400 bg-primary-50 dark:bg-primary-900/20 px-4 py-2 rounded-full">
                      <div className="w-2 h-2 bg-primary-500 rounded-full animate-bounce" />
                      Assessment generated successfully!
                    </div>

                    <button
                      onClick={() => navigate('/dashboard')}
                      className="bg-primary-600 text-white px-8 py-3 rounded-xl font-semibold text-lg hover:bg-primary-700 transition-all shadow-lg hover:shadow-primary-500/25 flex items-center gap-2 transform hover:-translate-y-0.5"
                    >
                      Go to Dashboard
                      <ArrowRight className="w-5 h-5" />
                    </button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Navigation Buttons */}
            {step < 4 && (
              <div className="mt-8 flex items-center justify-between pt-6 border-t border-gray-100 dark:border-gray-700">
                {step > 1 && (
                  <button
                    onClick={handleBack}
                    className="text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white font-medium px-4 py-2"
                  >
                    Back
                  </button>
                )}

                {step < 3 ? (
                  <button
                    onClick={handleNext}
                    className="bg-primary-600 text-white px-6 py-2.5 rounded-lg font-medium hover:bg-primary-700 transition-colors flex items-center gap-2"
                  >
                    Next
                    <ArrowRight className="w-4 h-4" />
                  </button>
                ) : (
                  <button
                    onClick={handleFinish}
                    disabled={loading}
                    className="bg-primary-600 text-white px-8 py-2.5 rounded-lg font-medium hover:bg-primary-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                  >
                    {loading ? 'Finishing...' : 'Finish'}
                    {!loading && <ArrowRight className="w-4 h-4" />}
                  </button>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
