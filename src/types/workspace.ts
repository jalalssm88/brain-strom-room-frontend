export type WorkspaceTab = 'owned' | 'shared' | 'pending';

export type MemberRole = 'ADMIN' | 'EDITOR' | 'VIEWER';

export interface Workspace {
  id: number;
  name: string;
  description: string | null;
  ownerId: number;
  role: MemberRole;
  memberCount: number;
  createdAt: string;
  updatedAt: string;
  invitationId?: number;
  invitedBy?: string;
  expiresAt?: string;
}

export interface WorkspaceMember {
  id: number;
  userId: number;
  fullName: string;
  email: string;
  avatar: string | null;
  role: MemberRole;
  joinedAt: string;
}
