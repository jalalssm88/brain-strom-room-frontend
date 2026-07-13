import { apiClient } from './api';
import { ApiSuccessResponse } from '@/types/auth';
import { Workspace, WorkspaceMember, WorkspaceTab } from '@/types/workspace';

export async function listWorkspacesRequest(tab: WorkspaceTab = 'owned'): Promise<Workspace[]> {
  const { data } = await apiClient.get<ApiSuccessResponse<{ workspaces: Workspace[] }>>(
    '/workspaces',
    { params: { tab } },
  );
  return data.data.workspaces;
}

export async function createWorkspaceRequest(payload: {
  name: string;
  description?: string;
}): Promise<Workspace> {
  const { data } = await apiClient.post<ApiSuccessResponse<{ workspace: Workspace }>>(
    '/workspaces',
    payload,
  );
  return data.data.workspace;
}

export async function updateWorkspaceRequest(
  id: number,
  payload: { name: string },
): Promise<Workspace> {
  const { data } = await apiClient.patch<ApiSuccessResponse<{ workspace: Workspace }>>(
    `/workspaces/${id}`,
    payload,
  );
  return data.data.workspace;
}

export async function deleteWorkspaceRequest(id: number): Promise<void> {
  await apiClient.delete(`/workspaces/${id}`);
}

export async function listWorkspaceMembersRequest(id: number): Promise<WorkspaceMember[]> {
  const { data } = await apiClient.get<ApiSuccessResponse<{ members: WorkspaceMember[] }>>(
    `/workspaces/${id}/members`,
  );
  return data.data.members;
}

export async function inviteMemberRequest(
  workspaceId: number,
  payload: { email: string; role: 'EDITOR' | 'VIEWER' },
): Promise<void> {
  await apiClient.post(`/workspaces/${workspaceId}/invite`, payload);
}

export async function removeMemberRequest(workspaceId: number, userId: number): Promise<void> {
  await apiClient.delete(`/workspaces/${workspaceId}/members/${userId}`);
}
