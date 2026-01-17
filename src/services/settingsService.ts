import { apiClient } from './api';

// Cache configuration
const CACHE_KEY = 'public_settings_cache';
const CACHE_DURATION = 60 * 60 * 1000; // 1 hour (fresh)
const STALE_DURATION = 24 * 60 * 60 * 1000; // 24 hours (serve stale while revalidating)

interface CachedSettings {
  data: any;
  timestamp: number;
}

let inFlightRequest: Promise<any> | null = null;

export const settingsService = {
  getPublicSettings: async () => {
    const now = Date.now();

    // Check cache first
    const cached = localStorage.getItem(CACHE_KEY);
    if (cached) {
      try {
        const { data, timestamp }: CachedSettings = JSON.parse(cached);
        const age = now - timestamp;

        // If cache is fresh, return immediately
        if (age < CACHE_DURATION) {
          return data;
        }

        // If cache is stale but not too old, return it and revalidate in background
        if (age < STALE_DURATION) {
          // Return stale data immediately
          setTimeout(() => {
            // Revalidate in background (don't await)
            settingsService.revalidatePublicSettings().catch(() => {});
          }, 0);
          return data;
        }
      } catch (_error) {
        // Invalid cache, continue to fetch
      }
    }

    // No cache or cache too old - fetch fresh data
    return settingsService.revalidatePublicSettings();
  },

  // Internal method to fetch and cache
  revalidatePublicSettings: async () => {
    // Prevent duplicate requests
    if (inFlightRequest) {
      return inFlightRequest;
    }

    inFlightRequest = (async () => {
      try {
        const response = await apiClient.get('/platform-settings/public');
        const data = response.data;

        // Cache the response
        const cacheData: CachedSettings = {
          data,
          timestamp: Date.now(),
        };
        localStorage.setItem(CACHE_KEY, JSON.stringify(cacheData));

        return data;
      } finally {
        inFlightRequest = null;
      }
    })();

    return inFlightRequest;
  },

  // Clear cache (call this when settings are updated)
  clearPublicSettingsCache: () => {
    localStorage.removeItem(CACHE_KEY);
  },

  getSettings: async () => {
    const response = await apiClient.get('/platform-settings');
    return response.data;
  },

  updateSettings: async (data: {
    allowRegistration?: boolean;
    maintenanceMode?: boolean;
    supportEmail?: string;
  }) => {
    const response = await apiClient.patch('/platform-settings', data);
    // Clear cache when settings are updated
    settingsService.clearPublicSettingsCache();
    return response.data;
  },
};
