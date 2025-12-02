import api from "./api";

export const settingsService = {
  getPublicSettings: async () => {
    const response = await api.get("/settings/public");
    return response.data;
  },

  getSettings: async () => {
    const response = await api.get("/settings");
    return response.data;
  },

  updateSettings: async (data: {
    allowRegistration?: boolean;
    maintenanceMode?: boolean;
    supportEmail?: string;
  }) => {
    const response = await api.patch("/settings", data);
    return response.data;
  },
};
