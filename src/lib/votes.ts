import { apiClient } from './api';
import { ApiSuccessResponse } from '@/types/auth';
import { VotesSummary, VoteToggleResult } from '@/types/vote';

export async function listVotesRequest(
  workspaceId: number,
  noteId: number,
): Promise<VotesSummary> {
  const { data } = await apiClient.get<ApiSuccessResponse<VotesSummary>>(
    `/workspaces/${workspaceId}/notes/${noteId}/votes`,
  );
  return data.data;
}

export async function toggleVoteRequest(
  workspaceId: number,
  noteId: number,
): Promise<VoteToggleResult> {
  const { data } = await apiClient.post<ApiSuccessResponse<VoteToggleResult>>(
    `/workspaces/${workspaceId}/notes/${noteId}/votes`,
  );
  return data.data;
}
