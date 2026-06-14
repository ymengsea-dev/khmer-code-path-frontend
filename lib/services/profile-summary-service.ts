import { apiClient } from "../api-client";
import type { MyLearningDto, ProfileSummaryDto } from "../types/profile-summary-api";

export const profileSummaryService = {
  async getMyLearning(): Promise<MyLearningDto> {
    const response = await apiClient.get<{ data: MyLearningDto }>("/learning/me");
    return response.data.data;
  },

  async getProfileSummary(): Promise<ProfileSummaryDto> {
    const response = await apiClient.get<{ data: ProfileSummaryDto }>("/profile/summary");
    return response.data.data;
  },
};
