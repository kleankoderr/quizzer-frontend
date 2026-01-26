import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Save } from 'lucide-react';
import { adminService } from '../../services';
import { Toast as toast } from '../../utils/toast';
import React, { useState, useEffect } from 'react';
import { CardSkeleton } from '../../components/skeletons';

interface PlatformSettingsState {
  allowRegistration: boolean;
  maintenanceMode: boolean;
  supportEmail: string;
}

export const PlatformSettings = () => {
  const queryClient = useQueryClient();
  const [formData, setFormData] = useState<PlatformSettingsState>({
    allowRegistration: true,
    maintenanceMode: false,
    supportEmail: '',
  });

  const { data: settings, isLoading: isSettingsLoading } = useQuery({
    queryKey: ['platformSettings'],
    queryFn: adminService.getSettings,
  });

  useEffect(() => {
    if (settings) {
      setFormData({
        allowRegistration: settings.allowRegistration,
        maintenanceMode: settings.maintenanceMode,
        supportEmail: settings.supportEmail || '',
      });
    }
  }, [settings]);

  const [isSuccess, setIsSuccess] = useState(false);

  const updateMutation = useMutation({
    mutationFn: adminService.updateSettings,
    onSuccess: async (settingsFromApi) => {
      queryClient.setQueryData(['platformSettings'], settingsFromApi);
      await queryClient.invalidateQueries({ queryKey: ['platformSettings'] });

      toast.success('Settings updated successfully');
      setIsSuccess(true);
      setTimeout(() => setIsSuccess(false), 2000);
    },
    onError: (error: any) => {
      toast.error(
        error?.response?.data?.message || 'Failed to update settings'
      );
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    updateMutation.mutate(formData);
  };

  if (isSettingsLoading) {
    return (
      <div className="space-y-6 p-4 sm:p-6">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            Platform Settings
          </h1>
        </div>
        <CardSkeleton count={1} />
      </div>
    );
  }

  return (
    <div className="space-y-6 p-4 sm:p-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
          Platform Settings
        </h1>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm dark:border-gray-800 dark:bg-gray-900">
          <h2 className="mb-4 text-lg font-semibold text-gray-900 dark:text-white">
            General Settings
          </h2>

          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <label
                  htmlFor="allow-registration"
                  className="block text-sm font-medium text-gray-700 dark:text-gray-300"
                >
                  Allow Registration
                </label>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  Allow new users to register on the platform
                </p>
              </div>
              <label
                htmlFor="allow-registration"
                className="relative inline-flex items-center cursor-pointer"
              >
                <input
                  id="allow-registration"
                  type="checkbox"
                  checked={formData.allowRegistration}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      allowRegistration: e.target.checked,
                    })
                  }
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary-300 dark:peer-focus:ring-primary-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-primary-600"></div>
                <span className="sr-only">Toggle Registration</span>
              </label>
            </div>

            <div className="flex items-center justify-between">
              <div>
                <label
                  htmlFor="maintenance-mode"
                  className="block text-sm font-medium text-gray-700 dark:text-gray-300"
                >
                  Maintenance Mode
                </label>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  Put the platform in maintenance mode
                </p>
              </div>
              <label
                htmlFor="maintenance-mode"
                className="relative inline-flex items-center cursor-pointer"
              >
                <input
                  id="maintenance-mode"
                  type="checkbox"
                  checked={formData.maintenanceMode}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      maintenanceMode: e.target.checked,
                    })
                  }
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary-300 dark:peer-focus:ring-primary-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-primary-600"></div>
                <span className="sr-only">Toggle Maintenance Mode</span>
              </label>
            </div>

            <div>
              <label
                htmlFor="support-email"
                className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
              >
                Support Email
              </label>
              <input
                id="support-email"
                type="email"
                value={formData.supportEmail}
                onChange={(e) =>
                  setFormData({ ...formData, supportEmail: e.target.value })
                }
                className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm focus:border-primary-500 focus:outline-none dark:border-gray-700 dark:bg-gray-800 dark:text-white"
                placeholder="support@example.com"
              />
            </div>
          </div>
        </div>

        <div className="flex justify-end">
          <button
            type="submit"
            disabled={updateMutation.isPending}
            className={`flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium text-white transition-all ${
              isSuccess
                ? 'bg-green-600 hover:bg-green-700'
                : 'bg-primary-600 hover:bg-primary-700'
            } disabled:opacity-50`}
          >
            {isSuccess ? (
              <>
                <Save className="h-4 w-4" />
                Saved!
              </>
            ) : (
              <>
                <Save className="h-4 w-4" />
                {updateMutation.isPending ? 'Saving...' : 'Save Settings'}
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
};
