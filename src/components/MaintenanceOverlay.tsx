import { useEffect, useState } from 'react';
import { X } from 'lucide-react';
import { settingsService } from '../services/settingsService';

const DISMISSED_KEY = 'maintenance_dismissed';

export const MaintenanceBanner = () => {
  const [isVisible, setIsVisible] = useState(false);
  const [settings, setSettings] = useState<any>(null);

  useEffect(() => {
    const checkMaintenanceMode = async () => {
      try {
        const publicSettings = await settingsService.getPublicSettings();
        setSettings(publicSettings);

        if (publicSettings.maintenanceMode) {
          const dismissed = localStorage.getItem(DISMISSED_KEY);
          if (!dismissed) {
            setIsVisible(true);
          }
        }
      } catch (error) {
        // Silently fail
      }
    };

    checkMaintenanceMode();
    
    // Poll every 30 minutes (settings rarely change, cache handles freshness)
    const interval = setInterval(checkMaintenanceMode, 30 * 60 * 1000);
    
    return () => clearInterval(interval);
  }, []);

  const handleDismiss = () => {
    localStorage.setItem(DISMISSED_KEY, 'true');
    setIsVisible(false);
  };

  if (!isVisible || !settings?.maintenanceMode) {
    return null;
  }

  const message = `⚠️ Maintenance Mode Active - We're performing scheduled maintenance. Some features may be temporarily unavailable.${settings.supportEmail ? ` • Need help? Contact: ${settings.supportEmail}` : ''}`;

  return (
    <div className="fixed top-0 left-0 right-0 z-50 bg-gradient-to-r from-blue-600/90 via-blue-700/90 to-blue-600/90 text-white shadow-md">
      <div className="relative flex items-center h-8 overflow-hidden">
        {/* Two messages - second follows first with closer spacing */}
        <div className="absolute inset-0 flex items-center">
          <div className="flex animate-continuous-scroll whitespace-nowrap text-xs font-medium">
            <span className="inline-block pr-32">{message}</span>
            <span className="inline-block pr-32">{message}</span>
          </div>
        </div>

        {/* Dismiss Button - Icon Only */}
        <div className="absolute right-0 top-0 bottom-0 flex items-center bg-gradient-to-l from-blue-600/90 via-blue-600/85 to-transparent pl-12 pr-2 pointer-events-none">
          <button
            onClick={handleDismiss}
            className="pointer-events-auto flex h-6 w-6 items-center justify-center rounded-full bg-white/20 backdrop-blur-sm transition-all hover:bg-white/30 hover:scale-110"
            aria-label="Dismiss maintenance notice"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>

      {/* Optimized continuous scrolling animation */}
      <style>{`
        @keyframes continuous-scroll {
          0% {
            transform: translate3d(0, 0, 0);
          }
          100% {
            transform: translate3d(-50%, 0, 0);
          }
        }
        .animate-continuous-scroll {
          animation: continuous-scroll 25s linear infinite;
          will-change: transform;
          backface-visibility: hidden;
          -webkit-font-smoothing: antialiased;
          transform: translateZ(0);
        }
        .animate-continuous-scroll:hover {
          animation-play-state: paused;
        }
      `}</style>
    </div>
  );
};
