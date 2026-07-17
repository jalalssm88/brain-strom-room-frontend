export interface Vote {
  id: number;
  noteId: number;
  userId: number;
  userName: string;
  createdAt: string;
}

export interface VotesSummary {
  votes: Vote[];
  count: number;
  hasVoted: boolean;
}

export interface VoteToggleResult {
  voted: boolean;
  count: number;
}
