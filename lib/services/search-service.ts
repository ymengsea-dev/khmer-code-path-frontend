import { apiClient } from "../api-client";
import type { GlobalSearchResultDto } from "../types/search-api";

export const searchService = {
  async search(q: string): Promise<GlobalSearchResultDto[]> {
    if (q.trim().length < 2) return [];
    const response = await apiClient.get<{ data: GlobalSearchResultDto[] }>(
      "/search",
      { params: { q } }
    );
    return response.data.data ?? [];
  },
};
