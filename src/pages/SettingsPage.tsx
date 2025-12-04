import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { useAuth } from '../contexts/AuthContext';
import { useTheme } from '../contexts/ThemeContext';
import { userService } from '../services';
import { User, Lock, Settings as SettingsIcon, AlertTriangle, Save, Palette } from 'lucide-react';
import { Modal } from '../components/Modal';
import { useProfile } from '../hooks';

type TabType = 'account' | 'security' | 'theme' | 'danger';

export const SettingsPage = () => {
  const { user, logout } = useAuth();
  const { theme, setTheme } = useTheme();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<TabType>('account');
  const [loading, setLoading] = useState(false);

  // Use React Query for profile data
  const { data: profileData, refetch } = useProfile();

  // Account form
  const [name, setName] = useState(profileData?.name || '');
  const [schoolName, setSchoolName] = useState(profileData?.schoolName || '');
  const [grade, setGrade] = useState(profileData?.grade || '');

  // Preferences form (excluding theme which is now in ThemeContext)
  const [preferences, setPreferences] = useState({

    studyGoalMinutes: profileData?.preferences?.studyGoalMinutes ?? 30,
  });

  // Password form
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  // Delete confirmation
  const [deleteConfirmation, setDeleteConfirmation] = useState('');
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);

  // Update local state when profile data changes
  if (profileData && !name) {
    setName(profileData.name);
    setSchoolName(profileData.schoolName || '');
    setGrade(profileData.grade || '');
    if (profileData.preferences) {
      setPreferences(prev => ({ ...prev, ...profileData.preferences }));
    }
  }

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      await userService.updateProfile({
        name,
        schoolName: schoolName || undefined,
        grade: grade || undefined,
      });
      toast.success('Profile updated successfully!');
      refetch();
    } catch (_error) {

      toast.error('Failed to update profile');
    } finally {
      setLoading(false);
    }
  };

  const handleUpdatePreferences = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      await userService.updateSettings({
        preferences,
      });
      toast.success('Preferences updated successfully!');
    } catch (_error) {

      toast.error('Failed to update preferences');
    } finally {
      setLoading(false);
    }
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();

    if (newPassword !== confirmPassword) {
      toast.error('New passwords do not match');
      return;
    }

    if (newPassword.length < 6) {
      toast.error('Password must be at least 6 characters long');
      return;
    }

    setLoading(true);

    try {
      await userService.changePassword({
        currentPassword,
        newPassword,
      });
      toast.success('Password changed successfully!');
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (error: any) {

      const message = error.response?.data?.message || 'Failed to change password';
      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteAccountClick = () => {
    if (deleteConfirmation !== 'DELETE') {
      toast.error('Please type DELETE to confirm');
      return;
    }
    setIsDeleteModalOpen(true);
  };

  const confirmDeleteAccount = async () => {
    setLoading(true);

    try {
      await userService.deleteAccount();
      toast.success('Account deleted successfully');
      logout();
      navigate('/login');
    } catch (_error) {

      toast.error('Failed to delete account');
      setLoading(false);
    } finally {
      setIsDeleteModalOpen(false);
    }
  };

  const tabs = [
    { id: 'account' as TabType, label: 'Account', icon: User },
    { id: 'security' as TabType, label: 'Security', icon: Lock },
    { id: 'theme' as TabType, label: 'Theme', icon: Palette },
    { id: 'danger' as TabType, label: 'Danger Zone', icon: AlertTriangle },
  ];

  return (
    <div className="space-y-6 pb-8">
      {/* Hero Header */}
      <header className="relative overflow-hidden rounded-xl bg-gradient-to-br from-slate-700 to-slate-900 dark:from-slate-800 dark:to-slate-950 p-6 md:p-8 shadow-lg">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute -top-10 -right-10 w-40 h-40 bg-white rounded-full"></div>
          <div className="absolute -bottom-10 -left-10 w-40 h-40 bg-white rounded-full"></div>
        </div>
        
        <div className="relative z-10">
          <div className="flex items-center gap-2 mb-2">
            <SettingsIcon className="w-6 h-6 text-yellow-300" />
            <span className="text-yellow-300 font-semibold text-sm">Configuration</span>
          </div>
          <h1 className="text-3xl md:text-4xl font-bold text-white mb-2">
            Settings
          </h1>
          <p className="text-primary-100 dark:text-primary-200 text-lg">
            Manage your account settings and preferences
          </p>
        </div>
      </header>

      {/* Tabs */}
      <div className="border-b border-gray-200 dark:border-gray-700">
        <div className="flex gap-4 overflow-x-auto scrollbar-hide">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 px-4 py-3 border-b-2 transition-colors whitespace-nowrap ${
                  activeTab === tab.id
                    ? 'border-primary-600 text-primary-600 dark:text-primary-400 dark:border-primary-400'
                    : 'border-transparent text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200'
                }`}
              >
                <Icon className="w-4 h-4" />
                {tab.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Tab Content */}
      <div className="card dark:bg-gray-800">
        {/* Account Settings */}
        {activeTab === 'account' && (
          <div>
            <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">Account Information</h2>
            <form onSubmit={handleUpdateProfile} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Name
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Email
                </label>
                <input
                  type="email"
                  value={user?.email || ''}
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-gray-700/50 text-gray-500 dark:text-gray-400 cursor-not-allowed"
                  disabled
                />
                <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Email cannot be changed</p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  School Name (Optional)
                </label>
                <input
                  type="text"
                  value={schoolName}
                  onChange={(e) => setSchoolName(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Grade (Optional)
                </label>
                <input
                  type="text"
                  value={grade}
                  onChange={(e) => setGrade(e.target.value)}
                  placeholder="e.g., 10th Grade, Sophomore"
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="flex items-center gap-2 px-6 py-2 bg-primary-600 hover:bg-primary-700 disabled:bg-gray-300 text-white rounded-lg transition-colors"
              >
                <Save className="w-4 h-4" />
                {loading ? 'Saving...' : 'Save Changes'}
              </button>
            </form>
          </div>
        )}

        {/* Security Settings */}
        {activeTab === 'security' && (
          <div>
            <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">Change Password</h2>
            <form onSubmit={handleChangePassword} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Current Password
                </label>
                <input
                  type="password"
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  New Password
                </label>
                <input
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  required
                  minLength={6}
                />
                <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Minimum 6 characters</p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Confirm New Password
                </label>
                <input
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  required
                  minLength={6}
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="flex items-center gap-2 px-6 py-2 bg-primary-600 hover:bg-primary-700 disabled:bg-gray-300 text-white rounded-lg transition-colors"
              >
                <Lock className="w-4 h-4" />
                {loading ? 'Changing...' : 'Change Password'}
              </button>
            </form>
          </div>
        )}

        {/* Theme Settings */}
        {activeTab === 'theme' && (
          <div>
            <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">Theme Settings</h2>
            <form onSubmit={handleUpdatePreferences} className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Theme
                </label>
                <div className="flex gap-4">
                  {(['light', 'dark', 'system'] as const).map((themeOption) => (
                    <button
                      key={themeOption}
                      type="button"
                      onClick={() => setTheme(themeOption)}
                      className={`px-4 py-2 rounded-lg border-2 capitalize ${
                        theme === themeOption
                          ? 'border-primary-600 bg-primary-50 dark:bg-primary-900/30 text-primary-700 dark:text-primary-300'
                          : 'border-gray-200 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:border-gray-300 dark:hover:border-gray-500'
                      }`}
                    >
                      {themeOption}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Daily Study Goal (Minutes)
                </label>
                <input
                  type="number"
                  min="5"
                  max="180"
                  step="5"
                  value={preferences.studyGoalMinutes}
                  onChange={(e) =>
                    setPreferences({
                      ...preferences,
                      studyGoalMinutes: parseInt(e.target.value) || 0,
                    })
                  }
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="flex items-center gap-2 px-6 py-2 bg-primary-600 hover:bg-primary-700 disabled:bg-gray-300 text-white rounded-lg transition-colors"
              >
                <Save className="w-4 h-4" />
                {loading ? 'Saving...' : 'Save Preferences'}
              </button>
            </form>
          </div>
        )}

        {/* Danger Zone */}
        {activeTab === 'danger' && (
          <div>
            <h2 className="text-xl font-bold text-red-600 dark:text-red-500 mb-4">Danger Zone</h2>
            <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-6">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">Delete Account</h3>
              <p className="text-gray-700 dark:text-gray-300 mb-4">
                Once you delete your account, there is no going back. All your data, including
                quizzes, flashcards, and progress will be permanently deleted.
              </p>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Type <span className="font-bold">DELETE</span> to confirm
                  </label>
                  <input
                    type="text"
                    value={deleteConfirmation}
                    onChange={(e) => setDeleteConfirmation(e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
                    placeholder="DELETE"
                  />
                </div>

                <button
                  onClick={handleDeleteAccountClick}
                  disabled={loading || deleteConfirmation !== 'DELETE'}
                  className="px-6 py-2 bg-red-600 hover:bg-red-700 disabled:bg-gray-300 text-white rounded-lg transition-colors"
                >
                  {loading ? 'Deleting...' : 'Delete My Account'}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>


      <Modal
        isOpen={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        title="Delete Account"
        footer={
          <>
            <button
              onClick={() => setIsDeleteModalOpen(false)}
              className="px-4 py-2 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={confirmDeleteAccount}
              className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
            >
              {loading ? 'Deleting...' : 'Yes, Delete My Account'}
            </button>
          </>
        }
      >
        <p>Are you absolutely sure? This action cannot be undone.</p>
      </Modal>
    </div>
  );
};
