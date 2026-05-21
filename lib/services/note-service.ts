import { apiClient } from "../api-client";
import type {
  NoteDto,
  NoteListDto,
  NoteShareDto,
  SaveNoteRequest,
  SharedNoteDto,
} from "../types/note-api";

export const noteService = {
  async list(search?: string): Promise<NoteListDto> {
    const response = await apiClient.get<{ data: NoteListDto }>("/notes", {
      params: search ? { search } : undefined,
    });
    return response.data.data;
  },

  async get(id: number): Promise<NoteDto> {
    const response = await apiClient.get<{ data: NoteDto }>(`/notes/${id}`);
    return response.data.data;
  },

  async getShared(token: string): Promise<SharedNoteDto> {
    const response = await apiClient.get<{ data: SharedNoteDto }>(
      `/notes/shared/${encodeURIComponent(token)}`
    );
    return response.data.data;
  },

  async create(request: SaveNoteRequest): Promise<NoteDto> {
    const response = await apiClient.post<{ data: NoteDto }>("/notes", request);
    return response.data.data;
  },

  async update(id: number, request: SaveNoteRequest): Promise<NoteDto> {
    const response = await apiClient.put<{ data: NoteDto }>(`/notes/${id}`, request);
    return response.data.data;
  },

  async delete(id: number): Promise<void> {
    await apiClient.delete(`/notes/${id}`);
  },

  async enableShare(id: number): Promise<NoteShareDto> {
    const response = await apiClient.post<{ data: NoteShareDto }>(`/notes/${id}/share`);
    return response.data.data;
  },
};
