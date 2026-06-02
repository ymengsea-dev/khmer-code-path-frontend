import { apiClient } from "../api-client";
import { getValidAccessToken } from "@/lib/auth/client-session";

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:8080/api/v1";

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

  /**
   * Streams the AI reply token-by-token via SSE.
   * Calls `onChunk` for each text token received.
   * Resolves when the `done` event arrives or the stream closes.
   */
  async streamMessage(
    conversationId: string,
    content: string,
    onChunk: (chunk: string) => void
  ): Promise<void> {
    const token = await getValidAccessToken();
    const response = await fetch(
      `${API_BASE_URL}/ai/conversations/${conversationId}/messages/stream`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({ content }),
      }
    );

    if (!response.ok) {
      throw new Error(`Stream failed: ${response.status}`);
    }

    const reader = response.body!.getReader();
    const decoder = new TextDecoder();
    let buffer = "";

    try {
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        // Normalise \r\n → \n so the parser works on both Windows and Unix line endings.
        buffer += decoder.decode(value, { stream: true }).replace(/\r\n/g, "\n");

        const lines = buffer.split("\n");
        // Keep the last (potentially incomplete) line in the buffer.
        buffer = lines.pop() ?? "";

        let isDone = false;
        for (const line of lines) {
          if (line.startsWith("event:") && line.includes("done")) {
            isDone = true;
            break;
          }
          if (line.startsWith("data:")) {
            // Per SSE spec, one optional space after "data:" is consumed as a
            // protocol separator — strip exactly one leading space if present.
            const raw = line.slice(5);
            const encoded = raw.startsWith(" ") ? raw.slice(1) : raw;
            if (!encoded) continue;
            try {
              // Backend JSON-encodes each chunk so spaces and newlines survive
              // the SSE wire format intact.
              const chunk: string = JSON.parse(encoded);
              if (chunk) onChunk(chunk);
            } catch {
              // Fallback for any unencoded frames (e.g. the done event data).
              onChunk(encoded);
            }
          }
        }
        if (isDone) return;
      }
    } finally {
      reader.releaseLock();
    }
  },

  async renameConversation(conversationId: string, title: string) {
    const response = await apiClient.patch<{ data: ConversationSummary }>(
      `/ai/conversations/${conversationId}`,
      { title }
    );
    return unwrap(response);
  },
};
