'use client';

import { useCallback, useEffect, useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { connectSocket } from '@/lib/socket';
import {
  SOCKET_BROADCAST_EVENTS,
  SOCKET_EVENTS,
  PresenceUser,
  RemoteNoteSelection,
} from '@/lib/socketEvents';
import { Note } from '@/types/note';
import { Comment } from '@/types/comment';
import { getAccessToken } from '@/lib/tokenStorage';

function notesKey(workspaceId: number) {
  return ['workspaces', workspaceId, 'notes'] as const;
}

function commentsKey(workspaceId: number, noteId: number) {
  return ['workspaces', workspaceId, 'notes', noteId, 'comments'] as const;
}

function votesKey(workspaceId: number, noteId: number) {
  return ['workspaces', workspaceId, 'notes', noteId, 'votes'] as const;
}

/**
 * Joins a workspace Socket.IO room and syncs notes/comments/votes/presence
 * into React Query caches for live collaboration.
 */
export function useWorkspaceRealtime(workspaceId: number, currentUserId: number) {
  const queryClient = useQueryClient();
  const [presence, setPresence] = useState<PresenceUser[]>([]);
  const [remoteSelections, setRemoteSelections] = useState<RemoteNoteSelection[]>([]);
  const [connected, setConnected] = useState(false);

  const publishSelection = useCallback(
    (noteId: number | null) => {
      if (workspaceId <= 0 || !getAccessToken()) return;
      const socket = connectSocket();
      socket.emit(SOCKET_EVENTS.SELECTION_UPDATE, { workspaceId, noteId });
    },
    [workspaceId],
  );

  useEffect(() => {
    if (workspaceId <= 0 || !getAccessToken()) return;

    const socket = connectSocket();

    const onConnect = () => {
      setConnected(true);
      socket.emit(
        SOCKET_EVENTS.WORKSPACE_JOIN,
        { workspaceId },
        (response: {
          success?: boolean;
          data?: { users?: PresenceUser[]; selections?: RemoteNoteSelection[] };
        }) => {
          if (!response?.success || !response.data) return;
          if (response.data.users) setPresence(response.data.users);
          if (response.data.selections) {
            setRemoteSelections(
              response.data.selections.filter((item) => item.userId !== currentUserId),
            );
          }
        },
      );
    };

    const onDisconnect = () => setConnected(false);

    const onPresence = (payload: { workspaceId: number; users: PresenceUser[] }) => {
      if (payload.workspaceId === workspaceId) {
        setPresence(payload.users ?? []);
      }
    };

    const onSelectionUpdate = (payload: {
      workspaceId: number;
      userId: number;
      fullName?: string;
      noteId: number | null;
      color?: string;
    }) => {
      if (payload.workspaceId !== workspaceId) return;
      if (payload.userId === currentUserId) return;

      setRemoteSelections((prev) => {
        const withoutUser = prev.filter((item) => item.userId !== payload.userId);
        if (payload.noteId == null || !payload.fullName || !payload.color) {
          return withoutUser;
        }
        return [
          ...withoutUser,
          {
            userId: payload.userId,
            fullName: payload.fullName,
            noteId: payload.noteId,
            color: payload.color,
          },
        ];
      });
    };

    const onNoteCreated = (payload: { note: Note }) => {
      const note = payload.note;
      if (!note || note.workspaceId !== workspaceId) return;

      queryClient.setQueryData<Note[]>(notesKey(workspaceId), (prev) => {
        if (!prev) return [{ ...note, hasVoted: false }];
        if (prev.some((item) => item.id === note.id)) {
          return prev.map((item) =>
            item.id === note.id ? { ...note, hasVoted: item.hasVoted } : item,
          );
        }
        return [...prev, { ...note, hasVoted: false }];
      });
    };

    const onNoteUpdated = (payload: { note: Note }) => {
      const note = payload.note;
      if (!note || note.workspaceId !== workspaceId) return;

      queryClient.setQueryData<Note[]>(notesKey(workspaceId), (prev) =>
        prev?.map((item) =>
          item.id === note.id
            ? {
                ...note,
                hasVoted: item.hasVoted,
                voteCount: note.voteCount ?? item.voteCount,
                commentCount: note.commentCount ?? item.commentCount,
              }
            : item,
        ),
      );
    };

    const onNoteDeleted = (payload: { workspaceId: number; noteId: number }) => {
      if (payload.workspaceId !== workspaceId) return;
      queryClient.setQueryData<Note[]>(notesKey(workspaceId), (prev) =>
        prev?.filter((note) => note.id !== payload.noteId),
      );
      setRemoteSelections((prev) => prev.filter((item) => item.noteId !== payload.noteId));
    };

    const onCommentCreated = (payload: { comment: Comment }) => {
      const comment = payload.comment;
      if (!comment) return;

      let shouldBump = false;
      queryClient.setQueryData<Comment[]>(
        commentsKey(workspaceId, comment.noteId),
        (prev) => {
          if (!prev) {
            shouldBump = true;
            return [comment];
          }
          if (prev.some((item) => item.id === comment.id)) return prev;
          shouldBump = true;
          return [...prev, comment];
        },
      );

      if (shouldBump) {
        queryClient.setQueryData<Note[]>(notesKey(workspaceId), (prev) =>
          prev?.map((note) =>
            note.id === comment.noteId
              ? { ...note, commentCount: (note.commentCount ?? 0) + 1 }
              : note,
          ),
        );
      }
    };

    const onCommentUpdated = (payload: { comment: Comment }) => {
      const comment = payload.comment;
      if (!comment) return;

      queryClient.setQueryData<Comment[]>(
        commentsKey(workspaceId, comment.noteId),
        (prev) => prev?.map((item) => (item.id === comment.id ? comment : item)),
      );
    };

    const onCommentDeleted = (payload: {
      workspaceId: number;
      noteId: number;
      commentId: number;
    }) => {
      if (payload.workspaceId !== workspaceId) return;

      let shouldDrop = false;
      queryClient.setQueryData<Comment[]>(
        commentsKey(workspaceId, payload.noteId),
        (prev) => {
          if (!prev) {
            shouldDrop = true;
            return prev;
          }
          if (!prev.some((item) => item.id === payload.commentId)) return prev;
          shouldDrop = true;
          return prev.filter((item) => item.id !== payload.commentId);
        },
      );

      if (shouldDrop) {
        queryClient.setQueryData<Note[]>(notesKey(workspaceId), (prev) =>
          prev?.map((note) =>
            note.id === payload.noteId
              ? { ...note, commentCount: Math.max(0, (note.commentCount ?? 0) - 1) }
              : note,
          ),
        );
      }
    };

    const onVoteCreated = (payload: {
      noteId: number;
      userId: number;
      count: number;
    }) => {
      queryClient.setQueryData<Note[]>(notesKey(workspaceId), (prev) =>
        prev?.map((note) => {
          if (note.id !== payload.noteId) return note;
          return {
            ...note,
            voteCount: payload.count,
            hasVoted: payload.userId === currentUserId ? true : note.hasVoted,
          };
        }),
      );
      void queryClient.invalidateQueries({
        queryKey: votesKey(workspaceId, payload.noteId),
      });
    };

    const onVoteDeleted = (payload: {
      noteId: number;
      userId: number;
      count: number;
    }) => {
      queryClient.setQueryData<Note[]>(notesKey(workspaceId), (prev) =>
        prev?.map((note) => {
          if (note.id !== payload.noteId) return note;
          return {
            ...note,
            voteCount: payload.count,
            hasVoted: payload.userId === currentUserId ? false : note.hasVoted,
          };
        }),
      );
      void queryClient.invalidateQueries({
        queryKey: votesKey(workspaceId, payload.noteId),
      });
    };

    socket.on('connect', onConnect);
    socket.on('disconnect', onDisconnect);
    socket.on(SOCKET_BROADCAST_EVENTS.PRESENCE_UPDATE, onPresence);
    socket.on(SOCKET_BROADCAST_EVENTS.SELECTION_UPDATE, onSelectionUpdate);
    socket.on(SOCKET_BROADCAST_EVENTS.NOTE_CREATED, onNoteCreated);
    socket.on(SOCKET_BROADCAST_EVENTS.NOTE_UPDATED, onNoteUpdated);
    socket.on(SOCKET_BROADCAST_EVENTS.NOTE_DELETED, onNoteDeleted);
    socket.on(SOCKET_BROADCAST_EVENTS.COMMENT_CREATED, onCommentCreated);
    socket.on(SOCKET_BROADCAST_EVENTS.COMMENT_UPDATED, onCommentUpdated);
    socket.on(SOCKET_BROADCAST_EVENTS.COMMENT_DELETED, onCommentDeleted);
    socket.on(SOCKET_BROADCAST_EVENTS.VOTE_CREATED, onVoteCreated);
    socket.on(SOCKET_BROADCAST_EVENTS.VOTE_DELETED, onVoteDeleted);

    if (socket.connected) {
      onConnect();
    } else {
      socket.connect();
    }

    return () => {
      socket.emit(SOCKET_EVENTS.WORKSPACE_LEAVE, { workspaceId });
      socket.off('connect', onConnect);
      socket.off('disconnect', onDisconnect);
      socket.off(SOCKET_BROADCAST_EVENTS.PRESENCE_UPDATE, onPresence);
      socket.off(SOCKET_BROADCAST_EVENTS.SELECTION_UPDATE, onSelectionUpdate);
      socket.off(SOCKET_BROADCAST_EVENTS.NOTE_CREATED, onNoteCreated);
      socket.off(SOCKET_BROADCAST_EVENTS.NOTE_UPDATED, onNoteUpdated);
      socket.off(SOCKET_BROADCAST_EVENTS.NOTE_DELETED, onNoteDeleted);
      socket.off(SOCKET_BROADCAST_EVENTS.COMMENT_CREATED, onCommentCreated);
      socket.off(SOCKET_BROADCAST_EVENTS.COMMENT_UPDATED, onCommentUpdated);
      socket.off(SOCKET_BROADCAST_EVENTS.COMMENT_DELETED, onCommentDeleted);
      socket.off(SOCKET_BROADCAST_EVENTS.VOTE_CREATED, onVoteCreated);
      socket.off(SOCKET_BROADCAST_EVENTS.VOTE_DELETED, onVoteDeleted);
      setPresence([]);
      setRemoteSelections([]);
      setConnected(false);
    };
  }, [workspaceId, currentUserId, queryClient]);

  return { presence, connected, remoteSelections, publishSelection };
}
