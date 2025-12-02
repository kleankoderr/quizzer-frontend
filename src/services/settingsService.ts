import { apiClient } from "./api";

export const settingsService = {
  getPublicSettings: async () => {
    const response = await apiClient.get("/settings/public");
    return response.data;
  },

  getSettings: async () => {
    const response = await apiClient.get("/settings");
    return response.data;
  },

  updateSettings: async (data: {
    allowRegistration?: boolean;
    maintenanceMode?: boolean;
    supportEmail?: string;
  }) => {
    const response = await apiClient.patch("/settings", data);
    return response.data;
  },
};
