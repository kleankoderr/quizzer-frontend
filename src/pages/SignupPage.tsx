import { useState, useEffect, useCallback } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { analytics } from '../services/analytics.service';
import { authService } from '../services/auth.service';
import { useAuth } from '../contexts/AuthContext';
import { Mail, Lock, User, ArrowRight, Eye, EyeOff, AlertCircle } from 'lucide-react';
import type { User as UserType } from '../types';
import { LoadingScreen } from '../components/LoadingScreen';

export const SignupPage = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [checkingRedirect, setCheckingRedirect] = useState(true);
  const navigate = useNavigate();
  const { login } = useAuth();

  const handleSignupSuccess = useCallback(async (user: UserType, method: 'email' | 'google') => {
    login(user);
    analytics.trackAuthSignup(method, true);
    
    // Small delay to ensure state is updated
    await new Promise(resolve => setTimeout(resolve, 500));
    
    if (user.role === 'ADMIN' || user.role === 'SUPER_ADMIN') {
      navigate('/admin', { replace: true });
    } else if (!user.onboardingCompleted) {
      navigate('/onboarding', { replace: true });
    } else {
      navigate('/dashboard', { replace: true });
    }
  }, [login, navigate]);

  useEffect(() => {
    const checkGoogleRedirect = async () => {
      try {
        const user = await authService.handleGoogleRedirect();
        
        if (user) {
          await handleSignupSuccess(user, 'google');
        }
      } catch (err: any) {
        const errorMessage = err.response?.data?.message || 'Google sign-up failed. Please try again.';
        setError(errorMessage);
        analytics.trackAuthSignup('google', false, errorMessage);
      } finally {
        setCheckingRedirect(false);
      }
    };

    checkGoogleRedirect();
  }, [handleSignupSuccess]);

  const handleGoogleSignUp = async () => {
    setError('');
    setGoogleLoading(true);

    try {
      const user = await authService.googleSignIn();
      
      // If user is null, it means redirect was initiated (mobile flow)
      if (!user) {
        return; // Don't set loading to false, page is redirecting
      }

      // Desktop popup flow - user data returned immediately
      await handleSignupSuccess(user, 'google');
    } catch (err: any) {
      const errorMessage = err.response?.data?.message || 'Google sign-up failed. Please try again.';
      setError(errorMessage);
      analytics.trackAuthSignup('google', false, errorMessage);
      setGoogleLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const user = await authService.signup(email, password, name);
      await handleSignupSuccess(user, 'email');
    } catch (err: any) {
      const errorMessage = err.response?.data?.message || 'Failed to create account';
      setError(errorMessage);
      analytics.trackAuthSignup('email', false, errorMessage);
    } finally {
      setLoading(false);
    }
  };

// ... imports ...

// ... inside component ...

  if (checkingRedirect) {
    return (
      <LoadingScreen 
        message="Creating Account..." 
        subMessage="Setting up your personalized learning journey" 
      />
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-950 p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-primary-600 dark:text-primary-500 mb-2">Quizzer</h1>
          <p className="text-gray-600 dark:text-gray-400">Create your account</p>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-8 space-y-6">
          {/* Google Sign-Up Button - Primary */}
          <button
            onClick={handleGoogleSignUp}
            disabled={googleLoading || loading}
            className="w-full bg-white dark:bg-gray-700 border-2 border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-200 py-3 rounded-lg font-medium hover:bg-gray-50 dark:hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-3"
          >
            <svg className="w-5 h-5" viewBox="0 0 24 24">
              <path
                fill="#4285F4"
                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
              />
              <path
                fill="#34A853"
                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.04-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
              />
              <path
                fill="#FBBC05"
                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
              />
              <path
                fill="#EA4335"
                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
              />
            </svg>
            {googleLoading ? 'Signing up with Google...' : 'Continue with Google'}
          </button>

          {/* Divider */}
          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-gray-200 dark:border-gray-700"></div>
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-2 bg-white dark:bg-gray-800 text-gray-500 dark:text-gray-400">Or sign up with email</span>
            </div>
          </div>

          {/* Email/Password Form - Secondary */}
          <form 
            onSubmit={handleSubmit} 
            className="space-y-4"
            onClick={() => error && setError('')}
          >
            <div>
              <label htmlFor="name" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Full Name</label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 dark:text-gray-500" />
                <input
                  id="name"
                  type="text"
                  value={name}
                  onChange={(e) => {
                    setName(e.target.value);
                    if (error) setError('');
                  }}
                  className="w-full pl-10 pr-4 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500"
                  placeholder="John Doe"
                  required
                />
              </div>
            </div>

            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Email Address</label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 dark:text-gray-500" />
                <input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => {
                    setEmail(e.target.value);
                    if (error) setError('');
                  }}
                  className="w-full pl-10 pr-4 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500"
                  placeholder="you@example.com"
                  required
                />
              </div>
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Password</label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 dark:text-gray-500" />
                <input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => {
                    setPassword(e.target.value);
                    if (error) setError('');
                  }}
                  className="w-full pl-10 pr-12 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500"
                  placeholder="••••••••"
                  required
                  minLength={6}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
              <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">Must be at least 6 characters</p>
            </div>

            {error && (
              <div 
                className="p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg animate-fade-in flex items-start gap-3"
                role="alert"
                aria-live="polite"
              >
                <AlertCircle className="w-5 h-5 text-red-600 dark:text-red-400 flex-shrink-0 mt-0.5" />
                <p className="text-sm text-red-600 dark:text-red-400 font-medium">{error}</p>
              </div>
            )}

            <button
              type="submit"
              disabled={loading || googleLoading}
              className="w-full bg-primary-600 text-white py-2.5 rounded-lg font-medium hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {loading ? 'Creating Account...' : 'Sign Up'}
              {!loading && <ArrowRight className="w-5 h-5" />}
            </button>
          </form>

          <div className="text-center pt-4 border-t border-gray-100 dark:border-gray-700">
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Already have an account?{' '}
              <Link to="/login" className="text-primary-600 dark:text-primary-400 hover:text-primary-700 dark:hover:text-primary-300 font-medium">
                Sign In
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
