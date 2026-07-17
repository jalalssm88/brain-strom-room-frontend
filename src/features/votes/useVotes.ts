'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { listVotesRequest, toggleVoteRequest } from '@/lib/votes';
import { Note } from '@/types/note';

function notesKey(workspaceId: number) {
  return ['workspaces', workspaceId, 'notes'] as const;
}

function votesKey(workspaceId: number, noteId: number) {
  return ['workspaces', workspaceId, 'notes', noteId, 'votes'] as const;
}

export function useNoteVotes(workspaceId: number, noteId: number, enabled: boolean) {
  return useQuery({
    queryKey: votesKey(workspaceId, noteId),
    queryFn: () => listVotesRequest(workspaceId, noteId),
    enabled: enabled && workspaceId > 0 && noteId > 0,
    staleTime: 30_000,
  });
}

export function useToggleVote(workspaceId: number) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (noteId: number) => toggleVoteRequest(workspaceId, noteId),
    onMutate: async (noteId) => {
      await queryClient.cancelQueries({ queryKey: notesKey(workspaceId) });
      const previous = queryClient.getQueryData<Note[]>(notesKey(workspaceId));

      queryClient.setQueryData<Note[]>(notesKey(workspaceId), (prev) =>
        prev?.map((note) => {
          if (note.id !== noteId) return note;
          const hasVoted = Boolean(note.hasVoted);
          return {
            ...note,
            hasVoted: !hasVoted,
            voteCount: Math.max(0, (note.voteCount ?? 0) + (hasVoted ? -1 : 1)),
          };
        }),
      );

      return { previous };
    },
    onError: (_err, _noteId, context) => {
      if (context?.previous) {
        queryClient.setQueryData(notesKey(workspaceId), context.previous);
      }
    },
    onSuccess: (result, noteId) => {
      queryClient.setQueryData<Note[]>(notesKey(workspaceId), (prev) =>
        prev?.map((note) =>
          note.id === noteId
            ? { ...note, hasVoted: result.voted, voteCount: result.count }
            : note,
        ),
      );
      void queryClient.invalidateQueries({ queryKey: votesKey(workspaceId, noteId) });
    },
  });
}
