import { useEffect, useState } from 'react';
import { X, AlertCircle, Mail } from 'lucide-react';
import { settingsService } from '../services/settingsService';

const DISMISSED_KEY = 'maintenance_dismissed';

export const MaintenanceOverlay = () => {
  const [isVisible, setIsVisible] = useState(false);
  const [settings, setSettings] = useState<any>(null);

  useEffect(() => {
    const checkMaintenanceMode = async () => {
      try {
        const publicSettings = await settingsService.getPublicSettings();
        setSettings(publicSettings);

        // Check if maintenance mode is active and not dismissed
        if (publicSettings.maintenanceMode) {
          const dismissed = localStorage.getItem(DISMISSED_KEY);
          if (!dismissed) {
            setIsVisible(true);
          }
        }
      } catch (error) {
        console.error('Failed to fetch settings:', error);
      }
    };

    checkMaintenanceMode();
  }, []);

  const handleDismiss = () => {
    localStorage.setItem(DISMISSED_KEY, 'true');
    setIsVisible(false);
  };

  if (!isVisible || !settings?.maintenanceMode) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="relative w-full max-w-md rounded-2xl bg-gradient-to-br from-blue-50 to-blue-100 p-8 shadow-2xl dark:from-blue-900/30 dark:to-blue-800/30 dark:bg-gray-900">
        {/* Close Button */}
        <button
          onClick={handleDismiss}
          className="absolute right-4 top-4 rounded-full p-2 text-blue-600 transition-colors hover:bg-blue-200 dark:text-blue-400 dark:hover:bg-blue-800/50"
          aria-label="Dismiss"
        >
          <X className="h-5 w-5" />
        </button>

        {/* Icon */}
        <div className="mb-4 flex justify-center">
          <div className="rounded-full bg-blue-600 p-4 shadow-lg">
            <AlertCircle className="h-12 w-12 text-white" />
          </div>
        </div>

        {/* Title */}
        <h2 className="mb-3 text-center text-2xl font-bold text-gray-900 dark:text-white">
          Maintenance Mode
        </h2>

        {/* Message */}
        <p className="mb-6 text-center text-gray-700 dark:text-gray-300">
          We're currently performing scheduled maintenance to improve your experience. 
          Some features may be temporarily unavailable.
        </p>

        {/* Support Email */}
        {settings.supportEmail && (
          <div className="mb-6 rounded-lg bg-white/50 p-4 dark:bg-gray-800/50">
            <div className="flex items-center justify-center gap-2 text-sm text-gray-700 dark:text-gray-300">
              <Mail className="h-4 w-4 text-blue-600 dark:text-blue-400" />
              <span>Need help?</span>
              <a
                href={`mailto:${settings.supportEmail}`}
                className="font-medium text-blue-600 hover:underline dark:text-blue-400"
              >
                {settings.supportEmail}
              </a>
            </div>
          </div>
        )}

        {/* Dismiss Button */}
        <button
          onClick={handleDismiss}
          className="w-full rounded-lg bg-blue-600 px-6 py-3 font-semibold text-white shadow-md transition-colors hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-600"
        >
          I Understand
        </button>

        <p className="mt-3 text-center text-xs text-gray-600 dark:text-gray-400">
          You can continue using the platform. This message won't appear again.
        </p>
      </div>
    </div>
  );
};
