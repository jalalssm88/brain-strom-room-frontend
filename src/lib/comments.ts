import { apiClient } from './api';
import { ApiSuccessResponse } from '@/types/auth';
import { Comment, CreateCommentPayload, UpdateCommentPayload } from '@/types/comment';

export async function listCommentsRequest(
  workspaceId: number,
  noteId: number,
): Promise<Comment[]> {
  const { data } = await apiClient.get<ApiSuccessResponse<{ comments: Comment[] }>>(
    `/workspaces/${workspaceId}/notes/${noteId}/comments`,
  );
  return data.data.comments;
}

export async function createCommentRequest(
  workspaceId: number,
  noteId: number,
  payload: CreateCommentPayload,
): Promise<Comment> {
  const { data } = await apiClient.post<ApiSuccessResponse<{ comment: Comment }>>(
    `/workspaces/${workspaceId}/notes/${noteId}/comments`,
    payload,
  );
  return data.data.comment;
}

export async function updateCommentRequest(
  workspaceId: number,
  noteId: number,
  commentId: number,
  payload: UpdateCommentPayload,
): Promise<Comment> {
  const { data } = await apiClient.patch<ApiSuccessResponse<{ comment: Comment }>>(
    `/workspaces/${workspaceId}/notes/${noteId}/comments/${commentId}`,
    payload,
  );
  return data.data.comment;
}

export async function deleteCommentRequest(
  workspaceId: number,
  noteId: number,
  commentId: number,
): Promise<void> {
  await apiClient.delete(`/workspaces/${workspaceId}/notes/${noteId}/comments/${commentId}`);
}
