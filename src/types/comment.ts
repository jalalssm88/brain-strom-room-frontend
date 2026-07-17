export interface Comment {
  id: number;
  noteId: number;
  userId: number;
  message: string;
  authorName: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateCommentPayload {
  message: string;
}

export interface UpdateCommentPayload {
  message: string;
}
