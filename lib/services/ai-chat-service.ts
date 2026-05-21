import { apiClient } from "../api-client";

export type AiSectionType =
  | "GENERAL"
  | "LESSON"
  | "CLASS"
  | "CODE"
  | "NOTEBOOK";

export type ChatMessageRole = "USER" | "ASSISTANT";

export interface ConversationSummary {
  id: string;
  sectionType: AiSectionType;
  sectionRef: string | null;
  title: string;
  preview: string;
  messageCount: number;
  createdAt: string;
  updatedAt: string;
}

export interface ChatMessageDto {
  id: number;
  conversationId: string;
  role: ChatMessageRole;
  content: string;
  createdAt: string;
}

export interface ChatReplyDto {
  conversationId: string;
  userMessage: ChatMessageDto;
  assistantMessage: ChatMessageDto;
  messages: ChatMessageDto[];
}

function unwrap<T>(response: { data?: { data?: T } }): T {
  const data = response.data?.data;
  if (data === undefined) {
    throw new Error("Empty API response");
  }
  return data;
}

export const aiChatService = {
  async listConversations(sectionType?: AiSectionType, sectionRef?: string) {
    const response = await apiClient.get<{ data: ConversationSummary[] }>(
      "/ai/conversations",
      { params: { sectionType, sectionRef } }
    );
    return unwrap(response);
  },

  async createConversation(params?: {
    sectionType?: AiSectionType;
    sectionRef?: string;
    title?: string;
  }) {
    const response = await apiClient.post<{ data: ConversationSummary }>(
      "/ai/conversations",
      {
        sectionType: params?.sectionType ?? "GENERAL",
        sectionRef: params?.sectionRef,
        title: params?.title,
      }
    );
    return unwrap(response);
  },

  async listMessages(conversationId: string) {
    const response = await apiClient.get<{ data: ChatMessageDto[] }>(
      `/ai/conversations/${conversationId}/messages`
    );
    return unwrap(response);
  },

  async sendMessage(conversationId: string, content: string) {
    const response = await apiClient.post<{ data: ChatReplyDto }>(
      `/ai/conversations/${conversationId}/messages`,
      { content }
    );
    return unwrap(response);
  },

  async clearMessages(conversationId: string) {
    await apiClient.delete(`/ai/conversations/${conversationId}/messages`);
  },

  async deleteConversation(conversationId: string) {
    await apiClient.delete(`/ai/conversations/${conversationId}`);
  },
};
