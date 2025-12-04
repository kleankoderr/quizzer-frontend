import { useState, useCallback } from "react";
import { useNavigate, Link } from "react-router-dom";
import { authService } from "../services/auth.service";
import { useAuth } from "../contexts/AuthContext";
import {
  Mail,
  Lock,
  User,
  ArrowRight,
  Eye,
  EyeOff,
  AlertCircle,
} from "lucide-react";
import { FcGoogle } from "react-icons/fc";
import { motion, AnimatePresence } from "framer-motion";
import type { User as UserType } from "../types";
import { useGoogleLogin } from "@react-oauth/google";

export const SignupPage = () => {
  const [showEmailForm, setShowEmailForm] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const navigate = useNavigate();
  const { login } = useAuth();

  const handleSignupSuccess = useCallback(
    async (user: UserType) => {
      login(user);

      // Small delay to ensure state is updated
      await new Promise((resolve) => setTimeout(resolve, 500));

      if (user.role === "ADMIN" || user.role === "SUPER_ADMIN") {
        navigate("/admin", { replace: true });
      } else if (user.onboardingCompleted) {
        navigate("/dashboard", { replace: true });
      } else {
        navigate("/onboarding", { replace: true });
      }
    },
    [login, navigate],
  );

  const googleLogin = useGoogleLogin({
    scope: "email profile openid",
    onSuccess: async (tokenResponse) => {
      setError("");
      setGoogleLoading(true);

      try {
        const user = await authService.googleSignIn(tokenResponse.access_token);
        await handleSignupSuccess(user);
      } catch (err: any) {
        const errorMessage =
          err.response?.data?.message ||
          "Google sign-up failed. Please try again.";
        setError(errorMessage);
        setGoogleLoading(false);
      }
    },
    onError: () => {
      const errorMessage = "Google sign-up failed. Please try again.";
      setError(errorMessage);
      setGoogleLoading(false);
    },
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const user = await authService.signup(email, password, name);
      await handleSignupSuccess(user);
    } catch (err: any) {
      const errorMessage =
        err.response?.data?.message || "Failed to create account";
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-950 p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-primary-600 dark:text-primary-500 mb-2">
            Quizzer
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Create your account
          </p>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-8 space-y-6 overflow-hidden">
          <AnimatePresence mode="wait">
            {!showEmailForm ? (
              <motion.div
                key="options"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.3 }}
                className="space-y-4"
              >
                {/* Google Sign-Up Button - Primary */}
                <button
                  onClick={() => {
                    setGoogleLoading(true);
                    googleLogin();
                  }}
                  disabled={googleLoading || loading}
                  className={`w-full bg-white dark:bg-gray-700 border-2 border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-200 py-3 rounded-lg font-medium hover:bg-gray-50 dark:hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-3 ${googleLoading ? "opacity-50 cursor-not-allowed" : ""}`}
                >
                  <FcGoogle className="w-5 h-5" />
                  {googleLoading ? (
                    <>
                      <span className="sm:hidden">Signing up...</span>
                      <span className="hidden sm:inline">
                        Signing up with Google...
                      </span>
                    </>
                  ) : (
                    "Continue with Google"
                  )}
                </button>

                {/* Continue with Email Button */}
                <button
                  onClick={() => setShowEmailForm(true)}
                  disabled={googleLoading || loading}
                  className={`w-full bg-primary-600 text-white py-3 rounded-lg font-medium hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 transition-all flex items-center justify-center gap-3 ${googleLoading || loading ? "opacity-50 cursor-not-allowed" : ""}`}
                >
                  <Mail className="w-5 h-5" />
                  Continue with Email
                </button>
              </motion.div>
            ) : (
              <motion.div
                key="form"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                transition={{ duration: 0.3 }}
              >
                <button
                  onClick={() => setShowEmailForm(false)}
                  className="text-sm text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 flex items-center gap-1 mb-4"
                >
                  <ArrowRight className="w-4 h-4 rotate-180" /> Back to options
                </button>

                {/* Email/Password Form - Secondary */}
                <form
                  onSubmit={handleSubmit}
                  className="space-y-4"
                  onClick={() => error && setError("")}
                >
                  <div>
                    <label
                      htmlFor="name"
                      className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
                    >
                      Full Name
                    </label>
                    <div className="relative">
                      <User className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 dark:text-gray-500" />
                      <input
                        id="name"
                        type="text"
                        value={name}
                        onChange={(e) => {
                          setName(e.target.value);
                          if (error) setError("");
                        }}
                        className="w-full pl-10 pr-4 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500"
                        placeholder="John Doe"
                        required
                      />
                    </div>
                  </div>

                  <div>
                    <label
                      htmlFor="email"
                      className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
                    >
                      Email Address
                    </label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 dark:text-gray-500" />
                      <input
                        id="email"
                        type="email"
                        value={email}
                        onChange={(e) => {
                          setEmail(e.target.value);
                          if (error) setError("");
                        }}
                        className="w-full pl-10 pr-4 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500"
                        placeholder="you@example.com"
                        required
                      />
                    </div>
                  </div>

                  <div>
                    <label
                      htmlFor="password"
                      className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
                    >
                      Password
                    </label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 dark:text-gray-500" />
                      <input
                        id="password"
                        type={showPassword ? "text" : "password"}
                        value={password}
                        onChange={(e) => {
                          setPassword(e.target.value);
                          if (error) setError("");
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
                        aria-label={
                          showPassword ? "Hide password" : "Show password"
                        }
                      >
                        {showPassword ? (
                          <EyeOff className="w-5 h-5" />
                        ) : (
                          <Eye className="w-5 h-5" />
                        )}
                      </button>
                    </div>
                    <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                      Must be at least 6 characters
                    </p>
                  </div>

                  {error && (
                    <div
                      className="p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg animate-fade-in flex items-start gap-3"
                      role="alert"
                      aria-live="polite"
                    >
                      <AlertCircle className="w-5 h-5 text-red-600 dark:text-red-400 flex-shrink-0 mt-0.5" />
                      <p className="text-sm text-red-600 dark:text-red-400 font-medium">
                        {error}
                      </p>
                    </div>
                  )}

                  <button
                    type="submit"
                    disabled={loading || googleLoading}
                    className="w-full bg-primary-600 text-white py-2.5 rounded-lg font-medium hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                  >
                    {loading ? "Creating Account..." : "Sign Up"}
                    {!loading && <ArrowRight className="w-5 h-5" />}
                  </button>
                </form>
              </motion.div>
            )}
          </AnimatePresence>

          <div className="text-center pt-4 border-t border-gray-100 dark:border-gray-700">
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Already have an account?{" "}
              <Link
                to="/login"
                className="text-primary-600 dark:text-primary-400 hover:text-primary-700 dark:hover:text-primary-300 font-medium"
              >
                Sign In
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
