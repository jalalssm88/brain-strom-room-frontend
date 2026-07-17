'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  createCommentRequest,
  deleteCommentRequest,
  listCommentsRequest,
  updateCommentRequest,
} from '@/lib/comments';
import { Comment, CreateCommentPayload, UpdateCommentPayload } from '@/types/comment';
import { Note } from '@/types/note';

function commentsKey(workspaceId: number, noteId: number) {
  return ['workspaces', workspaceId, 'notes', noteId, 'comments'] as const;
}

function notesKey(workspaceId: number) {
  return ['workspaces', workspaceId, 'notes'] as const;
}

export function useComments(workspaceId: number, noteId: number | null) {
  return useQuery({
    queryKey: commentsKey(workspaceId, noteId ?? 0),
    queryFn: () => listCommentsRequest(workspaceId, noteId!),
    enabled: workspaceId > 0 && noteId !== null && noteId > 0,
  });
}

export function useCreateComment(workspaceId: number, noteId: number) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: CreateCommentPayload) =>
      createCommentRequest(workspaceId, noteId, payload),
    onSuccess: (comment) => {
      queryClient.setQueryData<Comment[]>(commentsKey(workspaceId, noteId), (prev) =>
        prev ? [...prev, comment] : [comment],
      );
      queryClient.setQueryData<Note[]>(notesKey(workspaceId), (prev) =>
        prev?.map((note) =>
          note.id === noteId ? { ...note, commentCount: (note.commentCount ?? 0) + 1 } : note,
        ),
      );
    },
  });
}

export function useUpdateComment(workspaceId: number, noteId: number) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      commentId,
      payload,
    }: {
      commentId: number;
      payload: UpdateCommentPayload;
    }) => updateCommentRequest(workspaceId, noteId, commentId, payload),
    onSuccess: (comment) => {
      queryClient.setQueryData<Comment[]>(commentsKey(workspaceId, noteId), (prev) =>
        prev?.map((item) => (item.id === comment.id ? comment : item)),
      );
    },
  });
}

export function useDeleteComment(workspaceId: number, noteId: number) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (commentId: number) => deleteCommentRequest(workspaceId, noteId, commentId),
    onSuccess: (_data, commentId) => {
      queryClient.setQueryData<Comment[]>(commentsKey(workspaceId, noteId), (prev) =>
        prev?.filter((item) => item.id !== commentId),
      );
      queryClient.setQueryData<Note[]>(notesKey(workspaceId), (prev) =>
        prev?.map((note) =>
          note.id === noteId
            ? { ...note, commentCount: Math.max(0, (note.commentCount ?? 0) - 1) }
            : note,
        ),
      );
    },
  });
}
