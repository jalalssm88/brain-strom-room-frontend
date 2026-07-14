import { apiClient } from './api';
import { ApiSuccessResponse } from '@/types/auth';
import { CreateNotePayload, Note, UpdateNotePayload } from '@/types/note';

export async function listNotesRequest(workspaceId: number): Promise<Note[]> {
  const { data } = await apiClient.get<ApiSuccessResponse<{ notes: Note[] }>>(
    `/workspaces/${workspaceId}/notes`,
  );
  return data.data.notes;
}

export async function createNoteRequest(
  workspaceId: number,
  payload: CreateNotePayload,
): Promise<Note> {
  const { data } = await apiClient.post<ApiSuccessResponse<{ note: Note }>>(
    `/workspaces/${workspaceId}/notes`,
    payload,
  );
  return data.data.note;
}

export async function updateNoteRequest(
  workspaceId: number,
  noteId: number,
  payload: UpdateNotePayload,
): Promise<Note> {
  const { data } = await apiClient.patch<ApiSuccessResponse<{ note: Note }>>(
    `/workspaces/${workspaceId}/notes/${noteId}`,
    payload,
  );
  return data.data.note;
}

export async function deleteNoteRequest(workspaceId: number, noteId: number): Promise<void> {
  await apiClient.delete(`/workspaces/${workspaceId}/notes/${noteId}`);
}
