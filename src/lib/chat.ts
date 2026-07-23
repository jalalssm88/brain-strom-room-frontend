import { apiClient } from './api';
import { ApiSuccessResponse } from '@/types/auth';
import { ChatHistoryResponse } from '@/types/chat';

export async function listChatMessagesRequest(
  workspaceId: number,
  params?: { cursor?: number; limit?: number },
): Promise<ChatHistoryResponse> {
  const { data } = await apiClient.get<ApiSuccessResponse<ChatHistoryResponse>>(
    `/workspaces/${workspaceId}/messages`,
    {
      params: {
        ...(params?.cursor ? { cursor: params.cursor } : {}),
        ...(params?.limit ? { limit: params.limit } : {}),
      },
    },
  );
  return data.data;
}
