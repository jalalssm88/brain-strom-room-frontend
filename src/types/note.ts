export interface Note {
  id: number;
  workspaceId: number;
  createdById: number;
  title: string;
  content: string;
  color: string;
  x: number;
  y: number;
  width: number;
  height: number;
  authorName: string;
  voteCount: number;
  commentCount: number;
  hasVoted: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CreateNotePayload {
  title: string;
  content?: string;
  color?: string;
  x?: number;
  y?: number;
  width?: number;
  height?: number;
}

export type UpdateNotePayload = Partial<CreateNotePayload>;
