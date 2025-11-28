import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import { userService } from '../services';
import type { UserProfile } from '../types';
import { User, Mail, School, GraduationCap, Calendar, Brain, Layers, Flame, Trophy, Settings, Zap } from 'lucide-react';

export const ProfilePage = () => {
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadProfile();
  }, []);

  const loadProfile = async () => {
    try {
      const data = await userService.getProfile();
      setProfile(data);
    } catch (error) {
      console.error('Error loading profile:', error);
      toast.error('Failed to load profile');
    } finally {
      setLoading(false);
    }
  };

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
        <p className="text-gray-600">Profile not found</p>
      </div>
    );
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  return (
    <div className="space-y-6 pb-8">
      {/* Hero Header */}
      <header className="relative overflow-hidden rounded-xl bg-primary-600 p-6 md:p-8 shadow-lg">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute -top-10 -right-10 w-40 h-40 bg-white rounded-full"></div>
          <div className="absolute -bottom-10 -left-10 w-40 h-40 bg-white rounded-full"></div>
        </div>
        
        <div className="relative z-10">
          <div className="flex items-center justify-between">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <User className="w-6 h-6 text-yellow-300" />
                <span className="text-yellow-300 font-semibold text-sm">Your Account</span>
              </div>
              <h1 className="text-3xl md:text-4xl font-bold text-white mb-2">
                Profile
              </h1>
              <p className="text-primary-100 text-lg">
                View and manage your learning profile
              </p>
            </div>
            <Link
              to="/settings"
              className="flex items-center gap-2 px-4 py-2 bg-white/20 hover:bg-white/30 backdrop-blur-sm text-white rounded-lg transition-colors border border-white/30"
            >
              <Settings className="w-4 h-4" />
              Edit Profile
            </Link>
          </div>
        </div>
      </header>

      {/* Profile Card */}
      <div className="card">
        <div className="flex flex-col md:flex-row gap-6">
          {/* Avatar */}
          <div className="flex-shrink-0">
            <div className="w-32 h-32 rounded-full bg-gradient-to-br from-primary-500 to-blue-600 flex items-center justify-center text-white text-4xl font-bold shadow-lg">
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
          <div className="flex-1 space-y-4">
            <div>
              <h2 className="text-2xl font-bold text-gray-900">{profile.name}</h2>
              <p className="text-gray-600">Level {profile.statistics.level} Learner</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-blue-100 rounded-lg">
                  <Mail className="w-5 h-5 text-blue-600" />
                </div>
                <div>
                  <p className="text-sm text-gray-600">Email</p>
                  <p className="font-medium text-gray-900">{profile.email}</p>
                </div>
              </div>

              {profile.schoolName && (
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-purple-100 rounded-lg">
                    <School className="w-5 h-5 text-purple-600" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">School</p>
                    <p className="font-medium text-gray-900">{profile.schoolName}</p>
                  </div>
                </div>
              )}

              {profile.grade && (
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-green-100 rounded-lg">
                    <GraduationCap className="w-5 h-5 text-green-600" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Grade</p>
                    <p className="font-medium text-gray-900">{profile.grade}</p>
                  </div>
                </div>
              )}

              <div className="flex items-center gap-3">
                <div className="p-2 bg-orange-100 rounded-lg">
                  <Calendar className="w-5 h-5 text-orange-600" />
                </div>
                <div>
                  <p className="text-sm text-gray-600">Member Since</p>
                  <p className="font-medium text-gray-900">{formatDate(profile.createdAt)}</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Statistics Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="card bg-blue-50 border border-blue-200">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-blue-500 rounded-lg">
              <Brain className="w-6 h-6 text-white" />
            </div>
            <div>
              <p className="text-sm text-gray-600">Total Quizzes</p>
              <p className="text-2xl font-bold text-gray-900">{profile.statistics.totalQuizzes}</p>
            </div>
          </div>
        </div>

        <div className="card bg-purple-50 border border-purple-200">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-purple-500 rounded-lg">
              <Layers className="w-6 h-6 text-white" />
            </div>
            <div>
              <p className="text-sm text-gray-600">Flashcard Sets</p>
              <p className="text-2xl font-bold text-gray-900">{profile.statistics.totalFlashcards}</p>
            </div>
          </div>
        </div>

        <div className="card bg-orange-50 border border-orange-200">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-orange-500 rounded-lg">
              <Flame className="w-6 h-6 text-white" />
            </div>
            <div>
              <p className="text-sm text-gray-600">Current Streak</p>
              <p className="text-2xl font-bold text-gray-900">{profile.statistics.currentStreak} days</p>
            </div>
          </div>
        </div>

        <div className="card bg-yellow-50 border border-yellow-200">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-yellow-500 rounded-lg">
              <Zap className="w-6 h-6 text-white" />
            </div>
            <div>
              <p className="text-sm text-gray-600">Total XP</p>
              <p className="text-2xl font-bold text-gray-900">{profile.statistics.totalXP.toLocaleString()}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Additional Stats */}
      <div className="card">
        <h3 className="text-xl font-bold text-gray-900 mb-4">Learning Progress</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="text-center p-4 bg-gray-50 rounded-lg">
            <Trophy className="w-8 h-8 text-yellow-500 mx-auto mb-2" />
            <p className="text-2xl font-bold text-gray-900">{profile.statistics.longestStreak}</p>
            <p className="text-sm text-gray-600">Longest Streak</p>
          </div>

          <div className="text-center p-4 bg-gray-50 rounded-lg">
            <User className="w-8 h-8 text-primary-600 mx-auto mb-2" />
            <p className="text-2xl font-bold text-gray-900">Level {profile.statistics.level}</p>
            <p className="text-sm text-gray-600">Current Level</p>
          </div>

          <div className="text-center p-4 bg-gray-50 rounded-lg">
            <Brain className="w-8 h-8 text-blue-600 mx-auto mb-2" />
            <p className="text-2xl font-bold text-gray-900">{profile.statistics.totalAttempts}</p>
            <p className="text-sm text-gray-600">Total Attempts</p>
          </div>
        </div>
      </div>
    </div>
  );
};
