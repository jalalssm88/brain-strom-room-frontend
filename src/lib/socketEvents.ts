export const SOCKET_EVENTS = {
  WORKSPACE_JOIN: 'workspace:join',
  WORKSPACE_LEAVE: 'workspace:leave',
  SELECTION_UPDATE: 'selection:update',
  CHAT_MESSAGE: 'chat:message',
  TYPING_START: 'typing:start',
  TYPING_STOP: 'typing:stop',
} as const;

export const SOCKET_BROADCAST_EVENTS = {
  NOTE_CREATED: 'note:created',
  NOTE_UPDATED: 'note:updated',
  NOTE_DELETED: 'note:deleted',
  COMMENT_CREATED: 'comment:created',
  COMMENT_UPDATED: 'comment:updated',
  COMMENT_DELETED: 'comment:deleted',
  VOTE_CREATED: 'vote:created',
  VOTE_DELETED: 'vote:deleted',
  NOTIFICATION_NEW: 'notification:new',
  PRESENCE_UPDATE: 'presence:update',
  SELECTION_UPDATE: 'selection:update',
  CHAT_MESSAGE: 'chat:message',
  TYPING_START: 'typing:start',
  TYPING_STOP: 'typing:stop',
} as const;

export interface PresenceUser {
  userId: number;
  fullName: string;
  avatar: string | null;
}

export interface RemoteNoteSelection {
  userId: number;
  fullName: string;
  noteId: number;
  color: string;
}
