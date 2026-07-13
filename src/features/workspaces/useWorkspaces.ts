'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  listWorkspacesRequest,
  createWorkspaceRequest,
  updateWorkspaceRequest,
  deleteWorkspaceRequest,
  listWorkspaceMembersRequest,
  inviteMemberRequest,
  removeMemberRequest,
} from '@/lib/workspaces';
import { respondInvitationRequest } from '@/lib/invitations';
import { WorkspaceTab } from '@/types/workspace';

export function useWorkspaces(tab: WorkspaceTab = 'owned') {
  return useQuery({
    queryKey: ['workspaces', tab],
    queryFn: () => listWorkspacesRequest(tab),
  });
}

export function useCreateWorkspace() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: createWorkspaceRequest,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['workspaces'] });
    },
  });
}

export function useUpdateWorkspace() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, name }: { id: number; name: string }) =>
      updateWorkspaceRequest(id, { name }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['workspaces'] });
    },
  });
}

export function useDeleteWorkspace() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: deleteWorkspaceRequest,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['workspaces'] });
    },
  });
}

export function useWorkspaceMembers(workspaceId: number) {
  return useQuery({
    queryKey: ['workspaces', workspaceId, 'members'],
    queryFn: () => listWorkspaceMembersRequest(workspaceId),
    enabled: workspaceId > 0,
  });
}

export function useInviteMember() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      workspaceId,
      email,
      role,
    }: {
      workspaceId: number;
      email: string;
      role: 'EDITOR' | 'VIEWER';
    }) => inviteMemberRequest(workspaceId, { email, role }),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['workspaces', variables.workspaceId, 'members'] });
    },
  });
}

export function useRemoveMember() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ workspaceId, userId }: { workspaceId: number; userId: number }) =>
      removeMemberRequest(workspaceId, userId),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['workspaces', variables.workspaceId, 'members'] });
    },
  });
}

export function useRespondInvitation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: respondInvitationRequest,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['workspaces'] });
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
    },
  });
}
