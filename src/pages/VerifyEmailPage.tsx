import { useState, useEffect } from 'react';
import {
  useLocation,
  useNavigate,
  Navigate,
  useSearchParams,
} from 'react-router-dom';
import { authService } from '../services/auth.service';
import { useAuth } from '../contexts/AuthContext';
import {
  Mail,
  ArrowRight,
  RefreshCw,
  AlertCircle,
  CheckCircle,
} from 'lucide-react';
import { motion } from 'framer-motion';

export const VerifyEmailPage = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { login } = useAuth();

  const initialEmail = location.state?.email || searchParams.get('email');

  const [email] = useState(initialEmail || '');
  const [otp, setOtp] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [resendCooldown, setResendCooldown] = useState(0);

  useEffect(() => {
    if (resendCooldown > 0) {
      const timer = setTimeout(() => setResendCooldown((c) => c - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [resendCooldown]);

  if (!initialEmail) {
    return <Navigate to="/login" replace />;
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || otp.length !== 6) return;

    setLoading(true);
    setError('');

    try {
      const user = await authService.verifyEmail(email, otp);
      setSuccess('Email verified successfully!');

      // Login locally
      login(user);

      // Redirect after short delay
      setTimeout(() => {
        navigate('/dashboard');
      }, 1000);
    } catch (err: any) {
      setError(
        err.response?.data?.message ||
          'Verification failed. Please check your OTP.'
      );
    } finally {
      setLoading(false);
    }
  };

  const handleResendOtp = async () => {
    if (resendCooldown > 0) return;

    setLoading(true);
    setError('');
    setSuccess('');

    try {
      await authService.resendOtp(email);
      setSuccess('New OTP sent to your email.');
      setResendCooldown(60); // 60 seconds cooldown
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to resend OTP.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-950 p-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md bg-white dark:bg-gray-800 rounded-lg shadow-lg p-8 space-y-6"
      >
        <div className="text-center">
          <div className="mx-auto w-12 h-12 bg-primary-100 dark:bg-primary-900/30 rounded-full flex items-center justify-center mb-4">
            <Mail className="w-6 h-6 text-primary-600 dark:text-primary-400" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
            Verify your email
          </h1>
          <p className="text-gray-600 dark:text-gray-400 text-sm">
            We sent a verification code to{' '}
            <span className="font-semibold text-gray-800 dark:text-gray-200">
              {email}
            </span>
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label
              htmlFor="otp"
              className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
            >
              Verification Code
            </label>
            <input
              id="otp"
              type="text"
              value={otp}
              onChange={(e) =>
                setOtp(e.target.value.replaceAll(/\D/g, '').slice(0, 6))
              }
              className="w-full text-center text-2xl tracking-widest py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-300 dark:placeholder-gray-500"
              placeholder="000000"
              required
              maxLength={6}
              autoComplete="one-time-code"
            />
            <p className="mt-2 text-xs text-center text-gray-500 dark:text-gray-400">
              Enter the 6-digit code sent to your email
            </p>
          </div>

          {error && (
            <div className="p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg flex items-start gap-2">
              <AlertCircle className="w-5 h-5 text-red-600 dark:text-red-400 flex-shrink-0" />
              <p className="text-sm text-red-600 dark:text-red-400 font-medium">
                {error}
              </p>
            </div>
          )}

          {success && (
            <div className="p-3 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg flex items-start gap-2">
              <CheckCircle className="w-5 h-5 text-green-600 dark:text-green-400 flex-shrink-0" />
              <p className="text-sm text-green-600 dark:text-green-400 font-medium">
                {success}
              </p>
            </div>
          )}

          <button
            type="submit"
            disabled={loading || otp.length !== 6}
            className="w-full bg-primary-600 text-white py-2.5 rounded-lg font-medium hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {loading ? 'Verifying...' : 'Verify Email'}
            {!loading && <ArrowRight className="w-5 h-5" />}
          </button>
        </form>

        <div className="text-center pt-4 border-t border-gray-100 dark:border-gray-700">
          <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
            Didn't receive the code?
          </p>
          <button
            onClick={handleResendOtp}
            disabled={resendCooldown > 0 || loading}
            className="text-primary-600 dark:text-primary-400 hover:text-primary-700 dark:hover:text-primary-300 font-medium text-sm flex items-center justify-center gap-1 mx-auto disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <RefreshCw
              className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`}
            />
            {resendCooldown > 0
              ? `Resend in ${resendCooldown}s`
              : 'Resend Code'}
          </button>
        </div>
      </motion.div>
    </div>
  );
};
