import { apiClient } from "../api-client";
import type {
  NotificationDto,
  NotificationListDto,
  UnreadCountDto,
} from "../types/notification-api";

export const notificationService = {
  async list(
    filter: "all" | "unread" | "read" = "all",
    limit = 50,
    offset = 0
  ): Promise<NotificationListDto> {
    const response = await apiClient.get<{ data: NotificationListDto }>(
      "/notifications",
      { params: { filter, limit, offset } }
    );
    return response.data.data;
  },

  async unreadCount(): Promise<number> {
    const response = await apiClient.get<{ data: UnreadCountDto }>(
      "/notifications/unread-count"
    );
    return response.data.data.count;
  },

  async markRead(id: number): Promise<NotificationDto> {
    const response = await apiClient.patch<{ data: NotificationDto }>(
      `/notifications/${id}/read`
    );
    return response.data.data;
  },

  async markAllRead(): Promise<void> {
    await apiClient.patch("/notifications/read-all");
  },

  async delete(id: number): Promise<void> {
    await apiClient.delete(`/notifications/${id}`);
  },
};
