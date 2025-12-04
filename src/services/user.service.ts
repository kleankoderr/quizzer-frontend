import { apiClient } from "./api";
import { USER_ENDPOINTS } from "../config/api";
import type {
  UserProfile,
  UpdateProfileRequest,
  UpdateSettingsRequest,
  ChangePasswordRequest,
} from "../types";

export const userService = {
  getProfile: async (): Promise<UserProfile> => {
    const response = await apiClient.get<UserProfile>(
      USER_ENDPOINTS.GET_PROFILE,
    );
    return response.data;
  },

  updateProfile: async (data: UpdateProfileRequest): Promise<UserProfile> => {
    const response = await apiClient.put<UserProfile>(
      USER_ENDPOINTS.UPDATE_PROFILE,
      data,
    );
    return response.data;
  },

  updateSettings: async (data: UpdateSettingsRequest): Promise<UserProfile> => {
    const response = await apiClient.put<UserProfile>(
      USER_ENDPOINTS.UPDATE_SETTINGS,
      data,
    );
    return response.data;
  },

  changePassword: async (
    data: ChangePasswordRequest,
  ): Promise<{ message: string }> => {
    const response = await apiClient.put<{ message: string }>(
      USER_ENDPOINTS.CHANGE_PASSWORD,
      data,
    );
    return response.data;
  },

  deleteAccount: async (): Promise<{ message: string }> => {
    const response = await apiClient.delete<{ message: string }>(
      USER_ENDPOINTS.DELETE_ACCOUNT,
    );
    return response.data;
  },
};
