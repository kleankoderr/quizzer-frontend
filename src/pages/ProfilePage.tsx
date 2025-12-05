import { Link } from "react-router-dom";
import toast from "react-hot-toast";
import { useProfile } from "../hooks";
import {
  User,
  Mail,
  School,
  GraduationCap,
  Calendar,
  Brain,
  Layers,
  Flame,
  Trophy,
  Settings,
  Zap,
} from "lucide-react";

export const ProfilePage = () => {
  const { data: profile, isLoading: loading, error } = useProfile();

  if (error) {
    toast.error("Failed to load profile");
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-3 border-primary-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading profile...</p>
        </div>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-600 dark:text-gray-400">Profile not found</p>
      </div>
    );
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  return (
    <div className="space-y-6 pb-8">
      {/* Hero Header */}
      <header className="relative overflow-hidden rounded-xl bg-blue-600 dark:bg-blue-800 p-6 md:p-8 shadow-lg">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute -top-10 -right-10 w-40 h-40 bg-white rounded-full"></div>
          <div className="absolute -bottom-10 -left-10 w-40 h-40 bg-white rounded-full"></div>
        </div>

        <div className="relative z-10">
          <div className="flex items-center justify-between">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <User className="w-6 h-6 text-blue-200" />
                <span className="text-blue-200 font-semibold text-sm">
                  Your Account
                </span>
              </div>
              <h1 className="text-3xl md:text-4xl font-bold text-white mb-2">
                Profile
              </h1>
              <p className="text-blue-100 dark:text-blue-200 text-lg">
                View and manage your learning profile
              </p>
            </div>
            <Link
              to="/settings"
              className="flex items-center gap-2 px-3 py-2 sm:px-4 sm:py-2 bg-white/20 hover:bg-white/30 backdrop-blur-sm text-white rounded-lg transition-colors border border-white/30"
            >
              <Settings className="w-4 h-4" />
              <span className="hidden sm:inline">Edit Profile</span>
            </Link>
          </div>
        </div>
      </header>

      {/* Profile Card */}
      <div className="card dark:bg-gray-800 overflow-hidden">
        <div className="flex flex-col md:flex-row gap-6">
          {/* Avatar */}
          <div className="flex-shrink-0 flex justify-center md:justify-start">
            <div className="w-32 h-32 rounded-full bg-blue-500 flex items-center justify-center text-white text-4xl font-bold shadow-xl border-4 border-white dark:border-gray-700">
              {profile.avatar ? (
                <img
                  src={profile.avatar}
                  alt={profile.name}
                  className="w-full h-full rounded-full object-cover"
                />
              ) : (
                profile.name.charAt(0).toUpperCase()
              )}
            </div>
          </div>

          {/* Profile Info */}
          <div className="flex-1 space-y-6">
            <div className="text-center md:text-left">
              <h2 className="text-3xl font-bold text-gray-900 dark:text-white">
                {profile.name}
              </h2>
              <div className="inline-flex items-center gap-2 px-3 py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 rounded-full text-sm font-medium mt-2">
                <Brain className="w-4 h-4" />
                Level {profile.statistics.level} Learner
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="flex items-center gap-3 p-3 rounded-xl bg-gray-50 dark:bg-gray-700/50 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors">
                <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
                  <Mail className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                </div>
                <div className="min-w-0">
                  <p className="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wide">
                    Email
                  </p>
                  <p className="font-medium text-gray-900 dark:text-white truncate">
                    {profile.email}
                  </p>
                </div>
              </div>

              {profile.schoolName && (
                <div className="flex items-center gap-3 p-3 rounded-xl bg-gray-50 dark:bg-gray-700/50 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors">
                  <div className="p-2 bg-purple-100 dark:bg-purple-900/30 rounded-lg">
                    <School className="w-5 h-5 text-purple-600 dark:text-purple-400" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wide">
                      School
                    </p>
                    <p className="font-medium text-gray-900 dark:text-white truncate">
                      {profile.schoolName}
                    </p>
                  </div>
                </div>
              )}

              {profile.grade && (
                <div className="flex items-center gap-3 p-3 rounded-xl bg-gray-50 dark:bg-gray-700/50 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors">
                  <div className="p-2 bg-green-100 dark:bg-green-900/30 rounded-lg">
                    <GraduationCap className="w-5 h-5 text-green-600 dark:text-green-400" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wide">
                      Grade
                    </p>
                    <p className="font-medium text-gray-900 dark:text-white truncate">
                      {profile.grade}
                    </p>
                  </div>
                </div>
              )}

              <div className="flex items-center gap-3 p-3 rounded-xl bg-gray-50 dark:bg-gray-700/50 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors">
                <div className="p-2 bg-orange-100 dark:bg-orange-900/30 rounded-lg">
                  <Calendar className="w-5 h-5 text-orange-600 dark:text-orange-400" />
                </div>
                <div className="min-w-0">
                  <p className="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wide">
                    Joined
                  </p>
                  <p className="font-medium text-gray-900 dark:text-white truncate">
                    {formatDate(profile.createdAt)}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Statistics Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="card bg-blue-50 dark:bg-blue-900/10 border-blue-200 dark:border-blue-800 hover:shadow-md transition-all duration-300 hover:-translate-y-1">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-blue-500 rounded-lg shadow-md">
              <Brain className="w-6 h-6 text-white" />
            </div>
            <div>
              <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide">
                Total Quizzes
              </p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">
                {profile.statistics.totalQuizzes}
              </p>
            </div>
          </div>
        </div>

        <div className="card bg-purple-50 dark:bg-purple-900/10 border-purple-200 dark:border-purple-800 hover:shadow-md transition-all duration-300 hover:-translate-y-1">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-purple-500 rounded-lg shadow-md">
              <Layers className="w-6 h-6 text-white" />
            </div>
            <div>
              <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide">
                Flashcard Sets
              </p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">
                {profile.statistics.totalFlashcards}
              </p>
            </div>
          </div>
        </div>

        <div className="card bg-orange-50 dark:bg-orange-900/10 border-orange-200 dark:border-orange-800 hover:shadow-md transition-all duration-300 hover:-translate-y-1">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-orange-500 rounded-lg shadow-md">
              <Flame className="w-6 h-6 text-white" />
            </div>
            <div>
              <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide">
                Current Streak
              </p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">
                {profile.statistics.currentStreak} days
              </p>
            </div>
          </div>
        </div>

        <div className="card bg-yellow-50 dark:bg-yellow-900/10 border-yellow-200 dark:border-yellow-800 hover:shadow-md transition-all duration-300 hover:-translate-y-1">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-yellow-500 rounded-lg shadow-md">
              <Zap className="w-6 h-6 text-white" />
            </div>
            <div>
              <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide">
                Total XP
              </p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">
                {profile.statistics.totalXP.toLocaleString()}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Additional Stats */}
      <div className="card dark:bg-gray-800">
        <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-4">
          Learning Progress
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="text-center p-6 bg-gray-50 dark:bg-gray-700/50 rounded-xl hover:bg-white dark:hover:bg-gray-700 transition-all hover:shadow-md border border-transparent hover:border-gray-200 dark:hover:border-gray-600">
            <div className="w-16 h-16 bg-yellow-100 dark:bg-yellow-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
              <Trophy className="w-8 h-8 text-yellow-600 dark:text-yellow-400" />
            </div>
            <p className="text-3xl font-bold text-gray-900 dark:text-white mb-1">
              {profile.statistics.longestStreak}
            </p>
            <p className="text-sm font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide">
              Longest Streak
            </p>
          </div>

          <div className="text-center p-6 bg-gray-50 dark:bg-gray-700/50 rounded-xl hover:bg-white dark:hover:bg-gray-700 transition-all hover:shadow-md border border-transparent hover:border-gray-200 dark:hover:border-gray-600">
            <div className="w-16 h-16 bg-purple-100 dark:bg-purple-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
              <User className="w-8 h-8 text-purple-600 dark:text-purple-400" />
            </div>
            <p className="text-3xl font-bold text-gray-900 dark:text-white mb-1">
              Level {profile.statistics.level}
            </p>
            <p className="text-sm font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide">
              Current Level
            </p>
          </div>

          <div className="text-center p-6 bg-gray-50 dark:bg-gray-700/50 rounded-xl hover:bg-white dark:hover:bg-gray-700 transition-all hover:shadow-md border border-transparent hover:border-gray-200 dark:hover:border-gray-600">
            <div className="w-16 h-16 bg-blue-100 dark:bg-blue-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
              <Brain className="w-8 h-8 text-blue-600 dark:text-blue-400" />
            </div>
            <p className="text-3xl font-bold text-gray-900 dark:text-white mb-1">
              {profile.statistics.totalAttempts}
            </p>
            <p className="text-sm font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide">
              Total Attempts
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
