export interface ChatMessage {
  id: number;
  workspaceId: number;
  senderId: number;
  senderName: string;
  senderAvatar: string | null;
  type: string;
  message: string;
  createdAt: string;
}

export interface ChatHistoryResponse {
  messages: ChatMessage[];
  nextCursor: number | null;
  hasMore: boolean;
}
