export const PAGE_SIZE = 20;

export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  offset: number;
  limit: number;
  hasMore: boolean;
}

export interface WorkspaceListResponse {
  workspaces: PaginatedResponse<import('./workspace').Workspace>['items'];
  total: number;
  offset: number;
  limit: number;
  hasMore: boolean;
}

export interface NotificationListResponse {
  notifications: PaginatedResponse<import('./notification').Notification>['items'];
  total: number;
  unreadCount: number;
  offset: number;
  limit: number;
  hasMore: boolean;
}
