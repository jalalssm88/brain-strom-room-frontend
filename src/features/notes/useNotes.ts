'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  createNoteRequest,
  deleteNoteRequest,
  listNotesRequest,
  updateNoteRequest,
} from '@/lib/notes';
import { CreateNotePayload, Note, UpdateNotePayload } from '@/types/note';

export function useNotes(workspaceId: number) {
  return useQuery({
    queryKey: ['workspaces', workspaceId, 'notes'],
    queryFn: () => listNotesRequest(workspaceId),
    enabled: workspaceId > 0,
  });
}

export function useCreateNote(workspaceId: number) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: CreateNotePayload) => createNoteRequest(workspaceId, payload),
    onSuccess: (note) => {
      queryClient.setQueryData<Note[]>(['workspaces', workspaceId, 'notes'], (prev) =>
        prev ? [...prev, note] : [note],
      );
    },
  });
}

export function useUpdateNote(workspaceId: number) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ noteId, payload }: { noteId: number; payload: UpdateNotePayload }) =>
      updateNoteRequest(workspaceId, noteId, payload),
    onMutate: async ({ noteId, payload }) => {
      await queryClient.cancelQueries({ queryKey: ['workspaces', workspaceId, 'notes'] });
      const previous = queryClient.getQueryData<Note[]>(['workspaces', workspaceId, 'notes']);

      queryClient.setQueryData<Note[]>(['workspaces', workspaceId, 'notes'], (prev) =>
        prev?.map((note) => (note.id === noteId ? { ...note, ...payload } : note)),
      );

      return { previous };
    },
    onError: (_err, _vars, context) => {
      if (context?.previous) {
        queryClient.setQueryData(['workspaces', workspaceId, 'notes'], context.previous);
      }
    },
    onSuccess: (note) => {
      queryClient.setQueryData<Note[]>(['workspaces', workspaceId, 'notes'], (prev) =>
        prev?.map((item) => (item.id === note.id ? note : item)),
      );
    },
  });
}

export function useDeleteNote(workspaceId: number) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (noteId: number) => deleteNoteRequest(workspaceId, noteId),
    onMutate: async (noteId) => {
      await queryClient.cancelQueries({ queryKey: ['workspaces', workspaceId, 'notes'] });
      const previous = queryClient.getQueryData<Note[]>(['workspaces', workspaceId, 'notes']);

      queryClient.setQueryData<Note[]>(['workspaces', workspaceId, 'notes'], (prev) =>
        prev?.filter((note) => note.id !== noteId),
      );

      return { previous };
    },
    onError: (_err, _noteId, context) => {
      if (context?.previous) {
        queryClient.setQueryData(['workspaces', workspaceId, 'notes'], context.previous);
      }
    },
  });
}
