import { apiClient } from './api';
import { ApiSuccessResponse } from '@/types/auth';
import { Workspace } from '@/types/workspace';

export async function acceptInvitationByTokenRequest(token: string): Promise<Workspace> {
  const { data } = await apiClient.post<ApiSuccessResponse<{ workspace: Workspace; message: string }>>(
    `/invitations/${token}/accept`,
  );
  return data.data.workspace;
}

export async function declineInvitationByTokenRequest(token: string): Promise<void> {
  await apiClient.post(`/invitations/${token}/decline`);
}

export async function respondInvitationRequest(payload: {
  invitationId: number;
  action: 'accept' | 'decline';
}): Promise<Workspace | null> {
  const { data } = await apiClient.post<
    ApiSuccessResponse<{ workspace?: Workspace; message: string }>
  >('/invitations/respond', payload);
  return data.data.workspace ?? null;
}
