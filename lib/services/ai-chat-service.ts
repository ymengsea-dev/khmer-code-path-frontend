import { apiClient } from "../api-client";

export const aiChatService = {
  async chat(message: string): Promise<string> {
    const response = await apiClient.get<{ data: string }>("/ai/chat", {
      params: { message },
    });
    return response.data?.data ?? "";
  },
};
