import { apiClient } from "./api";
import { COACHING_ENDPOINTS } from "../config/api";

export interface CoachingTip {
  type: "motivation" | "improvement" | "challenge" | "general";
  message: string;
  action?: string;
  topic?: string;
  icon?: string;
}

export const coachingService = {
  getTips: async (): Promise<CoachingTip[]> => {
    const response = await apiClient.get<CoachingTip[]>(
      COACHING_ENDPOINTS.GET_TIPS,
    );
    return response.data;
  },
};
