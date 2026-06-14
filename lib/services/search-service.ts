import { apiClient } from "../api-client";
import type { GlobalSearchResultDto, GlobalSearchScopeDto } from "../types/search-api";

export const searchService = {
  async getScopes(): Promise<GlobalSearchScopeDto[]> {
    const response = await apiClient.get<{ data: GlobalSearchScopeDto[] }>("/search/scopes");
    return response.data.data ?? [];
  },

  async search(q: string, scope?: string): Promise<GlobalSearchResultDto[]> {
    if (q.trim().length < 2) return [];
    const response = await apiClient.get<{ data: GlobalSearchResultDto[] }>(
      "/search",
      { params: { q, scope } }
    );
    return response.data.data ?? [];
  },
};
